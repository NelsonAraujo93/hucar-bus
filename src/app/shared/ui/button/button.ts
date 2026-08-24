import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type ButtonVariant = 'yellow' | 'whatsapp' | 'teal' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

/**
 * Applied to a real `<button>` or `<a>` rather than wrapping one.
 *
 * The prototype renders every button as an anchor, which is wrong for a submit
 * control: the contact form needs a genuine `<button type="submit">`. An
 * attribute selector lets the caller pick the correct element and keeps the
 * host native, so keyboard behaviour, form participation and link semantics all
 * come for free.
 */
@Component({
  selector: 'button[hb-button], a[hb-button]',
  templateUrl: './button.html',
  styleUrl: './button.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'hb-button',
    '[attr.data-variant]': 'variant()',
    '[attr.data-size]': 'size()',
    '[class.is-full]': 'full()',
    '[class.is-pending]': 'pending()',
    // aria-busy tells assistive tech the control is working; aria-disabled
    // covers anchors, which have no native disabled state.
    '[attr.aria-busy]': 'pending() || null',
    '[attr.aria-disabled]': 'pending() || null',
  },
})
export class Button {
  readonly variant = input<ButtonVariant>('yellow');
  readonly size = input<ButtonSize>('md');

  /** Stretches to the width of its container. */
  readonly full = input(false);

  /** Swaps the leading icon for a spinner and blocks interaction. */
  readonly pending = input(false);
}
