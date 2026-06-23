import { z } from 'zod';

/** Coarse risk classification shared across deals, investors and memos. */
export const RiskTier = z.enum(['low', 'medium', 'high']);
export type RiskTier = z.infer<typeof RiskTier>;

/** ISO 4217 currency code, e.g. "USD". */
export const Currency = z.string().length(3);

/** ISO 3166-1 alpha-2 jurisdiction code, e.g. "MY", "SG". */
export const Jurisdiction = z.string().length(2);
