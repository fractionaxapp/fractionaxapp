/**
 * Minimal money primitive — integer minor units to avoid floating-point drift.
 * Placeholder for shared financial logic across Fractionax services.
 */
export interface Money {
  /** Amount in minor units (e.g. cents). */
  readonly amount: number;
  /** ISO 4217 currency code, e.g. "USD". */
  readonly currency: string;
}

export function money(amount: number, currency: string): Money {
  if (!Number.isInteger(amount)) {
    throw new TypeError('Money.amount must be an integer in minor units');
  }
  return { amount, currency: currency.toUpperCase() };
}

export function addMoney(a: Money, b: Money): Money {
  if (a.currency !== b.currency) {
    throw new Error(`Currency mismatch: ${a.currency} vs ${b.currency}`);
  }
  return money(a.amount + b.amount, a.currency);
}
