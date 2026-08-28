import { DOCUMENT, inject, InjectionToken } from '@angular/core';

export interface SentryConfig {
  /**
   * The project DSN.
   *
   * Committed rather than injected at build time, and deliberately so: a DSN is
   * public by design. It is in the client bundle of every site that uses Sentry,
   * and it grants nothing but the ability to send events to the project. The
   * secret in a Sentry setup is the auth token used to upload source maps, and
   * that one never leaves CI.
   *
   * An empty string means "not configured", and nothing initialises. That is a
   * defined, tested state rather than an accident, because the account does not
   * exist yet.
   */
  readonly dsn: string;

  /** Separates real traffic from a developer's own errors in the issue feed. */
  readonly environment: string;

  /**
   * The deployed version, so an error maps to a known deploy.
   *
   * Null until the release tag is threaded through from CI. package.json stays
   * at 0.0.0 -- semantic-release writes no version back to the repository -- so
   * this cannot simply be read from there.
   */
  readonly release: string | null;

  /** A landing page, not a distributed system. Traces are nearly worthless here. */
  readonly tracesSampleRate: number;
}

/** Hosts that are a developer's machine rather than the live site. */
const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]', '']);

export const SENTRY_CONFIG = new InjectionToken<SentryConfig>('hb.sentryConfig', {
  providedIn: 'root',
  factory: () => {
    const hostname = inject(DOCUMENT).location?.hostname ?? '';
    return {
      // BEFORE FILLING THIS IN: the privacy policy has to change with it.
      // /privacidad currently states that no monitoring tool is loaded and
      // lists Vercel as the only processor. A live DSN makes both sentences
      // false. Add Sentry to the processors section and, if it sets anything
      // in the browser, to the storage table -- which the addendum requires to
      // match what the banner actually permits. See legal.privacy.processors.*
      // and legal.privacy.storage.* in the message catalogue.
      dsn: '',
      environment: LOCAL_HOSTS.has(hostname) ? 'development' : 'production',
      release: null,
      tracesSampleRate: 0.1,
    };
  },
});

/**
 * Noise that dominates a browser issue feed if it is not filtered.
 *
 * Every one of these is an error thrown by something injected into the page --
 * an extension, an in-app browser's own script, a network-level injection --
 * and none of it is our code failing.
 */
export const SENTRY_DENY_URLS: readonly (string | RegExp)[] = [
  /extensions\//i,
  /^chrome:\/\//i,
  /^chrome-extension:\/\//i,
  /^moz-extension:\/\//i,
  /^safari-(web-)?extension:\/\//i,
  /webappstoolbarba\.texthelp\.com\//i,
  /metrics\.itunes\.apple\.com\.edgesuite\.net\//i,
];

/**
 * Messages worth dropping before they reach the project.
 *
 * ResizeObserver's loop notice is benign and fires in volume from layout
 * changes the browser recovers from on its own; the rest are extension and
 * in-app-browser noise.
 */
export const SENTRY_IGNORE_ERRORS: readonly (string | RegExp)[] = [
  'ResizeObserver loop limit exceeded',
  'ResizeObserver loop completed with undelivered notifications',
  'Non-Error promise rejection captured',
  /^AbortError: /,
];
