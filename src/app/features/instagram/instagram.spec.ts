import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { SITE_CONFIG } from '../../core/config/site.config';
import { Instagram } from './instagram';
import { INSTAGRAM_FIXTURE } from './instagram.fixture';
import type { InstagramPost } from './instagram.model';

@Component({
  imports: [Instagram],
  template: `<hb-instagram [posts]="posts" />`,
})
class Host {
  posts: readonly InstagramPost[] = INSTAGRAM_FIXTURE;
}

async function render(posts?: readonly InstagramPost[]): Promise<HTMLElement> {
  TestBed.configureTestingModule({ imports: [Host] });
  const fixture = TestBed.createComponent(Host);
  if (posts !== undefined) {
    fixture.componentInstance.posts = posts;
  }
  await fixture.whenStable();
  return fixture.nativeElement as HTMLElement;
}

describe('Instagram', () => {
  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('renders nothing without posts', async () => {
    const host = await render([]);
    expect(host.querySelector('section')).toBeNull();
  });

  it('renders a tile per post, the three the grid holds', async () => {
    const host = await render();
    expect(INSTAGRAM_FIXTURE).toHaveLength(3);
    expect(host.querySelectorAll('.tile')).toHaveLength(3);
  });

  it('links each tile to its post on Instagram, in a new tab', async () => {
    const host = await render();
    const link = host.querySelector<HTMLAnchorElement>('.tile__link');
    expect(link?.getAttribute('href')).toBe('https://www.instagram.com/hucarbus/');
    expect(link?.getAttribute('target')).toBe('_blank');
    expect(link?.getAttribute('rel')).toContain('noopener');
  });

  it('serves the image from this site, WebP first, lazily', async () => {
    const host = await render();
    const tile = host.querySelector('.tile');
    expect(tile?.querySelector('source')?.getAttribute('srcset')).toBe(
      '/img/about-driver-480.webp',
    );
    const img = tile?.querySelector('img');
    expect(img?.getAttribute('src')).toBe('/img/about-driver-480.jpg');
    expect(img?.getAttribute('loading')).toBe('lazy');
  });

  it('describes each image with its caption, or a generic text without one', async () => {
    const host = await render();
    const alts = Array.from(host.querySelectorAll('.tile img')).map((img) =>
      img.getAttribute('alt'),
    );
    expect(alts).toEqual([
      'Pie de foto de ejemplo',
      'Publicación de Hucar Bus en Instagram',
      'Otro pie de foto',
    ]);
  });

  it('shows the caption in the overlay only when there is one', async () => {
    const host = await render();
    const captions = Array.from(host.querySelectorAll('.tile__caption')).map((c) =>
      c.textContent?.trim(),
    );
    expect(captions).toEqual(['Pie de foto de ejemplo', 'Otro pie de foto']);
  });

  it('shows no like counts, which would go stale between builds', async () => {
    const host = await render();
    for (const count of ['284', '412', '198']) {
      expect(host.textContent).not.toContain(count);
    }
  });

  it('keeps the hover overlay out of the accessibility tree', async () => {
    const host = await render();
    for (const overlay of Array.from(host.querySelectorAll('.tile__overlay'))) {
      expect(overlay.getAttribute('aria-hidden')).toBe('true');
    }
  });

  it('derives the handle from the profile URL rather than repeating it', async () => {
    const host = await render();
    const config = TestBed.inject(SITE_CONFIG);
    expect(host.textContent).toContain('@hucarbus');
    expect(host.querySelector('a[hb-button]')?.getAttribute('href')).toBe(config.instagramUrl);
  });
});
