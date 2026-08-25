import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { BRAND } from '../../core/config/brand';
import { SITE_CONFIG } from '../../core/config/site.config';
import { navItems } from '../../core/navigation/nav-items';
import { Icon } from '../../shared/ui/icon/icon';
import { LanguageSwitcher } from '../../shared/ui/language-switcher/language-switcher';
import { Logo } from '../../shared/ui/logo/logo';

@Component({
  selector: 'hb-footer',
  imports: [Icon, LanguageSwitcher, Logo],
  templateUrl: './footer.html',
  styleUrl: './footer.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Footer {
  protected readonly config = inject(SITE_CONFIG);
  protected readonly brand = BRAND;
  protected readonly items = navItems();

  /**
   * Rendered at build time, so a rebuild keeps it current rather than requiring
   * someone to remember to edit a literal every January.
   */
  protected readonly year = new Date().getFullYear();
}
