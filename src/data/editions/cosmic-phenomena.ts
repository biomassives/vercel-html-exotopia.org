/**
 * src/data/editions/cosmic-phenomena.ts
 *
 * EDITION 3 — Cosmic Phenomena
 * IDs 23–27 · Five forces and substances of the universe
 *
 * Where the Anti-AI Slop Drop celebrated human craft,
 * Cosmic Phenomena celebrates the substrate everything is made of —
 * the physics beneath the art, the settlement, the planet.
 *
 * Rarity distribution:
 *   Legendary (23)  : Quantum Gravity  — a theory we cannot fully observe
 *   Legendary (27)  : Paired Particles — entanglement transcends space
 *   Rare      (25)  : Cosmic Energy    — the field that drives expansion
 *   Uncommon  (24)  : Moonbeams        — light refracting through time
 *   Common    (23b) : Stardust         — we are made of this
 *   (re-ordered by visual impact; IDs are sequential 23–27)
 */

import type { CollectorCard } from 'src/data/collector-cards'

export const COSMIC_PHENOMENA_CARDS: CollectorCard[] = [

  // ── STARDUST ──────────────────────────────────────────────────────────────────

  {
    id: 23, name: 'Stardust', series: 'Cosmic Phenomena',
    edition: 1, maxEdition: 33, rarity: 'common', rarityScore: 3, mintedCount: 0,
    description: 'Every atom heavier than hydrogen was forged in a stellar core and scattered by a supernova. Carbon, oxygen, iron — the elements in your body were made in a star that died before the Earth formed. We are the universe looking at itself.',
    bgFrom: '#04020c', bgTo: '#0c0818',
    borderColor: '#c8a060', glowColor: 'rgba(200,160,80,0.35)',
    artColors: ['#ffe060', '#ff9040', '#60b0ff', '#ff4040', '#80ff80', '#ffffff'],
    attributes: [
      { trait_type: 'Series',    value: 'Cosmic Phenomena' },
      { trait_type: 'Edition',   value: '1 of 33' },
      { trait_type: 'Elements',  value: 'C · O · Fe · Si · Ca · Na · H' },
      { trait_type: 'Origin',    value: 'Stellar nucleosynthesis' },
      { trait_type: 'Process',   value: 'Supernova dispersal' },
    ],
  },

  // ── MOONBEAMS ─────────────────────────────────────────────────────────────────

  {
    id: 24, name: 'Moonbeams', series: 'Cosmic Phenomena',
    edition: 1, maxEdition: 22, rarity: 'uncommon', rarityScore: 5, mintedCount: 0,
    description: 'Reflected sunlight, 384,400 km of travel, diffracted through a thin atmosphere. Moonbeams are ancient photons arriving gently — the sun\'s energy slowed, softened, and turned silver. Every full moon delivers 0.001 lux. Enough to cast a shadow.',
    bgFrom: '#02040c', bgTo: '#04060e',
    borderColor: '#c8d8f0', glowColor: 'rgba(180,210,255,0.32)',
    artColors: ['#e8eeff', '#a8b8d8', '#6070a0', '#303860', '#ffffff'],
    attributes: [
      { trait_type: 'Series',      value: 'Cosmic Phenomena' },
      { trait_type: 'Edition',     value: '1 of 22' },
      { trait_type: 'Wavelength',  value: '400–700 nm (visible)' },
      { trait_type: 'Distance',    value: '384,400 km' },
      { trait_type: 'Illuminance', value: '0.001 lux (full moon)' },
    ],
  },

  // ── COSMIC ENERGY ─────────────────────────────────────────────────────────────

  {
    id: 25, name: 'Cosmic Energy', series: 'Cosmic Phenomena',
    edition: 1, maxEdition: 11, rarity: 'rare', rarityScore: 7, mintedCount: 0,
    description: 'Dark energy constitutes 68% of the universe and drives its accelerating expansion. It is not a force — it is the energy of empty space itself. Every cubic metre of vacuum hums at 10⁻²⁹ g/cm³. It cannot be captured, only observed in the recession of galaxies.',
    bgFrom: '#080010', bgTo: '#040008',
    borderColor: '#aa44ff', glowColor: 'rgba(160,60,255,0.45)',
    artColors: ['#cc44ff', '#4488ff', '#ff4488', '#ffcc00', '#ffffff'],
    attributes: [
      { trait_type: 'Series',       value: 'Cosmic Phenomena' },
      { trait_type: 'Edition',      value: '1 of 11' },
      { trait_type: 'Universe share', value: '68% dark energy' },
      { trait_type: 'Density',      value: '~10⁻²⁹ g/cm³' },
      { trait_type: 'Effect',       value: 'Accelerating expansion' },
    ],
  },

  // ── QUANTUM GRAVITY ───────────────────────────────────────────────────────────

  {
    id: 26, name: 'Quantum Gravity', series: 'Cosmic Phenomena',
    edition: 1, maxEdition: 7, rarity: 'legendary', rarityScore: 10, mintedCount: 0,
    description: 'General relativity and quantum mechanics are both correct — and incompatible. At the Planck scale (10⁻³⁵ m), spacetime itself granulates. A theory of quantum gravity remains the deepest open problem in physics. This card represents a phenomenon that cannot yet be measured.',
    bgFrom: '#000c10', bgTo: '#000408',
    borderColor: '#00ddcc', glowColor: 'rgba(0,220,200,0.55)',
    artColors: ['#00ffee', '#0088cc', '#ffffff', '#003344', '#00ccaa'],
    attributes: [
      { trait_type: 'Series',       value: 'Cosmic Phenomena' },
      { trait_type: 'Edition',      value: '1 of 7' },
      { trait_type: 'Planck length','value': '1.616 × 10⁻³⁵ m' },
      { trait_type: 'Status',       value: 'Theoretical — unobserved' },
      { trait_type: 'Approaches',   value: 'String theory · Loop QG' },
    ],
  },

  // ── PAIRED PARTICLES ──────────────────────────────────────────────────────────

  {
    id: 27, name: 'Paired Particles', series: 'Cosmic Phenomena',
    edition: 1, maxEdition: 11, rarity: 'legendary', rarityScore: 9, mintedCount: 0,
    description: 'Quantum entanglement: two particles share a single quantum state regardless of the distance between them. Measuring one instantly determines the other. Einstein called it "spooky action at a distance" — and yet it is experimentally confirmed. Information does not travel. The correlation already existed.',
    bgFrom: '#08000c', bgTo: '#040006',
    borderColor: '#ff66aa', glowColor: 'rgba(220,60,140,0.45)',
    artColors: ['#ff4444', '#4444ff', '#ffcc00', '#220022', '#ffffff'],
    attributes: [
      { trait_type: 'Series',      value: 'Cosmic Phenomena' },
      { trait_type: 'Edition',     value: '1 of 11' },
      { trait_type: 'Phenomenon',  value: 'Quantum entanglement' },
      { trait_type: 'State',       value: '|ψ⟩ = (|↑↓⟩ − |↓↑⟩) / √2' },
      { trait_type: 'Speed',       value: 'Non-local · instantaneous' },
    ],
  },

]
