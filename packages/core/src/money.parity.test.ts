import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { money } from './money.js';

interface NormalizeCase {
  amount: number;
  currency: string;
  expected: { amount: number; currency: string };
}

// Shared fixtures, also asserted by py-core's test_money_parity.py, so the TS and
// Python money implementations stay in parity.
const cases = JSON.parse(
  readFileSync(new URL('../../../test-fixtures/money-cases.json', import.meta.url), 'utf8'),
) as { normalize: NormalizeCase[] };

describe('money parity (shared fixtures)', () => {
  for (const c of cases.normalize) {
    it(`normalizes ${c.amount} ${c.currency}`, () => {
      const m = money(c.amount, c.currency);
      expect({ amount: m.amount, currency: m.currency }).toEqual(c.expected);
    });
  }
});
