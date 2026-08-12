/**
 * resonance-split.ts — single source of truth for contribution-allocation
 * percentages.
 *
 * WHY THIS FILE EXISTS
 * --------------------
 * Originally written for on-chain NFT minting (settlement deeds, $SUNLIGHT
 * recordings) — before this file existed, the same split was stated with five
 * different, inconsistent sets of numbers across the app. Minting itself has
 * since been removed from this app in favour of IPFS pinning (see
 * src/lib/ipfs-pinning.ts, SETTLEMENT_ADDRESS_API.md) — no chain, no gas fee,
 * no wallet. The underlying math is kept: it's a general-purpose "how is a
 * contribution divided between creator/community/platform" calculation, not
 * inherently a minting concept, and stays available for whatever the
 * IPFS-support model needs next (e.g. attributing a paid pinning-service
 * subscription, or a future community fund).
 *
 * RULES
 * -----
 * 1. Import from here. Do not inline percentages anywhere, including in copy.
 * 2. `PRIMARY_MINT_IS_FREE` is not decoration — see the note below it. Any UI
 *    that displays a split must also make clear whether there is a fee to split.
 * 3. Fee isolation: never render a split figure combined into one expression
 *    with a network-cost figure or a community payout amount. Compute and
 *    display them independently.
 */

export interface ResonanceSplit {
  /** Fraction to the creator / artist / participant wallet. */
  creator: number
  /** Fraction to the Community Hardware Fund (WATSAN, mapping, field kit). */
  community_fund: number
  /** Fraction to platform maintenance. */
  platform: number
}

/**
 * Standard split — $SUNLIGHT recordings and generative compositions.
 * Applies where a transaction actually carries a fee.
 */
export const STANDARD_SPLIT: ResonanceSplit = Object.freeze({
  creator:        0.99,
  community_fund: 0.0075,
  platform:       0.0025,
})

/**
 * Exoloc settlement deeds. Currently 100% creator: the primary deed mint takes
 * no platform cut at all.
 *
 * This is deliberately a separate constant rather than an alias of
 * STANDARD_SPLIT — the two have always differed in the shipped metadata writers
 * and collapsing them would silently change what gets written on-chain.
 */
export const SETTLEMENT_SPLIT: ResonanceSplit = Object.freeze({
  creator:        1.00,
  community_fund: 0,
  platform:       0,
})

/**
 * Primary settlement minting is free — the user pays network gas and nothing
 * else. There is therefore no platform fee to divide on the primary path today.
 *
 * This matters for how splits are described: stating "99% goes to the creator"
 * next to a free mint implies a revenue stream that does not currently exist.
 * Describe the split as the allocation that applies *if and when* a transaction
 * carries a fee, not as an ongoing distribution.
 */
export const PRIMARY_MINT_IS_FREE = true

/** Legacy alias kept for $SUNLIGHT metadata, which names the field differently. */
export function toSunlightShape(s: ResonanceSplit) {
  return { creator: s.creator, hardware_fund: s.community_fund, platform: s.platform }
}

/** "99 / 0.75 / 0.25" — for display. Trailing zeros trimmed. */
export function formatSplit(s: ResonanceSplit): string {
  const pct = (n: number) => {
    const v = n * 100
    return Number.isInteger(v) ? String(v) : String(parseFloat(v.toFixed(4)))
  }
  return `${pct(s.creator)} / ${pct(s.community_fund)} / ${pct(s.platform)}`
}
