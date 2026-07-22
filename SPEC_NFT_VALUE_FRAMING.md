# SPEC: NFT Value & Rarity Framing — Integrated Solution

**Status:** Implemented — 2026-07-22
**Date:** 2026-07-22
**Scope:** Every place rarity/scarcity language, numeric rarity scores, and on-chain "Rarity" metadata traits appear across the collector-card/editions subsystem
**Relates to:** `RISK_REDUCTION_RECOMMENDATIONS.md` §1 (NFT/investment-framing risk), `SPEC_NFT_FRONTIER.md`
**Shipped:** all of §5/§6 below — schema, `CollectorCard.vue`, `GalleryPage.vue`, `MainLayout.vue` copy. Universal disclaimer generalization (§6, last row) remains blocked on an editions mint path going live.

---

## 1. Why this needs an integrated spec, not a patch

The first pass at this (in `src/pages/MintPage.vue`) fixed the most *visible* instance — the hero section's rarity-tier chips shown before minting — because that was the one thing `RISK_REDUCTION_RECOMMENDATIONS.md` named directly, and because it was safe to change in isolation: pure display copy, no schema, no other file depended on it.

Pulling on that thread further, the actual rarity concept turns out to be load-bearing across the whole collector-card/editions subsystem, not a one-off display choice:

| File | What it does with rarity |
|---|---|
| `src/data/collector-cards.ts` | Defines `CardRarity` (`'legendary'\|'rare'\|'uncommon'\|'common'`), a `rarityScore` (1–10, "10 = most rare"), and `RARITY_CONFIG` (label/color/glow per tier). Backwards-compat shim re-exporting Edition 1. |
| `src/data/editions/extrapolation-edition.ts`, `anti-ai-slop-drop.ts`, `cosmic-phenomena.ts` | 27 cards total across 3 editions, each with its own `rarity`/`rarityScore`, and — critically — an **on-chain NFT attribute**: `{ trait_type: 'Rarity', value: 'Legendary' }` (or Rare/Uncommon/Common), baked into the metadata every card would mint with. |
| `src/components/CollectorCard.vue` | Renders `RARITY_CONFIG[card.rarity].label` on every card face, plus a visible **score bar** sized to `card.rarityScore / 10` — a literal graded-scarcity meter. |
| `src/pages/GalleryPage.vue` | Rarity filter tabs with live counts (`COLLECTOR_CARDS.filter(c => c.rarity === r.id).length`), a ticker showing each card's rarity, per-cell rarity label + the same score bar. |
| `src/layouts/MainLayout.vue` | Marketing copy: *"11 hand-crafted SVG cards — Legendary, Rare, Uncommon, Common."* (two places). |
| `src/pages/MintPage.vue` | **Already fixed** — hero chips removed, replaced with neutral "11 distinct hand-crafted designs" copy; pre-mint disclaimer added and gated on the one live mint path. |

This is a single design decision (tiered scarcity as the organizing metaphor for the whole card system) expressed consistently across data, on-chain metadata, and UI in six files. Changing the hero copy alone leaves the substance — the thing regulators actually look at — fully intact everywhere else a user encounters these cards.

**The good news on timing:** every card in every edition currently shows `mintedCount: 0` — nothing has been minted yet, anywhere. There is no already-pinned IPFS metadata, no already-minted token whose `attributes` array would go stale if the trait shape changes. This is a genuine zero-migration-risk window to fix the schema before it ships, not a breaking change to something live.

---

## 2. What's already shipped (✅)

- `MintPage.vue` hero section: rarity-tier chips → neutral "11 distinct hand-crafted designs" line. `RARITY_SUMMARY` constant and its now-orphaned `.rarity-pip` CSS removed.
- `MintPage.vue` pre-mint disclaimer: a required, logged checkbox — *"This mints a collectible record. It has no cash value, no expectation of profit, and is not an investment."* — gating the one path that actually executes an on-chain mint today (`doMint('exolocation')`). Acceptance timestamps persist to `localStorage` (`exo.mint-disclaimer-log`) as an evidentiary record, and are also `console.info`-logged.

## 3. Design principles for the rest

1. **Thematic/aesthetic variety, not graded scarcity.** Cards can still look and feel different from each other — that's good design. What they can't do is present that difference as a *value hierarchy* with a name (Legendary/Rare/…) and a number (score/10). Substance-over-form review doesn't care that the label is presented as "flavor" if the structure underneath is still a four-tier ranked scarcity system.
2. **No visible counts tied to scarcity.** "3 Legendary, 4 Rare…" is exactly the pattern to avoid — it's a supply/demand signal, not a description.
3. **The disclaimer generalizes.** Whichever mint path eventually goes live for editions/collector cards, it inherits the same required, logged, non-bypassable disclaimer already built for the exolocation path — not a second bespoke implementation.
4. **On-chain metadata is the highest-leverage surface.** A trait that says `{"trait_type": "Rarity", "value": "Legendary"}` is discoverable by any marketplace, aggregator, or regulator that reads the metadata directly — it doesn't matter what the UI says elsewhere. This is the one change that should happen even if nothing else in this spec does.

## 4. Proposed schema change

**Remove**, don't rename-and-keep: `CardRarity`, `rarityScore`, `RARITY_CONFIG`, and the `{ trait_type: 'Rarity', value: ... }` attribute entry, across `collector-cards.ts` and all three edition files.

**Replace with**, if visual/organizational variety is still wanted:
- `visualTheme: string` — a purely descriptive, non-ranked tag (e.g. `'nebula'`, `'wormhole'`, `'habitable-world'` — literally what the art depicts). Internal only; not rendered as a badge, not filterable-with-counts, not an on-chain attribute unless it's genuinely descriptive metadata a collector would want (e.g. `{ trait_type: 'Subject', value: 'Nebula' }` — describing *what the art is*, not *how scarce it is*, is fine and normal for NFT metadata).
- Keep `edition` / `maxEdition` (e.g. "3 of 11") if wanted — a plain edition number is standard collectible-numbering practice and isn't itself a scarcity *ranking*, as long as it isn't paired with a value-coded tier name or a "score."

**Card visual differentiation** (`bgFrom`/`bgTo`/`borderColor`/`artColors`/`glowColor`) stays exactly as-is — none of that is the problem; it's the ranking system layered on top of it that is.

## 5. UI changes needed

| File | Change |
|---|---|
| `CollectorCard.vue` | Remove the rarity label render (line ~106) and the score bar (line ~950, `rarityBarWidth`). Card art/palette rendering unchanged. |
| `GalleryPage.vue` | Remove `RARITY_FILTERS` tabs-with-counts, the ticker's rarity display, per-cell rarity label, and the score-bar render. Replace filtering (if wanted) with edition/series selection only — which is real, factual grouping, not a value hierarchy. |
| `MainLayout.vue` | Update the two marketing-copy lines ("11 hand-crafted SVG cards — Legendary, Rare, Uncommon, Common") to match `MintPage.vue`'s already-fixed neutral framing. |
| `src/data/collector-cards.ts` + `src/data/editions/*.ts` | Schema change per §4 — 27 card definitions to update, mechanical once the shape is agreed. |

## 6. Status table

| Item | Status |
|---|---|
| MintPage.vue hero reframe | ✅ Shipped |
| MintPage.vue pre-mint disclaimer + logged acceptance | ✅ Shipped |
| `CardRarity`/`rarityScore`/on-chain `Rarity` trait removed from data files | ✅ Shipped — all 27 cards, 3 editions; `collector-cards.ts` also converted from a fake shim (was actually an already-drifted independent duplicate) into a real re-export |
| `CollectorCard.vue` score bar + rarity label removed | ✅ Shipped — stats bar rebalanced to Edition/Minted; per-tier hover glow replaced with a per-card `--card-glow` custom property |
| `GalleryPage.vue` rarity filters/counts/ticker/score bar removed | ✅ Shipped — filter tabs removed outright (redundant with the edition switcher already on the page); hero-fan selection now fixed by card order instead of rarity |
| `MainLayout.vue` marketing copy updated | ✅ Shipped |
| Universal pre-mint disclaimer (generalized beyond exolocation) | 🔲 Still blocked on an editions mint path actually going live first; currently `doMint()` shows "chain integration is in development" for every type except exolocation |

**One unrelated bug fixed along the way:** verifying cross-edition browsing surfaced a genuine pre-existing crash in `CollectorCardBack.vue` — a broken `v-for2`/`:key2` (not real Vue syntax, dead/non-functional markup) on card #20's decoration, plus a stale `card.rarity.toUpperCase()` call — both threw and crashed the whole gallery page when switching to Edition 2. Neither was introduced by this change; both blocked verifying it, so both are fixed in the same commit.

## 7. Explicitly not part of this

- Building the actual editions/collector-card minting flow (still "in development" per `doMint()`) — this spec covers what its metadata and UI should look like *whenever* that ships, not building the mint path itself.
- Resale marketplace / secondary-market price display — `RISK_REDUCTION_RECOMMENDATIONS.md`'s second bullet already recommends never building this in-product; nothing here proposes it either.
- Retroactive metadata migration for already-minted tokens — moot, since `mintedCount: 0` everywhere confirms nothing has been minted yet.
- A lawyer's review of whether this fully addresses the underlying legal risk — this spec implements the specific product recommendations in `RISK_REDUCTION_RECOMMENDATIONS.md`; it is not itself legal advice or a substitute for the review that document also calls for.
