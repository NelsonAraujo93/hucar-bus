import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { SITE_CONFIG } from '../../core/config/site.config';
import { Icon } from '../../shared/ui/icon/icon';

/**
 * Persistent WhatsApp affordance.
 *
 * The design gives it no accessible name, which for an icon-only fixed control
 * is the difference between "Message us on WhatsApp" and "link" in a screen
 * reader's list.
 */
@Component({
  selector: 'hb-whatsapp-float',
  imports: [Icon],
  templateUrl: './whatsapp-float.html',
  styleUrl: './whatsapp-float.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WhatsappFloat {
  protected readonly config = inject(SITE_CONFIG);
}
