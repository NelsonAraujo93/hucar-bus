import { ChangeDetectionStrategy, Component } from '@angular/core';

/**
 * The single page.
 *
 * Deliberately empty in Phase 2: the eight sections it will compose belong to
 * Phase 3. It exists now so the '' route matches -- without it the router
 * matches nothing and the dev server returns 404 for the whole site.
 */
@Component({
  selector: 'hb-home',
  templateUrl: './home.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Home {}
