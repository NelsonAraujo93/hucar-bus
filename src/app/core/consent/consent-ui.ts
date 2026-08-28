import { Injectable, signal } from '@angular/core';

/**
 * Whether the consent preferences dialog is open.
 *
 * Separate from {@link ConsentService} on purpose: that holds the decision, this
 * holds a piece of presentation state. Keeping them apart is what lets the
 * footer's "Cookies" link open the dialog without going anywhere near the stored
 * record -- the alternative was to have the link erase the decision to make the
 * banner reappear, which loses the visitor's current settings just to show them.
 */
@Injectable({ providedIn: 'root' })
export class ConsentUi {
  private readonly open = signal(false);

  readonly isOpen = this.open.asReadonly();

  openPreferences(): void {
    this.open.set(true);
  }

  closePreferences(): void {
    this.open.set(false);
  }
}
