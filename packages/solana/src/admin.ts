/**
 * Server-only admin signer for the `fractionax` program's privileged instructions.
 *
 * This module loads the program authority keypair from `SOLANA_AUTHORITY_SECRET`
 * and builds/signs/submits transactions, so it MUST NOT be imported into client
 * code — it is exposed on the `@fractionax/solana/admin` subpath (never re-exported
 * from the package index) and uses `node:crypto`, keeping it off the browser bundle.
 *
 * Instructions are hand-built to match the Anchor program without pulling in the
 * Anchor client: the 8-byte discriminator is `sha256("global:<ix>")[..8]` and args
 * are Borsh-encoded. Account orders mirror the `#[derive(Accounts)]` structs in
 * `onchain/programs/fractionax/src/lib.rs`.
 */
import { createHash } from 'node:crypto';

import {
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
  sendAndConfirmTransaction,
} from '@solana/web3.js';
import type { Connection } from '@solana/web3.js';

import { DEFAULT_CLUSTER, getConnection } from './cluster.js';
import { FRACTIONAX_PROGRAM_ID } from './program.js';
import { getRegistryPda } from './registry.js';

function anchorDiscriminator(ixName: string): Buffer {
  return createHash('sha256').update(`global:${ixName}`).digest().subarray(0, 8);
}

/** Load the program authority keypair from `SOLANA_AUTHORITY_SECRET` (the JSON byte
 * array from a Solana id.json). Throws if unset or malformed. */
export function loadAuthority(): Keypair {
  const raw = process.env.SOLANA_AUTHORITY_SECRET;
  if (!raw) throw new Error('SOLANA_AUTHORITY_SECRET is not set');
  let bytes: number[];
  try {
    bytes = JSON.parse(raw) as number[];
  } catch {
    throw new Error('SOLANA_AUTHORITY_SECRET must be a JSON array of bytes (id.json contents)');
  }
  return Keypair.fromSecretKey(Uint8Array.from(bytes));
}

/** PDA for an investor's on-chain compliance credential (seeds ["investor", wallet]). */
export function getInvestorCredentialPda(
  wallet: PublicKey,
  programId: PublicKey = FRACTIONAX_PROGRAM_ID,
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync([Buffer.from('investor'), wallet.toBytes()], programId);
}

/** Deterministically derive a devnet wallet pubkey for an investor that hasn't
 * connected one, so credentials can be issued in the demo. Same input → same
 * address (so issue/revoke target the same PDA). Not a spendable account. */
export function deriveDemoWallet(seed: string): PublicKey {
  const hash = createHash('sha256').update(`fractionax-investor:${seed}`).digest();
  return new PublicKey(hash.subarray(0, 32));
}

function jurisdictionBytes(jurisdiction: string): Buffer {
  const code = jurisdiction.trim().toUpperCase().padEnd(2, 'X').slice(0, 2);
  return Buffer.from(code, 'ascii');
}

function borshString(value: string): Buffer {
  const utf8 = Buffer.from(value, 'utf8');
  const len = Buffer.alloc(4);
  len.writeUInt32LE(utf8.length, 0);
  return Buffer.concat([len, utf8]);
}

async function submit(
  conn: Connection,
  authority: Keypair,
  ix: TransactionInstruction,
): Promise<string> {
  const tx = new Transaction().add(ix);
  return sendAndConfirmTransaction(conn, tx, [authority], { commitment: 'confirmed' });
}

/** Register a deal on-chain (admin-gated). Returns the transaction signature. */
export async function registerDeal(dealId: string): Promise<string> {
  const authority = loadAuthority();
  const conn = getConnection(DEFAULT_CLUSTER);
  const [registry] = getRegistryPda(FRACTIONAX_PROGRAM_ID);
  const data = Buffer.concat([anchorDiscriminator('register_deal'), borshString(dealId)]);
  const ix = new TransactionInstruction({
    programId: FRACTIONAX_PROGRAM_ID,
    keys: [
      { pubkey: registry, isSigner: false, isWritable: true },
      { pubkey: authority.publicKey, isSigner: true, isWritable: false },
    ],
    data,
  });
  return submit(conn, authority, ix);
}

export interface CredentialArgs {
  wallet: PublicKey;
  jurisdiction: string;
  kycVerified: boolean;
  accredited: boolean;
  sanctionsClear: boolean;
}

/** Write/update an investor's on-chain credential (authority-signed upsert). */
export async function setInvestorCredential(args: CredentialArgs): Promise<string> {
  const authority = loadAuthority();
  const conn = getConnection(DEFAULT_CLUSTER);
  const [registry] = getRegistryPda(FRACTIONAX_PROGRAM_ID);
  const [credential] = getInvestorCredentialPda(args.wallet);
  const data = Buffer.concat([
    anchorDiscriminator('set_investor_credential'),
    jurisdictionBytes(args.jurisdiction),
    Buffer.from([args.kycVerified ? 1 : 0, args.accredited ? 1 : 0, args.sanctionsClear ? 1 : 0]),
  ]);
  const ix = new TransactionInstruction({
    programId: FRACTIONAX_PROGRAM_ID,
    keys: [
      { pubkey: registry, isSigner: false, isWritable: false },
      { pubkey: credential, isSigner: false, isWritable: true },
      { pubkey: args.wallet, isSigner: false, isWritable: false },
      { pubkey: authority.publicKey, isSigner: true, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    data,
  });
  return submit(conn, authority, ix);
}

/** Revoke an investor's on-chain credential (authority-signed). */
export async function revokeInvestorCredential(wallet: PublicKey): Promise<string> {
  const authority = loadAuthority();
  const conn = getConnection(DEFAULT_CLUSTER);
  const [registry] = getRegistryPda(FRACTIONAX_PROGRAM_ID);
  const [credential] = getInvestorCredentialPda(wallet);
  const data = anchorDiscriminator('revoke_investor_credential');
  const ix = new TransactionInstruction({
    programId: FRACTIONAX_PROGRAM_ID,
    keys: [
      { pubkey: registry, isSigner: false, isWritable: false },
      { pubkey: wallet, isSigner: false, isWritable: false },
      { pubkey: credential, isSigner: false, isWritable: true },
      { pubkey: authority.publicKey, isSigner: true, isWritable: false },
    ],
    data,
  });
  return submit(conn, authority, ix);
}

// --- String-based wrappers ---------------------------------------------------
// Higher-level entry points that take/return plain strings, so callers (the web
// route handlers) never need to import @solana/web3.js themselves. The wallet is
// the investor's connected wallet when provided, else a deterministic demo wallet.

function resolveWallet(investorId: string, wallet?: string | null): PublicKey {
  return wallet ? new PublicKey(wallet) : deriveDemoWallet(investorId);
}

/** Issue/update a credential; returns the tx signature and the wallet used. */
export async function issueCredential(params: {
  investorId: string;
  wallet?: string | null;
  jurisdiction: string;
  accredited: boolean;
  kycVerified: boolean;
  sanctionsClear: boolean;
}): Promise<{ tx: string; wallet: string }> {
  const wallet = resolveWallet(params.investorId, params.wallet);
  const tx = await setInvestorCredential({
    wallet,
    jurisdiction: params.jurisdiction,
    kycVerified: params.kycVerified,
    accredited: params.accredited,
    sanctionsClear: params.sanctionsClear,
  });
  return { tx, wallet: wallet.toBase58() };
}

/** Revoke a credential; returns the tx signature and the wallet used. */
export async function revokeCredential(params: {
  investorId: string;
  wallet?: string | null;
}): Promise<{ tx: string; wallet: string }> {
  const wallet = resolveWallet(params.investorId, params.wallet);
  const tx = await revokeInvestorCredential(wallet);
  return { tx, wallet: wallet.toBase58() };
}
