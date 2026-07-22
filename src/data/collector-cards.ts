/**
 * src/data/collector-cards.ts
 *
 * Shared `CollectorCard` type definition, plus a real re-export of Edition 1
 * for components that still import `COLLECTOR_CARDS` directly rather than
 * going through the edition registry.
 *
 * Edition 1 (Extrapolation Edition) data lives in:
 *   src/data/editions/extrapolation-edition.ts
 *
 * Edition 2 (Anti-AI Slop Drop) data lives in:
 *   src/data/editions/anti-ai-slop-drop.ts
 *
 * Edition 3 (Cosmic Phenomena) data lives in:
 *   src/data/editions/cosmic-phenomena.ts
 *
 * All editions are registered in:
 *   src/data/editions/index.ts
 *
 * For multi-edition access use EDITIONS from src/data/editions/index.ts.
 *
 * No rarity/scarcity tiering on these cards, deliberately — see
 * SPEC_NFT_VALUE_FRAMING.md. Cards are differentiated by their own visual
 * palette (bgFrom/bgTo/borderColor/artColors/glowColor) and by which
 * edition/series they belong to, not by a ranked tier or score.
 */

export interface CollectorCard {
  id:           number          // unique within the edition
  name:         string
  series:       string          // e.g. 'Extrapolation Edition'
  edition:      number          // position within the edition
  maxEdition:   number          // total cards in the edition
  description:  string
  // NFT attributes (ERC-721 / OpenSea compatible) — descriptive only, no rarity trait
  attributes:   Array<{ trait_type: string; value: string | number }>
  // Visual palette — used by CollectorCard.vue to render unique art
  bgFrom:       string          // gradient start (hex)
  bgTo:         string          // gradient end (hex)
  borderColor:  string          // border hex
  artColors:    string[]        // up to 5 colors for central artwork
  glowColor:    string          // outer glow hex
  // Mint state
  ipfsCid?:     string          // set after Pinata upload
  mintedCount:  number          // 0 until minted
}

export { EXTRAPOLATION_CARDS as COLLECTOR_CARDS } from './editions/extrapolation-edition'
