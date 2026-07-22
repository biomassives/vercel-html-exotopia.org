# Cards Without a Ranking System

## A legal-risk review flagged our collector cards as a securities-framing problem. Here's what we removed, and what a mint screen looks like when it isn't trying to sell you on scarcity.

*Exotopia.org — July 2026*

---

A product/policy risk review (`RISK_REDUCTION_RECOMMENDATIONS.md`) came back with a specific, concrete finding: our collector cards had a four-tier ranked rarity system — Legendary, Rare, Uncommon, Common — with a numeric score out of 10, displayed prominently before minting. That's the exact pattern regulators look for when applying the Howey test to NFTs: an "expectation of profit" signal, functionally identical to how graded-collectible and gacha-style products argue value.

Pulling on that thread, the rarity concept turned out to be load-bearing across six files, not a single display choice — a `CardRarity` type, a `rarityScore` field, an on-chain `{trait_type: "Rarity", value: "Legendary"}` metadata attribute baked into all 27 cards across our three editions, a literal score/10 meter on every card face, and rarity-based filter tabs with live counts in the gallery. We wrote up the full inventory as `SPEC_NFT_VALUE_FRAMING.md` before touching anything, then removed it — schema, metadata, and UI — in one pass.

<div class="post-carousel">
  <input type="radio" name="nft-carousel" id="nc-1" checked>
  <input type="radio" name="nft-carousel" id="nc-2">
  <input type="radio" name="nft-carousel" id="nc-3">
  <input type="radio" name="nft-carousel" id="nc-4">
  <div class="post-carousel__track">
    <figure class="post-carousel__slide">
      <img src="/blog-assets/nft-value-framing/gallery-grid.png" alt="Gallery card grid with no rarity badges or score bars">
      <figcaption>The gallery grid now — edition and mint-count only. No tier badges, no score bars.</figcaption>
    </figure>
    <figure class="post-carousel__slide">
      <img src="/blog-assets/nft-value-framing/detail-panel.png" alt="Card detail panel showing descriptive attributes, no rarity score">
      <figcaption>The detail panel's attribute table is entirely descriptive now — Series, Edition, Teff, Luminosity, Spectral, Fate. No "Rarity" row.</figcaption>
    </figure>
    <figure class="post-carousel__slide">
      <img src="/blog-assets/nft-value-framing/mint-hero.png" alt="Mint page hero with neutral collection copy instead of rarity chips">
      <figcaption>The mint hero's rarity-tier chips are gone, replaced with a plain count: "11 distinct hand-crafted designs."</figcaption>
    </figure>
    <figure class="post-carousel__slide">
      <img src="/blog-assets/nft-value-framing/mint-disclaimer.png" alt="Required pre-mint disclaimer checkbox above the mint button">
      <figcaption>A required, logged disclaimer now sits above every live mint action: no cash value, no expectation of profit, not an investment.</figcaption>
    </figure>
  </div>
  <div class="post-carousel__dots">
    <label for="nc-1"></label>
    <label for="nc-2"></label>
    <label for="nc-3"></label>
    <label for="nc-4"></label>
  </div>
</div>

<style>
.post-carousel { position: relative; margin: 28px 0; }
.post-carousel input { display: none; }
.post-carousel__track {
  display: flex;
  overflow-x: hidden;
  border-radius: 8px;
  border: 1px solid rgba(0, 180, 220, 0.20);
  background: #010510;
}
.post-carousel__slide {
  flex: 0 0 100%;
  margin: 0;
  display: none;
}
.post-carousel__slide img { display: block; width: 100%; height: auto; }
.post-carousel__slide figcaption {
  padding: 10px 14px;
  font-size: 12.5px;
  line-height: 1.5;
  color: rgba(150, 190, 215, 0.75);
  background: rgba(0, 10, 22, 0.9);
  border-top: 1px solid rgba(0, 130, 170, 0.18);
}
#nc-1:checked ~ .post-carousel__track .post-carousel__slide:nth-child(1),
#nc-2:checked ~ .post-carousel__track .post-carousel__slide:nth-child(2),
#nc-3:checked ~ .post-carousel__track .post-carousel__slide:nth-child(3),
#nc-4:checked ~ .post-carousel__track .post-carousel__slide:nth-child(4) {
  display: block;
}
.post-carousel__dots {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-top: 10px;
}
.post-carousel__dots label {
  width: 8px; height: 8px;
  border-radius: 50%;
  background: rgba(0, 150, 200, 0.25);
  cursor: pointer;
  transition: background 0.15s;
}
#nc-1:checked ~ .post-carousel__dots label:nth-child(1),
#nc-2:checked ~ .post-carousel__dots label:nth-child(2),
#nc-3:checked ~ .post-carousel__dots label:nth-child(3),
#nc-4:checked ~ .post-carousel__dots label:nth-child(4) {
  background: #00d4dc;
}
</style>

## What actually changed

**The schema, not just the label.** `CardRarity`, `rarityScore`, and the on-chain `{trait_type: "Rarity", ...}` attribute are gone from all 27 cards across all three editions — not renamed, removed. Cards still look distinct from each other (each keeps its own gradient, border color, glow, and artwork palette), they just don't carry a ranked scarcity tier anymore. `collector-cards.ts` also turned out to be a second, independently-drifted copy of the same data rather than the re-export its own comment claimed — fixed that too, while we were in there.

**A required, logged disclaimer.** Every live mint action now sits behind an explicit checkbox: *"This mints a collectible record. It has no cash value, no expectation of profit, and is not an investment."* Acceptance timestamps persist locally as an evidentiary record — an affirmative, logged user action holds up better under consumer-protection review than a clause in a Terms document nobody reads.

**Filter tabs removed, not replaced.** The gallery already had a working edition switcher (Extrapolation / Anti-AI Slop Drop / Cosmic Phenomena) sitting right above the rarity filter bar — so the rarity tabs were redundant as well as risky. Removed outright rather than rebuilt as something else.

**The hero fan.** Both the gallery and mint pages feature five cards in a fanned hero display. That selection used to pick "the legendaries" specifically — now it's just the first five cards by order. No ranking system reintroduced by another name.

## One real bug found along the way

Verifying cross-edition browsing surfaced something unrelated but broken: `CollectorCardBack.vue`'s card-back header had a *literal hardcoded string* — every single card, in every edition, showed "ANTI-AI SLOP DROP" on its back face regardless of which series it actually belonged to. Not something we introduced; it was already there, just never exercised by anyone switching editions and looking at the back of a card from a different series. Fixed in the same pass, since it was blocking verification of the actual change.

## What this doesn't do

This isn't legal advice, and it isn't the end of the review. `RISK_REDUCTION_RECOMMENDATIONS.md` covers more ground than the rarity display — a resale marketplace is explicitly recommended against building at all, and the underlying legal exposure still needs an actual lawyer's review, not a product change standing in for one. What shipped here is the concrete, code-level part of that document's first and most specific finding, done as a full pass rather than a surface patch — because the alternative was fixing the marketing copy and leaving the exact same ranking system sitting in the metadata every marketplace and aggregator would still read directly.
