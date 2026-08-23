import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SeoService } from './core/seo/seo.service';
import { LanguageSwitcher } from './shared/ui/language-switcher/language-switcher';

@Component({
  imports: [RouterOutlet, LanguageSwitcher],
  selector: 'hb-root',
  styleUrl: './app.css',
  templateUrl: './app.html',
})
export class App {
  constructor() {
    // Runs during prerendering as well as in the browser, so the canonical and
    // hreflang tags are present in the static HTML crawlers actually read.
    inject(SeoService).setPage({ title: 'HucarBus' });
  }
}
