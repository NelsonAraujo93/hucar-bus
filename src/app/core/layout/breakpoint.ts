import { isPlatformBrowser } from '@angular/common';
import { DestroyRef, DOCUMENT, inject, Injectable, PLATFORM_ID, signal } from '@angular/core';

export type Breakpoint = 'mobile' | 'tablet' | 'desktop';

/** Matches the design's breakpoints, which are also Tailwind's md and lg. */
const TABLET_MIN = 768;
const DESKTOP_MIN = 1024;

/**
 * The current breakpoint, for the few decisions CSS cannot make.
 *
 * Layout stays in media queries; this exists only where behaviour differs --
 * the reviews carousel has to know how many cards are visible to clamp its
 * index, and no stylesheet can tell it that.
 *
 * Defaults to desktop during prerendering. The prerendered HTML is laid out by
 * CSS regardless, so the value only affects behaviour after hydration.
 */
@Injectable({ providedIn: 'root' })
export class BreakpointObserver {
  private readonly document = inject(DOCUMENT);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly destroyRef = inject(DestroyRef);

  readonly current = signal<Breakpoint>('desktop');

  constructor() {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    const view = this.document.defaultView;
    if (view === null || typeof view.matchMedia !== 'function') {
      return;
    }

    const tablet = view.matchMedia(`(min-width: ${TABLET_MIN}px)`);
    const desktop = view.matchMedia(`(min-width: ${DESKTOP_MIN}px)`);

    const update = (): void => {
      this.current.set(desktop.matches ? 'desktop' : tablet.matches ? 'tablet' : 'mobile');
    };

    update();
    tablet.addEventListener('change', update);
    desktop.addEventListener('change', update);

    this.destroyRef.onDestroy(() => {
      tablet.removeEventListener('change', update);
      desktop.removeEventListener('change', update);
    });
  }
}
