import { z } from 'zod';
import { Jurisdiction, RiskTier } from './common.js';
import { KycStatus } from './compliance.js';

/** A platform user who invests in deals. KYC/accreditation deepens in M3. */
export const Investor = z.object({
  id: z.string(),
  displayName: z.string(),
  jurisdiction: Jurisdiction,
  /** Accredited-investor status; gates jurisdiction-restricted deals later. */
  accredited: z.boolean().default(false),
  /** The investor's configured risk appetite, used by the Portfolio Manager. */
  riskAppetite: RiskTier,
  /** Solana wallet the on-chain investor credential is keyed by (base58).
   * Optional until the investor connects a wallet. */
  wallet: z.string().optional(),
  /** KYC/AML screening state; the Compliance Agent (M3) drives this. */
  kycStatus: KycStatus.default('unverified'),
});
export type Investor = z.infer<typeof Investor>;
