/**
 * src/data/legal-docs.ts
 * Loader for the three public legal/community documents — Terms of Service,
 * Privacy Policy, Community Guidelines. Mirrors src/data/blog-posts.ts's
 * pattern: root-level markdown files glob-imported as raw strings by the
 * `markdownPlugin` in quasar.config.js, rendered with the same `marked`
 * parser. Unlike blog posts, the raw file is rendered as-is (no H1/H2
 * stripping) since the page doesn't duplicate a title from elsewhere.
 */

import { marked } from 'marked'

export type LegalDocKey = 'terms' | 'privacy' | 'community-guidelines'

const FILE_STEM: Record<LegalDocKey, string> = {
  terms:                  'legal-terms',
  privacy:                'legal-privacy',
  'community-guidelines': 'legal-community-guidelines',
}

export const LEGAL_DOC_LABEL: Record<LegalDocKey, string> = {
  terms:                  'Terms of Service',
  privacy:                'Privacy Policy',
  'community-guidelines': 'Community Guidelines',
}

// Vite eager glob — transformed to { default: string } by markdownPlugin in quasar.config.js
const rawModules = import.meta.globEager('../../legal-*.md') as Record<string, { default: string }>

export function getLegalDocRaw(key: LegalDocKey): string {
  return rawModules[`../../${FILE_STEM[key]}.md`]?.default ?? ''
}

export function hasLegalDoc(key: LegalDocKey): boolean {
  return !!getLegalDocRaw(key).trim()
}

export function renderLegalDoc(key: LegalDocKey): string {
  const raw = getLegalDocRaw(key)
  if (!raw.trim()) return ''
  return marked.parse(raw, { async: false }) as string
}
