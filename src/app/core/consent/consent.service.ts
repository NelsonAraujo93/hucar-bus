import { isPlatformBrowser } from '@angular/common';
import { computed, DOCUMENT, inject, Injectable, PLATFORM_ID, signal } from '@angular/core';
import {
  ALLOW_ALL,
  CONSENT_STORAGE_KEY,
  decide,
  DENY_ALL,
  parseDecision,
  type ConsentCategory,
  type ConsentDecision,
  type ConsentState,
  type OptionalCategory,
} from './consent.model';

/**
 * The visitor's consent decision, and the only thing allowed to change it.
 *
 * Nothing here loads a third-party script. Deciding and acting on the decision
 * are separated on purpose: {@link ScriptGate} is what acts, so a feature that
 * wants analytics asks the gate rather than reading this state and reimplementing
 * the check slightly differently.
 */
@Injectable({ providedIn: 'root' })
export class ConsentService {
  private readonly document = inject(DOCUMENT);
  private readonly platformId = inject(PLATFORM_ID);

  private readonly decision = signal<ConsentDecision | null>(this.read());

  /**
   * False until the visitor has actively chosen, which is what the banner keys
   * off. Note that this starts false during prerendering too: the server has no
   * idea what any given browser has stored, so the banner is a client-side
   * concern and the prerendered HTML contains none of it.
   */
  readonly hasDecided = computed(() => this.decision() !== null);

  /** Always safe to read. Denies everything optional until told otherwise. */
  readonly state = computed<ConsentState>(() => this.decision()?.categories ?? DENY_ALL);

  /** When the decision was made, for the record. Null before any choice. */
  readonly decidedAt = computed(() => this.decision()?.decidedAt ?? null);

  allows(category: ConsentCategory): boolean {
    return this.state()[category];
  }

  acceptAll(): void {
    this.commit(decide({ analytics: true, monitoring: true }, this.now()));
  }

  /**
   * Rejecting is a decision, not an absence of one, so it is recorded. Without
   * that the banner would reappear on every page load for anyone who declined --
   * which is nagging, and is itself a documented dark pattern.
   */
  rejectAll(): void {
    this.commit(decide({}, this.now()));
  }

  /** Saves a per-category selection from the preferences dialog. */
  save(choices: Partial<Record<OptionalCategory, boolean>>): void {
    this.commit(decide(choices, this.now()));
  }

  /**
   * Erases the decision and re-prompts, for the footer's "change my choice"
   * link. Withdrawing must be as easy as giving, and a visitor who cannot find
   * their way back to the banner effectively cannot withdraw.
   *
   * Anything already loaded under the old decision stays loaded until the next
   * page load. Unloading a third-party SDK in place is not something any of them
   * support, so the honest behaviour is to stop it loading next time rather than
   * to claim an immediate revocation we cannot deliver.
   */
  withdraw(): void {
    this.decision.set(null);
    this.write(null);
  }

  private commit(next: ConsentDecision): void {
    this.decision.set(next);
    this.write(next);
  }

  private now(): string {
    return new Date().toISOString();
  }

  /**
   * Reads the stored decision, or null when there is none, when it is from an
   * older consent version, or when storage is unavailable.
   *
   * Storage access throws outright in some privacy modes -- it is not merely
   * empty -- so both the read and the write are wrapped. A visitor who has
   * blocked storage is treated as undecided, which denies everything optional.
   * That is the safe direction to fail in.
   */
  private read(): ConsentDecision | null {
    const storage = this.storage();
    if (storage === null) {
      return null;
    }
    try {
      return parseDecision(storage.getItem(CONSENT_STORAGE_KEY));
    } catch {
      return null;
    }
  }

  private write(decision: ConsentDecision | null): void {
    const storage = this.storage();
    if (storage === null) {
      return;
    }
    try {
      if (decision === null) {
        storage.removeItem(CONSENT_STORAGE_KEY);
      } else {
        storage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(decision));
      }
    } catch {
      // A visitor with storage blocked gets a decision that holds for this page
      // only. Re-prompting next time is correct; throwing here is not.
    }
  }

  /** Null during prerendering, and in a browser that denies storage entirely. */
  private storage(): Storage | null {
    if (!isPlatformBrowser(this.platformId)) {
      return null;
    }
    try {
      return this.document.defaultView?.localStorage ?? null;
    } catch {
      return null;
    }
  }
}

/** Re-exported so callers need only one import to compare against a full grant. */
export { ALLOW_ALL, DENY_ALL };
