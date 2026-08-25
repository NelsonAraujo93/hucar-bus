export interface Review {
  readonly name: string;
  /** Relative date as supplied by the source, e.g. "hace 2 meses". */
  readonly when: string;
  readonly text: string;
}

export interface ReviewSummary {
  /** Average rating as displayed, e.g. "4.8". */
  readonly average: string;
  /** Count as displayed, e.g. "120+". */
  readonly count: string;
}
