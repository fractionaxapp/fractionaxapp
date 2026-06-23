import { PublicKey, SystemProgram } from '@solana/web3.js';
import { describe, expect, it } from 'vitest';
import { decodeRegistry, getRegistryPda } from './registry.js';

describe('getRegistryPda', () => {
  it('derives deterministically for a program id', () => {
    const [a, bumpA] = getRegistryPda(SystemProgram.programId);
    const [b, bumpB] = getRegistryPda(SystemProgram.programId);
    expect(a.equals(b)).toBe(true);
    expect(bumpA).toBe(bumpB);
    expect(bumpA).toBeGreaterThanOrEqual(0);
    expect(bumpA).toBeLessThanOrEqual(255);
  });
});

describe('decodeRegistry', () => {
  it('decodes the Anchor account layout', () => {
    const authority = new PublicKey('So11111111111111111111111111111111111111112');
    const data = new Uint8Array(49);
    data.set(authority.toBytes(), 8); // after the 8-byte discriminator
    new DataView(data.buffer).setBigUint64(40, 7n, true);
    data[48] = 254;

    const registry = decodeRegistry(data);
    expect(registry.authority.equals(authority)).toBe(true);
    expect(registry.dealCount).toBe(7n);
    expect(registry.bump).toBe(254);
  });
});
