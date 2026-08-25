import { TestBed } from '@angular/core/testing';
import { SITE_CONFIG } from '../../core/config/site.config';
import { WhatsappFloat } from './whatsapp-float';

async function render(): Promise<HTMLElement> {
  TestBed.configureTestingModule({ imports: [WhatsappFloat] });
  const fixture = TestBed.createComponent(WhatsappFloat);
  await fixture.whenStable();
  return fixture.nativeElement as HTMLElement;
}

describe('WhatsappFloat', () => {
  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('is named, being an icon-only control', async () => {
    // The design gives it no accessible name at all.
    const host = await render();
    expect(host.querySelector('.float')?.getAttribute('aria-label')).toBeTruthy();
  });

  it('takes the number from config rather than hardcoding it', async () => {
    const host = await render();
    expect(host.querySelector('.float')?.getAttribute('href')).toBe(
      TestBed.inject(SITE_CONFIG).whatsappUrl,
    );
  });

  it('keeps the attention ring out of the accessibility tree', async () => {
    const host = await render();
    expect(host.querySelector('.float__ring')?.getAttribute('aria-hidden')).toBe('true');
  });
});
