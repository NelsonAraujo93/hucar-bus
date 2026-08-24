import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { BRAND } from '../../core/config/brand';
import { SITE_CONFIG } from '../../core/config/site.config';
import { Button } from '../../shared/ui/button/button';
import { Icon } from '../../shared/ui/icon/icon';
import { ImagePlaceholder } from '../../shared/ui/image-placeholder/image-placeholder';
import { SectionHeader } from '../../shared/ui/section-header/section-header';

/**
 * The four states the form can be in.
 *
 * The design covers `idle` and `sent` only. `pending` and `error` are added
 * here rather than in Phase 4: a form that can fail needs somewhere to say so,
 * and designing that under deadline while wiring an endpoint is how error
 * states end up as an alert().
 */
export type ContactStatus = 'idle' | 'pending' | 'sent' | 'error';

@Component({
  selector: 'hb-contact',
  imports: [Button, Icon, ImagePlaceholder, SectionHeader],
  templateUrl: './contact.html',
  styleUrl: './contact.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Contact {
  protected readonly config = inject(SITE_CONFIG);
  protected readonly brand = BRAND;

  /**
   * Public so Phase 4 can drive it when submission is wired, and so each panel
   * can be exercised in tests. Nothing moves it yet.
   */
  readonly status = signal<ContactStatus>('idle');

  /**
   * Submission belongs to Phase 4. Handled only to stop the browser navigating
   * away on Enter, which a form with no action would otherwise do.
   */
  protected onSubmit(event: Event): void {
    event.preventDefault();
  }

  protected reset(): void {
    this.status.set('idle');
  }
}
