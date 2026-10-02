import { TestBed } from '@angular/core/testing';
import type { Review } from '../reviews.model';
import { ReviewCard } from './review-card';

const REVIEW: Review = {
  author: 'Ana García',
  authorUri: 'https://www.google.com/maps/contrib/1',
  avatar: 'data:image/jpeg;base64,AAAA',
  rating: 3,
  when: 'hace 2 semanas',
  text: 'Correcto.',
  translated: false,
};

async function render(review: Partial<Review> = {}): Promise<HTMLElement> {
  TestBed.configureTestingModule({ imports: [ReviewCard] });
  const fixture = TestBed.createComponent(ReviewCard);
  fixture.componentRef.setInput('review', { ...REVIEW, ...review });
  await fixture.whenStable();
  return fixture.nativeElement as HTMLElement;
}

function starNames(host: HTMLElement): string[] {
  return Array.from(host.querySelectorAll('.card__stars hb-icon')).map(
    (icon) => icon.querySelector('svg')?.getAttribute('data-name') ?? icon.outerHTML,
  );
}

describe('ReviewCard', () => {
  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('shows the review text', async () => {
    const host = await render();
    expect(host.querySelector('.card__quote')?.textContent).toBe('Correcto.');
  });

  it('shows the review’s own rating, not five stars for everyone', async () => {
    const host = await render({ rating: 3 });
    const stars = host.querySelector('.card__stars');
    expect(stars?.getAttribute('role')).toBe('img');
    expect(stars?.getAttribute('aria-label')).toBe('3 de 5 estrellas');
    expect(stars?.querySelectorAll('hb-icon')).toHaveLength(5);
    expect(starNames(host).length).toBe(5);
  });

  it('links the author to their Google profile, as Google requires', async () => {
    const host = await render();
    const link = host.querySelector<HTMLAnchorElement>('a.card__name');
    expect(link?.textContent?.trim()).toBe('Ana García');
    expect(link?.getAttribute('href')).toBe('https://www.google.com/maps/contrib/1');
    expect(link?.getAttribute('rel')).toContain('noopener');
  });

  it('shows the author name without a link when Google gives none', async () => {
    const host = await render({ authorUri: null });
    expect(host.querySelector('a.card__name')).toBeNull();
    expect(host.querySelector('.card__name')?.textContent).toBe('Ana García');
  });

  it('shows the author photo from the inlined data, never a Google URL', async () => {
    const host = await render();
    const img = host.querySelector('img.card__avatar');
    expect(img?.getAttribute('src')).toBe('data:image/jpeg;base64,AAAA');
    // Decorative: the name next to it already identifies the author.
    expect(img?.getAttribute('alt')).toBe('');
  });

  it('falls back to the initial without a photo', async () => {
    const host = await render({ avatar: null, author: 'tom' });
    expect(host.querySelector('img.card__avatar')).toBeNull();
    expect(host.querySelector('.card__avatar--initial')?.textContent).toBe('T');
  });

  it('marks a review Google translated, and only that', async () => {
    expect((await render({ translated: true })).querySelector('.card__translated')).toBeTruthy();
    TestBed.resetTestingModule();
    expect((await render({ translated: false })).querySelector('.card__translated')).toBeNull();
  });
});
