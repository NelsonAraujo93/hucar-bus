import { DOCUMENT, LOCALE_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { SeoService } from './seo.service';
import { SITE_ORIGIN } from './seo.tokens';

function setup(localeId: string): { seo: SeoService; doc: Document } {
  TestBed.configureTestingModule({
    providers: [
      { provide: LOCALE_ID, useValue: localeId },
      { provide: SITE_ORIGIN, useValue: 'https://example.test' },
    ],
  });
  return { seo: TestBed.inject(SeoService), doc: TestBed.inject(DOCUMENT) };
}

function hrefOf(doc: Document, selector: string): string | null {
  return doc.head.querySelector(selector)?.getAttribute('href') ?? null;
}

describe('SeoService', () => {
  afterEach(() => {
    for (const el of Array.from(document.head.querySelectorAll('[id^="hb-"]'))) {
      el.remove();
    }
    for (const el of Array.from(document.head.querySelectorAll('meta[property^="og:"]'))) {
      el.remove();
    }
    TestBed.resetTestingModule();
  });

  it('sets the document title', () => {
    const { seo, doc } = setup('es-ES');
    seo.setPage({ title: 'Traslados', path: '/es/' });
    expect(doc.title).toBe('Traslados');
  });

  it('writes a self-referencing canonical for the active locale', () => {
    const { seo, doc } = setup('es-ES');
    seo.setPage({ title: 'x', path: '/es/' });
    expect(hrefOf(doc, '#hb-canonical')).toBe('https://example.test/es/');
  });

  it('points the canonical at the English URL on the English build', () => {
    const { seo, doc } = setup('en-GB');
    seo.setPage({ title: 'x', path: '/en/' });
    expect(hrefOf(doc, '#hb-canonical')).toBe('https://example.test/en/');
  });

  it('advertises every locale as an alternate, including from the other side', () => {
    const { seo, doc } = setup('es-ES');
    seo.setPage({ title: 'x', path: '/es/' });
    expect(hrefOf(doc, '#hb-alt-es')).toBe('https://example.test/es/');
    expect(hrefOf(doc, '#hb-alt-en')).toBe('https://example.test/en/');
  });

  it('points x-default at the negotiating root rather than a locale', () => {
    const { seo, doc } = setup('es-ES');
    seo.setPage({ title: 'x', path: '/es/' });
    expect(hrefOf(doc, '#hb-alt-x-default')).toBe('https://example.test/');
  });

  it('keeps alternates on the same page when the path is deeper', () => {
    const { seo, doc } = setup('es-ES');
    seo.setPage({ title: 'x', path: '/es/contacto' });
    expect(hrefOf(doc, '#hb-canonical')).toBe('https://example.test/es/contacto');
    expect(hrefOf(doc, '#hb-alt-en')).toBe('https://example.test/en/contacto');
  });

  it('writes og:locale and its alternate in Open Graph underscore form', () => {
    const { seo, doc } = setup('es-ES');
    seo.setPage({ title: 'x', path: '/es/' });
    expect(doc.head.querySelector('meta[property="og:locale"]')?.getAttribute('content')).toBe(
      'es_ES',
    );
    expect(
      doc.head.querySelector('meta[property="og:locale:alternate"]')?.getAttribute('content'),
    ).toBe('en_GB');
  });

  it('sets a description only when one is supplied', () => {
    const { seo, doc } = setup('es-ES');
    seo.setPage({ title: 'x', path: '/es/' });
    expect(doc.head.querySelector('meta[name="description"]')).toBeNull();

    seo.setPage({ title: 'x', description: 'Traslados en Lanzarote', path: '/es/' });
    expect(doc.head.querySelector('meta[name="description"]')?.getAttribute('content')).toBe(
      'Traslados en Lanzarote',
    );
  });

  it('falls back to the current location when no path is given', () => {
    // This is how the app shell actually calls it -- no explicit path.
    const { seo, doc } = setup('es-ES');
    seo.setPage({ title: 'x' });
    const canonical = hrefOf(doc, '#hb-canonical');
    expect(canonical).toBeTruthy();
    expect(canonical?.startsWith('https://example.test/es')).toBe(true);
  });

  it('replaces rather than duplicates its tags when called again', () => {
    const { seo, doc } = setup('es-ES');
    seo.setPage({ title: 'x', path: '/es/' });
    seo.setPage({ title: 'x', path: '/es/contacto' });

    expect(doc.head.querySelectorAll('link[rel="canonical"]')).toHaveLength(1);
    expect(doc.head.querySelectorAll('link[rel="alternate"]')).toHaveLength(3);
    expect(hrefOf(doc, '#hb-canonical')).toBe('https://example.test/es/contacto');
    expect(doc.head.querySelectorAll('meta[property="og:locale:alternate"]')).toHaveLength(1);
  });
});
