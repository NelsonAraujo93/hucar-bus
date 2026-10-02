import { Component, inject, OnInit } from '@angular/core';
import { SPY_IDS } from '../../core/navigation/nav-items';
import { ScrollSpy } from '../../core/navigation/scroll-spy';
import { About } from '../about/about';
import { Contact } from '../contact/contact';
import { Footer } from '../footer/footer';
import { Hero } from '../hero/hero';
import { Navbar } from '../navbar/navbar';
import { ReviewsSection } from '../reviews/reviews-section';
import { WhatsappFloat } from '../whatsapp-float/whatsapp-float';
import { Services } from '../services/services';

/**
 * The single page.
 *
 * Composes the sections and owns the scroll spy, which the navbar reads.
 * ReviewsSection is deferred, so it ships in its own chunk and loads only when
 * the visitor scrolls near it.
 */
@Component({
  selector: 'hb-home',
  imports: [About, Contact, Footer, Hero, Navbar, ReviewsSection, Services, WhatsappFloat],
  templateUrl: './home.html',
})
export class Home implements OnInit {
  private readonly scrollSpy = inject(ScrollSpy);

  ngOnInit(): void {
    this.scrollSpy.start(SPY_IDS);
  }
}
