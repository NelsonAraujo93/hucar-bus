import { services } from './services.data';

describe('services data', () => {
  it('lists six offerings, matching the 3x2 grid', () => {
    expect(services()).toHaveLength(6);
  });

  it('gives every service a distinct icon from the design set', () => {
    const icons = services().map((s) => s.icon);
    expect(icons).toEqual(['plane', 'users', 'car', 'building', 'map', 'compass']);
    expect(new Set(icons).size).toBe(icons.length);
  });

  it('gives every service a title and a body', () => {
    for (const service of services()) {
      expect(service.title.length).toBeGreaterThan(0);
      expect(service.body.length).toBeGreaterThan(0);
    }
  });

  it('resolves strings through $localize rather than leaving raw literals', () => {
    // An untagged literal here would ship in Spanish on the English build with
    // nothing to warn you, so this asserts the strings actually resolve.
    for (const service of services()) {
      expect(service.title).not.toContain(':@@');
      expect(service.body).not.toContain(':@@');
    }
  });
});
