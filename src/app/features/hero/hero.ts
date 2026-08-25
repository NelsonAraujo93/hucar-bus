import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { BRAND } from '../../core/config/brand';
import { SITE_CONFIG } from '../../core/config/site.config';
import { Button } from '../../shared/ui/button/button';
import { Icon } from '../../shared/ui/icon/icon';

/**
 * Opening statement and the two primary calls to action.
 *
 * Only the `sunset` background ships. The design carries `photo` and `solid`
 * explorations plus the tweaks-panel plumbing that switched between them; the
 * handoff says to pick one and hard-code it, so the rest is gone rather than
 * carried as dead options.
 */
@Component({
  selector: 'hb-hero',
  imports: [Button, Icon],
  templateUrl: './hero.html',
  styleUrl: './hero.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Hero {
  protected readonly config = inject(SITE_CONFIG);
  protected readonly brand = BRAND;
}
