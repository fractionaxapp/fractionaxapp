import { z } from 'zod';
import { AssetKind } from './asset.js';
import { Currency, Jurisdiction, RiskTier } from './common.js';

/** The high-level action a user expresses in natural language. */
export const IntentAction = z.enum(['invest', 'discover', 'rebalance', 'quote']);
export type IntentAction = z.infer<typeof IntentAction>;

/**
 * The structured action the User Copilot Agent parses natural language into,
 * e.g. "Invest $1,000 in low-risk Malaysian real estate" ->
 * { action: "invest", amountMinor: 100000, currency: "USD", riskTier: "low",
 *   jurisdiction: "MY" }.
 */
export const InvestmentIntent = z.object({
  action: IntentAction,
  /** Amount in minor units, when the user names one. */
  amountMinor: z.number().int().positive().optional(),
  currency: Currency.optional(),
  riskTier: RiskTier.optional(),
  jurisdiction: Jurisdiction.optional(),
  assetKind: AssetKind.optional(),
});
export type InvestmentIntent = z.infer<typeof InvestmentIntent>;
