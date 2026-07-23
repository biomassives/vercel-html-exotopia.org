# A Tour of What's Here

*Settlement identity, elder knowledge, citizen science, and your own data — a walk through
the newest corners of Exotopia*

---

We've spent the last stretch of work fixing things underneath the surface — legal framing,
consent flows, a marketplace that shouldn't have existed. This post is the opposite: a tour of
what those changes actually add up to as *services*, if you're arriving fresh and want to know
what you can do here.

<div class="post-carousel">
  <input type="radio" name="pst" id="pst-1" checked>
  <input type="radio" name="pst" id="pst-2">
  <input type="radio" name="pst" id="pst-3">
  <input type="radio" name="pst" id="pst-4">
  <input type="radio" name="pst" id="pst-5">
  <div class="post-carousel__track">
    <figure class="post-carousel__slide">
      <img src="/blog-assets/platform-tour/consent-modal.png" alt="The updated consent modal with two separate checkboxes">
      <figcaption>The first thing you'll see — two separate consents instead of one bundled checkbox, and a direct statement that there's no resale marketplace here.</figcaption>
    </figure>
    <figure class="post-carousel__slide">
      <img src="/blog-assets/platform-tour/onboard-age.png" alt="Onboarding age self-attestation step">
      <figcaption>Onboarding — a self-attested age bracket, no birthdate collected, six steps from mission to your first settlement.</figcaption>
    </figure>
    <figure class="post-carousel__slide">
      <img src="/blog-assets/platform-tour/kk-hero.png" alt="Knowledge Keeper Records page">
      <figcaption>Wisdom from Elders — a place for the memory a longitudinal monitoring program can't replicate.</figcaption>
    </figure>
    <figure class="post-carousel__slide">
      <img src="/blog-assets/platform-tour/pfas-disclaimer.png" alt="PFAS citizen science page with disclaimer">
      <figcaption>PFAS/PFOA citizen science — real remediation methods, honestly labeled as community-submitted, not certified.</figcaption>
    </figure>
    <figure class="post-carousel__slide">
      <img src="/blog-assets/platform-tour/account.png" alt="Account and Privacy self-service page">
      <figcaption>Your data, self-service — export or request deletion without an email round-trip.</figcaption>
    </figure>
  </div>
  <div class="post-carousel__dots">
    <label for="pst-1"></label><label for="pst-2"></label><label for="pst-3"></label><label for="pst-4"></label><label for="pst-5"></label>
  </div>
</div>

<style>
.post-carousel { margin: 24px 0; border: 1px solid rgba(0,150,200,0.20); border-radius: 8px; overflow: hidden; background: #010510; }
.post-carousel__slide { flex: 0 0 100%; margin: 0; display: none; }
.post-carousel__slide img { display: block; width: 100%; height: auto; }
.post-carousel__slide figcaption { padding: 10px 14px; font-size: 12.5px; line-height: 1.5; color: rgba(150, 190, 215, 0.75); background: rgba(0, 10, 22, 0.9); border-top: 1px solid rgba(0, 130, 170, 0.18); }
#pst-1:checked ~ .post-carousel__track .post-carousel__slide:nth-child(1),
#pst-2:checked ~ .post-carousel__track .post-carousel__slide:nth-child(2),
#pst-3:checked ~ .post-carousel__track .post-carousel__slide:nth-child(3),
#pst-4:checked ~ .post-carousel__track .post-carousel__slide:nth-child(4),
#pst-5:checked ~ .post-carousel__track .post-carousel__slide:nth-child(5) { display: block; }
.post-carousel__dots { display: flex; justify-content: center; gap: 8px; margin-top: 10px; }
.post-carousel__dots label { width: 8px; height: 8px; border-radius: 50%; background: rgba(0, 150, 200, 0.25); cursor: pointer; transition: background 0.15s; }
#pst-1:checked ~ .post-carousel__dots label:nth-child(1),
#pst-2:checked ~ .post-carousel__dots label:nth-child(2),
#pst-3:checked ~ .post-carousel__dots label:nth-child(3),
#pst-4:checked ~ .post-carousel__dots label:nth-child(4),
#pst-5:checked ~ .post-carousel__dots label:nth-child(5) { background: #00d4dc; }
</style>

## Settlement Registry (`/pon-ink`)

This used to be a mock trading floor — listings, asking prices, a "make offer" dialog. It's now
what the name always should have implied: a registry. Every settlement gets a hashmark — a
deterministic, visually distinct quilt pattern generated from your settlement's own hash — and
this is where you view it, copy the hash, or jump to the surface. No pricing, no depot, no
aftermarket. If you're looking for a place to trade collectibles, this isn't it, on purpose.

## Wisdom from Elders (`/knowledge-keepers`)

A new one. An elder who's lived near a place for sixty years has a dataset no sampling program
can replicate — water clarity in 1965, when the ticks first showed up, what grew here before.
This is where that memory gets recorded alongside the technical monitoring data, tagged by
domain (place, plant, animal, season, practice, memory, story) and optionally cross-referenced
to a specific site record.

It's built with a graded trust model instead of one-size-fits-all friction: if you're
documenting your own memory or a family member's, it publishes immediately. If you know the
Knowledge Keeper personally, you get a quick confirmation prompt first. If you're a student or
researcher documenting at more of a distance, the record is held until someone reviews how
consent was actually obtained. And if what you're recording touches a threatened language, this
lightweight path doesn't apply at all — that goes through a real Free, Prior and Informed
Consent process with the community's own governance structure, no shortcut available at any
relationship distance. (We wrote up why that boundary matters in
[Networks of Trust](/blog/networks-of-trust).)

## PFAS / PFOA Citizen Science (`/pfas-citizen-science`)

Real remediation science — established methods and emerging ones, both labeled honestly for
which is which — plus a place to track progress on an actual decontamination project or a
simulated one for practice. Every page now carries a standing disclaimer: this is
community-submitted data, not a certified lab result, and it says so before you read anything
else. Named sites can be disputed through a real correction-request path. And if you're starting
a real (non-simulated) project, there's now an actual field-safety acknowledgment — not just a
buried clause, a checkbox you see at the moment it matters.

## Account & Privacy (`/account`)

The self-service rights a Privacy Policy usually just promises in prose, actually built:
download everything tied to your account as a JSON file in one click, or file a real, timestamped
account-deletion request. We're upfront in the UI about why deletion isn't instant — actually
removing an account needs a step your browser can never safely perform on its own, so a request
gets logged and a person handles it, not a black hole.

## Onboarding, revisited

Six steps now instead of five — a new "About You" step asking a self-attested age bracket (18+,
13–17, or under 13) right after the mission intro. No birthdate collected. Under-13 doesn't get a
fake consent checkbox that wouldn't hold up anyway — it points you at an actual person to talk to,
because that's what COPPA-grade consent actually requires. The other five steps are the same
path you'd remember: pick what brought you here, commit to a first step, reserve a settlement,
begin.

## The quiet one: the consent modal

First thing anyone sees. It used to be one checkbox covering three different things. It's now
two — one for the contract terms (Terms, Privacy, Community Guidelines), one specifically for
consenting to your data being processed off-device when you sign in or submit something. Small
change, but it's the difference between a bundled "I agree" and an honest accounting of what
you're actually agreeing to.

---

None of this is finished — it's a live demo, and the modal above says so every time. But it's a
real tour of real, working services, not a roadmap. Everything shown here is live at the paths
listed; go click around.
