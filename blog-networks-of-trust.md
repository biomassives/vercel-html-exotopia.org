# Networks of Trust

*Four features, one design decision, and why it matters which rung you're on*

---

Over the last few passes through this codebase, we kept independently reinventing the same
small decision: when someone claims a relationship to another person — "I'm related to this
elder," "I'm 13," "this person and I both agreed to talk privately" — how much should the
product trust that claim, and what should happen if it's wrong?

<div class="post-carousel">
  <input type="radio" name="ntc" id="ntc-1" checked>
  <input type="radio" name="ntc" id="ntc-2">
  <input type="radio" name="ntc" id="ntc-3">
  <div class="post-carousel__track">
    <figure class="post-carousel__slide">
      <img src="/blog-assets/networks-of-trust/onboard-age-step.png" alt="Onboarding age self-attestation step">
      <figcaption>A self-attested age bracket, no birthdate collected — trusted at 13+, but under-13 gets no lightweight path at all.</figcaption>
    </figure>
    <figure class="post-carousel__slide">
      <img src="/blog-assets/networks-of-trust/consent-two-checkboxes.png" alt="Unbundled consent checkboxes">
      <figcaption>Two separate consents instead of one bundled checkbox — a visible moment, not a buried default.</figcaption>
    </figure>
    <figure class="post-carousel__slide">
      <img src="/blog-assets/networks-of-trust/kk-browse.png" alt="Knowledge Keeper records page">
      <figcaption>Knowledge Keeper records — the newest instance of this pattern, graded by the submitter's relationship to the elder.</figcaption>
    </figure>
  </div>
  <div class="post-carousel__dots">
    <label for="ntc-1"></label><label for="ntc-2"></label><label for="ntc-3"></label>
  </div>
</div>

<style>
.post-carousel { margin: 24px 0; border: 1px solid rgba(0,150,200,0.20); border-radius: 8px; overflow: hidden; background: #010510; }
.post-carousel__slide { flex: 0 0 100%; margin: 0; display: none; }
.post-carousel__slide img { display: block; width: 100%; height: auto; }
.post-carousel__slide figcaption { padding: 10px 14px; font-size: 12.5px; line-height: 1.5; color: rgba(150, 190, 215, 0.75); background: rgba(0, 10, 22, 0.9); border-top: 1px solid rgba(0, 130, 170, 0.18); }
#ntc-1:checked ~ .post-carousel__track .post-carousel__slide:nth-child(1),
#ntc-2:checked ~ .post-carousel__track .post-carousel__slide:nth-child(2),
#ntc-3:checked ~ .post-carousel__track .post-carousel__slide:nth-child(3) { display: block; }
.post-carousel__dots { display: flex; justify-content: center; gap: 8px; margin-top: 10px; }
.post-carousel__dots label { width: 8px; height: 8px; border-radius: 50%; background: rgba(0, 150, 200, 0.25); cursor: pointer; transition: background 0.15s; }
#ntc-1:checked ~ .post-carousel__dots label:nth-child(1),
#ntc-2:checked ~ .post-carousel__dots label:nth-child(2),
#ntc-3:checked ~ .post-carousel__dots label:nth-child(3) { background: #00d4dc; }
</style>

We finally wrote the pattern down once, in `SPEC_NETWORKS_OF_TRUST.md`, instead of re-deriving it
per feature. This post is the accessible version.

## The four rungs

Most products treat trust as binary — verified or not. We think that's wrong for a platform
this size, and here's the concrete failure mode on each side: if everything requires full
verification, low-stakes stuff (a private message between two people who already agreed to
talk) gets as slow and bureaucratic as high-stakes stuff. If everything gets the same light
touch, an elder's oral history about a place they've lived for sixty years can end up published
by a well-meaning student researcher who never actually checked in with them.

So instead of two settings, there are four:

1. **Trust the self-report, act immediately.** Two members who mutually opted into a private
   comment thread don't need a gate on every message — they already consented to the channel.
2. **Trust it, but make it a visible moment first.** A friend of a Knowledge Keeper submitting
   their memory sees a reminder — *"have you actually confirmed with them what they're
   comfortable sharing?"* — before it publishes. Still fast. Still a real pause.
3. **Hold it for a documented step.** A student or researcher submitting the same kind of
   record doesn't get to publish immediately — the record is held, they have to write down how
   consent was actually obtained, and someone reviews it before it goes live.
4. **Don't offer a shortcut at all.** Formal endangered-language documentation requires Free,
   Prior and Informed Consent from a community's actual governance body — not from whoever
   happens to be holding the recorder. No self-attestation, at any relationship distance,
   substitutes for that. Same logic applies to a child under 13 trying to sign up — there's no
   checkbox version of verified parental consent, so we don't pretend there is one; we point
   them at a person instead.

## Why the boundary between rung 3 and rung 4 is the one that matters

Rungs 1–3 are all still fundamentally about *this user's own experience* — how much friction
should *they* face using the product. Rung 4 exists because sometimes the person whose consent
actually matters isn't the person using the product at all. A family member submitting a
Knowledge Keeper record and a sibling signing a little brother up for an account are both
"someone acting on behalf of someone who isn't in the room." That's the exact situation both
COPPA and the international Free, Prior and Informed Consent frameworks (ILO Convention 169,
UNDRIP Article 31, the Nagoya Protocol) were built for — and it's why closeness of relationship,
which is real and useful information at rungs 1–3, stops being sufficient the moment you cross
into rung 4. "I know them well" is a legitimate reason to trust someone's account of their own
memory being shared. It is not a legitimate substitute for a threatened-language speaker
community's own governance structure deciding what happens to their knowledge commons.

We built the Knowledge Keeper feature (`/knowledge-keepers`) with this boundary as a hard rule,
not a suggestion: if what's being documented touches a threatened language, the form doesn't
offer a graded path at all — it routes straight to the real process, full stop, regardless of
how the submitter describes their relationship to the speaker.

## What this isn't

Self-attestation at any rung isn't legal verification, and we're not pretending it is. An age
bracket isn't ID verification. A "we've talked about this" checkbox isn't a signed release. The
actual compliance commitments live in `legal-privacy.md`, `legal-community-guidelines.md`, and
`LEGAL_REQUEST_POLICY.md` — this pattern is the design reasoning underneath those documents, not
a replacement for them. And it's not a call to keep adding rungs — four is what the actual legal
frameworks we're approximating distinguish between; a fifth rung "just in case" would be
complexity with nothing real underneath it.

Small, underresourced projects usually can't build full verified-identity infrastructure for
every relationship claim a feature might involve — and mostly shouldn't try to. What we can do
is be honest about which rung a given feature sits on, and refuse to let a lower rung's speed
leak into a situation that actually needs the top one. That's the whole pattern.
