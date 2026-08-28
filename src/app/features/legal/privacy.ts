import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { SITE_CONFIG } from '../../core/config/site.config';
import { ConsentUi } from '../../core/consent/consent-ui';
import { CONSENT_STORAGE_KEY } from '../../core/consent/consent.model';
import { LOCALE_COOKIE } from '../../../shared/i18n/negotiate-locale';
import { LegalPage } from './legal-page';
import { LegalPending } from './legal-pending';

/**
 * Política de privacidad.
 *
 * The responsable block and the storage table are real. The table in particular
 * is not a guess: the addendum requires the cookie policy to match what the
 * banner actually sets, so both names are imported from the code that sets
 * them, and a rename cannot leave this page describing something that no longer
 * exists.
 *
 * The purposes, legal bases, retention periods and international-transfer
 * analysis are marked as pending. Those are judgements about how the business
 * operates and about EU transfer safeguards, not facts derivable from the
 * codebase, and inventing them would be the exact failure mode the phase plan
 * warns about.
 */
@Component({
  selector: 'hb-privacy',
  imports: [LegalPage, LegalPending],
  templateUrl: './privacy.html',
  styleUrl: './legal-document.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Privacy {
  private readonly ui = inject(ConsentUi);

  protected readonly config = inject(SITE_CONFIG);

  /** Read from the source of truth so the policy cannot drift from the code. */
  protected readonly localeCookie = LOCALE_COOKIE;
  protected readonly consentKey = CONSENT_STORAGE_KEY;

  protected openPreferences(): void {
    this.ui.openPreferences();
  }
}
