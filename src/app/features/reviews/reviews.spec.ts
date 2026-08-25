import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { BreakpointObserver, type Breakpoint } from '../../core/layout/breakpoint';
import { Reviews } from './reviews';
import { REVIEW_FIXTURE, REVIEW_SUMMARY_FIXTURE } from './reviews.fixture';
import type { Review } from './reviews.model';

class BreakpointStub {
  readonly current = signal<Breakpoint>('desktop');
}

@Component({
  imports: [Reviews],
  template: `<hb-reviews [reviews]="reviews" [summary]="summary" />`,
})
class Host {
  reviews: readonly Review[] = REVIEW_FIXTURE;
  summary = REVIEW_SUMMARY_FIXTURE;
}

interface Rendered {
  host: HTMLElement;
  breakpoint: BreakpointStub;
  detect: () => void;
}

async function render(options?: {
  breakpoint?: Breakpoint;
  reviews?: readonly Review[];
}): Promise<Rendered> {
  const breakpoint = new BreakpointStub();
  breakpoint.current.set(options?.breakpoint ?? 'desktop');
  TestBed.configureTestingModule({
    imports: [Host],
    providers: [{ provide: BreakpointObserver, useValue: breakpoint }],
  });
  const fixture = TestBed.createComponent(Host);
  if (options?.reviews !== undefined) {
    fixture.componentInstance.reviews = options.reviews;
  }
  await fixture.whenStable();
  return {
    host: fixture.nativeElement as HTMLElement,
    breakpoint,
    detect: () => fixture.detectChanges(),
  };
}

function offset(host: HTMLElement): number {
  const style = host.querySelector<HTMLElement>('.carousel__track')?.getAttribute('style') ?? '';
  return Number(/--index:\s*(\d+)/.exec(style)?.[1] ?? '0');
}

function click(host: HTMLElement, selector: string): void {
  host.querySelector<HTMLButtonElement>(selector)?.click();
}

const NEXT = '.carousel__controls .carousel__arrow:last-of-type';
const PREV = '.carousel__controls .carousel__arrow:first-of-type';

describe('Reviews', () => {
  afterEach(() => {
    TestBed.resetTestingModule();
  });

  describe('with no data', () => {
    it('renders nothing at all', async () => {
      // The only review content that exists is invented, so an empty component
      // must be silent rather than showing an empty shell on a live site.
      const { host } = await render({ reviews: [] });
      expect(host.querySelector('section')).toBeNull();
    });
  });

  describe('index clamping', () => {
    it('starts at the first review with the previous arrow disabled', async () => {
      const { host } = await render();
      expect(offset(host)).toBe(0);
      expect(host.querySelector<HTMLButtonElement>(PREV)?.disabled).toBe(true);
    });

    it('advances one review at a time', async () => {
      const { host, detect } = await render();
      click(host, NEXT);
      detect();
      expect(offset(host)).toBe(1);
    });

    it('stops at the last full row rather than scrolling into blank space', async () => {
      // Five reviews, three visible: the last valid index is 2.
      const { host, detect } = await render({ breakpoint: 'desktop' });
      for (let i = 0; i < 10; i += 1) {
        click(host, NEXT);
        detect();
      }
      expect(offset(host)).toBe(2);
      expect(host.querySelector<HTMLButtonElement>(NEXT)?.disabled).toBe(true);
    });

    it('never goes below zero', async () => {
      const { host, detect } = await render();
      for (let i = 0; i < 5; i += 1) {
        click(host, PREV);
        detect();
      }
      expect(offset(host)).toBe(0);
    });

    it('allows one more step at tablet, where two cards show', async () => {
      const { host, detect } = await render({ breakpoint: 'tablet' });
      for (let i = 0; i < 10; i += 1) {
        click(host, NEXT);
        detect();
      }
      expect(offset(host)).toBe(3);
    });

    it('reaches the last review at mobile, where one card shows', async () => {
      const { host, detect } = await render({ breakpoint: 'mobile' });
      for (let i = 0; i < 10; i += 1) {
        click(host, NEXT);
        detect();
      }
      expect(offset(host)).toBe(4);
    });

    it('pulls the index back in when the viewport widens', async () => {
      // Scrolled to the end on mobile, then rotated to landscape: index 4 is no
      // longer valid with three cards visible.
      const { host, breakpoint, detect } = await render({ breakpoint: 'mobile' });
      for (let i = 0; i < 10; i += 1) {
        click(host, NEXT);
        detect();
      }
      expect(offset(host)).toBe(4);
      breakpoint.current.set('desktop');
      detect();
      expect(offset(host)).toBe(2);
    });
  });

  describe('keyboard', () => {
    it('moves with the arrow keys, which the design does not support', async () => {
      const { host, detect } = await render();
      const carousel = host.querySelector('.carousel');
      carousel?.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
      detect();
      expect(offset(host)).toBe(1);
      carousel?.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft' }));
      detect();
      expect(offset(host)).toBe(0);
    });

    it('is focusable, so the arrow keys are reachable', async () => {
      const { host } = await render();
      expect(host.querySelector('.carousel')?.getAttribute('tabindex')).toBe('0');
    });

    it('ignores keys it does not handle', async () => {
      const { host, detect } = await render();
      host
        .querySelector('.carousel')
        ?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
      detect();
      expect(offset(host)).toBe(0);
    });
  });

  describe('landmarks', () => {
    it('is a labelled region', async () => {
      const { host } = await render();
      const carousel = host.querySelector('.carousel');
      expect(carousel?.getAttribute('role')).toBe('region');
      expect(carousel?.getAttribute('aria-label')).toBeTruthy();
    });

    it('hides the decorative star rows', async () => {
      const { host } = await render();
      for (const stars of Array.from(host.querySelectorAll('.review__stars'))) {
        expect(stars.getAttribute('aria-hidden')).toBe('true');
      }
    });
  });

  describe('summary', () => {
    it('is omitted when no verified rating is supplied', async () => {
      TestBed.configureTestingModule({
        imports: [Reviews],
        providers: [{ provide: BreakpointObserver, useValue: new BreakpointStub() }],
      });
      const fixture = TestBed.createComponent(Reviews);
      fixture.componentRef.setInput('reviews', REVIEW_FIXTURE);
      await fixture.whenStable();
      const host = fixture.nativeElement as HTMLElement;
      expect(host.querySelector('.rating')).toBeNull();
    });
  });
});
