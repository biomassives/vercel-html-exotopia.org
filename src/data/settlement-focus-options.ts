/**
 * src/data/settlement-focus-options.ts
 *
 * Predetermined settlement focus categories — shown as a chip-card picker in
 * MintPage.vue (both the surface-deed and cluster-world claim flows) and
 * rendered as a badge on SettlementProfilePage.vue's public settlement page.
 * Kept as shared data so both places read the exact same id/title, rather
 * than each maintaining its own copy of the list.
 */

export interface FocusOption {
  id:    string
  icon:  string   // Material Design Icons name, e.g. 'mdi-leaf'
  title: string
  desc:  string
}

export const FOCUS_OPTIONS: FocusOption[] = [
  {
    id:    'eco',
    icon:  'mdi-leaf',
    title: 'Ecological Settlement',
    desc:  'Water, food, shelter node — full eco-ops field monitoring',
  },
  {
    id:    'learning',
    icon:  'mdi-school',
    title: 'Learning & Mentoring',
    desc:  'Education, youth pathways, peer mentoring, professional certificates',
  },
  {
    id:    'library',
    icon:  'mdi-book-open-page-variant',
    title: 'Library Development',
    desc:  'Grow the eco-ops methods library — write up, document, curate',
  },
  {
    id:    'watsan',
    icon:  'mdi-water',
    title: 'WATSAN Science Node',
    desc:  'Water quality monitoring, pH, turbidity, published field certificates',
  },
  {
    id:    'food',
    icon:  'mdi-sprout',
    title: 'Food Systems Station',
    desc:  'Permaculture, farm mapping, food co-op business management',
  },
  {
    id:    'health',
    icon:  'mdi-heart-pulse',
    title: 'Health & Green Business',
    desc:  'Healthcare outpost, clean energy training, green enterprise',
  },
  {
    id:    'leadership',
    icon:  'mdi-account-group',
    title: 'Community Leadership',
    desc:  'Coordinate projects, document local knowledge, lead initiatives',
  },
  {
    id:    'command',
    icon:  'mdi-hexagon-multiple',
    title: 'Complete Station',
    desc:  'All domains — for established SCD Hub communities',
  },
]

export function focusLabel(id: string | null | undefined): string {
  return FOCUS_OPTIONS.find(f => f.id === id)?.title ?? ''
}
