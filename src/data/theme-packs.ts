/**
 * src/data/theme-packs.ts
 *
 * Curated multi-item bundles a settler can apply in one action, so designing
 * an interior doesn't mean adding items one at a time.
 *
 * Scope: these are arrangements of the existing ITEM_MESH_PRESETS, not custom
 * geometry. Every preset used here must list 'constructed' in its acquiredBy
 * (see ITEM_MESH_PRESETS in src/lib/settlement-items.ts) — applying a pack goes
 * through the same addItem() guard as any other build.
 *
 * Colours are deliberately absent: they come from themePackItemColorHex(), which
 * derives from the settlement's own hue, so an applied pack reads as belonging
 * to that settlement rather than dropping in a stock palette.
 */

import type { ItemZone } from 'src/lib/settlement-items'

export interface ThemePack {
  key:         string
  label:       string
  description: string
  items:       { meshPreset: string; zone: ItemZone }[]
}

export const THEME_PACKS: Record<string, ThemePack> = {
  garden_sanctuary: {
    key: 'garden_sanctuary',
    label: 'Garden Sanctuary',
    description: 'A planted quarter with its own water treatment — the greenest way to fill an empty dome.',
    items: [
      { meshPreset: 'planter',      zone: 'garden' },
      { meshPreset: 'planter',      zone: 'garden' },
      { meshPreset: 'planter',      zone: 'garden' },
      { meshPreset: 'water-filter', zone: 'water-edge' },
    ],
  },
  research_outpost: {
    key: 'research_outpost',
    label: 'Research Outpost',
    description: 'Archive, relay and power — a working layout for a settlement used as a field base.',
    items: [
      { meshPreset: 'archive-node', zone: 'library' },
      { meshPreset: 'comms-relay',  zone: 'gateway' },
      { meshPreset: 'solar-array',  zone: 'open-floor' },
    ],
  },
  signal_array: {
    key: 'signal_array',
    label: 'Signal Array',
    description: 'Beacon and relay at the gateway, powered from the open floor — built to be seen from orbit.',
    items: [
      { meshPreset: 'beacon',      zone: 'gateway' },
      { meshPreset: 'comms-relay', zone: 'gateway' },
      { meshPreset: 'solar-array', zone: 'open-floor' },
    ],
  },
  waterworks: {
    key: 'waterworks',
    label: 'Waterworks',
    description: 'Twin filtration units feeding a planted bed — a settlement organised around its water.',
    items: [
      { meshPreset: 'water-filter', zone: 'water-edge' },
      { meshPreset: 'water-filter', zone: 'water-edge' },
      { meshPreset: 'planter',      zone: 'garden' },
    ],
  },
}
