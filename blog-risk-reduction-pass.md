# Being Cautious On Purpose

*What changed after we actually read our own risk-reduction memo*

---

`RISK_REDUCTION_RECOMMENDATIONS.md` sat in this repo for a while as exactly
what it sounds like — a list of things a careful outside read of the
codebase flagged as legal/product risk, organized by "here's what I found,
here's the concrete fix." Some of it we'd already acted on (the [rarity/value
framing pass](/blog/nft-value-framing-fix) was item #1 before it was fully
item #1). This post is about going back and doing the rest of it, including
the parts that meant removing something that already worked.

<div class="post-carousel">
  <input type="radio" name="nc" id="nc-1" checked>
  <input type="radio" name="nc" id="nc-2">
  <input type="radio" name="nc" id="nc-3">
  <input type="radio" name="nc" id="nc-4">
  <div class="post-carousel__track">
    <figure class="post-carousel__slide">
      <img src="/blog-assets/risk-reduction-pass/pon-ink-registry.png" alt="pon.ink settlement registry, no pricing or trading UI">
      <figcaption>pon.ink, after: a settlement identity registry. The Exchange Depot — filters, listings, offer dialog, a public "post your own listing" form — is gone.</figcaption>
    </figure>
    <figure class="post-carousel__slide">
      <img src="/blog-assets/risk-reduction-pass/onboard-age-step.png" alt="New onboarding step asking for a self-attested age bracket">
      <figcaption>A new onboarding step. No birthdate collected — just a bracket, wired to what was previously a dead code path.</figcaption>
    </figure>
    <figure class="post-carousel__slide">
      <img src="/blog-assets/risk-reduction-pass/community-guidelines.png" alt="The newly published Community Guidelines document">
      <figcaption>/community-guidelines used to render a "hasn't been published yet" placeholder. It's a route and a loader that already existed, pointed at a file that never did.</figcaption>
    </figure>
    <figure class="post-carousel__slide">
      <img src="/blog-assets/risk-reduction-pass/pfas-disclaimer.png" alt="Standing disclaimer banner on the PFAS citizen science page">
      <figcaption>A standing disclaimer on the PFAS page — data here was already handled carefully, it just wasn't labeled as such.</figcaption>
    </figure>
  </div>
  <div class="post-carousel__dots">
    <label for="nc-1"></label><label for="nc-2"></label><label for="nc-3"></label><label for="nc-4"></label>
  </div>
</div>

<style>
.post-carousel { margin: 24px 0; border: 1px solid rgba(0,150,200,0.20); border-radius: 8px; overflow: hidden; background: #010510; }
.post-carousel__slide { flex: 0 0 100%; margin: 0; display: none; }
.post-carousel__slide img { display: block; width: 100%; height: auto; }
.post-carousel__slide figcaption { padding: 10px 14px; font-size: 12.5px; line-height: 1.5; color: rgba(150, 190, 215, 0.75); background: rgba(0, 10, 22, 0.9); border-top: 1px solid rgba(0, 130, 170, 0.18); }
#nc-1:checked ~ .post-carousel__track .post-carousel__slide:nth-child(1),
#nc-2:checked ~ .post-carousel__track .post-carousel__slide:nth-child(2),
#nc-3:checked ~ .post-carousel__track .post-carousel__slide:nth-child(3),
#nc-4:checked ~ .post-carousel__track .post-carousel__slide:nth-child(4) { display: block; }
.post-carousel__dots { display: flex; justify-content: center; gap: 8px; margin-top: 10px; }
.post-carousel__dots label { width: 8px; height: 8px; border-radius: 50%; background: rgba(0, 150, 200, 0.25); cursor: pointer; transition: background 0.15s; }
#nc-1:checked ~ .post-carousel__dots label:nth-child(1),
#nc-2:checked ~ .post-carousel__dots label:nth-child(2),
#nc-3:checked ~ .post-carousel__dots label:nth-child(3),
#nc-4:checked ~ .post-carousel__dots label:nth-child(4) { background: #00d4dc; }
</style>

## The thing we almost talked ourselves out of

The recommendation doc's single strongest line was: *"Do not build a
secondary marketplace or resale-price display... a visible resale market is
the most common trigger for 'this is a security' analysis across every
jurisdiction on your list."*

We had already built one. `PonInkPage.vue`'s "Exchange Depot" was a working
mock marketplace — filterable listings, asking prices in "PON" tokens, a
"Make Offer" dialog, a public "POST YOUR OWN LISTING" form that queued
submissions for a 24-hour review. `RealmFunnel.vue`, the funnel component
shown across the app, advertised it directly: *"List your Exolocation deeds
on the aftermarket — 80% of every secondary sale goes directly to the
original creator."* The mint and station fee panels showed a live KES
exchange-rate reference next to a resale-fee percentage. None of it was
wired to a real backend, but none of that mattered to what it *looked like*
— a functioning peer-to-peer resale market, reachable from the main nav,
demoing real financial mechanics.

The honest reaction to finding that, a few weeks into a small, underresourced
project, is to want to keep it — it's a real feature, it demos well, ripping
it out feels like giving something up. We took it out anyway. Recommendation
#1 wasn't vague about why: this is the single highest-leverage decision in
the whole document, and "we'll make it more compliant later" is exactly the
kind of hedge that doesn't survive contact with an actual regulator reading
what the product does instead of what the Terms say it does.

What's left at `/pon-ink` is a settlement hashmark viewer — the same
cryptographic quilt visualization, the same "copy hash" and "visit surface"
actions, none of the pricing. The nav entry that said "Aftermarket" now says
"Registry." Docs, glossary, and a quiz question that taught the "Resonance
Split" as a secondary-market royalty system got rewritten to describe ARTs
and collector NFTs as non-tradable contribution records, because leaving the
teaching material in place while removing the feature it taught would have
been worse than doing nothing.

## The quieter fixes

**Financial-literacy content was gated by a badge, not a route.** The
"Power-Up" post had an editorial note flagging it needed a COPPA/financial-
content review before publishing, and its status was correctly set to
`draft`. But `BlogIndexPage.vue` and `BlogPostPage.vue` never actually
checked status before rendering — every post showed up in the index and at
its direct URL regardless, with only a colored badge distinguishing "Working
draft" from "Published." The hold was documentation, not enforcement. Fixed
with one shared `isPubliclyVisible()` check used by the index, the direct
route, and the related-posts list — draft and internal posts now genuinely
don't resolve until their status changes.

**The age gate had plumbing but no wiring.** `useGuestProfile.ts` already
defined a `youth_participant` mode, and `BlogComments.vue` already checked it
to hide the private-comment compose box for youth accounts. Nothing in the
app ever *set* that field — the onboarding wizard tracked a path and a
commitment, never an age bracket. We added one step: a self-attested age
bracket (18+, 13–17, or under 13), with an honest under-13 path that doesn't
pretend a checkbox satisfies COPPA — it points a parent or guardian at the
team directly instead of faking a consent flow we can't actually verify. No
birthdate collected, matching the "no DOB, no ID verification" design
philosophy the eco-ops spec had already committed to elsewhere.

**The private comment system's privacy model was accurate but implicit.**
The "seven-person, mutual green-light" comment system already had a real,
recipient-initiated report path (`useComments.ts::report()`) — the design
was sound, it just wasn't written down anywhere a user or a regulator could
read it. Added an explicit section to the Privacy Policy covering exactly
what's visible to whom, and a new internal `LEGAL_REQUEST_POLICY.md`
documenting how we handle a valid legal request without building the
proactive scanning infrastructure we've deliberately avoided.

**`/community-guidelines` was a route pointing at nothing.** `LegalDocPage.vue`
and its loader already handled a `community-guidelines` key correctly — the
markdown file it was supposed to render just never existed, so the route
quietly served a "hasn't been published yet" placeholder since whenever it
was wired in. Terms of Service referenced it by name in the community-conduct
section. Wrote the actual document.

**PFAS data got a disclaimer and a dispute path.** The methods library and
regulatory-context data were already handled honestly — real EPA figures,
dated "verified as of" notes, no health-risk interpretation in the app's own
voice. What was missing was saying so on the page itself, and giving a named
site a way to push back on a listing. Added a standing "community-submitted,
not certified laboratory results" banner and a "Dispute this listing" action
that opens a pre-filled issue against the project tracker — a real,
functioning correction path rather than a promise of one.

**Staged entries had no expiration.** The Record widget's local drafts —
eco-ops self-reports, mentoring requests — persisted on-device indefinitely
until manually deleted. Unsubmitted entries older than 90 days now prune
automatically on load. Submitted entries are left alone; they're a completed
record, not a lingering draft.

**A footer that didn't exist.** There was no persistent contact or report
link anywhere in the app's chrome — the only place Terms/Privacy/Guidelines
links appeared was inside the one-time consent modal. Added a minimal,
collapsible footer bar with those links plus a direct "Report a problem"
link to the project's issue tracker, visible on every page.

**Consent logging got a timestamp.** The existing first-visit consent modal
stored a version string on accept, not a timestamp — useful for re-prompting
on material changes, less useful as an evidentiary record of *when* someone
agreed. Now logs both, following the same pattern the mint-disclaimer
acceptance already used. Also used the modal to say plainly that Exotopia
doesn't run a resale market and that crypto-asset participation may be
restricted where you live, since we were already touching the one screen
every user sees.

## What we didn't touch

The recommendation doc's items on M-Pesa/Stripe licensing structure and
jurisdiction-specific legal review are exactly what they sound like — actual
legal and business questions, not product bugs. We removed the one concrete
code-level violation of the "don't display an implied KES exchange rate"
guidance (it was sitting unused in `mint-config.ts`, never wired to anything
after this pass), but confirming a licensed M-Pesa aggregator relationship
is not something a pull request fixes. `SPEC_PON_INK.md`, `SPEC.md` §7.2,
and a few blog posts still describe the fuller aspirational Resonance Split
vision — an 80/15/5 split on secondary NFT transactions — as a future design.
That's clearly labeled elsewhere in `SPEC.md` as vision, not what shipped,
and rewriting the entire planning corpus felt like a worse use of a small
team's time than fixing every surface a user or regulator would actually
encounter today. We fixed those.

Small and underresourced doesn't have to mean quiet about it. This is the
boring, unglamorous half of shipping something real — and it's still less
work than finding out the hard way that "we'll clean it up later" wasn't a
plan.
