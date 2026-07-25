/**
 * resonance-split.ts — single source of truth for allocation percentages.
 *
 * WHY THIS FILE EXISTS
 * --------------------
 * Before this, the same concept was stated with five different sets of numbers
 * across the app: 99/0.75/0.25 (DocsPage, DocPage, DocPage0, erc721-metadata,
 * mint-style), 80/15/5 (GlossaryPage summary line, SettlementHashmark),
 * 80/10/0 (GlossaryPage body — which also contradicted its own summary line),
 * and 100/0/0 (the exoloc settlement deed written by MintPage).
 *
 * Two of those were being committed to immutable records: the SettlementHashmark
 * figure is inside the object that gets SHA-256'd into `design_hash`, which is
 * then embedded in ERC-721 deed metadata. A wrong number in that position is not
 * a typo, it is a permanent misstatement about where money goes, attached to an
 * artefact a user paid gas to create.
 *
 * RULES
 * -----
 * 1. Import from here. Do not inline percentages anywhere, including in copy.
 * 2. `PRIMARY_MINT_IS_FREE` is not decoration — see the note below it. Any UI
 *    that displays a split must also make clear whether there is a fee to split.
 * 3. Fee isolation: never render a split figure combined into one expression
 *    with a gas figure or a community payout amount. Compute and display them
 *    independently.
 * 4. Changing SETTLEMENT_SPLIT changes the SettlementHashmark digest. Bump the
 *    hashmark schema version in the same commit so existing deed hashes stay
 *    reproducible against the schema they were minted under.
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
