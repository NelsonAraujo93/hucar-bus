import { inject, Injectable } from '@angular/core';
import { ScriptGate } from '../consent/script-gate';
import { scrubEvent, type ScrubbableEvent } from './scrub';
import {
  SENTRY_CONFIG,
  SENTRY_DENY_URLS,
  SENTRY_IGNORE_ERRORS,
  type SentryConfig,
} from './sentry.config';

/** The gate id, exported so tests and diagnostics can name the same thing. */
export const SENTRY_GATE_ID = 'sentry';

/**
 * Error monitoring, behind the `monitoring` consent category.
 *
 * Sentry could be argued as legitimate interest, and often is. Nelson's call was
 * consent, and the argument for it is the stronger one here: the moment a
 * third-party processor and an IP transfer are involved the balancing test gets
 * much harder to win, and the safe configuration costs nothing.
 *
 * **What this costs, stated plainly.** An error thrown before the visitor
 * decides is never reported, and errors from anyone who declines are never
 * reported at all. That is the price of the consent decision, not a defect. It
 * also means the issue feed is a sample of consenting visitors, so an absence of
 * errors is not evidence that there are none.
 *
 * The SDK is loaded by dynamic import inside the gate, so a visitor who has not
 * consented does not merely avoid running Sentry -- their browser never fetches
 * a byte of it.
 */
@Injectable({ providedIn: 'root' })
export class Monitoring {
  private readonly gate = inject(ScriptGate);
  private readonly config = inject(SENTRY_CONFIG);

  /** Resolved once the SDK has been imported and initialised, for tests. */
  private ready: Promise<void> | null = null;

  /**
   * Sentry's captureException, or null while monitoring has not been consented
   * to.
   *
   * Deliberately the one function rather than the module namespace. Holding
   * `import * as Sentry` in a field lets the whole namespace escape, and esbuild
   * must then keep every export alive -- which pulled the entire Session Replay
   * implementation, rrweb included, into the bundle. Not initialised and so
   * never running, but present, and roughly 150 kB of code whose sole purpose is
   * recording what visitors type. Destructuring at the import keeps it out
   * structurally rather than by configuration.
   *
   * Sentry's top-level functions are standalone and do not close over the
   * module object, so pulling one out is safe.
   */
  private capture: ((error: unknown) => string) | null = null;

  /**
   * Registers Sentry with the consent gate. Safe to call more than once, and a
   * no-op until the project DSN is filled in.
   */
  start(): void {
    if (this.config.dsn === '') {
      return;
    }

    this.gate.when(SENTRY_GATE_ID, 'monitoring', () => {
      this.ready = this.initialise(this.config);
    });
  }

  /** Whether the SDK has been asked to load. Exposed for tests. */
  whenReady(): Promise<void> | null {
    return this.ready;
  }

  /**
   * Reports an error if, and only if, monitoring was consented to.
   *
   * Silent otherwise. This is the path Angular's ErrorHandler takes for every
   * uncaught error, so it runs constantly on a page where Sentry will never
   * load, and it must stay cheap and quiet.
   */
  captureException(error: unknown): void {
    this.capture?.(error);
  }

  private async initialise(config: SentryConfig): Promise<void> {
    // Named, not a namespace: see the note on `capture`.
    const { init, browserTracingIntegration, captureException } = await import('@sentry/angular');
    this.capture = captureException;

    init({
      dsn: config.dsn,
      environment: config.environment,
      ...(config.release === null ? {} : { release: config.release }),

      // The default attaches IP addresses and user context. This is an EU site
      // handling enquiries from members of the public; neither is wanted.
      sendDefaultPii: false,

      // No Session Replay, and no replay integration to be switched on by
      // accident. It records the DOM including form fields, which for this
      // contact form means capturing names, emails and phone numbers. If it is
      // ever wanted it needs its own consent category and aggressive masking.
      integrations: [browserTracingIntegration()],

      tracesSampleRate: config.tracesSampleRate,
      denyUrls: [...SENTRY_DENY_URLS],
      ignoreErrors: [...SENTRY_IGNORE_ERRORS],

      // Sentry's event types are closed shapes; the scrubber deliberately works
      // on plain records so it can be tested without the SDK. The double cast is
      // the seam between the two.
      beforeSend: (event) =>
        scrubEvent(event as unknown as ScrubbableEvent) as unknown as typeof event,

      // Breadcrumbs are the other route by which form content escapes: a
      // console.log of the payload, or a fetch body, recorded minutes before
      // the error that ships them.
      beforeBreadcrumb: (crumb) =>
        scrubEvent(crumb as unknown as ScrubbableEvent) as unknown as typeof crumb,
    });
  }
}
