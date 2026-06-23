import { z } from 'zod';
import { Currency, Jurisdiction } from './common.js';

/** The alternative-asset classes Fractionax onboards at launch. */
export const AssetKind = z.enum(['ip_royalty', 'invoice', 'revenue_share']);
export type AssetKind = z.infer<typeof AssetKind>;

const AssetBase = z.object({
  id: z.string(),
  name: z.string(),
  currency: Currency,
  jurisdiction: Jurisdiction,
});

/** Income from licensed intellectual property (music, patents, trademarks). */
export const IpRoyaltyAsset = AssetBase.extend({
  kind: z.literal('ip_royalty'),
  licensor: z.string(),
  /** Expected annual royalty income, in minor units. */
  annualRoyaltyMinor: z.number().int().nonnegative(),
  termMonths: z.number().int().positive(),
});
export type IpRoyaltyAsset = z.infer<typeof IpRoyaltyAsset>;

/** A receivable purchased at a discount to face value. */
export const InvoiceAsset = AssetBase.extend({
  kind: z.literal('invoice'),
  debtor: z.string(),
  /** Face (settlement) value, in minor units. */
  faceValueMinor: z.number().int().positive(),
  /** ISO 8601 date the invoice is due. */
  dueDate: z.string(),
});
export type InvoiceAsset = z.infer<typeof InvoiceAsset>;

/** A share of a business's future revenue. */
export const RevenueShareAsset = AssetBase.extend({
  kind: z.literal('revenue_share'),
  business: z.string(),
  /** Percentage of revenue shared with holders (0–100). */
  sharePct: z.number().min(0).max(100),
  projectedMonthlyRevenueMinor: z.number().int().nonnegative(),
});
export type RevenueShareAsset = z.infer<typeof RevenueShareAsset>;

/** Any onboardable alternative asset, discriminated by `kind`. */
export const Asset = z.discriminatedUnion('kind', [
  IpRoyaltyAsset,
  InvoiceAsset,
  RevenueShareAsset,
]);
export type Asset = z.infer<typeof Asset>;
