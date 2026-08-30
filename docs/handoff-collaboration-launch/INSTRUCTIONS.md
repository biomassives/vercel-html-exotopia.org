# Handoff: Collaboration/Testing Launch — Follow-Through

*Prepared 2026-08-29 for the local agent picking up implementation work. Written by the session
that drafted the source documents; that session did the writing/editorial pass, this folder is
the punch list for what's left to actually ship it.*

## What already happened (context, not TODO)

One editorial pass, spread across five files, all part of the same scope decision:

- `SPEC.md` — added **§26 "Blockchain/NFT Scope Correction"**: the NFT/blockchain economy
  originally described in §5–7, §10.3, and §18.5 has been edited to match what §21 already
  established as shipped reality (a Supabase-backed points ledger, not an NFT economy), and the
  full blockchain/NFT layer has been relocated to `SPEC_PON_INK.md` / `SPEC_WORLDBRIDGER_ONE.md`
  as an **optional** monetization/creator layer — not core Exotopia distro scope. Both those spec
  files already exist in the repo root; nothing new needed there.
- `GLOSSARY.md` — updated in step with the same pivot: `[24] Exolocation` is now a local-first
  address (`exotopia:{scope}:{path}`, see `SPEC_EXOLOC_ADDRESS.md`), the NFT & CHAIN section now
  carries a header note that everything in it is pon.ink/Worldbridger One's *optional* layer.
- `welcome-letter.md` — the onboarding template no longer says settlement addresses are
  "recorded on the blockchain" (was Algorand-specific language, factually wrong relative to the
  actual local-first/IPFS architecture). Both the HTML and plain-text bodies were fixed.
- `status-report-aug17-2026.md` (new, repo root) — a from-scratch honest status snapshot, written
  to hand to someone who's never seen the project, superseding an August 10 version.
- `call-for-collaboration-testing.md` (new, repo root) — a draft open call for testers/mentors/
  developers, explicitly marked **`[DRAFT — not reviewed, not sent, not published]`** at the top.
  Its own trailing "Notes for review" section is the source of everything in this handoff.

None of this is committed yet — `git status` at time of writing shows all five files as pending
(three modified, two untracked), nothing staged.

Read-only copies of the two new documents are included in this folder
(`status-report-aug17-2026.md`, `call-for-collaboration-testing.md`) so you don't have to hunt
the repo root for them. **They are snapshots, not the source of truth** — if you edit content,
edit the repo-root files, not these copies.

## Task list, in order

### 1. Review the diff, then commit
Nothing above is committed. Read the actual diffs (`git diff GLOSSARY.md SPEC.md
welcome-letter.md`) plus the two new files before committing — this handoff doc is a summary, not
a substitute for reading the real change. If it holds up, commit as one logical change (the scope
correction + its two launch documents are one coherent unit of work).

### 2. Sweep `src/` for stale blockchain/Algorand copy
The doc-level pivot (core Exotopia = local-first, no wallet/blockchain required; pon.ink is
optional) isn't yet reflected everywhere in the app itself. A grep for `blockchain|Algorand` hits
these files — **each needs a human read, not a blind find/replace**, since some mentions may be
legitimate (e.g. describing the *optional* pon.ink path correctly):

- `src/pages/GlossaryPage.vue`
- `src/pages/DocPage0.vue`
- `src/pages/MintPage.vue`
- `src/pages/RewardsGuidePage.vue`
- `src/pages/MintStylePage.vue`
- `src/lib/station-modules.ts`
- `src/lib/mint-style.ts`
- `src/data/blog-posts.ts`
- `src/components/DemoConsentOverlay.vue`
- `src/lib/ipfs-pinning.ts`
- `src/stores/file-cabinet.ts`
- `src/data/quizzes.ts`
- `src/data/editions/extrapolation-edition.ts`

For each: does this describe the core settlement/address system (should now say local-first, no
blockchain required) or does it describe the optional pon.ink NFT layer (fine to keep as-is, just
check it's clearly framed as optional per SPEC.md §26)?

### 3. Register `status-report-aug17-2026.md` as a blog post — has a real gotcha
The call-for-collaboration doc's review notes flag this as wanted but unbuilt. Mechanically:

- The blog loader (`src/data/blog-posts.ts`) does `import.meta.globEager('../../blog-*.md')` —
  **it only picks up files whose name starts with `blog-`**. The current file is named
  `status-report-aug17-2026.md`, which the glob will **not** match. Copy or rename it to
  `blog-status-report-aug17-2026.md` at the repo root (check whether the call-for-collaboration
  doc's link to `status-report-aug17-2026.md` — see its "How to actually do this" §step 1 — needs
  updating too if you rename rather than duplicate).
- Add a matching entry to the `blogPosts` array in `src/data/blog-posts.ts`, following the
  existing entry shape (`slug`, `title`, `subtitle`, `date`, `audience`, `series`, `status`,
  `description`, optional `editorialNote`). Look at the `local-first-by-default` or
  `the-lessons-are-real` entries (both August 2026, both nearby in the file) as the closest
  precedent in tone and audience tags.
- Pick `status: 'public-draft'` rather than `'published'` until someone signs off on it going
  fully live — `isPubliclyVisible()` treats both the same for listing purposes, but `'published'`
  implies a stronger commitment the draft banner on the collaboration call doesn't support yet.

### 4. Produce the shareable one-pager for `call-for-collaboration-testing.md`
Flagged in the doc's own review notes: *"Happy to turn this into a shareable one-pager
(PDF-style artifact) once approved."* Approval is a human call, not yours to make — but once
someone signs off on the content, this is a design/formatting task (print-friendly HTML or a
Claude Artifact), not a rewrite. Don't do this before #5.

### 5. Decide the publication surface
Both new documents currently exist only as bare repo files with no public route. The
collaboration-call doc's own notes raise this directly: *"This assumes
`status-report-aug17-2026.md` gets linked from somewhere public (a blog post wrapper, or the
About modal) — right now it's a bare repo file with no route."* Task #3 handles the blog-post
route for the status report; the call-for-collaboration doc itself still needs a decision on
where it's posted (About modal? Its own blog entry? GitHub Discussions?) — that's a product call
for whoever owns this launch, flag it rather than guessing.

### 6. Not in scope for this handoff (backlog awareness only)
Both new documents' "what's next" sections name two larger, already-specced items that are **not**
part of this launch push and shouldn't be pulled in scope here: the sky-data "regime" architecture,
and broadening the installable PWA identity beyond the citizen-science module. Leave those alone.

## Files in this folder

- `INSTRUCTIONS.md` — this file
- `status-report-aug17-2026.md` — snapshot copy of the repo-root file (task #3 subject)
- `call-for-collaboration-testing.md` — snapshot copy of the repo-root file (tasks #4–5 subject)
