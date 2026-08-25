import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { BRAND } from '../../core/config/brand';
import { SITE_CONFIG } from '../../core/config/site.config';
import { navItems } from '../../core/navigation/nav-items';
import { ScrollSpy } from '../../core/navigation/scroll-spy';
import { Button } from '../../shared/ui/button/button';
import { Icon } from '../../shared/ui/icon/icon';
import { LanguageSwitcher } from '../../shared/ui/language-switcher/language-switcher';
import { Logo } from '../../shared/ui/logo/logo';

/**
 * Fixed header: brand, anchor navigation, language switcher and the primary CTA.
 *
 * Below 1024px the links collapse into a drawer. That is designed -- the
 * responsive source specifies 48px rows, a 4px active marker, and both CTAs
 * inside -- so nothing here is invented.
 */
@Component({
  selector: 'hb-navbar',
  imports: [Button, Icon, LanguageSwitcher, Logo],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Navbar {
  private readonly scrollSpy = inject(ScrollSpy);

  protected readonly config = inject(SITE_CONFIG);
  protected readonly brand = BRAND;
  protected readonly items = navItems();
  protected readonly activeId = this.scrollSpy.activeId;
  protected readonly scrolled = this.scrollSpy.scrolled;

  protected readonly open = signal(false);
  protected readonly expanded = computed(() => (this.open() ? 'true' : 'false'));

  protected toggle(): void {
    this.open.update((open) => !open);
  }

  protected close(): void {
    this.open.set(false);
  }
}
