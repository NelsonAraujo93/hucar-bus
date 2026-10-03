import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SITE_CONFIG } from '../../../core/config/site.config';

/**
 * The first layer of data-protection information, shown where data is
 * collected.
 *
 * GDPR art. 13 requires the essentials at the moment of collection; the AEPD's
 * layered model puts them in a short table beside the form and the rest in the
 * privacy policy. Content follows the Facilita RGPD output (2026-10-03): one
 * year for enquiries that do not become bookings, no marketing, no transfers
 * to third parties beyond service providers.
 */
@Component({
  selector: 'hb-privacy-notice',
  imports: [RouterLink],
  templateUrl: './privacy-notice.html',
  styleUrl: './privacy-notice.css',
})
export class PrivacyNotice {
  protected readonly config = inject(SITE_CONFIG);
}
