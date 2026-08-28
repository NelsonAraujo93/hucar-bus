import { ChangeDetectionStrategy, Component } from '@angular/core';

/**
 * Marks a section of a legal document whose text has not been written.
 *
 * The alternative was to fill the gap with plausible boilerplate, which is
 * worse: an invented privacy policy reads as a commitment the business has not
 * actually made, and nobody reviewing the page can tell which paragraphs are
 * real. A visible gap is honest, and it is also a working checklist for whoever
 * drafts the text.
 */
@Component({
  selector: 'hb-legal-pending',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <p class="pending">
      <strong class="pending__label" i18n="Marks unwritten legal text|@@legal.pending.label"
        >Pendiente de redacción.</strong
      >
      <ng-content />
    </p>
  `,
  styles: `
    .pending {
      margin: 12px 0 0;
      padding: 14px 16px;
      background: var(--color-sand-lighter);
      border-left: 4px solid var(--color-sunset-orange);
      border-radius: var(--radius-8);
      font-family: var(--font-body);
      font-size: 14px;
      line-height: 1.6;
      color: var(--color-ink);
    }

    .pending__label {
      margin-right: 4px;
    }
  `,
})
export class LegalPending {}
