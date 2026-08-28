import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BRAND } from '../../core/config/brand';
import { SITE_CONFIG } from '../../core/config/site.config';
import { ConsentUi } from '../../core/consent/consent-ui';
import { LocaleService } from '../../core/i18n/locale.service';
import { navItems } from '../../core/navigation/nav-items';
import { Icon } from '../../shared/ui/icon/icon';
import { LanguageSwitcher } from '../../shared/ui/language-switcher/language-switcher';
import { Logo } from '../../shared/ui/logo/logo';

@Component({
  selector: 'hb-footer',
  imports: [Icon, LanguageSwitcher, Logo, RouterLink],
  templateUrl: './footer.html',
  styleUrl: './footer.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Footer {
  protected readonly config = inject(SITE_CONFIG);
  protected readonly brand = BRAND;
  protected readonly items = navItems();

  /** Qualifies the section anchors, which no longer resolve from a legal page. */
  protected readonly homePath = inject(LocaleService).homePath;

  /**
   * Rendered at build time, so a rebuild keeps it current rather than requiring
   * someone to remember to edit a literal every January.
   */
  protected readonly year = new Date().getFullYear();

  private readonly consentUi = inject(ConsentUi);

  /** The site's only route back to a decision already made. */
  protected openCookiePreferences(): void {
    this.consentUi.openPreferences();
  }
}
