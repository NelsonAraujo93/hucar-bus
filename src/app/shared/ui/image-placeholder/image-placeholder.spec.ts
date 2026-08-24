import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ImagePlaceholder, type PlaceholderTone } from './image-placeholder';

@Component({
  imports: [ImagePlaceholder],
  template: `<hb-image-placeholder [tone]="tone" />`,
})
class Host {
  tone: PlaceholderTone = 'sand';
}

async function render(tone?: PlaceholderTone): Promise<HTMLElement> {
  const fixture = TestBed.createComponent(Host);
  if (tone !== undefined) {
    fixture.componentInstance.tone = tone;
  }
  await fixture.whenStable();
  return fixture.nativeElement as HTMLElement;
}

describe('ImagePlaceholder', () => {
  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('stays out of the accessibility tree, conveying nothing', async () => {
    const host = await render();
    expect(host.querySelector('hb-image-placeholder')?.getAttribute('aria-hidden')).toBe('true');
  });

  it('carries no content of its own', async () => {
    const host = await render();
    expect(host.querySelector('hb-image-placeholder')?.textContent?.trim()).toBe('');
  });

  it('exposes every tone the design assigns to an image slot', async () => {
    for (const tone of ['sand', 'sunset', 'ocean', 'night', 'gray'] as const) {
      const host = await render(tone);
      expect(host.querySelector('hb-image-placeholder')?.getAttribute('data-tone')).toBe(tone);
      TestBed.resetTestingModule();
    }
  });

  it('leaves shape to the caller rather than forcing an inline style', async () => {
    // An inline aspect-ratio would outrank the consumer's stylesheet.
    const host = await render();
    const style = host.querySelector('hb-image-placeholder')?.getAttribute('style');
    expect(style).toBeNull();
  });
});
