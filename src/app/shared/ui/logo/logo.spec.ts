import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Logo, type LogoVariant } from './logo';

@Component({
  imports: [Logo],
  template: `<hb-logo [variant]="variant" />`,
})
class Host {
  variant: LogoVariant = 'nav';
}

async function render(variant?: LogoVariant): Promise<HTMLElement> {
  const fixture = TestBed.createComponent(Host);
  if (variant !== undefined) {
    fixture.componentInstance.variant = variant;
  }
  await fixture.whenStable();
  return fixture.nativeElement as HTMLElement;
}

describe('Logo', () => {
  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('links home in both variants', async () => {
    for (const variant of ['nav', 'footer'] as const) {
      const host = await render(variant);
      expect(host.querySelector('a')?.getAttribute('href')).toBe('#top');
      TestBed.resetTestingModule();
    }
  });

  it('renders at 56px in the nav', async () => {
    const host = await render('nav');
    const img = host.querySelector('img');
    expect(img?.getAttribute('height')).toBe('56');
  });

  it('renders at 88px in the footer', async () => {
    const host = await render('footer');
    expect(host.querySelector('img')?.getAttribute('height')).toBe('88');
  });

  it('declares a width derived from the asset ratio, so it reserves layout space', async () => {
    // Explicit dimensions keep CLS within the 0.1 budget.
    const host = await render('nav');
    const img = host.querySelector('img');
    expect(img?.getAttribute('width')).toBe('68');
    expect(img?.getAttribute('height')).toBe('56');
  });

  it('carries alt text, so the link has an accessible name', async () => {
    for (const variant of ['nav', 'footer'] as const) {
      const host = await render(variant);
      expect(host.querySelector('img')?.getAttribute('alt')).toBeTruthy();
      TestBed.resetTestingModule();
    }
  });

  it('marks the variant on the host so the footer card can be styled', async () => {
    const host = await render('footer');
    expect(host.querySelector('hb-logo')?.getAttribute('data-variant')).toBe('footer');
  });
});
