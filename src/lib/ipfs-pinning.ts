/**
 * src/lib/ipfs-pinning.ts
 *
 * Replaces blockchain minting as the durability mechanism for a settlement.
 * There is no collision-proof claim registry here, by design — durability
 * comes from content persistence (as long as someone keeps it pinned), not
 * from exclusivity of on-chain ownership. See SETTLEMENT_ADDRESS_API.md.
 *
 * "Supporting the network" means running or paying for pinning, not holding
 * a token. This is opt-in and additive to settlement creation — addSettlement()
 * in settlements.ts already doesn't require it, and neither does this.
 *
 * PinningService is a small plugin interface so a different provider (a
 * self-hosted node, Web3.Storage, etc.) can be added later without touching
 * callers — but ships with one real, working implementation (Pinata) rather
 * than an abstraction with nothing behind it.
 */

// ── Metadata shape ───────────────────────────────────────────────────────────

export interface SettlementPinMetadata {
  title:              string
  description?:       string
  exolocationAddress: string   // the exoloc address string (settlements.ts key builders)
  ownerHandle?:        string  // member handle, if the owner wants attribution
  createdAt:          string   // ISO 8601
  /** Extra CIDs already pinned elsewhere (artwork, audio, etc.) to reference, not re-upload. */
  relatedCids?:       Record<string, string>
}

// ── Plugin interface ──────────────────────────────────────────────────────────

export interface PinningService {
  /** Short identifier shown in UI (e.g. "Pinata"). */
  readonly name: string
  /** Whether this deployment has the credentials this service needs. */
  isConfigured(): boolean
  /** Pin the metadata and return an `ipfs://<CID>` URI. Throws on failure. */
  pin(metadata: SettlementPinMetadata): Promise<string>
}

// ── Pinata implementation ─────────────────────────────────────────────────────
// Generalized from the settlement-specific uploadToPinata() that used to live
// in (now-relocated) lib/chains/evm/mint-evm.ts, built for ERC-721 metadata.
//
// Uses the v3 Files API (uploads.pinata.cloud), not the legacy /pinning/*
// endpoints — v3 scoped keys (Files: write) don't carry the separate legacy
// endpoint permissions that pinJSONToIPFS requires, and v3 is now the
// actively maintained surface. JSON content is uploaded as a file (v3 has
// no JSON-content-body shortcut like the legacy pinJSONToIPFS did), on the
// "public" network so it's retrievable from any public IPFS gateway.

function pinataJwt(): string {
  return ((import.meta as any).env?.VITE_PINATA_JWT ?? '') as string
}

export const pinataService: PinningService = {
  name: 'Pinata',

  isConfigured() {
    return !!pinataJwt()
  },

  async pin(metadata: SettlementPinMetadata): Promise<string> {
    const jwt = pinataJwt()
    if (!jwt) throw new Error('VITE_PINATA_JWT is not set — add it to .env.local')

    const blob = new Blob([JSON.stringify(metadata)], { type: 'application/json' })
    const form = new FormData()
    form.set('file', blob, `${metadata.title || 'settlement'}.json`)
    form.set('network', 'public')
    form.set('name', metadata.title)

    const res = await fetch('https://uploads.pinata.cloud/v3/files', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${jwt}` },
      body: form,
    })
    if (!res.ok) {
      const text = await res.text().catch(() => res.statusText)
      throw new Error(`Pinata upload failed (${res.status}): ${text}`)
    }
    const { data } = await res.json() as { data: { cid: string } }
    return `ipfs://${data.cid}`
  },
}

// ── Registry ───────────────────────────────────────────────────────────────────
// Additional services (Web3.Storage, self-hosted, etc.) get pushed here later —
// callers never need to change, they just get more options in the picker.

export const PINNING_SERVICES: PinningService[] = [pinataService]

/** Whether at least one pinning service is usable in this deployment. */
export function hasAnyPinningConfigured(): boolean {
  return PINNING_SERVICES.some(s => s.isConfigured())
}

/** Convenience: pin via the first configured service, or throw if none are. */
export async function pinSettlement(
  metadata: SettlementPinMetadata,
  service: PinningService = PINNING_SERVICES.find(s => s.isConfigured()) ?? pinataService,
): Promise<string> {
  return service.pin(metadata)
}
