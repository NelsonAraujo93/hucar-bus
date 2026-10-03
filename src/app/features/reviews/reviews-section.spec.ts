import { LOCALE_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { REVIEWS_GATEWAY, type ReviewsGateway } from '../../application/reviews/reviews-gateway';
import type { ReviewsSnapshot } from '../../../shared/reviews/protocol';
import { ReviewsSection } from './reviews-section';

const SNAPSHOT: ReviewsSnapshot = {
  rating: 5,
  count: 1,
  mapsUri: 'https://maps.google.com/',
  reviews: [
    {
      author: 'Ana',
      authorUri: null,
      avatar: null,
      rating: 5,
      when: 'hace 1 día',
      text: 'Perfecto.',
      translated: false,
    },
  ],
};

async function render(
  snapshot: ReviewsSnapshot | null,
  locale = 'es',
): Promise<{ host: HTMLElement; load: ReturnType<typeof vi.fn<ReviewsGateway['load']>> }> {
  const load = vi.fn<ReviewsGateway['load']>(async () => snapshot);
  TestBed.configureTestingModule({
    imports: [ReviewsSection],
    providers: [
      { provide: REVIEWS_GATEWAY, useValue: { load } },
      { provide: LOCALE_ID, useValue: locale },
    ],
  });
  const fixture = TestBed.createComponent(ReviewsSection);
  await fixture.whenStable();
  await vi.waitFor(() => expect(load).toHaveBeenCalled());
  await fixture.whenStable();
  return { host: fixture.nativeElement as HTMLElement, load };
}

describe('ReviewsSection', () => {
  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('renders the live reviews once they arrive', async () => {
    const { host } = await render(SNAPSHOT);
    expect(host.querySelector('section#opiniones')).toBeTruthy();
    expect(host.textContent).toContain('Perfecto.');
  });

  it('renders nothing when there is nothing to show', async () => {
    const { host } = await render(null);
    expect(host.querySelector('section')).toBeNull();
  });

  it('asks for the visitor language', async () => {
    const { load } = await render(SNAPSHOT, 'en-GB');
    expect(load).toHaveBeenCalledWith('en');
  });

  it('asks in English when the locale is unknown', async () => {
    // No snapshot: an unknown locale has no number data to render with.
    const { load } = await render(null, 'xx');
    expect(load).toHaveBeenCalledWith('en');
  });
});
