import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { SITE_CONFIG } from '../../core/config/site.config';
import { LegalPage } from './legal-page';
import { LegalPending } from './legal-pending';

/**
 * Aviso legal.
 *
 * Required of a Spanish commercial site by LSSI-CE art. 10, which is why this
 * route exists at all -- the Phase 4A plan listed only the privacy policy and
 * the terms. The identity block is the one part that can be written for real
 * today; the two registry fields the same article demands have not been
 * supplied, and are shown as gaps rather than omitted, so nobody reads the page
 * as complete.
 */
@Component({
  selector: 'hb-legal-notice',
  imports: [LegalPage, LegalPending],
  templateUrl: './legal-notice.html',
  styleUrl: './legal-document.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LegalNotice {
  protected readonly config = inject(SITE_CONFIG);
}
