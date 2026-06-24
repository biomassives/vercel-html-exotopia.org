/**
 * src/lib/evm/chains.ts
 *
 * EVM chain configurations for PON INK NFT minting.
 *
 * TESTNET chains (draft push):
 *   Polygon Amoy    — chainId 80002  — $BARS, Water Quality Certs, Health Card IDs
 *   Celo Alfajores  — chainId 44787  — Community badges, Eco-ops participation tokens
 *
 * MAINNET chains (production — not yet active):
 *   Polygon PoS     — chainId 137
 *   Celo mainnet    — chainId 42220
 *
 * Chain switch uses wallet_addEthereumChain / wallet_switchEthereumChain per EIP-3085.
 *
 * Celo choice rationale:
 *   Celo is EVM-compatible, mobile-first, and has strong East Africa adoption.
 *   Its cUSD stablecoin and M-Pesa bridge map directly to the community payment flows
 *   used by Uni-Kibaoni, OT Kulcha, and Fana Ka.
 *
 * Polygon choice rationale:
 *   Low gas costs, large ecosystem, and already specified in SPEC.md for
 *   $BARS, Health Card IDs, and Water Quality Certifications.
 */

export interface EvmChain {
  chainId:        number
  chainIdHex:     string
  name:           string
  shortName:      string
  network:        'testnet' | 'mainnet'
  rpcUrls:        string[]
  blockExplorer:  string
  nativeCurrency: { name: string; symbol: string; decimals: number }
  testFaucet?:    string
  ponInkRole:     string[]   // which NFT types are deployed on this chain
}

// ── Testnet chains ────────────────────────────────────────────────────────────

export const POLYGON_AMOY: EvmChain = {
  chainId:       80002,
  chainIdHex:    '0x13882',
  name:          'Polygon Amoy Testnet',
  shortName:     'amoy',
  network:       'testnet',
  rpcUrls:       ['https://rpc-amoy.polygon.technology'],
  blockExplorer: 'https://amoy.polygonscan.com',
  nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
  testFaucet:    'https://faucet.polygon.technology',
  ponInkRole:    ['bars', 'wq_cert', 'health_card'],
}

export const CELO_ALFAJORES: EvmChain = {
  chainId:       44787,
  chainIdHex:    '0xAEF3',
  name:          'Celo Alfajores Testnet',
  shortName:     'alfajores',
  network:       'testnet',
  rpcUrls:       ['https://alfajores-forno.celo-testnet.org'],
  blockExplorer: 'https://alfajores.celoscan.io',
  nativeCurrency: { name: 'CELO', symbol: 'CELO', decimals: 18 },
  testFaucet:    'https://faucet.celo.org/alfajores',
  ponInkRole:    ['community_badge', 'eco_ops_token'],
}

// ── Mainnet chains (production — addresses TBD) ───────────────────────────────

export const POLYGON_MAINNET: EvmChain = {
  chainId:       137,
  chainIdHex:    '0x89',
  name:          'Polygon PoS',
  shortName:     'polygon',
  network:       'mainnet',
  rpcUrls:       ['https://polygon-rpc.com'],
  blockExplorer: 'https://polygonscan.com',
  nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
  ponInkRole:    ['bars', 'wq_cert', 'health_card'],
}

export const CELO_MAINNET: EvmChain = {
  chainId:       42220,
  chainIdHex:    '0xA4EC',
  name:          'Celo',
  shortName:     'celo',
  network:       'mainnet',
  rpcUrls:       ['https://forno.celo.org'],
  blockExplorer: 'https://celoscan.io',
  nativeCurrency: { name: 'CELO', symbol: 'CELO', decimals: 18 },
  ponInkRole:    ['community_badge', 'eco_ops_token'],
}

// ── Deployed contract addresses ───────────────────────────────────────────────
// Testnet addresses are set once contracts are deployed via Hardhat.
// Until then, PLACEHOLDER indicates an address that must be provided before
// executeMint() is called (dry-run still works with any placeholder).

export interface ContractAddresses {
  exolocNft?:       string   // Exolocation Deed ERC-721 (Polygon Amoy primary)
  barsNft?:         string   // $BARS ERC-721
  wqCertNft?:       string   // Water Quality Certification ERC-721
  healthCardNft?:   string   // Health Card ID ERC-721
  communityBadge?:  string   // Community Badge ERC-721 (Celo)
  ecoOpsToken?:     string   // Eco-ops Participation Token ERC-721 (Celo)
}

// ── Read testnet contract addresses from Vite env vars ────────────────────────
// Set these in .env.local after deploying via /contracts/scripts/deploy.ts.
// PLACEHOLDER strings are detected as "not yet deployed" in mint-evm.ts.

const _env = (import.meta as any).env ?? {}
function _addr(key: string): string {
  const v = (_env[key] ?? '') as string
  return v.startsWith('0x') && v.length === 42 ? v : `PLACEHOLDER — set ${key} in .env.local`
}

export const TESTNET_CONTRACTS: Record<string, ContractAddresses> = {
  amoy: {
    exolocNft:     _addr('VITE_AMOY_EXOLOC_CONTRACT'),
    barsNft:       _addr('VITE_AMOY_BARS_CONTRACT'),
    wqCertNft:     _addr('VITE_AMOY_WQCERT_CONTRACT'),
    healthCardNft: _addr('VITE_AMOY_HEALTHCARD_CONTRACT'),
  },
  alfajores: {
    communityBadge: _addr('VITE_ALFAJORES_BADGE_CONTRACT'),
    ecoOpsToken:    _addr('VITE_ALFAJORES_ECOOP_CONTRACT'),
  },
}

// ── Gas estimates (approximate, testnet) ─────────────────────────────────────

export const GAS_ESTIMATES = {
  erc721Mint:       '~0.001 MATIC / ~0.001 CELO  (testnet gas is free via faucet)',
  ipfsUpload:       'Pinata free tier — no gas cost',
  metadataStorage:  '~0.0001 MATIC per KB on-chain (prefer IPFS pointer)',
}
