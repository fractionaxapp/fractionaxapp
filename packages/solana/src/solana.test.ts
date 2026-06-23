import { describe, expect, it } from 'vitest';
import { DEFAULT_CLUSTER, getRpcUrl } from './cluster.js';
import { FRACTIONAX_PROGRAM_ID } from './program.js';

describe('cluster', () => {
  it('defaults to devnet', () => {
    expect(DEFAULT_CLUSTER).toBe('devnet');
  });

  it('returns a devnet RPC url when no override is set', () => {
    delete process.env.SOLANA_RPC_URL;
    expect(getRpcUrl('devnet')).toContain('devnet');
  });

  it('honors the SOLANA_RPC_URL override', () => {
    process.env.SOLANA_RPC_URL = 'https://example-rpc.test';
    expect(getRpcUrl()).toBe('https://example-rpc.test');
    delete process.env.SOLANA_RPC_URL;
  });
});

describe('program', () => {
  it('exposes a valid base58 program id', () => {
    expect(FRACTIONAX_PROGRAM_ID.toBase58()).toHaveLength(32);
  });
});
