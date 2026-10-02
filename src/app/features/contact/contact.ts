import { NgComponentOutlet } from '@angular/common';
import { Component, inject, signal, type Type } from '@angular/core';
import { SITE_CONFIG } from '../../core/config/site.config';
import { Button } from '../../shared/ui/button/button';
import { Icon } from '../../shared/ui/icon/icon';
import { ImagePlaceholder } from '../../shared/ui/image-placeholder/image-placeholder';
import { SectionHeader } from '../../shared/ui/section-header/section-header';
import { ContactForm } from './contact-form/contact-form';

/**
 * The contact section: the form beside the direct channels.
 *
 * Layout only. The form, its states and its submission live in ContactForm.
 */
@Component({
  selector: 'hb-contact',
  imports: [Button, ContactForm, Icon, ImagePlaceholder, NgComponentOutlet, SectionHeader],
  templateUrl: './contact.html',
  styleUrl: './contact.css',
})
export class Contact {
  protected readonly config = inject(SITE_CONFIG);

  /**
   * TEMPORARY. With HB_MOCKS false (production) the import below is removed at
   * build time, so the mock and its third-party URL never reach the bundle.
   */
  protected readonly mockMap = signal<Type<unknown> | null>(null);

  constructor() {
    if (HB_MOCKS) {
      void import('../../mocks/mock-map').then((module) => this.mockMap.set(module.MockMap));
    }
  }
}
