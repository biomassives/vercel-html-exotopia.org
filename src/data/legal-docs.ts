/**
 * src/data/legal-docs.ts
 * Loader for the three public legal/community documents — Terms of Service,
 * Privacy Policy, Community Guidelines — plus each one's changelog, split
 * into its own file/page so the changelog table can grow without pushing
 * the substantive document further down. Mirrors src/data/blog-posts.ts's
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

const CHANGELOG_FILE_STEM: Record<LegalDocKey, string> = {
  terms:                  'legal-terms-changelog',
  privacy:                'legal-privacy-changelog',
  'community-guidelines': 'legal-community-guidelines-changelog',
}

export const LEGAL_DOC_LABEL: Record<LegalDocKey, string> = {
  terms:                  'Terms of Service',
  privacy:                'Privacy Policy',
  'community-guidelines': 'Community Guidelines',
}

// Vite eager glob — transformed to { default: string } by markdownPlugin in quasar.config.js.
// Matches both the docs above and their `-changelog` companions.
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

export function getLegalChangelogRaw(key: LegalDocKey): string {
  return rawModules[`../../${CHANGELOG_FILE_STEM[key]}.md`]?.default ?? ''
}

export function hasLegalChangelog(key: LegalDocKey): boolean {
  return !!getLegalChangelogRaw(key).trim()
}

export function renderLegalChangelog(key: LegalDocKey): string {
  const raw = getLegalChangelogRaw(key)
  if (!raw.trim()) return ''
  return marked.parse(raw, { async: false }) as string
}
