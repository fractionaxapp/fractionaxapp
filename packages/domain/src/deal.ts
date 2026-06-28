import { z } from 'zod';
import { Currency, Jurisdiction, RiskTier } from './common.js';

/** Lifecycle of a deal as it moves through the agent pipeline. */
export const DealStatus = z.enum(['sourced', 'screening', 'open', 'funded', 'closed']);
export type DealStatus = z.infer<typeof DealStatus>;

/**
 * An investable opportunity backed by an Asset. Produced by the Deal Sourcing
 * Agent and surfaced in the deal discovery dashboard.
 */
export const Deal = z.object({
  id: z.string(),
  assetId: z.string(),
  title: z.string(),
  jurisdiction: Jurisdiction,
  currency: Currency,
  /** Minimum ticket size, in minor units. */
  minInvestmentMinor: z.number().int().positive(),
  /** Total amount being raised, in minor units. */
  targetRaiseMinor: z.number().int().positive(),
  /** Projected annual yield, as a percentage (e.g. 8.5). */
  projectedYieldPct: z.number(),
  riskTier: RiskTier,
  status: DealStatus,
  /** ISO 8601 timestamp the deal was sourced. */
  sourcedAt: z.string(),
  /** Asset class slug (e.g. "real-estate", "stocks") for discovery grouping.
   * Optional: legacy demo deals omit it; catalogue deals populate it. */
  assetClass: z.string().optional(),
});
export type Deal = z.infer<typeof Deal>;

/** Criteria the Deal Sourcing Agent filters opportunities by. */
export const DealFilter = z.object({
  jurisdiction: Jurisdiction.optional(),
  riskTier: RiskTier.optional(),
  minYieldPct: z.number().optional(),
  maxMinInvestmentMinor: z.number().int().positive().optional(),
});
export type DealFilter = z.infer<typeof DealFilter>;
