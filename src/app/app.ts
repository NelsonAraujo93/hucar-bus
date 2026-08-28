import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ConsentBanner } from './features/consent-banner/consent-banner';
import { Monitoring } from './core/monitoring/monitoring';
import { SeoService } from './core/seo/seo.service';

@Component({
  imports: [ConsentBanner, RouterOutlet],
  selector: 'hb-root',
  styleUrl: './app.css',
  templateUrl: './app.html',
})
export class App {
  constructor() {
    // Runs during prerendering as well as in the browser, so the canonical and
    // hreflang tags are present in the static HTML crawlers actually read.
    inject(SeoService).setPage({ title: 'HucarBus' });

    // Registers Sentry with the consent gate. Nothing loads here: the gate
    // will not fire during prerendering, nor until the visitor opts in to
    // monitoring, nor at all while the project DSN is unset.
    inject(Monitoring).start();
  }
}
