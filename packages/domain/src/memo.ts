import { z } from 'zod';
import { RiskTier } from './common.js';

/** A single risk factor called out in an investment memo. */
export const MemoRisk = z.object({
  title: z.string(),
  severity: RiskTier,
  detail: z.string(),
});
export type MemoRisk = z.infer<typeof MemoRisk>;

/**
 * The Underwriting Agent's structured output. This schema is the target shape
 * for the memo generator's structured-output call (Anthropic tool use / JSON
 * schema), so the model returns a memo we can render and store directly.
 */
export const InvestmentMemo = z.object({
  dealId: z.string(),
  summary: z.string(),
  /** Illiquidity-adjusted valuation, in minor units. */
  valuationMinor: z.number().int().nonnegative(),
  projectedYieldPct: z.number(),
  riskTier: RiskTier,
  risks: z.array(MemoRisk),
  recommendation: z.enum(['invest', 'pass', 'watch']),
  /** ISO 8601 timestamp the memo was generated. */
  generatedAt: z.string(),
});
export type InvestmentMemo = z.infer<typeof InvestmentMemo>;
