import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Button, type ButtonSize, type ButtonVariant } from '../../shared/ui/button/button';
import { Icon, type IconName } from '../../shared/ui/icon/icon';
import { LanguageSwitcher } from '../../shared/ui/language-switcher/language-switcher';
import { Logo } from '../../shared/ui/logo/logo';
import { SectionHeader } from '../../shared/ui/section-header/section-header';

interface Swatch {
  readonly token: string;
  readonly label: string;
}

/**
 * Development-only gallery of every primitive in every variant and state.
 *
 * Exists so the design system can be reviewed before any section depends on it,
 * and so token drift shows up immediately. Never reaches production: the
 * production build swaps app.routes.ts for a version without this route, and
 * only the home route is prerendered, so no /ui document is ever emitted.
 */
@Component({
  selector: 'hb-ui-gallery',
  imports: [Button, Icon, LanguageSwitcher, Logo, SectionHeader],
  templateUrl: './ui-gallery.html',
  styleUrl: './ui-gallery.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UiGallery {
  protected readonly buttonVariants: readonly ButtonVariant[] = [
    'yellow',
    'whatsapp',
    'teal',
    'ghost',
  ];
  protected readonly buttonSizes: readonly ButtonSize[] = ['sm', 'md', 'lg'];

  protected readonly icons: readonly IconName[] = [
    'plane',
    'users',
    'car',
    'building',
    'map',
    'compass',
    'phone',
    'mail',
    'pin',
    'clock',
    'instagram',
    'star',
    'star-outline',
    'chevron-down',
    'chevron-up',
    'chevron-left',
    'chevron-right',
    'whatsapp',
    'facebook',
    'heart',
    'google',
    'menu',
    'menu-close',
  ];

  protected readonly colours: readonly Swatch[] = [
    { token: '--color-sun-yellow', label: 'sun-yellow' },
    { token: '--color-sunset-orange', label: 'sunset-orange' },
    { token: '--color-lava-red', label: 'lava-red' },
    { token: '--color-ocean-teal', label: 'ocean-teal' },
    { token: '--color-teal-hover', label: 'teal-hover' },
    { token: '--color-brand-blue', label: 'brand-blue' },
    { token: '--color-ink', label: 'ink' },
    { token: '--color-ink-muted', label: 'ink-muted' },
    { token: '--color-sand', label: 'sand' },
    { token: '--color-sand-light', label: 'sand-light' },
    { token: '--color-sand-lighter', label: 'sand-lighter' },
    { token: '--color-cream', label: 'cream' },
    { token: '--color-border', label: 'border' },
    { token: '--color-whatsapp', label: 'whatsapp' },
    { token: '--color-whatsapp-hover', label: 'whatsapp-hover' },
  ];

  protected readonly shadows: readonly Swatch[] = [
    { token: '--shadow-card-rest', label: 'card-rest' },
    { token: '--shadow-card-hover', label: 'card-hover' },
    { token: '--shadow-button-rest', label: 'button-rest' },
    { token: '--shadow-button-hover', label: 'button-hover' },
    { token: '--shadow-arrow-btn', label: 'arrow-btn' },
    { token: '--shadow-nav-scrolled', label: 'nav-scrolled' },
    { token: '--shadow-float-card', label: 'float-card' },
    { token: '--shadow-whatsapp-float', label: 'whatsapp-float' },
  ];

  protected readonly radii: readonly Swatch[] = [
    { token: '--radius-4', label: '4' },
    { token: '--radius-8', label: '8' },
    { token: '--radius-10', label: '10' },
    { token: '--radius-12', label: '12' },
    { token: '--radius-14', label: '14' },
    { token: '--radius-16', label: '16' },
    { token: '--radius-20', label: '20' },
    { token: '--radius-full', label: 'full' },
  ];
}
