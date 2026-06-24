import { PublicKey } from '@solana/web3.js';

/**
 * On-chain program ID for the Fractionax Anchor program (see the `onchain`
 * submodule). Defaults to the devnet deployment; override via FRACTIONAX_PROGRAM_ID
 * (e.g. for a mainnet deployment).
 */
export const FRACTIONAX_PROGRAM_ID = new PublicKey(
  process.env.FRACTIONAX_PROGRAM_ID ?? 'Aqvk9Br2PPoTzGZbnYVxnwgpGTzPZTdcowpN9gdkRXGP',
);
