import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Button, type ButtonSize, type ButtonVariant } from './button';

@Component({
  imports: [Button],
  template: `
    <button hb-button [variant]="variant" [size]="size" [full]="full" [pending]="pending">
      <svg hb-button-icon data-testid="icon"></svg>
      {{ label }}
    </button>
    <a hb-button href="#contacto" data-testid="link">{{ linkLabel }}</a>
  `,
})
class Host {
  // Bound rather than literal: literal text in a template must carry an i18n
  // attribute, and test fixtures must never reach a translation file.
  readonly label = 'Contactar';
  readonly linkLabel = 'Enlace';
  variant: ButtonVariant = 'yellow';
  size: ButtonSize = 'md';
  full = false;
  pending = false;
}

async function render(setup?: (host: Host) => void): Promise<HTMLElement> {
  const fixture = TestBed.createComponent(Host);
  setup?.(fixture.componentInstance);
  await fixture.whenStable();
  return fixture.nativeElement as HTMLElement;
}

describe('Button', () => {
  afterEach(() => {
    TestBed.resetTestingModule();
  });

  describe('host element', () => {
    it('applies to a real button, so it can submit a form', async () => {
      const host = await render();
      const button = host.querySelector('button');
      expect(button?.tagName).toBe('BUTTON');
      expect(button?.classList.contains('hb-button')).toBe(true);
    });

    it('applies to a real anchor, so it stays a navigable link', async () => {
      const host = await render();
      const link = host.querySelector<HTMLAnchorElement>('[data-testid="link"]');
      expect(link?.tagName).toBe('A');
      expect(link?.getAttribute('href')).toBe('#contacto');
      expect(link?.classList.contains('hb-button')).toBe(true);
    });
  });

  describe('variant and size', () => {
    it('defaults to yellow at medium', async () => {
      const host = await render();
      const button = host.querySelector('button');
      expect(button?.getAttribute('data-variant')).toBe('yellow');
      expect(button?.getAttribute('data-size')).toBe('md');
    });

    it('reflects every variant', async () => {
      for (const variant of ['yellow', 'whatsapp', 'teal', 'ghost'] as const) {
        const host = await render((h) => {
          h.variant = variant;
        });
        expect(host.querySelector('button')?.getAttribute('data-variant')).toBe(variant);
        TestBed.resetTestingModule();
      }
    });

    it('reflects every size', async () => {
      for (const size of ['sm', 'md', 'lg'] as const) {
        const host = await render((h) => {
          h.size = size;
        });
        expect(host.querySelector('button')?.getAttribute('data-size')).toBe(size);
        TestBed.resetTestingModule();
      }
    });

    it('stretches when full', async () => {
      const host = await render((h) => {
        h.full = true;
      });
      expect(host.querySelector('button')?.classList.contains('is-full')).toBe(true);
    });
  });

  describe('pending', () => {
    it('shows the leading icon when idle', async () => {
      const host = await render();
      expect(host.querySelector('[data-testid="icon"]')).toBeTruthy();
      expect(host.querySelector('.hb-button__spinner')).toBeNull();
    });

    it('replaces the leading icon with a spinner', async () => {
      const host = await render((h) => {
        h.pending = true;
      });
      expect(host.querySelector('.hb-button__spinner')).toBeTruthy();
      expect(host.querySelector('[data-testid="icon"]')).toBeNull();
    });

    it('announces itself as busy and disabled to assistive tech', async () => {
      const host = await render((h) => {
        h.pending = true;
      });
      const button = host.querySelector('button');
      expect(button?.getAttribute('aria-busy')).toBe('true');
      // Anchors have no native disabled state, so this carries it for both.
      expect(button?.getAttribute('aria-disabled')).toBe('true');
    });

    it('sets neither attribute when idle', async () => {
      const host = await render();
      const button = host.querySelector('button');
      expect(button?.getAttribute('aria-busy')).toBeNull();
      expect(button?.getAttribute('aria-disabled')).toBeNull();
    });

    it('keeps the spinner out of the accessibility tree', async () => {
      const host = await render((h) => {
        h.pending = true;
      });
      expect(host.querySelector('.hb-button__spinner')?.getAttribute('aria-hidden')).toBe('true');
    });
  });
});
