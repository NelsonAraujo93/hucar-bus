import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { SPY_IDS } from '../../core/navigation/nav-items';
import { ScrollSpy } from '../../core/navigation/scroll-spy';
import { About } from '../about/about';
import { Contact } from '../contact/contact';
import { Footer } from '../footer/footer';
import { Hero } from '../hero/hero';
import { Navbar } from '../navbar/navbar';
import { Services } from '../services/services';

/**
 * The single page.
 *
 * Composes the sections and owns the scroll spy, which the navbar reads. The
 * remaining sections -- hero, services, about, reviews, instagram, contact and
 * the WhatsApp float -- arrive in later steps of this phase.
 */
@Component({
  selector: 'hb-home',
  imports: [About, Contact, Footer, Hero, Navbar, Services],
  templateUrl: './home.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Home implements OnInit {
  private readonly scrollSpy = inject(ScrollSpy);

  ngOnInit(): void {
    this.scrollSpy.start(SPY_IDS);
  }
}
