import { NAV_IDS, navItems, SPY_IDS } from './nav-items';

describe('navigation items', () => {
  it('lists the five anchor sections in page order', () => {
    expect(NAV_IDS).toEqual(['servicios', 'nosotros', 'opiniones', 'instagram', 'contacto']);
  });

  it('keeps the hero in the spy list but out of the nav links', () => {
    expect(SPY_IDS[0]).toBe('top');
    expect(SPY_IDS).toHaveLength(NAV_IDS.length + 1);
    expect(NAV_IDS).not.toContain('top');
  });

  it('gives every nav id a label', () => {
    const items = navItems();
    expect(items).toHaveLength(NAV_IDS.length);
    for (const item of items) {
      expect(item.label.length).toBeGreaterThan(0);
    }
  });

  it('keeps fragment ids in Spanish so links survive across locales', () => {
    // A shared /en/#servicios must resolve; translating the fragment would
    // break that for no SEO benefit.
    const items = navItems();
    expect(items.map((i) => i.id)).toEqual([...NAV_IDS]);
  });
});
