import { TestBed } from '@angular/core/testing';
import { SITE_CONFIG } from '../../core/config/site.config';
import { siteConfigWith } from '../../core/config/site.config.fixture';
import { About } from './about';

async function render(): Promise<HTMLElement> {
  TestBed.configureTestingModule({ imports: [About] });
  const fixture = TestBed.createComponent(About);
  await fixture.whenStable();
  return fixture.nativeElement as HTMLElement;
}

describe('About', () => {
  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('is the anchor target for the about link', async () => {
    const host = await render();
    expect(host.querySelector('section')?.id).toBe('nosotros');
  });

  it('heads the section with an h2, not an h1', async () => {
    const host = await render();
    expect(host.querySelectorAll('h1')).toHaveLength(0);
    expect(host.querySelectorAll('h2')).toHaveLength(1);
  });

  it('splits the heading without a break inside a translated string', async () => {
    const host = await render();
    expect(host.querySelectorAll('.about__title-line')).toHaveLength(2);
    expect(host.querySelector('h2 br')).toBeNull();
  });

  describe('unverified claims', () => {
    it('takes both stats from config rather than the template', async () => {
      const host = await render();
      const config = TestBed.inject(SITE_CONFIG);
      const values = Array.from(host.querySelectorAll('.stat__value')).map((s) =>
        s.textContent?.trim(),
      );
      expect(values).toEqual([config.yearsOfExperience, config.availability]);
    });

    it('publishes no star rating anywhere', async () => {
      // A 4.8 average reached the page through the About stats while the Reviews
      // section was withheld for inventing exactly that figure. Nothing may show
      // a rating until one comes from a verified source.
      const host = await render();
      expect(host.textContent).not.toContain('★');
      expect(host.textContent).not.toContain('4.8');
    });

    it('takes the founding year from config, so it is corrected in one place', async () => {
      const host = await render();
      const config = TestBed.inject(SITE_CONFIG);
      expect(host.querySelector('h2')?.textContent).toContain(String(config.foundedYear));
    });

    it('takes the base location from config', async () => {
      const host = await render();
      const config = TestBed.inject(SITE_CONFIG);
      expect(host.querySelector('.about__badge-value')?.textContent?.trim()).toBe(
        config.addressShort,
      );
    });

    it('changes everywhere at once when config changes', async () => {
      TestBed.configureTestingModule({
        imports: [About],
        providers: [
          {
            provide: SITE_CONFIG,
            useValue: siteConfigWith({
              addressShort: 'Playa Blanca',
              foundedYear: 2011,
              yearsOfExperience: '13+',
            }),
          },
        ],
      });
      const fixture = TestBed.createComponent(About);
      await fixture.whenStable();
      const host = fixture.nativeElement as HTMLElement;
      expect(host.querySelector('h2')?.textContent).toContain('2011');
      expect(host.querySelector('.about__badge-value')?.textContent?.trim()).toBe('Playa Blanca');
      const values = Array.from(host.querySelectorAll('.stat__value')).map((s) =>
        s.textContent?.trim(),
      );
      expect(values).toEqual(['13+', '24/7']);
    });
  });

  it('shows the real photo, described for screen readers', async () => {
    const host = await render();
    const image = host.querySelector<HTMLImageElement>('.about__photo img');
    expect(image?.getAttribute('alt')).toContain('Hucar Bus');
    expect(image?.getAttribute('src')).toBe('/img/about-driver-800.jpg');
  });

  it('offers AVIF and WebP before the JPEG fallback, in every size', async () => {
    const host = await render();
    const sources = Array.from(host.querySelectorAll('.about__photo source'));
    expect(sources.map((source) => source.getAttribute('type'))).toEqual([
      'image/avif',
      'image/webp',
    ]);
    for (const source of sources) {
      expect(source.getAttribute('srcset')).toContain('480w');
      expect(source.getAttribute('srcset')).toContain('1200w');
      expect(source.getAttribute('sizes')).toBeTruthy();
    }
  });

  it('loads the photo lazily, since it is below the fold', async () => {
    const host = await render();
    expect(host.querySelector('.about__photo img')?.getAttribute('loading')).toBe('lazy');
  });

  it('hides the badge icon, which the adjacent text already names', async () => {
    const host = await render();
    expect(host.querySelector('.about__badge-icon')?.getAttribute('aria-hidden')).toBe('true');
  });
});
