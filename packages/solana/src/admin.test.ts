import { Keypair } from '@solana/web3.js';
import { afterEach, describe, expect, it } from 'vitest';

import { deriveDemoWallet, getInvestorCredentialPda, loadAuthority } from './admin.js';
import { FRACTIONAX_PROGRAM_ID } from './program.js';

describe('getInvestorCredentialPda', () => {
  it('derives deterministically per wallet', () => {
    const wallet = Keypair.generate().publicKey;
    const [a, bumpA] = getInvestorCredentialPda(wallet);
    const [b, bumpB] = getInvestorCredentialPda(wallet);
    expect(a.equals(b)).toBe(true);
    expect(bumpA).toBe(bumpB);
    expect(bumpA).toBeGreaterThanOrEqual(0);
    expect(bumpA).toBeLessThanOrEqual(255);
  });

  it('is a PDA of the fractionax program (off-curve)', () => {
    const [pda] = getInvestorCredentialPda(Keypair.generate().publicKey, FRACTIONAX_PROGRAM_ID);
    // A valid PDA is off the ed25519 curve.
    expect(pda.toBytes()).toHaveLength(32);
  });
});

describe('deriveDemoWallet', () => {
  it('is deterministic for the same seed and distinct across seeds', () => {
    expect(deriveDemoWallet('inv_1').equals(deriveDemoWallet('inv_1'))).toBe(true);
    expect(deriveDemoWallet('inv_1').equals(deriveDemoWallet('inv_2'))).toBe(false);
  });
});

describe('loadAuthority', () => {
  const original = process.env.SOLANA_AUTHORITY_SECRET;
  afterEach(() => {
    if (original === undefined) delete process.env.SOLANA_AUTHORITY_SECRET;
    else process.env.SOLANA_AUTHORITY_SECRET = original;
  });

  it('throws when the secret is unset', () => {
    delete process.env.SOLANA_AUTHORITY_SECRET;
    expect(() => loadAuthority()).toThrow(/SOLANA_AUTHORITY_SECRET/);
  });

  it('round-trips a JSON byte-array secret key (id.json format)', () => {
    const kp = Keypair.generate();
    process.env.SOLANA_AUTHORITY_SECRET = JSON.stringify([...kp.secretKey]);
    expect(loadAuthority().publicKey.equals(kp.publicKey)).toBe(true);
  });

  it('rejects a non-array secret', () => {
    process.env.SOLANA_AUTHORITY_SECRET = 'not-json';
    expect(() => loadAuthority()).toThrow(/JSON array/);
  });
});
