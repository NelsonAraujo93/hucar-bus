import { isPlatformBrowser } from '@angular/common';
import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  PLATFORM_ID,
  signal,
  viewChild,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { ConsentService } from '../../core/consent/consent.service';
import { ConsentUi } from '../../core/consent/consent-ui';
import { type OptionalCategory } from '../../core/consent/consent.model';
import { Button } from '../../shared/ui/button/button';

interface CategoryCopy {
  readonly id: OptionalCategory;
  readonly name: string;
  readonly description: string;
}

/**
 * The consent banner and its preferences dialog.
 *
 * Two deliberate accessibility decisions, which look contradictory in the plan
 * but are not:
 *
 * The **banner** is not a modal. It is a labelled region that does not trap
 * focus and does not hide the page from assistive technology, because a visitor
 * must be able to read the privacy policy the banner itself links to before
 * deciding. A cookie notice that traps focus prevents exactly that.
 *
 * The **preferences dialog** is a modal, and uses the native `<dialog>` element
 * opened with showModal(). That gives a real focus trap, Escape-to-close, the
 * top layer and inertness of the rest of the page from the browser, rather than
 * from a hand-rolled keydown handler that will be subtly wrong.
 */
@Component({
  selector: 'hb-consent-banner',
  imports: [Button, RouterLink],
  templateUrl: './consent-banner.html',
  styleUrl: './consent-banner.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConsentBanner {
  private readonly consent = inject(ConsentService);
  protected readonly ui = inject(ConsentUi);

  private readonly dialogRef = viewChild<ElementRef<HTMLDialogElement>>('preferencesDialog');

  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  /**
   * False until hydration has finished, and permanently false on the server.
   *
   * The prerendered HTML must contain no banner: it is a static document served
   * to every visitor alike, and it cannot know what any one browser has stored.
   * But rendering nothing on the server and something on the client is a
   * hydration mismatch, so the flag flips only after the first client render,
   * by which point Angular has finished matching the DOM.
   */
  private readonly hydrated = signal(false);

  /**
   * The platform check is not redundant with `hydrated`. afterNextRender does
   * not run on the server, so the flag alone would do the job -- but that makes
   * "never prerendered" a consequence of a lifecycle hook's behaviour rather
   * than something this component states. It is a legal guarantee, so it is
   * stated.
   */
  protected readonly visible = computed(
    () => this.isBrowser && this.hydrated() && !this.consent.hasDecided(),
  );

  /**
   * The dialog's working copy. Edits here do nothing until Guardar is pressed,
   * so a visitor who opens preferences, flips a toggle and presses Escape has
   * changed nothing -- which is what closing without saving should mean.
   */
  private readonly draft = signal<Record<OptionalCategory, boolean>>({
    analytics: false,
    monitoring: false,
  });

  protected readonly categories = computed<readonly CategoryCopy[]>(() => [
    {
      id: 'analytics',
      name: $localize`:Consent category name|@@consent.category.analytics.name:Analítica`,
      description: $localize`:Consent category description|@@consent.category.analytics.description:Nos dicen de forma agregada qué páginas se visitan y cómo llega la gente al sitio, para poder mejorarlo.`,
    },
    {
      id: 'monitoring',
      name: $localize`:Consent category name|@@consent.category.monitoring.name:Monitorización de errores`,
      description: $localize`:Consent category description|@@consent.category.monitoring.description:Nos avisan cuando algo falla, con los detalles técnicos del fallo. Nunca incluyen lo que escribes en el formulario.`,
    },
  ]);

  constructor() {
    afterNextRender(() => this.hydrated.set(true));

    // Seeding on open rather than on save means the dialog always reflects what
    // is actually stored, including after a decision made from the banner.
    effect(() => {
      const dialog = this.dialogRef()?.nativeElement;
      if (dialog === undefined) {
        return;
      }

      if (this.ui.isOpen()) {
        if (!dialog.open) {
          this.draft.set({
            analytics: this.consent.allows('analytics'),
            monitoring: this.consent.allows('monitoring'),
          });
          dialog.showModal();
        }
      } else if (dialog.open) {
        dialog.close();
      }
    });
  }

  protected isDrafted(category: OptionalCategory): boolean {
    return this.draft()[category];
  }

  protected toggle(category: OptionalCategory, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    this.draft.update((current) => ({ ...current, [category]: checked }));
  }

  protected acceptAll(): void {
    this.consent.acceptAll();
    this.ui.closePreferences();
  }

  protected rejectAll(): void {
    this.consent.rejectAll();
    this.ui.closePreferences();
  }

  protected saveDraft(): void {
    this.consent.save(this.draft());
    this.ui.closePreferences();
  }

  protected openPreferences(): void {
    this.ui.openPreferences();
  }

  /**
   * Fires for Escape and for the backdrop alike, so the signal cannot drift out
   * of step with the element's own open state.
   */
  protected onDialogClose(): void {
    this.ui.closePreferences();
  }
}
