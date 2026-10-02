import { Component, computed, input } from '@angular/core';
import { Icon } from '../../../shared/ui/icon/icon';
import type { Review } from '../reviews.model';

const STARS = [1, 2, 3, 4, 5] as const;

/**
 * One Google review, credited the way Google requires: the author's photo,
 * name and a link to their profile, and a note when Google translated it.
 *
 * The stars are the review's own rating. A design mock-up can show five on
 * every card; a real review that scored three cannot.
 */
@Component({
  selector: 'hb-review-card',
  imports: [Icon],
  templateUrl: './review-card.html',
  styleUrl: './review-card.css',
})
export class ReviewCard {
  readonly review = input.required<Review>();

  protected readonly stars = STARS;

  protected readonly initial = computed(() => this.review().author.charAt(0).toUpperCase());

  protected readonly ratingLabel = computed(
    () =>
      $localize`:Star rating of one review|@@reviews.card.rating:${this.review().rating}:rating: de 5 estrellas`,
  );
}
