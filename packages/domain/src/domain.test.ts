import { describe, expect, it } from 'vitest';
import { Asset } from './asset.js';
import { Deal } from './deal.js';
import { InvestmentIntent } from './intent.js';
import { InvestmentMemo } from './memo.js';

describe('asset', () => {
  it('accepts a valid IP-royalty asset', () => {
    const parsed = Asset.parse({
      kind: 'ip_royalty',
      id: 'ast_1',
      name: 'Catalog A',
      currency: 'USD',
      jurisdiction: 'US',
      licensor: 'Label X',
      annualRoyaltyMinor: 1_200_000,
      termMonths: 36,
    });
    expect(parsed.kind).toBe('ip_royalty');
  });

  it('rejects an unknown asset kind', () => {
    expect(() => Asset.parse({ kind: 'real_estate', id: 'x' })).toThrow();
  });
});

describe('deal', () => {
  it('rejects a non-positive minimum investment', () => {
    expect(() =>
      Deal.parse({
        id: 'deal_1',
        assetId: 'ast_1',
        title: 'Catalog A — Q3',
        jurisdiction: 'US',
        currency: 'USD',
        minInvestmentMinor: 0,
        targetRaiseMinor: 5_000_000,
        projectedYieldPct: 8.5,
        riskTier: 'low',
        status: 'open',
        sourcedAt: '2026-06-23T00:00:00Z',
      }),
    ).toThrow();
  });
});

describe('investment intent', () => {
  it('parses a minimal "discover" intent', () => {
    const intent = InvestmentIntent.parse({ action: 'discover', riskTier: 'low', jurisdiction: 'MY' });
    expect(intent.action).toBe('discover');
    expect(intent.jurisdiction).toBe('MY');
  });
});

describe('investment memo', () => {
  it('requires a recommendation', () => {
    expect(() =>
      InvestmentMemo.parse({
        dealId: 'deal_1',
        summary: 'Solid catalog with stable streaming income.',
        valuationMinor: 4_800_000,
        projectedYieldPct: 8.5,
        riskTier: 'low',
        risks: [],
        generatedAt: '2026-06-23T00:00:00Z',
      }),
    ).toThrow();
  });
});
