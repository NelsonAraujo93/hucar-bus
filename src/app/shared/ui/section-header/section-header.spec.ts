import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { SectionHeader, type EyebrowTone } from './section-header';

@Component({
  imports: [SectionHeader],
  template: `
    <hb-section-header
      [title]="title"
      [eyebrow]="eyebrow"
      [subtitle]="subtitle"
      [dark]="dark"
      [eyebrowTone]="tone"
    />
  `,
})
class Host {
  title = 'Nuestros servicios';
  eyebrow: string | undefined = undefined;
  subtitle: string | undefined = undefined;
  dark = false;
  tone: EyebrowTone = 'sunset-orange';
}

async function render(setup?: (host: Host) => void): Promise<HTMLElement> {
  const fixture = TestBed.createComponent(Host);
  setup?.(fixture.componentInstance);
  await fixture.whenStable();
  return fixture.nativeElement as HTMLElement;
}

describe('SectionHeader', () => {
  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('renders the title as a real h2 so section structure survives', async () => {
    const host = await render();
    const heading = host.querySelector('h2');
    expect(heading).toBeTruthy();
    expect(heading?.textContent?.trim()).toBe('Nuestros servicios');
  });

  it('leaves the source string in sentence case and uppercases in CSS', async () => {
    // Screen readers may spell out capitalised words, and translators should
    // review normal casing -- so the DOM must not carry an uppercased string.
    const host = await render();
    expect(host.querySelector('h2')?.textContent).toContain('Nuestros servicios');
  });

  it('omits the eyebrow and subtitle when not supplied', async () => {
    const host = await render();
    expect(host.querySelector('.eyebrow')).toBeNull();
    expect(host.querySelector('.subtitle')).toBeNull();
  });

  it('renders the eyebrow when supplied', async () => {
    const host = await render((h) => {
      h.eyebrow = 'Lo que hacemos';
    });
    expect(host.querySelector('.eyebrow')?.textContent?.trim()).toBe('Lo que hacemos');
  });

  it('keeps the decorative dots out of the DOM', async () => {
    // They are pseudo-elements, so they are never announced or translated.
    const host = await render((h) => {
      h.eyebrow = 'Lo que hacemos';
    });
    expect(host.querySelector('.eyebrow')?.textContent).not.toContain('·');
  });

  it('renders the subtitle when supplied', async () => {
    const host = await render((h) => {
      h.subtitle = 'Traslados y excursiones en Lanzarote';
    });
    expect(host.querySelector('.subtitle')?.textContent?.trim()).toBe(
      'Traslados y excursiones en Lanzarote',
    );
  });

  it('is light by default', async () => {
    const host = await render();
    expect(host.querySelector('.section-header')?.classList.contains('is-dark')).toBe(false);
  });

  it('inverts for dark sections', async () => {
    const host = await render((h) => {
      h.dark = true;
    });
    expect(host.querySelector('.section-header')?.classList.contains('is-dark')).toBe(true);
  });

  it('uses the orange eyebrow tone by default', async () => {
    const host = await render((h) => {
      h.eyebrow = 'x';
    });
    expect(host.querySelector('.section-header')?.classList.contains('eyebrow-lava-red')).toBe(
      false,
    );
  });

  it('switches to the lava-red eyebrow for About', async () => {
    const host = await render((h) => {
      h.eyebrow = 'x';
      h.tone = 'lava-red';
    });
    expect(host.querySelector('.section-header')?.classList.contains('eyebrow-lava-red')).toBe(
      true,
    );
  });
});
