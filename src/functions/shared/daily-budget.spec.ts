import { createDailyBudget } from './daily-budget';

const MORNING = Date.UTC(2026, 9, 2, 8);
const EVENING = Date.UTC(2026, 9, 2, 23, 59);
const NEXT_DAY = Date.UTC(2026, 9, 3, 0, 1);

describe('createDailyBudget', () => {
  it('allows up to the limit in one UTC day, then refuses', () => {
    const budget = createDailyBudget(2);

    expect(budget.spend(MORNING)).toBe(true);
    expect(budget.spend(MORNING)).toBe(true);
    expect(budget.spend(EVENING)).toBe(false);
  });

  it('starts afresh at midnight UTC', () => {
    const budget = createDailyBudget(1);

    budget.spend(EVENING);
    expect(budget.spend(EVENING)).toBe(false);
    expect(budget.spend(NEXT_DAY)).toBe(true);
  });

  it('refuses everything with a budget of zero', () => {
    expect(createDailyBudget(0).spend(MORNING)).toBe(false);
  });
});
