import { Component, inject } from '@angular/core';
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
  imports: [Button, ContactForm, Icon, ImagePlaceholder, SectionHeader],
  templateUrl: './contact.html',
  styleUrl: './contact.css',
})
export class Contact {
  protected readonly config = inject(SITE_CONFIG);
}
