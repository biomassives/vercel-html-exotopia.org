<template>
  <q-page class="chain-page q-pa-md">

    <!-- ── Header ─────────────────────────────────────────────────────────── -->
    <div class="chain-header">
      <div class="chain-title">
        <q-icon name="mdi-link-variant" color="cyan-5" size="18px" class="q-mr-sm" />
        NETWORKS
      </div>
      <div class="chain-sub">
        NFT minting, certification, and collectible schemas across 6 networks.
        Status reflects current testnet deployment.
        <router-link to="/docs#chains-section" style="color:rgba(0,200,240,0.70);margin-left:8px;font-size:9px">
          ↗ Full network docs
        </router-link>
      </div>
    </div>

    <!-- ── Status legend ──────────────────────────────────────────────────── -->
    <div class="status-legend q-mb-lg">
      <span v-for="s in STATUS_TYPES" :key="s.id" class="legend-chip" :class="`legend--${s.id}`">
        <span class="legend-dot" :style="{ background: s.color }" />
        {{ s.label }}
      </span>
      <span class="legend-note">· hover any cell for details</span>
    </div>

    <!-- ── Chain info cards ───────────────────────────────────────────────── -->
    <div class="chain-cards q-mb-xl">
      <div
        v-for="chain in CHAINS" :key="chain.id"
        class="chain-card"
        :class="`chain-card--${chain.overallStatus}`"
      >
        <div class="cc-header" :style="{ borderColor: chain.color + '55' }">
          <div class="cc-dot" :style="{ background: chain.color }" />
          <div>
            <div class="cc-name">{{ chain.name }}</div>
            <div class="cc-ticker">{{ chain.ticker }}</div>
          </div>
          <div class="cc-status-badge" :class="`badge--${chain.overallStatus}`">
            {{ chain.overallStatus.toUpperCase() }}
          </div>
        </div>
        <div class="cc-body">
          <div class="cc-standard">{{ chain.standard }}</div>
          <div class="cc-desc">{{ chain.desc }}</div>
          <div class="cc-network">
            <span class="cc-net-label">Testnet:</span> {{ chain.testnet }}
          </div>
          <div v-if="chain.faucet" class="cc-faucet">
            <a :href="chain.faucet" target="_blank" rel="noopener" class="cc-faucet-link">
              ⛽ {{ chain.faucet.replace('https://', '') }}
            </a>
          </div>
        </div>
      </div>
    </div>

    <!-- ── Matrix grid ─────────────────────────────────────────────────────── -->
    <div class="matrix-wrap">
      <div class="matrix-title q-mb-sm">NFT TYPE × CHAIN STATUS</div>

      <div class="matrix-scroll">
        <table class="matrix-table">
          <thead>
            <tr>
              <th class="matrix-th-corner">NFT Type</th>
              <th v-for="c in CHAINS" :key="c.id" class="matrix-th-chain">
                <div class="matrix-chain-head">
                  <div class="matrix-chain-dot" :style="{ background: c.color }" />
                  <div class="matrix-chain-sym">{{ c.ticker }}</div>
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="nft in NFT_TYPES" :key="nft.id"
              :class="{ 'matrix-row--section': nft.isSection }">

              <!-- Row header -->
              <td class="matrix-row-label">
                <template v-if="nft.isSection">
                  <div class="matrix-section-label">{{ nft.label }}</div>
                </template>
                <template v-else>
                  <div class="matrix-nft-name">{{ nft.label }}</div>
                  <div class="matrix-nft-sub">{{ nft.sub }}</div>
                </template>
              </td>

              <!-- Status cells -->
              <template v-if="!nft.isSection">
                <td v-for="chain in CHAINS" :key="chain.id"
                  class="matrix-cell"
                  :title="getCellNote(nft.id, chain.id)"
                >
                  <div
                    class="matrix-status"
                    :class="`status--${getStatus(nft.id, chain.id)}`"
                  >
                    <span class="status-icon">{{ STATUS_ICONS[getStatus(nft.id, chain.id)] }}</span>
                    <span class="status-text">{{ getStatusLabel(nft.id, chain.id) }}</span>
                  </div>
                </td>
              </template>
              <template v-else>
                <td v-for="chain in CHAINS" :key="chain.id" class="matrix-cell matrix-cell--section" />
              </template>

            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- ── Footer notes ────────────────────────────────────────────────────── -->
    <div class="chain-footnotes q-mt-xl">
      <div class="fn-title">NOTES</div>
      <div class="fn-row">
        <span class="fn-bullet">◈</span>
        <span>All testnet deployments require testnet gas from the chain's faucet. Production gas is always displayed separately from community payout amounts (fee isolation rule).</span>
      </div>
      <div class="fn-row">
        <span class="fn-bullet">◈</span>
        <span>Tezos and Hedera are PLANNED but not yet deployed. Contracts are being designed. Community governance vote required before mainnet launch.</span>
      </div>
      <div class="fn-row">
        <span class="fn-bullet">◈</span>
        <span>The 100/0/0 — Platform Free applies on all chains. 100% creator — platform is free.</span>
      </div>
      <div class="fn-row">
        <span class="fn-bullet">◈</span>
        <span>GPL v3 · Community owns its data · No chain lock-in by design.</span>
      </div>
    </div>

  </q-page>
</template>

<script setup lang="ts">

// ── Chain definitions ─────────────────────────────────────────────────────────

interface Chain {
  id:            string
  name:          string
  ticker:        string
  color:         string
  standard:      string
  desc:          string
  testnet:       string
  faucet?:       string
  overallStatus: 'live' | 'testing' | 'planned'
}

const CHAINS: Chain[] = [
  {
    id: 'algo', name: 'Algorand', ticker: 'ALGO', color: '#1b85e0',
    standard: 'ARC-3 / ARC-69',
    desc: 'Primary chain for Exolocation NFTs (land deeds). Algorand ARC-3 stores rich metadata on IPFS; ARC-69 stores compact identifiers on-chain. Low-cost, carbon-neutral.',
    testnet: 'Algorand Testnet',
    faucet: 'https://dispenser.testnet.aws.algodev.network',
    overallStatus: 'live',
  },
  {
    id: 'matic', name: 'Polygon', ticker: 'MATIC', color: '#8247e5',
    standard: 'ERC-721 (OpenSea)',
    desc: '$SUNLIGHT music NFTs, Water Quality Certifications, and Health Card IDs. EVM-compatible; MetaMask support. Low gas on PoS chain.',
    testnet: 'Polygon Amoy (chainId 80002)',
    faucet: 'https://faucet.polygon.technology',
    overallStatus: 'testing',
  },
  {
    id: 'sol', name: 'Solana', ticker: 'SOL', color: '#14f195',
    standard: 'Metaplex Bubblegum cNFT',
    desc: 'Station Core, Station Module, and EcocitySolution NFTs. Compressed NFTs via Bubblegum — near-zero mint cost for community airdrops at scale.',
    testnet: 'Solana Devnet',
    faucet: 'https://solfaucet.com',
    overallStatus: 'live',
  },
  {
    id: 'tez', name: 'Tezos', ticker: 'TEZ', color: '#2c7df7',
    standard: 'FA2 (TZIP-12)',
    desc: 'Planned for art collectibles and $SUNLIGHT music NFTs. Tezos has a strong NFT art culture (Objkt, fxhash). Low energy, on-chain metadata standard.',
    testnet: 'Ghostnet',
    faucet: 'https://faucet.ghostnet.teztnets.com',
    overallStatus: 'planned',
  },
  {
    id: 'hbar', name: 'Hedera', ticker: 'HBAR', color: '#3dbcb4',
    standard: 'Hedera Token Service (HTS)',
    desc: 'Planned for environmental data certifications and eco-ops supply chain records. Enterprise-grade tamper-evidence. HBAR Sustainable Impact Fund alignment.',
    testnet: 'Hedera Testnet',
    faucet: 'https://portal.hedera.com',
    overallStatus: 'planned',
  },
  {
    id: 'celo', name: 'Celo', ticker: 'CELO', color: '#35d07f',
    standard: 'ERC-721 (EVM)',
    desc: 'Community badges and eco-ops participation tokens. Mobile-first, EVM-compatible. cUSD stablecoin bridges to M-Pesa for East Africa communities.',
    testnet: 'Celo Alfajores (chainId 44787)',
    faucet: 'https://faucet.celo.org/alfajores',
    overallStatus: 'testing',
  },
]

// ── NFT type rows ─────────────────────────────────────────────────────────────

interface NftRow {
  id:         string
  label:      string
  sub?:       string
  isSection?: boolean
}

const NFT_TYPES: NftRow[] = [
  { id: 's_land',    label: 'LAND & PROPERTY',           isSection: true },
  { id: 'exoloc',    label: 'Exolocation NFT',            sub: 'Virtual land deed · 40 acres' },
  { id: 'station',   label: 'Station Core NFT',           sub: 'Settlement root · orbital anchor' },
  { id: 'module',    label: 'Station Module NFT',         sub: 'Functional zone (gallery / watsan / energy …)' },
  { id: 'ecoobj',    label: 'EcocitySolution (3D object)',sub: 'Exchangeable sustainable design model' },
  { id: 's_sound',   label: 'SOUND & CULTURE',            isSection: true },
  { id: 'sunlight',      label: '$SUNLIGHT Music NFT',             sub: 'Sound ownership · licensing · royalties' },
  { id: 'poap',      label: 'Event POAP',                  sub: 'Attendance proof · voting weight' },
  { id: 'collect',   label: 'Art Collectible',             sub: 'Visual art · rarity tiers · tradeable' },
  { id: 's_cert',    label: 'CERTIFICATIONS & CREDS',     isSection: true },
  { id: 'wqcert',    label: 'Water Quality Cert',          sub: 'Tamper-evident field measurement' },
  { id: 'health',    label: 'Health Card ID',              sub: 'Encrypted health credential (portable)' },
  { id: 'ecocert',   label: 'Module Completion Cert',      sub: 'ecocity.com vocational training' },
  { id: 's_comm',    label: 'COMMUNITY TOKENS',           isSection: true },
  { id: 'badge',     label: 'Community Badge',             sub: 'Tier: bronze → platinum · non-financial' },
  { id: 'ecotok',    label: 'Eco-ops Token',               sub: 'Field check-in milestone · earned only' },
  { id: 'gov',       label: 'Governance Token (DAO)',       sub: 'Ecommunity DAO voting weight' },
]

// ── Status matrix ─────────────────────────────────────────────────────────────
// Format: [nft_id]: { chain_id: { status, note } }

type StatusCode = 'live' | 'testing' | 'planned' | 'na'

interface CellDef { status: StatusCode; note: string }

const MATRIX: Record<string, Record<string, CellDef>> = {
  exoloc: {
    algo:  { status: 'live',    note: 'ARC-3 + ARC-69 deployed · mint-exolocation.js active' },
    matic: { status: 'planned', note: 'ERC-721 contract designed, not deployed' },
    sol:   { status: 'planned', note: 'Could use cNFT but Algorand is primary chain' },
    tez:   { status: 'planned', note: 'FA2 implementation planned — community vote required' },
    hbar:  { status: 'planned', note: 'HTS NFT planned · good fit for tamper-evident deeds' },
    celo:  { status: 'na',      note: 'Not planned — Algorand is primary for land deeds' },
  },
  station: {
    algo:  { status: 'planned', note: 'Optional ARC-3 version being considered' },
    matic: { status: 'planned', note: 'ERC-721 secondary chain planned' },
    sol:   { status: 'live',    note: 'Metaplex Bubblegum cNFT — station-metadata.ts active' },
    tez:   { status: 'planned', note: 'FA2 planned' },
    hbar:  { status: 'na',      note: 'Not planned for station tier' },
    celo:  { status: 'na',      note: 'Not planned for station tier' },
  },
  module: {
    algo:  { status: 'na',      note: 'Module tier on Algorand not planned' },
    matic: { status: 'na',      note: 'Not planned' },
    sol:   { status: 'live',    note: 'Metaplex Bubblegum cNFT — station-metadata.ts' },
    tez:   { status: 'planned', note: 'FA2 planned' },
    hbar:  { status: 'na',      note: 'Not planned' },
    celo:  { status: 'na',      note: 'Not planned' },
  },
  ecoobj: {
    algo:  { status: 'na',      note: 'Not planned for 3D objects' },
    matic: { status: 'na',      note: 'Not planned' },
    sol:   { status: 'live',    note: 'Bubblegum cNFT with GLTF CID reference — station-metadata.ts' },
    tez:   { status: 'planned', note: 'FA2 with on-chain GLTF reference — strong fit for art objects' },
    hbar:  { status: 'na',      note: 'Not planned' },
    celo:  { status: 'na',      note: 'Not planned' },
  },
  bars: {
    algo:  { status: 'na',      note: 'Not planned — Algorand focused on land deeds' },
    matic: { status: 'testing', note: 'ERC-721 on Polygon Amoy · mint-evm.ts deployed' },
    sol:   { status: 'planned', note: 'Metaplex NFT secondary chain planned' },
    tez:   { status: 'planned', note: 'Tezos music NFT ecosystem (Objkt, fxhash) — strong fit' },
    hbar:  { status: 'na',      note: 'Not planned for music' },
    celo:  { status: 'na',      note: 'Not planned for music' },
  },
  poap: {
    algo:  { status: 'planned', note: 'ARC-69 event POAP designed' },
    matic: { status: 'planned', note: 'ERC-721 POAP planned' },
    sol:   { status: 'na',      note: 'Not planned' },
    tez:   { status: 'planned', note: 'FA2 POAP planned — low mint cost' },
    hbar:  { status: 'planned', note: 'HTS token planned for attendance records' },
    celo:  { status: 'planned', note: 'ERC-721 POAP planned — mobile-first events' },
  },
  collect: {
    algo:  { status: 'planned', note: 'ARC-3 collectible NFT planned' },
    matic: { status: 'planned', note: 'ERC-721 rarity tiers planned' },
    sol:   { status: 'planned', note: 'Metaplex standard planned' },
    tez:   { status: 'planned', note: 'Tezos art scene — primary collectible chain candidate' },
    hbar:  { status: 'na',      note: 'Not planned for collectibles' },
    celo:  { status: 'planned', note: 'Mobile collectibles for community gifting' },
  },
  wqcert: {
    algo:  { status: 'planned', note: 'ARC-69 on-chain cert planned — Arweave backup' },
    matic: { status: 'testing', note: 'ERC-721 on Polygon Amoy · mint-evm.ts deployed' },
    sol:   { status: 'na',      note: 'Not planned for certifications' },
    tez:   { status: 'na',      note: 'Not planned' },
    hbar:  { status: 'planned', note: 'Hedera best fit — tamper-evident supply chain cert standard' },
    celo:  { status: 'planned', note: 'Africa-first water data certs — mobile, low cost' },
  },
  health: {
    algo:  { status: 'na',      note: 'Not planned — encrypted data requires EVM or Hedera' },
    matic: { status: 'testing', note: 'ERC-721 encrypted health credential on Polygon Amoy' },
    sol:   { status: 'na',      note: 'Not planned' },
    tez:   { status: 'na',      note: 'Not planned' },
    hbar:  { status: 'planned', note: 'Hedera HIPAA-aligned infrastructure — best fit for health data' },
    celo:  { status: 'planned', note: 'Mobile health credentials for field communities' },
  },
  ecocert: {
    algo:  { status: 'planned', note: 'ARC-3 ecocity module completion cert planned' },
    matic: { status: 'na',      note: 'Not planned' },
    sol:   { status: 'na',      note: 'Not planned' },
    tez:   { status: 'na',      note: 'Not planned' },
    hbar:  { status: 'planned', note: 'Vocational cert on Hedera — portable to employers' },
    celo:  { status: 'planned', note: 'Mobile credential for workshop participants' },
  },
  badge: {
    algo:  { status: 'na',      note: 'Not planned for community badges' },
    matic: { status: 'na',      note: 'Not planned' },
    sol:   { status: 'na',      note: 'Not planned' },
    tez:   { status: 'na',      note: 'Not planned' },
    hbar:  { status: 'na',      note: 'Not planned' },
    celo:  { status: 'testing', note: 'ERC-721 community badge on Celo Alfajores · mint-evm.ts' },
  },
  ecotok: {
    algo:  { status: 'na',      note: 'Not planned' },
    matic: { status: 'na',      note: 'Not planned' },
    sol:   { status: 'na',      note: 'Not planned' },
    tez:   { status: 'na',      note: 'Not planned' },
    hbar:  { status: 'planned', note: 'Eco-ops participation on Hedera — enterprise supply chain fit' },
    celo:  { status: 'testing', note: 'ERC-721 eco-ops token on Celo Alfajores · mint-evm.ts' },
  },
  gov: {
    algo:  { status: 'planned', note: 'Algorand governance ASA planned for Ecommunity DAO' },
    matic: { status: 'na',      note: 'Not planned' },
    sol:   { status: 'na',      note: 'Not planned' },
    tez:   { status: 'na',      note: 'Not planned' },
    hbar:  { status: 'na',      note: 'Not planned' },
    celo:  { status: 'planned', note: 'Celo governance token planned — mobile-first DAO voting' },
  },
}

function getStatus(nftId: string, chainId: string): StatusCode {
  return MATRIX[nftId]?.[chainId]?.status ?? 'na'
}

function getCellNote(nftId: string, chainId: string): string {
  return MATRIX[nftId]?.[chainId]?.note ?? '—'
}

// ── Status display config ─────────────────────────────────────────────────────

interface StatusType { id: StatusCode; label: string; color: string }

const STATUS_TYPES: StatusType[] = [
  { id: 'live',    label: 'LIVE',    color: '#22dd88' },
  { id: 'testing', label: 'TESTING', color: '#f0a030' },
  { id: 'planned', label: 'PLANNED', color: '#5588cc' },
  { id: 'na',      label: 'N/A',     color: '#334455' },
]

const STATUS_ICONS: Record<StatusCode, string> = {
  live:    '●',
  testing: '◐',
  planned: '○',
  na:      '—',
}

function getStatusLabel(nftId: string, chainId: string): string {
  const s = getStatus(nftId, chainId)
  if (s === 'live')    return 'LIVE'
  if (s === 'testing') return 'TEST'
  if (s === 'planned') return 'PLAN'
  return '—'
}
</script>

<style scoped>
/* ── Page shell ───────────────────────────────────────────────────── */

.chain-page {
  background: #000408;
  min-height: 100vh;
  font-family: 'Courier New', monospace;
}

/* ── Header ───────────────────────────────────────────────────────── */

.chain-header { max-width: 1100px; margin: 0 auto 20px; }

.chain-title {
  display: flex;
  align-items: center;
  font-size: 14px;
  letter-spacing: 0.14em;
  color: rgba(0, 200, 240, 0.85);
  margin-bottom: 6px;
}

.chain-sub {
  font-size: 9px;
  color: rgba(80, 130, 160, 0.65);
  letter-spacing: 0.04em;
  line-height: 1.6;
  max-width: 680px;
}

/* ── Status legend ────────────────────────────────────────────────── */

.status-legend {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  max-width: 1100px;
  margin: 0 auto;
}

.legend-chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 8px;
  letter-spacing: 0.10em;
  padding: 3px 8px;
  border-radius: 3px;
  border: 1px solid;
}

.legend--live    { border-color: rgba(34, 221, 136, 0.35); color: rgba(34, 221, 136, 0.80); }
.legend--testing { border-color: rgba(240, 160, 48, 0.35);  color: rgba(240, 160, 48, 0.80); }
.legend--planned { border-color: rgba(85, 136, 204, 0.30);  color: rgba(85, 136, 204, 0.70); }
.legend--na      { border-color: rgba(51, 68, 85, 0.30);    color: rgba(80, 110, 130, 0.50); }

.legend-dot {
  width: 6px; height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}

.legend-note {
  font-size: 7px;
  color: rgba(60, 90, 120, 0.50);
  letter-spacing: 0.06em;
}

/* ── Chain cards ──────────────────────────────────────────────────── */

.chain-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 12px;
  max-width: 1100px;
  margin: 0 auto;
}

.chain-card {
  background: rgba(0, 5, 16, 0.80);
  border: 1px solid rgba(0, 80, 120, 0.30);
  border-radius: 6px;
  overflow: hidden;
}

.chain-card--live    { border-color: rgba(34, 221, 136, 0.22); }
.chain-card--testing { border-color: rgba(240, 160, 48, 0.22); }
.chain-card--planned { border-color: rgba(85, 136, 204, 0.18); }

.cc-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-bottom: 1px solid;
  background: rgba(0, 8, 22, 0.55);
}

.cc-dot {
  width: 10px; height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
  box-shadow: 0 0 8px currentColor;
}

.cc-name   { font-size: 12px; color: rgba(180, 220, 245, 0.88); letter-spacing: 0.04em; }
.cc-ticker { font-size: 8px;  color: rgba(80, 130, 160, 0.65); letter-spacing: 0.12em; }

.cc-status-badge {
  margin-left: auto;
  font-size: 7px;
  letter-spacing: 0.12em;
  padding: 2px 7px;
  border-radius: 3px;
  border: 1px solid;
}
.badge--live    { color: rgba(34, 221, 136, 0.85); border-color: rgba(34, 221, 136, 0.30); }
.badge--testing { color: rgba(240, 160, 48, 0.85);  border-color: rgba(240, 160, 48, 0.30); }
.badge--planned { color: rgba(85, 136, 204, 0.75);  border-color: rgba(85, 136, 204, 0.28); }

.cc-body    { padding: 10px 12px; }
.cc-standard { font-size: 8px; color: rgba(0, 180, 220, 0.60); letter-spacing: 0.08em; margin-bottom: 5px; }
.cc-desc    { font-size: 8px; color: rgba(100, 150, 180, 0.70); line-height: 1.55; margin-bottom: 6px; }
.cc-net-label { color: rgba(60, 100, 140, 0.55); }
.cc-network { font-size: 7px; color: rgba(80, 130, 160, 0.60); margin-bottom: 4px; }
.cc-faucet-link {
  font-size: 7px; color: rgba(0, 160, 200, 0.55); text-decoration: none;
  transition: color 0.1s;
}
.cc-faucet-link:hover { color: rgba(0, 220, 255, 0.75); }

/* ── Matrix table ─────────────────────────────────────────────────── */

.matrix-wrap  { max-width: 1100px; margin: 0 auto; }
.matrix-title { font-size: 8px; letter-spacing: 0.16em; color: rgba(0, 160, 200, 0.55); }
.matrix-scroll { overflow-x: auto; }

.matrix-table {
  border-collapse: collapse;
  width: 100%;
  min-width: 680px;
}

/* Header row */
.matrix-th-corner {
  font-size: 7px;
  letter-spacing: 0.10em;
  color: rgba(60, 100, 130, 0.55);
  padding: 8px 12px 8px 4px;
  text-align: left;
  border-bottom: 1px solid rgba(0, 80, 120, 0.30);
  width: 180px;
}

.matrix-th-chain {
  padding: 6px 8px;
  border-bottom: 1px solid rgba(0, 80, 120, 0.30);
  text-align: center;
}

.matrix-chain-head { display: flex; flex-direction: column; align-items: center; gap: 3px; }
.matrix-chain-dot  { width: 8px; height: 8px; border-radius: 50%; }
.matrix-chain-sym  { font-size: 8px; color: rgba(120, 180, 210, 0.75); letter-spacing: 0.08em; }

/* Body rows */
.matrix-row-label {
  padding: 5px 12px 5px 4px;
  border-bottom: 1px solid rgba(0, 50, 80, 0.25);
  vertical-align: top;
}

.matrix-nft-name { font-size: 9px; color: rgba(160, 210, 235, 0.85); letter-spacing: 0.03em; }
.matrix-nft-sub  { font-size: 7px; color: rgba(70, 110, 140, 0.55); margin-top: 1px; line-height: 1.4; }

/* Section divider row */
.matrix-row--section .matrix-row-label {
  padding-top: 12px;
  border-bottom: 1px solid rgba(0, 80, 120, 0.28);
}
.matrix-section-label {
  font-size: 7px;
  letter-spacing: 0.16em;
  color: rgba(0, 140, 180, 0.50);
}

/* Status cells */
.matrix-cell {
  padding: 5px 6px;
  border-bottom: 1px solid rgba(0, 50, 80, 0.20);
  text-align: center;
  vertical-align: middle;
  cursor: default;
}
.matrix-cell--section { border-bottom: 1px solid rgba(0, 80, 120, 0.28); }

.matrix-status {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  gap: 1px;
}

.status-icon { font-size: 9px; line-height: 1; }
.status-text { font-size: 6px; letter-spacing: 0.08em; }

/* Status colours */
.status--live    .status-icon { color: rgba(34, 221, 136, 0.90); }
.status--live    .status-text { color: rgba(34, 221, 136, 0.65); }
.status--testing .status-icon { color: rgba(240, 160, 48, 0.85); }
.status--testing .status-text { color: rgba(240, 160, 48, 0.60); }
.status--planned .status-icon { color: rgba(85, 136, 204, 0.70); }
.status--planned .status-text { color: rgba(85, 136, 204, 0.50); }
.status--na      .status-icon { color: rgba(50, 70, 90, 0.40); }
.status--na      .status-text { display: none; }

/* Hover highlight */
.matrix-cell:hover { background: rgba(0, 40, 70, 0.22); }

/* ── Footer notes ─────────────────────────────────────────────────── */

.chain-footnotes {
  max-width: 1100px;
  margin: 0 auto;
  border-top: 1px solid rgba(0, 60, 100, 0.30);
  padding-top: 16px;
}

.fn-title {
  font-size: 7px;
  letter-spacing: 0.16em;
  color: rgba(60, 100, 130, 0.50);
  margin-bottom: 8px;
}

.fn-row {
  display: flex;
  gap: 8px;
  align-items: flex-start;
  margin-bottom: 5px;
  font-size: 8px;
  color: rgba(80, 120, 150, 0.60);
  line-height: 1.55;
}

.fn-bullet { color: rgba(0, 160, 200, 0.40); flex-shrink: 0; }
</style>
