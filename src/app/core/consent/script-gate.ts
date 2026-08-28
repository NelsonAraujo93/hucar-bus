import { isPlatformBrowser } from '@angular/common';
import { DOCUMENT, effect, inject, Injectable, Injector, PLATFORM_ID } from '@angular/core';
import { ConsentService } from './consent.service';
import { type ConsentCategory } from './consent.model';

export interface GatedScript {
  /** Unique, and reused as the element id so a script cannot be added twice. */
  readonly id: string;
  readonly src: string;
  readonly category: ConsentCategory;
  /** Extra attributes, for the data-* keys most vendors want. */
  readonly attributes?: Readonly<Record<string, string>>;
}

/**
 * The single place that decides whether a third party may load.
 *
 * Every integration goes through here rather than reading {@link ConsentService}
 * and writing its own check. That is what keeps "does this need consent?" a
 * question with one answer: scattering the condition through feature code is how
 * one of five integrations ends up loading unconditionally, and nobody notices
 * until an audit.
 */
@Injectable({ providedIn: 'root' })
export class ScriptGate {
  private readonly consent = inject(ConsentService);
  private readonly document = inject(DOCUMENT);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly injector = inject(Injector);

  private readonly activated = new Set<string>();

  /**
   * Runs `activate` exactly once, as soon as the category is consented to, and
   * never if it is not.
   *
   * This is the primitive rather than {@link load}, because not every gated
   * third party is a script tag -- Sentry is an init() call against a bundled
   * SDK, and it needs the same gate.
   *
   * Activation is deliberately one-way. Withdrawing consent stops the *next*
   * load; it does not unload what is already running, because no vendor SDK
   * supports being torn out in place, and claiming a revocation we cannot
   * deliver would be worse than being clear that it takes effect on reload.
   */
  when(id: string, category: ConsentCategory, activate: () => void): void {
    // Nothing third-party may load during prerendering. It would bake a vendor
    // script into the static HTML, where it runs before the visitor has been
    // asked anything at all.
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    if (this.activated.has(id)) {
      return;
    }

    // The effect is not destroyed after firing. It is a handful of subscriptions
    // on a landing page, the `activated` guard already makes it a no-op, and
    // tearing down an effect from inside its own run is a sharper edge than the
    // cost it would save.
    effect(
      () => {
        if (!this.consent.allows(category) || this.activated.has(id)) {
          return;
        }
        this.activated.add(id);
        activate();
      },
      { injector: this.injector },
    );
  }

  /** Appends a vendor script tag once its category is consented to. */
  load(script: GatedScript): void {
    this.when(script.id, script.category, () => {
      const element = this.document.createElement('script');
      element.id = script.id;
      element.src = script.src;
      element.async = true;
      for (const [name, value] of Object.entries(script.attributes ?? {})) {
        element.setAttribute(name, value);
      }
      this.document.head.appendChild(element);
    });
  }

  /** Whether a given gate has fired. Exposed for tests and diagnostics. */
  hasActivated(id: string): boolean {
    return this.activated.has(id);
  }
}
