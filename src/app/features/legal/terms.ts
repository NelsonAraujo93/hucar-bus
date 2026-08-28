import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { SITE_CONFIG } from '../../core/config/site.config';
import { LegalPage } from './legal-page';
import { LegalPending } from './legal-pending';

/**
 * Términos y condiciones del servicio.
 *
 * The thinnest of the three, and honestly so. Nothing here is derivable from the
 * codebase: cancellation windows, liability limits and the conditions of a
 * passenger-transport contract are commercial decisions the client has not yet
 * made. The page exists because Phase 4B's contact form must link to it and
 * because Google's Places policy will require it, not because there is text to
 * show.
 */
@Component({
  selector: 'hb-terms',
  imports: [LegalPage, LegalPending],
  templateUrl: './terms.html',
  styleUrl: './legal-document.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Terms {
  protected readonly config = inject(SITE_CONFIG);
}
