import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/**
 * Chevron direction and the two menu states are encoded in the name rather than
 * as extra inputs, so callers never pass a flag that is meaningless for the icon
 * they asked for.
 */
export type IconName =
  | 'plane'
  | 'users'
  | 'car'
  | 'building'
  | 'map'
  | 'compass'
  | 'phone'
  | 'mail'
  | 'pin'
  | 'clock'
  | 'instagram'
  | 'star'
  | 'star-outline'
  | 'chevron-down'
  | 'chevron-up'
  | 'chevron-left'
  | 'chevron-right'
  | 'whatsapp'
  | 'facebook'
  | 'heart'
  | 'google'
  | 'menu'
  | 'menu-close';

interface IconDefaults {
  readonly size: number;
  readonly color: string;
}

/** Per-icon defaults copied from the design source, not invented. */
const ICON_DEFAULTS: Record<IconName, IconDefaults> = {
  plane: { size: 40, color: '#F0882A' },
  users: { size: 40, color: '#F0882A' },
  car: { size: 40, color: '#F0882A' },
  building: { size: 40, color: '#F0882A' },
  map: { size: 40, color: '#F0882A' },
  compass: { size: 40, color: '#F0882A' },
  phone: { size: 20, color: 'currentColor' },
  mail: { size: 20, color: 'currentColor' },
  pin: { size: 20, color: 'currentColor' },
  clock: { size: 20, color: 'currentColor' },
  instagram: { size: 20, color: 'currentColor' },
  star: { size: 16, color: '#F5C518' },
  'star-outline': { size: 16, color: '#F5C518' },
  'chevron-down': { size: 24, color: 'currentColor' },
  'chevron-up': { size: 24, color: 'currentColor' },
  'chevron-left': { size: 24, color: 'currentColor' },
  'chevron-right': { size: 24, color: 'currentColor' },
  whatsapp: { size: 24, color: 'currentColor' },
  facebook: { size: 20, color: 'currentColor' },
  heart: { size: 28, color: 'currentColor' },
  google: { size: 20, color: 'currentColor' },
  menu: { size: 26, color: '#1A1A1A' },
  'menu-close': { size: 26, color: '#1A1A1A' },
};

const ROTATION: Partial<Record<IconName, number>> = {
  'chevron-down': 0,
  'chevron-up': 180,
  'chevron-left': 90,
  'chevron-right': -90,
};

@Component({
  selector: 'hb-icon',
  templateUrl: './icon.html',
  styleUrl: './icon.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'hb-icon',
    '[style.width.px]': 'resolvedSize()',
    '[style.height.px]': 'resolvedSize()',
    '[style.rotate]': 'rotation()',
    // Decorative by default. An icon only enters the accessibility tree when
    // the caller gives it a label, which is the case the design never covers.
    '[attr.aria-hidden]': 'label() ? null : "true"',
    '[attr.role]': 'label() ? "img" : null',
    '[attr.aria-label]': 'label() ?? null',
  },
})
export class Icon {
  readonly name = input.required<IconName>();
  readonly size = input<number>();
  readonly color = input<string>();

  /** Supply only for a meaningful icon; decorative ones stay hidden. */
  readonly label = input<string>();

  protected readonly resolvedSize = computed(() => this.size() ?? ICON_DEFAULTS[this.name()].size);
  protected readonly resolvedColor = computed(
    () => this.color() ?? ICON_DEFAULTS[this.name()].color,
  );
  protected readonly rotation = computed(() => {
    const degrees = ROTATION[this.name()];
    return degrees === undefined || degrees === 0 ? null : `${degrees}deg`;
  });
}
