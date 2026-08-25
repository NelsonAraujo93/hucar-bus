import { isPlatformBrowser } from '@angular/common';
import { DestroyRef, DOCUMENT, inject, Injectable, PLATFORM_ID, signal } from '@angular/core';

/**
 * The design activates the last section whose top has passed 120px. Expressed
 * as a root margin, that is a band starting 120px below the viewport top.
 */
const SPY_ROOT_MARGIN = '-120px 0px -70% 0px';

/** The navbar gains its shadow once the page has moved at all. */
const ELEVATION_THRESHOLD_PX = 8;

/**
 * Tracks which section is in view and whether the page has scrolled.
 *
 * Uses IntersectionObserver rather than the prototype's scroll listener, which
 * called getBoundingClientRect on every section on every scroll frame. The
 * elevation flag does use a scroll listener, but it only compares a number and
 * writes the signal when the value actually changes.
 */
@Injectable({ providedIn: 'root' })
export class ScrollSpy {
  private readonly document = inject(DOCUMENT);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly destroyRef = inject(DestroyRef);

  readonly activeId = signal<string>('top');
  readonly scrolled = signal(false);

  /**
   * Begins observing the given section ids, in document order.
   *
   * Does nothing during prerendering, where there is no viewport to observe --
   * the prerendered HTML simply ships with the first section active.
   */
  start(ids: readonly string[]): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    const view = this.document.defaultView;
    if (view === null) {
      return;
    }

    const visible = new Set<string>();
    const observer = new view.IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            visible.add(entry.target.id);
          } else {
            visible.delete(entry.target.id);
          }
        }

        // Last in document order wins, matching the design's "last section
        // whose top is above the line".
        for (let i = ids.length - 1; i >= 0; i -= 1) {
          if (visible.has(ids[i])) {
            this.activeId.set(ids[i]);
            return;
          }
        }
      },
      { rootMargin: SPY_ROOT_MARGIN },
    );

    for (const id of ids) {
      const element = this.document.getElementById(id);
      if (element !== null) {
        observer.observe(element);
      }
    }

    const onScroll = (): void => {
      const next = view.scrollY > ELEVATION_THRESHOLD_PX;
      if (next !== this.scrolled()) {
        this.scrolled.set(next);
      }
    };

    onScroll();
    view.addEventListener('scroll', onScroll, { passive: true });

    this.destroyRef.onDestroy(() => {
      observer.disconnect();
      view.removeEventListener('scroll', onScroll);
    });
  }
}
