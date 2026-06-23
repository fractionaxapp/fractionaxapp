import { z } from 'zod';
import { Jurisdiction, RiskTier } from './common.js';

/** A platform user who invests in deals. KYC/accreditation deepens in M3. */
export const Investor = z.object({
  id: z.string(),
  displayName: z.string(),
  jurisdiction: Jurisdiction,
  /** Accredited-investor status; gates jurisdiction-restricted deals later. */
  accredited: z.boolean().default(false),
  /** The investor's configured risk appetite, used by the Portfolio Manager. */
  riskAppetite: RiskTier,
});
export type Investor = z.infer<typeof Investor>;
