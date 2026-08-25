import { TestBed } from '@angular/core/testing';
import { SITE_CONFIG } from '../../core/config/site.config';
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
    it('takes all three stats from config rather than the template', async () => {
      const host = await render();
      const config = TestBed.inject(SITE_CONFIG);
      const values = Array.from(host.querySelectorAll('.stat__value')).map((s) =>
        s.textContent?.trim(),
      );
      expect(values).toEqual([config.yearsOfExperience, config.availability, config.rating]);
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
            useValue: {
              phone: '',
              phoneHref: '',
              email: '',
              whatsappUrl: '',
              instagramUrl: '',
              address: '',
              addressShort: 'Playa Blanca',
              foundedYear: 2011,
              yearsOfExperience: '13+',
              availability: '24/7',
              rating: '4.9★',
            },
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
      expect(values).toEqual(['13+', '24/7', '4.9★']);
    });
  });

  it('keeps the photo placeholder out of the accessibility tree', async () => {
    // It conveys nothing until a real photograph with real alt text lands.
    // Announcing "photograph pending" would expose a build detail to visitors.
    const host = await render();
    const photo = host.querySelector('.about__photo');
    expect(photo).toBeTruthy();
    expect(photo?.getAttribute('aria-hidden')).toBe('true');
    expect(photo?.getAttribute('role')).toBeNull();
  });

  it('hides the badge icon, which the adjacent text already names', async () => {
    const host = await render();
    expect(host.querySelector('.about__badge-icon')?.getAttribute('aria-hidden')).toBe('true');
  });
});
