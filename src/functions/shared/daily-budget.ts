/**
 * A cap on how many times something may happen per UTC day, in one function
 * instance's memory.
 *
 * Used to bound calls to paid APIs when the provider's own quota cannot be
 * set. Per instance, so the true daily total can exceed it by the number of
 * warm instances -- on a small site that is one or two.
 */
export interface DailyBudget {
  /** Spends one unit and reports whether it was available. */
  spend(now: number): boolean;
}

export function createDailyBudget(limit: number): DailyBudget {
  let day = '';
  let spent = 0;

  return {
    spend(now: number): boolean {
      const today = new Date(now).toISOString().slice(0, 10);
      if (today !== day) {
        day = today;
        spent = 0;
      }
      if (spent >= limit) {
        return false;
      }
      spent += 1;
      return true;
    },
  };
}
