import { DOCUMENT, PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ScrollSpy } from './scroll-spy';

type IoCallback = (entries: { target: { id: string }; isIntersecting: boolean }[]) => void;

class FakeIntersectionObserver {
  static latest: FakeIntersectionObserver | undefined;

  readonly observed: string[] = [];
  disconnected = false;

  constructor(
    readonly callback: IoCallback,
    readonly options: { rootMargin?: string },
  ) {
    FakeIntersectionObserver.latest = this;
  }

  observe(element: { id: string }): void {
    this.observed.push(element.id);
  }

  disconnect(): void {
    this.disconnected = true;
  }
}

interface Harness {
  spy: ScrollSpy;
  view: { scrollY: number; listeners: Record<string, () => void> };
}

function setup(options?: { platformId?: string; missingIds?: string[] }): Harness {
  const known = ['top', 'servicios', 'nosotros'].filter(
    (id) => !(options?.missingIds ?? []).includes(id),
  );
  const listeners: Record<string, () => void> = {};
  const view = {
    scrollY: 0,
    listeners,
    IntersectionObserver: FakeIntersectionObserver,
    addEventListener(type: string, handler: () => void) {
      listeners[type] = handler;
    },
    removeEventListener() {
      /* asserted via disconnect instead */
    },
  };
  const document = {
    getElementById: (id: string) => (known.includes(id) ? { id } : null),
    defaultView: view,
  };

  TestBed.configureTestingModule({
    providers: [
      { provide: DOCUMENT, useValue: document },
      { provide: PLATFORM_ID, useValue: options?.platformId ?? 'browser' },
    ],
  });

  return { spy: TestBed.inject(ScrollSpy), view: view as unknown as Harness['view'] };
}

function emit(entries: { id: string; isIntersecting: boolean }[]): void {
  FakeIntersectionObserver.latest?.callback(
    entries.map((e) => ({ target: { id: e.id }, isIntersecting: e.isIntersecting })),
  );
}

describe('ScrollSpy', () => {
  afterEach(() => {
    FakeIntersectionObserver.latest = undefined;
    TestBed.resetTestingModule();
  });

  it('starts on the first section', () => {
    const { spy } = setup();
    expect(spy.activeId()).toBe('top');
    expect(spy.scrolled()).toBe(false);
  });

  it('observes every section that exists', () => {
    const { spy } = setup();
    spy.start(['top', 'servicios', 'nosotros']);
    expect(FakeIntersectionObserver.latest?.observed).toEqual(['top', 'servicios', 'nosotros']);
  });

  it('skips ids with no element rather than throwing', () => {
    const { spy } = setup({ missingIds: ['nosotros'] });
    spy.start(['top', 'servicios', 'nosotros']);
    expect(FakeIntersectionObserver.latest?.observed).toEqual(['top', 'servicios']);
  });

  it('activates a section when it enters the band', () => {
    const { spy } = setup();
    spy.start(['top', 'servicios', 'nosotros']);
    emit([{ id: 'servicios', isIntersecting: true }]);
    expect(spy.activeId()).toBe('servicios');
  });

  it('prefers the last section in document order when several are in view', () => {
    const { spy } = setup();
    spy.start(['top', 'servicios', 'nosotros']);
    emit([
      { id: 'servicios', isIntersecting: true },
      { id: 'nosotros', isIntersecting: true },
    ]);
    expect(spy.activeId()).toBe('nosotros');
  });

  it('falls back to the previous section when one leaves', () => {
    const { spy } = setup();
    spy.start(['top', 'servicios', 'nosotros']);
    emit([
      { id: 'servicios', isIntersecting: true },
      { id: 'nosotros', isIntersecting: true },
    ]);
    emit([{ id: 'nosotros', isIntersecting: false }]);
    expect(spy.activeId()).toBe('servicios');
  });

  it('keeps the last active section when nothing is in the band', () => {
    // Between bands the header should not flicker back to the top.
    const { spy } = setup();
    spy.start(['top', 'servicios', 'nosotros']);
    emit([{ id: 'servicios', isIntersecting: true }]);
    emit([{ id: 'servicios', isIntersecting: false }]);
    expect(spy.activeId()).toBe('servicios');
  });

  it('uses a root margin matching the design 120px line', () => {
    const { spy } = setup();
    spy.start(['top']);
    expect(FakeIntersectionObserver.latest?.options.rootMargin).toContain('-120px');
  });

  describe('elevation', () => {
    it('is not elevated at the top of the page', () => {
      const { spy } = setup();
      spy.start(['top']);
      expect(spy.scrolled()).toBe(false);
    });

    it('elevates once past the threshold', () => {
      const { spy, view } = setup();
      spy.start(['top']);
      view.scrollY = 9;
      view.listeners['scroll']();
      expect(spy.scrolled()).toBe(true);
    });

    it('does not elevate exactly at the threshold', () => {
      const { spy, view } = setup();
      spy.start(['top']);
      view.scrollY = 8;
      view.listeners['scroll']();
      expect(spy.scrolled()).toBe(false);
    });

    it('returns to flat when scrolled back up', () => {
      const { spy, view } = setup();
      spy.start(['top']);
      view.scrollY = 100;
      view.listeners['scroll']();
      view.scrollY = 0;
      view.listeners['scroll']();
      expect(spy.scrolled()).toBe(false);
    });
  });

  it('does nothing during prerendering, where there is no viewport', () => {
    const { spy } = setup({ platformId: 'server' });
    spy.start(['top', 'servicios']);
    expect(FakeIntersectionObserver.latest).toBeUndefined();
    expect(spy.activeId()).toBe('top');
  });
});
