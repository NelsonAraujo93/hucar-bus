import { ChangeDetectionStrategy, Component, inject, input, OnInit } from '@angular/core';
import { SITE_CONFIG } from '../../core/config/site.config';
import { SeoService } from '../../core/seo/seo.service';
import { Footer } from '../footer/footer';
import { Navbar } from '../navbar/navbar';

/**
 * The shell every legal document shares: the site chrome, a heading, the
 * unreviewed-draft notice, and the document body.
 *
 * The notice lives here rather than being repeated on each page so it cannot be
 * forgotten on one of the three, and so removing it once a lawyer has signed
 * the texts off is a single deletion.
 */
@Component({
  selector: 'hb-legal-page',
  imports: [Footer, Navbar],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <hb-navbar />

    <main class="legal">
      <div class="legal__inner">
        <h1 class="legal__title">{{ heading() }}</h1>

        <!-- Not a decorative disclaimer. These documents carry real identity
             data alongside marked gaps, and a visitor is entitled to know which
             is which before relying on any of it. -->
        <p
          class="legal__draft"
          role="note"
          i18n="Notice at the top of every legal page|@@legal.draft.notice"
        >
          Este documento está en preparación. Los datos identificativos son correctos y están
          verificados; el resto del texto está pendiente de redacción y de revisión profesional. Si
          necesitas información legal sobre nuestros servicios, escríbenos y te la damos.
        </p>

        <ng-content />
      </div>
    </main>

    <hb-footer />
  `,
  styleUrl: './legal-page.css',
})
export class LegalPage implements OnInit {
  private readonly seo = inject(SeoService);
  private readonly config = inject(SITE_CONFIG);

  /** The document title, used for both the h1 and the browser title. */
  readonly heading = input.required<string>();

  ngOnInit(): void {
    // Deliberately not guarded with isPlatformBrowser. These pages are
    // prerendered, and a title set only in the browser is one that crawlers and
    // link previews never see. ngOnInit rather than the constructor because the
    // heading is an input, which is not yet bound when the constructor runs.
    this.seo.setPage({ title: `${this.heading()} · ${this.config.tradingName}` });
  }
}
