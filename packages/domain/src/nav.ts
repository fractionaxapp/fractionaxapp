import { z } from 'zod';
import { Currency } from './common.js';

/** Where a NAV figure was sourced from. */
export const NavSource = z.enum(['pyth', 'switchboard', 'manual']);
export type NavSource = z.infer<typeof NavSource>;

/**
 * A net-asset-value price point for an asset. The oracle adapter normalizes
 * Pyth/Switchboard feeds (or a manual mark) into this shape.
 */
export const NavQuote = z.object({
  assetId: z.string(),
  /** Net asset value, in minor units. */
  navMinor: z.number().int().nonnegative(),
  currency: Currency,
  /** ISO 8601 timestamp the NAV was observed. */
  asOf: z.string(),
  source: NavSource,
});
export type NavQuote = z.infer<typeof NavQuote>;
