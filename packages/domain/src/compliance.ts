import { z } from 'zod';
import { Jurisdiction, RiskTier } from './common.js';
import { AssetKind } from './asset.js';

/**
 * KYC/AML screening state for an investor. `pending` means a check is in
 * flight; `verified`/`rejected` are terminal. Written on-chain to the investor
 * credential PDA once terminal (see the `fractionax` program's InvestorCredential).
 */
export const KycStatus = z.enum(['unverified', 'pending', 'verified', 'rejected']);
export type KycStatus = z.infer<typeof KycStatus>;

/**
 * Accreditation tier. Gates jurisdiction-restricted and higher-risk deals:
 * `retail` is the default, `accredited`/`institutional` unlock Reg D-style
 * private offerings.
 */
export const AccreditationTier = z.enum(['retail', 'accredited', 'institutional']);
export type AccreditationTier = z.infer<typeof AccreditationTier>;

/**
 * The securities-exemption regime a deal is offered under. Drives which
 * investors (by jurisdiction + accreditation) may participate:
 * - `reg_d`: US private placement — accredited US investors only
 * - `reg_s`: offshore — non-US investors only
 * - `reg_a`: mini-IPO — open to retail within permitted jurisdictions
 */
export const OfferingRegime = z.enum(['reg_d', 'reg_s', 'reg_a']);
export type OfferingRegime = z.infer<typeof OfferingRegime>;

/** A single machine-readable reason contributing to a compliance decision. */
export const ComplianceReason = z.object({
  /** Stable code, e.g. `kyc_not_verified`, `jurisdiction_blocked`. */
  code: z.string(),
  detail: z.string(),
});
export type ComplianceReason = z.infer<typeof ComplianceReason>;

/**
 * An investor's compliance profile — the off-chain source of truth the
 * Compliance Agent maintains and mirrors on-chain to the credential PDA.
 */
export const ComplianceProfile = z.object({
  investorId: z.string(),
  jurisdiction: Jurisdiction,
  kycStatus: KycStatus,
  accreditationTier: AccreditationTier,
  /** True if screened clear of sanctions/watchlist hits. */
  sanctionsClear: z.boolean(),
  /** ISO 8601 timestamp the profile was last screened. */
  screenedAt: z.string(),
});
export type ComplianceProfile = z.infer<typeof ComplianceProfile>;

/**
 * The Compliance Agent's structured verdict for one investor against one deal.
 * `outcome === 'allow'` is the gate the invest CTA and the on-chain gated
 * instruction both enforce.
 */
export const ComplianceDecision = z.object({
  investorId: z.string(),
  dealId: z.string(),
  outcome: z.enum(['allow', 'deny']),
  kycStatus: KycStatus,
  accreditationTier: AccreditationTier,
  /** The regime the deal was evaluated under. */
  regime: OfferingRegime,
  /** Non-empty when `outcome === 'deny'`; the specific failures. */
  reasons: z.array(ComplianceReason),
  /** Plain-language rationale for the decision. */
  rationale: z.string(),
  /** ISO 8601 timestamp of the decision. */
  decidedAt: z.string(),
});
export type ComplianceDecision = z.infer<typeof ComplianceDecision>;

/**
 * A jurisdiction-aware transfer/holding rule. The rules engine evaluates a deal
 * (its regime + asset kind) against an investor's jurisdiction + accreditation
 * to decide eligibility. `minTier` is the lowest accreditation tier permitted.
 */
export const JurisdictionRule = z.object({
  regime: OfferingRegime,
  /** Jurisdictions permitted under this regime; empty means "any not blocked". */
  allowedJurisdictions: z.array(Jurisdiction),
  /** Jurisdictions explicitly blocked regardless of tier. */
  blockedJurisdictions: z.array(Jurisdiction),
  minTier: AccreditationTier,
  /** Asset kinds this rule applies to; empty means all kinds. */
  assetKinds: z.array(AssetKind),
  /** Risk tiers that additionally require accreditation. */
  accreditedOnlyRiskTiers: z.array(RiskTier),
});
export type JurisdictionRule = z.infer<typeof JurisdictionRule>;

/**
 * Result of the transfer-restriction predicate: whether `to` may receive/hold a
 * deal's fractional token. Used by the secondary-market path (M3) and mirrors
 * the on-chain gate.
 */
export const TransferCheck = z.object({
  dealId: z.string(),
  fromInvestorId: z.string(),
  toInvestorId: z.string(),
  allowed: z.boolean(),
  reasons: z.array(ComplianceReason),
});
export type TransferCheck = z.infer<typeof TransferCheck>;
