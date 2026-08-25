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

  it('renders nothing without posts, since the section scope is undecided', async () => {
    const host = await render([]);
    expect(host.querySelector('section')).toBeNull();
  });

  it('renders a tile per post', async () => {
    const host = await render();
    expect(host.querySelectorAll('.tile')).toHaveLength(INSTAGRAM_FIXTURE.length);
  });

  it('fills the nine-tile grid the design specifies', async () => {
    expect(INSTAGRAM_FIXTURE).toHaveLength(9);
  });

  it('shows no like counts, which are invented in the design', async () => {
    const host = await render();
    const text = host.textContent ?? '';
    for (const count of ['284', '412', '198', '321', '567']) {
      expect(text).not.toContain(count);
    }
  });

  it('shows no captions until someone confirms what the photographs depict', async () => {
    const host = await render();
    expect(host.querySelector('.tile__caption')).toBeNull();
  });

  it('renders a caption once one is supplied', async () => {
    const host = await render([{ id: '1', tone: 'ocean', caption: 'Playa de Papagayo' }]);
    expect(host.querySelector('.tile__caption')?.textContent?.trim()).toBe('Playa de Papagayo');
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
