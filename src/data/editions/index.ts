/**
 * src/data/editions/index.ts
 *
 * Edition registry and TOC for all PON INK / Exotopia collector card series.
 *
 * Architecture:
 *   Each edition lives in its own file (editions/<slug>.ts).
 *   This index defines the Edition interface, registers all editions,
 *   and exports helpers used by GalleryPage and the Mint page.
 *
 * Adding a new edition:
 *   1. Create src/data/editions/<slug>.ts  — define CARDS array
 *   2. Import and push to EDITIONS below
 *   3. Cards must use IDs that don't clash with existing editions
 *      (each edition has its own ID namespace starting at edition.idStart)
 *
 * TOC format:
 *   Exposed as EDITION_TOC — suitable for nav menus, route guards,
 *   sitemap generation, and the Gallery edition selector.
 */

import type { CollectorCard, CardRarity } from 'src/data/collector-cards'

// ── Edition metadata interface ────────────────────────────────────────────────

export type EditionStatus = 'live' | 'dropping' | 'upcoming' | 'sold_out'

export interface Edition {
  id:          number        // sequential (1, 2, 3 …)
  slug:        string        // URL-safe identifier
  name:        string        // display name
  tagline:     string        // one line
  description: string        // 2–3 sentences
  year:        number
  totalCards:  number        // 11, 22, etc.
  idStart:     number        // card IDs within this edition start here
  status:      EditionStatus
  heroFrom:    string        // CSS gradient start (dark)
  heroTo:      string        // CSS gradient end (darker)
  accentColor: string        // primary accent for this edition's UI
  cards:       CollectorCard[]
}

// ── Edition registry ──────────────────────────────────────────────────────────
// Import each edition's card set and register it here.

import { EXTRAPOLATION_CARDS }     from './extrapolation-edition'
import { ANTI_AI_CARDS }           from './anti-ai-slop-drop'
import { COSMIC_PHENOMENA_CARDS }  from './cosmic-phenomena'

export const EDITIONS: Edition[] = [
  {
    id: 1, slug: 'extrapolation-edition',
    name:        'Extrapolation Edition',
    tagline:     'Astronomical objects, phenomena, and concepts from the cosmos.',
    description: '11 hand-crafted SVG collector\'s cards representing astronomical objects, cosmic phenomena, and key concepts from the Exotopia ecosystem. The first series. Minted on-chain. Yours permanently.',
    year:        2026,
    totalCards:  11,
    idStart:     1,
    status:      'live',
    heroFrom:    '#000820',
    heroTo:      '#000c18',
    accentColor: '#ffd700',
    cards:       EXTRAPOLATION_CARDS,
  },
  {
    id: 2, slug: 'anti-ai-slop-drop',
    name:        'Anti-AI Slop Drop',
    tagline:     'Human craft, field truth, and community signal. The real stuff.',
    description: '11 cards celebrating authentic human creativity, lived experience, and community science. A direct counter to AI-generated generic content — every image, every data point, every lyric here came from a real person doing real work.',
    year:        2026,
    totalCards:  11,
    idStart:     12,
    status:      'live',
    heroFrom:    '#0a0600',
    heroTo:      '#120c02',
    accentColor: '#ff6633',
    cards:       ANTI_AI_CARDS,
  },
  {
    id: 3, slug: 'cosmic-phenomena',
    name:        'Cosmic Phenomena',
    tagline:     'Stardust, moonbeams, and the forces that shape everything.',
    description: '5 cards celebrating the physical phenomena underlying the Exotopia universe — from the stellar nucleosynthesis that forged every atom to the quantum entanglement that defies classical space. The substrate beneath the settlement.',
    year:        2026,
    totalCards:  5,
    idStart:     23,
    status:      'live',
    heroFrom:    '#04020c',
    heroTo:      '#000408',
    accentColor: '#00ddcc',
    cards:       COSMIC_PHENOMENA_CARDS,
  },
]

// ── TOC helpers ───────────────────────────────────────────────────────────────

export function getEditionBySlug(slug: string): Edition | undefined {
  return EDITIONS.find(e => e.slug === slug)
}

export function getAllCards(): CollectorCard[] {
  return EDITIONS.flatMap(e => e.cards)
}

export function getCardById(id: number): CollectorCard | undefined {
  return getAllCards().find(c => c.id === id)
}

/** Flat TOC for nav menus and sitemaps */
export const EDITION_TOC = EDITIONS.map(e => ({
  id:         e.id,
  slug:       e.slug,
  name:       e.name,
  tagline:    e.tagline,
  totalCards: e.totalCards,
  status:     e.status,
  accentColor: e.accentColor,
}))

/** Status display labels */
export const STATUS_LABELS: Record<EditionStatus, string> = {
  live:      'LIVE',
  dropping:  'DROPPING SOON',
  upcoming:  'UPCOMING',
  sold_out:  'SOLD OUT',
}
