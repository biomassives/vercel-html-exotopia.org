/**
 * src/data/mint-style-presets.ts
 *
 * Curated "start here" presets for MintStylePage.vue — a small, hand-picked
 * set of attractive, one-click starting points, distinct from
 * nav-history.ts's generateSmartPresets() (which infers suggestions from
 * where a visitor has *already* browsed this session). These exist for the
 * opposite case: a first-time visitor with no browsing history yet, who
 * needs a handful of easy choices instead of a blank 5-source configurator.
 *
 * Grouped by regime — the operational/lifecycle periods documented in
 * docs/eco-ops-workflow-guide.md, not generic calendar seasons:
 *   - Founding a Settlement   — Part 1 (site securing) + "Year 0 — Installation"
 *   - Dry Season              — establishment watering ("drought-stressed in
 *                                their first summer"), drought-stressed private
 *                                wells, solar reliability
 *   - Wet Season              — stormwater capture/runoff, sanitation risk
 *                                during runoff, the rain-garden nutrient/
 *                                pathogen removal workflow
 *   - Growing & Harvest       — Year 2-3 fill-in, yield records, seed
 *                                sovereignty, a settlement scaling past its
 *                                first infrastructure
 *   - Field Health & Water Monitoring — the PFAS monitoring workflow (Part 2)
 *                                and community primary care
 * Each preset still turns on exactly one source (ecocity_model) with a
 * well-chosen model — enough to produce a real, composed piece in one or two
 * clicks (pick a regime tab, then a tile — the tab is optional, a default
 * regime is always showing). Everything else (Worldbridger One layers,
 * gallery event, mule knowledge delta, settlement history) stays available
 * afterward in the existing configurator as the "calibrate further" step —
 * this file deliberately doesn't try to be a second configurator, just a
 * fast, honest on-ramp into the one that already exists.
 */
import { createMintingStyle, type MintingStyle, type EcocityCategory } from 'src/lib/mint-style'

export type PresetRegimeId =
  | 'founding'
  | 'dry-season'
  | 'wet-season'
  | 'growing-harvest'
  | 'field-health'

export interface PresetRegime {
  id:    PresetRegimeId
  label: string
  blurb: string   // shown under the regime tabs — what period/context this covers
}

export const PRESET_REGIMES: PresetRegime[] = [
  {
    id: 'founding', label: 'Founding a Settlement',
    blurb: 'The first water, shelter, and power a brand-new site needs.',
  },
  {
    id: 'dry-season', label: 'Dry Season',
    blurb: 'Water storage and food preservation for when wells and rain run low.',
  },
  {
    id: 'wet-season', label: 'Wet Season',
    blurb: 'Stormwater and sanitation management when runoff peaks.',
  },
  {
    id: 'growing-harvest', label: 'Growing & Harvest',
    blurb: 'Food systems and power for a settlement that has taken root.',
  },
  {
    id: 'field-health', label: 'Field Health & Water Monitoring',
    blurb: 'Primary care and water-safety records for an active community.',
  },
]

export interface CuratedPreset {
  id:                string
  label:             string
  blurb:             string   // plain-language, not technical — shown on the tile
  icon:              string   // single emoji, matches this app's existing icon convention
  category:          EcocityCategory
  modelId:           string    // ECOCITY_MODELS id
  accentColor:       string
  regime:            PresetRegimeId
  customImpactNote?: string   // overrides the model's default impact string when set
}

export const CURATED_PRESETS: CuratedPreset[] = [
  // ── Founding a Settlement ──────────────────────────────────────────────
  {
    id: 'water-guardian', label: 'Water Guardian', category: 'watsan', modelId: 'biosand-filter',
    blurb: 'Clean-water access, made visible — 200 L/day per unit.',
    icon: '💧', accentColor: 'rgba(0, 190, 230, 0.85)', regime: 'founding',
  },
  {
    id: 'shelter-architect', label: 'Shelter Architect', category: 'shelter', modelId: 'earth-block',
    blurb: 'Local-material construction — no cement required.',
    icon: '🏠', accentColor: 'rgba(200, 150, 90, 0.85)', regime: 'founding',
  },
  {
    id: 'energy-builder', label: 'Off-Grid Energy Builder', category: 'energy', modelId: 'solar-array',
    blurb: 'Solar power for a settlement — offsets real CO₂ per year.',
    icon: '☀️', accentColor: 'rgba(255, 190, 60, 0.85)', regime: 'founding',
  },

  // ── Dry Season ──────────────────────────────────────────────────────────
  {
    id: 'rain-reserve', label: 'Rain Catchment Reserve', category: 'watsan', modelId: 'rainwater-harvest',
    blurb: 'Stores wet-season rain for the dry months ahead — up to 50,000 L/year off a 100m² roof.',
    icon: '🌧️', accentColor: 'rgba(70, 170, 220, 0.85)', regime: 'dry-season',
  },
  {
    id: 'sun-dried-harvest', label: 'Sun-Dried Harvest', category: 'food', modelId: 'solar-dryer',
    blurb: 'Turns dry-season sun into food that keeps 6–12 months longer.',
    icon: '🧺', accentColor: 'rgba(230, 170, 70, 0.85)', regime: 'dry-season',
  },

  // ── Wet Season ──────────────────────────────────────────────────────────
  {
    id: 'waste-safe-sanitation', label: 'Waste-Safe Sanitation', category: 'watsan', modelId: 'latrine-system',
    blurb: 'Keeps waste out of the water table when storm runoff peaks — serves 10 households.',
    icon: '🚻', accentColor: 'rgba(120, 180, 120, 0.85)', regime: 'wet-season',
  },
  {
    id: 'compost-cycle', label: 'Compost Cycle', category: 'watsan', modelId: 'composting-unit',
    blurb: '500 kg of household waste a year, turned into soil for the growing season ahead.',
    icon: '♻️', accentColor: 'rgba(150, 190, 90, 0.85)', regime: 'wet-season',
  },

  // ── Growing & Harvest ───────────────────────────────────────────────────
  {
    id: 'food-steward', label: 'Food Systems Steward', category: 'food', modelId: 'seed-bank',
    blurb: 'Seed sovereignty — 50+ varieties preserved for a community.',
    icon: '🌱', accentColor: 'rgba(90, 210, 110, 0.85)', regime: 'growing-harvest',
  },
  {
    id: 'kitchen-garden-yield', label: 'Kitchen Garden Yield', category: 'food', modelId: 'food-garden-bed',
    blurb: '30 kg yield per season, per 4m² bed — the harvest record a settlement keeps.',
    icon: '🥕', accentColor: 'rgba(120, 200, 90, 0.85)', regime: 'growing-harvest',
  },
  {
    id: 'aquaponics-circuit', label: 'Aquaponics Circuit', category: 'food', modelId: 'aquaponics-tank',
    blurb: '20 kg fish and 40 kg vegetables a year — food systems at scale.',
    icon: '🐟', accentColor: 'rgba(70, 180, 190, 0.85)', regime: 'growing-harvest',
  },
  {
    id: 'scaling-power', label: 'Scaling Power', category: 'energy', modelId: 'micro-hydro',
    blurb: '500 W continuous power for a settlement that has outgrown its first solar array.',
    icon: '🌊', accentColor: 'rgba(60, 150, 210, 0.85)', regime: 'growing-harvest',
  },

  // ── Field Health & Water Monitoring ────────────────────────────────────
  {
    id: 'field-health-post', label: 'Field Health Post', category: 'healthcare', modelId: 'health-post',
    blurb: 'Primary-care access for a community of 50 households.',
    icon: '⚕️', accentColor: 'rgba(255, 90, 120, 0.85)', regime: 'field-health',
  },
  {
    id: 'water-quality-watch', label: 'Water Quality Watch', category: 'healthcare', modelId: 'wq-test-station',
    blurb: 'Documents drinking-water results against safety limits — the record a response starts from.',
    icon: '🧪', accentColor: 'rgba(0, 190, 230, 0.70)', regime: 'field-health',
    customImpactNote: 'Verified water-quality record for the settlement.',
  },
  {
    id: 'herb-garden-post', label: 'Community Herb Garden', category: 'healthcare', modelId: 'herb-garden',
    blurb: '15 species grown on-site — reduces dependence on over-the-counter medicine.',
    icon: '🌿', accentColor: 'rgba(120, 200, 140, 0.85)', regime: 'field-health',
  },
]

/** Builds a real MintingStyle from a curated preset — same shape a hand-configured one would be. */
export function buildCuratedStyle(preset: CuratedPreset): MintingStyle {
  const style = createMintingStyle(preset.label)
  style.description = preset.blurb
  style.sources.ecocity_model = true
  style.ecocityConfig.modelId = preset.modelId
  style.ecocityConfig.includeImpactMetrics = true
  if (preset.customImpactNote) style.ecocityConfig.customImpactNote = preset.customImpactNote
  return style
}
