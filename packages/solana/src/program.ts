import { PublicKey } from '@solana/web3.js';

/**
 * On-chain program ID for the Fractionax Anchor program (see the `onchain`
 * submodule). Defaults to the System Program as a placeholder until the program
 * is deployed to devnet; override via FRACTIONAX_PROGRAM_ID.
 */
export const FRACTIONAX_PROGRAM_ID = new PublicKey(
  process.env.FRACTIONAX_PROGRAM_ID ?? '11111111111111111111111111111111',
);
