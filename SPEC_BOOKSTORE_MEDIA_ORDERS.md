# SPEC — Bookstore & Media Orders

Status: **v1 shipped as order-intake, not live checkout.** This page exists so
creatives on the Exotopia network, and Home Team (the people maintaining this
software), have a real, visible way to earn income from their work — without
building a full payment/fulfillment system before anyone has agreed on the
split, the fulfillment model, or the nonprofit-compliance angle.

## What shipped

- `src/pages/BookstorePage.vue` at route `/bookstore`
- `src/stores/bookstore.ts` — catalog load, self-listing, order-request writes
- `supabase/migrations/019_bookstore.sql` — `bookstore_items`, `bookstore_orders`
- `BOOKSTORE_SPLIT` / `HOME_TEAM_LISTING_SPLIT` added to `src/lib/resonance-split.ts`
- Nav entries on both desktop (mega-menu PARTICIPATE group) and mobile drawer,
  kept in sync deliberately — see the `/docs` UX review from the same day,
  which flagged `/api-surface` for exactly the inconsistency this avoids.

## How it works today

1. A signed-in member lists an item (title, format, description, price,
   optional cover image / external listing URL). It lands as `pending`.
2. An admin reviews it in Supabase directly (no admin UI shipped yet — see
   Open Questions) and flips it to `active`, at which point it's public.
3. Any signed-in member can "Request to order" an active item. This inserts
   a `bookstore_orders` row — quantity, an optional note — and is explicitly
   **not** a purchase confirmation anywhere in the copy.
4. The item's creator (or an admin, for Home Team-authored listings) sees the
   order and follows up directly — by whatever channel they already use — to
   actually collect payment and arrange delivery.

Nothing here moves money. That's deliberate: this app's whole economic model
(Resonance Split, pon.ink, the Stripe/M-Pesa detail in `SPEC_PON_INK.md`) is
under active correction this session specifically to *stop* implying payment
flows that aren't actually wired up. Better to ship an honest order-intake
tool now than a fake "Buy now" button.

## Income split

`BOOKSTORE_SPLIT` in `resonance-split.ts`: **80% creator / 20% Home Team
maintainer support / 0% platform.** This is a **proposed default**, not a
ratified number — flagged in the file's own doc comment the same way
`SETTLEMENT_SPLIT` and `STANDARD_SPLIT` are. It intentionally reads
`community_fund` as "Home Team" in this context rather than the WATSAN/field-kit
fund `STANDARD_SPLIT` feeds elsewhere, because this page's stated purpose is
maintainer income, not field infrastructure — don't let the two funds blend
in copy or in a future payment integration.

A listing may instead be authored directly by Home Team (`is_home_team = true`
on `bookstore_items`, admin-set only — not a self-serve checkbox on the public
form) — in that case `HOME_TEAM_LISTING_SPLIT` (100% to maintainer support)
applies, since there's no separate creator to pay.

## Open questions (need a maintainer decision before this becomes real commerce)

1. **Actual payment collection.** Order requests currently resolve to "the
   creator follows up directly." That's fine for a handful of early orders,
   not a real system. Likely paths: (a) route through pon.ink once its
   Stripe/M-Pesa integration (`SPEC_PON_INK.md` §2.6) is live and can pay out
   to a creator's own account, not just SCD Hub's; (b) a much simpler interim
   step — a per-creator payment link (Stripe Payment Link, Ko-fi, etc.) stored
   on the listing itself, so "Request to order" can hand the buyer a real link
   instead of only notifying the creator.
2. **Print-on-demand / physical fulfillment.** Nothing here integrates a POD
   vendor (Lulu, Printful, etc.) for books/prints — physical fulfillment is
   entirely the creator's own arrangement today. Worth deciding whether
   Exotopia/Home Team ever operates a shared POD account creators can plug
   into, or whether this stays "creator handles their own fulfillment"
   permanently.
3. **Nonprofit compliance (UBIT).** SCD Hub is a Colorado 501(c)(3) — see the
   Terms of Service draft's own `[CONFIRM]` markers on charitable-solicitation
   registration. Ongoing commerce revenue (as opposed to a one-time donation)
   can implicate Unrelated Business Income Tax if it isn't substantially
   related to the exempt purpose, or can be run through the Home Team side as
   contractor/maintainer compensation instead of nonprofit revenue. This needs
   the same kind of jurisdiction-aware review the Terms/Privacy docs already
   flag elsewhere in this repo (`compliance/INDEX.md`) — not a decision to
   make silently in a UI PR.
4. **Admin review UI.** Approving/rejecting `bookstore_items` and updating
   `bookstore_orders.status` currently requires going into Supabase directly.
   If this gets real usage, it wants an `AdminBookstorePage.vue` alongside
   the existing `AdminVideoSuggestionsPage.vue` / `AdminSettlementProfilesPage.vue`
   pattern.
5. **Split ratification.** 80/20 is a starting proposal (see above) — needs
   Group Manager + Admin co-sign per the existing Resonance Split governance
   note in `resonance-split.ts` and `GLOSSARY.md` [31] before it's treated as
   final, especially once real money starts moving through it.

## Non-goals for v1

- No live checkout, no card capture, no automatic payout math.
- No public storefront outside the app (this isn't replacing a creator's own
  Etsy/Bandcamp/etc. — `external_url` on a listing exists precisely so a
  creator can point buyers at whatever they already use).
- No inventory/stock tracking — `quantity` on an order is informational for
  the creator, not decremented against a stock count anywhere.
