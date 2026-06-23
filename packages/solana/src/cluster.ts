import { Connection, clusterApiUrl, type Cluster } from '@solana/web3.js';

/** Default Solana cluster for Fractionax during development. */
export const DEFAULT_CLUSTER: Cluster = 'devnet';

/** RPC endpoint for a cluster; override via SOLANA_RPC_URL for private RPCs. */
export function getRpcUrl(cluster: Cluster = DEFAULT_CLUSTER): string {
  return process.env.SOLANA_RPC_URL ?? clusterApiUrl(cluster);
}

/** A confirmed-commitment connection to the chosen cluster. */
export function getConnection(cluster: Cluster = DEFAULT_CLUSTER): Connection {
  return new Connection(getRpcUrl(cluster), 'confirmed');
}
