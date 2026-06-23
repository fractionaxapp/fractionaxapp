import { PublicKey, type Connection } from '@solana/web3.js';
import { FRACTIONAX_PROGRAM_ID } from './program.js';

/** Seed for the singleton Registry PDA (see the `onchain` Anchor program). */
const REGISTRY_SEED = new TextEncoder().encode('registry');

/** The decoded on-chain `Registry` account. */
export interface Registry {
  authority: PublicKey;
  dealCount: bigint;
  bump: number;
}

/** Derive the Registry PDA address (and bump) for a program. */
export function getRegistryPda(programId: PublicKey = FRACTIONAX_PROGRAM_ID): [PublicKey, number] {
  return PublicKey.findProgramAddressSync([REGISTRY_SEED], programId);
}

/**
 * Decode the Anchor `Registry` account.
 *
 * Layout (little-endian): `[8 discriminator][32 authority][8 deal_count u64][1 bump]`.
 */
export function decodeRegistry(data: Uint8Array): Registry {
  const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
  return {
    authority: new PublicKey(data.subarray(8, 40)),
    dealCount: view.getBigUint64(40, true),
    bump: view.getUint8(48),
  };
}

/**
 * Read the on-chain Registry from `connection`. Returns `null` when the program
 * is not yet deployed or the registry has not been initialized — callers render
 * a "not deployed" state rather than erroring.
 */
export async function fetchRegistry(
  connection: Connection,
  programId: PublicKey = FRACTIONAX_PROGRAM_ID,
): Promise<Registry | null> {
  const [pda] = getRegistryPda(programId);
  const info = await connection.getAccountInfo(pda);
  if (!info || info.data.length < 49) return null;
  return decodeRegistry(info.data);
}
