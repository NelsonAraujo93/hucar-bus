import { TestBed } from '@angular/core/testing';
import { INSTAGRAM_GATEWAY } from '../../application/instagram/instagram-gateway';
import type { FeedPost } from '../../../shared/instagram/feed';
import { InstagramSection } from './instagram-section';
import { INSTAGRAM_FIXTURE } from './instagram.fixture';

async function render(posts: readonly FeedPost[]): Promise<HTMLElement> {
  const load = vi.fn(async () => posts);
  TestBed.configureTestingModule({
    imports: [InstagramSection],
    providers: [{ provide: INSTAGRAM_GATEWAY, useValue: { load } }],
  });
  const fixture = TestBed.createComponent(InstagramSection);
  await fixture.whenStable();
  await vi.waitFor(() => expect(load).toHaveBeenCalled());
  await fixture.whenStable();
  return fixture.nativeElement as HTMLElement;
}

describe('InstagramSection', () => {
  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('renders the posts once the feed arrives', async () => {
    const host = await render(INSTAGRAM_FIXTURE);
    expect(host.querySelectorAll('.tile')).toHaveLength(3);
  });

  it('renders nothing when the feed is empty', async () => {
    const host = await render([]);
    expect(host.querySelector('section')).toBeNull();
  });
});
