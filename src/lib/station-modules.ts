/**
 * The seven station-module slot types used by the Station Builder feature
 * (src/stores/station.ts, src/pages/StationPage.vue).
 *
 * Previously imported from src/lib/solana/station-metadata.ts, which also
 * built Solana NFT metadata for the (now-removed) station-minting flow. That
 * module moved to archive/chains/solana/ as a standalone, portable-elsewhere
 * blockchain library — the Station Builder feature is unrelated to minting,
 * so it gets its own local copy of just the type it actually needs instead
 * of depending on the relocated module.
 */
export type ModuleType =
  | 'gallery'
  | 'watsan'
  | 'energy'
  | 'shelter'
  | 'healthcare'
  | 'food'
  | 'command'
