import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Icon, type IconName } from './icon';

const ALL_ICONS: readonly IconName[] = [
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

@Component({
  imports: [Icon],
  template: `<hb-icon [name]="name" [size]="size" [color]="color" [label]="label" />`,
})
class Host {
  name: IconName = 'plane';
  size: number | undefined = undefined;
  color: string | undefined = undefined;
  label: string | undefined = undefined;
}

async function render(setup?: (host: Host) => void): Promise<HTMLElement> {
  const fixture = TestBed.createComponent(Host);
  setup?.(fixture.componentInstance);
  await fixture.whenStable();
  return fixture.nativeElement as HTMLElement;
}

describe('Icon', () => {
  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('renders an svg for every name in the set', async () => {
    for (const name of ALL_ICONS) {
      const host = await render((h) => {
        h.name = name;
      });
      const svg = host.querySelector('svg');
      expect(svg).toBeTruthy();
      // Every icon in the design is authored on the same canvas.
      expect(svg?.getAttribute('viewBox')).toBe('0 0 24 24');
      TestBed.resetTestingModule();
    }
  });

  describe('accessibility', () => {
    it('is hidden from assistive tech by default, being decorative', async () => {
      const host = await render();
      const icon = host.querySelector('hb-icon');
      expect(icon?.getAttribute('aria-hidden')).toBe('true');
      expect(icon?.getAttribute('role')).toBeNull();
    });

    it('becomes an labelled image when given a label', async () => {
      const host = await render((h) => {
        h.label = 'Abrir WhatsApp';
      });
      const icon = host.querySelector('hb-icon');
      expect(icon?.getAttribute('aria-hidden')).toBeNull();
      expect(icon?.getAttribute('role')).toBe('img');
      expect(icon?.getAttribute('aria-label')).toBe('Abrir WhatsApp');
    });
  });

  describe('sizing', () => {
    it('uses the design default when no size is given', async () => {
      const host = await render();
      // Service icons are 40px in the design.
      expect(host.querySelector('hb-icon')?.getAttribute('style')).toContain('40px');
    });

    it('uses a different default for the small line icons', async () => {
      const host = await render((h) => {
        h.name = 'phone';
      });
      expect(host.querySelector('hb-icon')?.getAttribute('style')).toContain('20px');
    });

    it('honours an explicit size', async () => {
      const host = await render((h) => {
        h.size = 64;
      });
      expect(host.querySelector('hb-icon')?.getAttribute('style')).toContain('64px');
    });
  });

  describe('colour', () => {
    it('uses the design default when no colour is given', async () => {
      const host = await render();
      expect(host.querySelector('svg')?.getAttribute('stroke')).toBe('#F0882A');
    });

    it('defaults the small line icons to currentColor so they inherit', async () => {
      const host = await render((h) => {
        h.name = 'phone';
      });
      expect(host.querySelector('svg')?.getAttribute('stroke')).toBe('currentColor');
    });

    it('honours an explicit colour', async () => {
      const host = await render((h) => {
        h.color = '#2BBCD4';
      });
      expect(host.querySelector('svg')?.getAttribute('stroke')).toBe('#2BBCD4');
    });
  });

  describe('variants encoded in the name', () => {
    it('fills the star but not the outline star', async () => {
      const filled = await render((h) => {
        h.name = 'star';
      });
      expect(filled.querySelector('svg')?.getAttribute('fill')).toBe('#F5C518');
      TestBed.resetTestingModule();

      const outline = await render((h) => {
        h.name = 'star-outline';
      });
      expect(outline.querySelector('svg')?.getAttribute('fill')).toBe('none');
    });

    it('rotates the chevron by direction rather than duplicating geometry', async () => {
      const down = await render((h) => {
        h.name = 'chevron-down';
      });
      expect(down.querySelector('hb-icon')?.getAttribute('style')).not.toContain('rotate');
      TestBed.resetTestingModule();

      const up = await render((h) => {
        h.name = 'chevron-up';
      });
      expect(up.querySelector('hb-icon')?.getAttribute('style')).toContain('180deg');
      TestBed.resetTestingModule();

      const left = await render((h) => {
        h.name = 'chevron-left';
      });
      expect(left.querySelector('hb-icon')?.getAttribute('style')).toContain('90deg');
    });

    it('keeps the Google mark in its brand colours rather than recolouring it', async () => {
      const host = await render((h) => {
        h.name = 'google';
        h.color = '#FF0000';
      });
      const fills = Array.from(host.querySelectorAll('svg path')).map((p) =>
        p.getAttribute('fill'),
      );
      expect(fills).toEqual(['#4285F4', '#34A853', '#FBBC05', '#EA4335']);
    });
  });
});
