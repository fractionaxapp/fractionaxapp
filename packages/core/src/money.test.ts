import { describe, expect, it } from 'vitest';
import { addMoney, money } from './money.js';

describe('money', () => {
  it('rejects non-integer minor units', () => {
    expect(() => money(1.5, 'usd')).toThrow(TypeError);
  });

  it('normalizes the currency code', () => {
    expect(money(100, 'usd').currency).toBe('USD');
  });

  it('adds matching currencies', () => {
    expect(addMoney(money(100, 'USD'), money(50, 'USD')).amount).toBe(150);
  });

  it('rejects currency mismatch', () => {
    expect(() => addMoney(money(100, 'USD'), money(50, 'EUR'))).toThrow();
  });
});
