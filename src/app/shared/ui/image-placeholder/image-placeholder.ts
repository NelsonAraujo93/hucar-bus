import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * Tones from the design, which assigns one per image slot: sunset for the fleet
 * portrait, ocean for the map, and a cycle across the Instagram grid.
 */
export type PlaceholderTone = 'sand' | 'sunset' | 'ocean' | 'night' | 'gray';

/**
 * Stands in for photography that has not arrived yet.
 *
 * Deliberately not the design's PlaceholderImage, which the handoff says never
 * to port: that one carries a monospaced caption chip and hairline stripes to
 * mark a dev artefact. This is just the tone, so a page with it still reads as
 * finished rather than unbuilt.
 *
 * Decorative: it conveys nothing, so it stays out of the accessibility tree
 * until a real image with real alt text replaces it.
 *
 * Shape is the caller's business. An inline aspect-ratio here would outrank the
 * consumer's own stylesheet and force !important on every responsive override.
 */
@Component({
  selector: 'hb-image-placeholder',
  templateUrl: './image-placeholder.html',
  styleUrl: './image-placeholder.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.data-tone]': 'tone()',
    '[attr.aria-hidden]': '"true"',
  },
})
export class ImagePlaceholder {
  readonly tone = input<PlaceholderTone>('sand');
}
