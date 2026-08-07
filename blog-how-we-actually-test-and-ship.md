# How We Actually Test and Ship Exotopia

## Playwright, Vite, Vercel, Cloudflare, Supabase-local, localStorage — and what "E8" in your browser really is

*SCD Hub · Exotopia.org · August 2026*

---

We just finished a testing pass on a batch of new settlement features — a real
financial-literacy ledger, cross-device persistence, a public directory, a
bug/feature/security reporting flow. Rather than just report "it works,"
this is a walkthrough of the actual pipeline that let us verify it did,
tool by tool, with the real bugs it caught along the way. It's also the
right place to clear something up: this project's data layer uses a
localStorage key prefix called `e8`, and a separate, already-published post
on this blog describes a genuinely serious cryptographic system built on the
real E8 lattice. Those are not the same thing, and conflating them would be
exactly the kind of overclaiming we've spent the last several weeks cleaning
out of our own legal and product copy. So: here's what's real, what's
aspirational, and where the line actually is.

---

## The stack, as it's actually wired together

**Vite + Quasar, on localhost.** `quasar dev` runs a Vite dev server with hot
module replacement — edit a `.vue` file, see the change in the browser in
under a second, no full reload. This is the loop we live in for basically
all UI work.

**Supabase, twice — local and remote.** `npx supabase start` boots a full
local Postgres + PostgREST + GoTrue (auth) + Studio stack in Docker,
completely separate from the hosted project. `.env.local` (gitignored)
overrides `.env` to point the dev server at `127.0.0.1:54321` instead of
production — a one-line file that's the difference between testing against
a throwaway database and testing against the real one. Every schema change
lives as a numbered file in `supabase/migrations/`, applied to both
environments from the same source; the local stack is disposable, the
migration history is not.

One real lesson from this project specifically: a fresh local Supabase
clone doesn't automatically get the same `anon`/`authenticated` table
permissions a hosted project provisions for you — that's platform-level
bootstrapping invisible in the migration files. If a table 401s locally even
though its row-level security policy clearly should allow the read, that's
usually the actual cause, not a policy bug.

**Vercel, for production.** Static build output and serverless
routing, driven by `vercel.json` — cache headers on the big static JSON
astronomy datasets, a Content-Security-Policy, URL rewrites. We don't
deploy from `localhost`; Vercel builds from what's pushed to `main`.

**Git and GitHub, as the actual source of truth.** GitLab exists as a
mirror — either GitHub Actions pushing on every commit, or GitLab's own
pull-mirror polling every few minutes. This week's testing pass caught that
mirror completely broken: it had failed every single run since the day it
was set up, silently, because the repo secrets it needed were never
actually filled in. Nobody noticed for weeks because a failing background
Action makes no noise unless someone goes looking. The fix was two lines of
config and a checklist for finishing the GitLab-side setup — but the
lesson is really about observability, not GitLab: a sync mechanism that can
fail silently, will, eventually.

**Cloudflare, for the domain.** DNS, and now Email Routing once we cleared
out some leftover MX records a previous setup attempt left behind (the
usual suspect: a registrar's default placeholder forwarding service,
`eforward*.registrar-servers.com`, quietly still claiming the mail slot).
Also where we just turned on GitHub's private vulnerability reporting and
locked `/admin*` behind a real access check — both small, both the kind of
thing that's free to do and easy to forget.

---

## Playwright: driving the actual app, not mocking it

Everything above gets you a running app. Playwright is how we actually
*use* it the way a person would — click, type, wait, screenshot, read the
console — headless, from a script, repeatably.

A few things this week's pass specifically relied on:

**Simulating sign-in without sending real email.** Exotopia's auth is
Supabase magic-link — there's no password to type. To test anything behind
a sign-in wall without waiting on a real email round-trip, we mint a JWT by
hand, signed with the *local* Supabase stack's own JWT secret (a fixed,
publicly-documented default for local dev — `npx supabase status` prints
it), matching the shape GoTrue expects, and drop it straight into
`localStorage` under the key the Supabase client already looks for. Reload,
and the app believes you're signed in as a real seeded test account. This
works *only* because the local stack's JWT secret is a known, shared
default — it is not a technique that could ever work against the real,
deployed Supabase project, which has its own private key. It's a local-dev
testing shortcut, not a security shortcut.

**Screenshots as the actual assertion.** A lot of this app is a live WebGL
scene — Three.js cameras, dissolve transitions, a settlement dome. You
can't `expect(x).toBe(y)` your way to confidence that a scene renders
correctly; you take a screenshot and look at it. Several real bugs this
session only showed up that way — including the original one that kicked
off this whole round of work, where a settlement's exterior view was being
swallowed by leftover galaxy geometry from whatever planet you'd visited
three clicks earlier. No console error, no failed assertion — just a wrong
picture.

**A routing-mode mistake, caught by "nothing changed."** Early in this
pass, a batch of `#/surface/...`-style test URLs kept landing on the
homepage instead of the page they named. Not an error — just silently the
wrong page, because this app uses HTML5 history-mode routing, not hash
routing, and a `#` fragment on a history-mode app is just... a fragment,
ignored. The fix was realizing the *original* bug screenshot (the one that
started this whole thread) used a plain path with no `#` at all — the tell
was there from the start.

**And a reminder that the test harness has its own bugs.** Partway through
this pass, an authenticated flow that had worked cleanly minutes earlier
started failing every request with "Empty JWT is sent in Authorization
header." Not a bug in the app — a shell variable set in one command doesn't
persist into the next one when each command runs as its own process.
Testing infrastructure needs the same skepticism as the thing it's testing.

---

## localStorage, and what "E8" actually means in this codebase

Settlements and their items live client-side first: a `SettlementRecord`
array under one localStorage key, an item list per settlement under
another, both run through a light XOR-based obfuscation
(`src/lib/storage-cipher.ts`) before they touch disk. The storage keys are
named `e8.1` and `e8.2`. The code comments say, plainly: *opaque — was
`exotopia_settlements_v1`*.

That's the whole story. `e8` here is a codename, not a claim. It is **not**
the mathematical E8 lattice, does **not** involve zero-knowledge proofs,
and the "cipher" is explicitly documented in its own source file as
obfuscation, not real encryption — good enough to keep a location name from
sitting in plaintext in devtools, not good enough to be called security.

That name isn't an accident, though — it's a nod to a much bigger, much
more real piece of mathematics this project has genuinely written up
elsewhere: a [separate post on this blog](https://exotopia.org/blog/e8-art-hash-zkp)
lays out, correctly and in real technical detail, how the actual E8 root
system (240 points, discovered by Killing in the 1880s, the largest
exceptional Lie group) and its 24-dimensional cousin the Leech lattice
(the densest possible sphere-packing in 24D, per Viazovska's Fields
Medal–winning 2016 proof) could underpin a zero-knowledge proof system for
verifying field citizen-science contributions without a trusted server in
the loop. The math in that post is accurate. But — and the post says this
itself, if you read past the framing — none of it is built yet. It's a
specification. The `zk-e8` halo2 crate, the WASM verifier, the Algorand
anchoring: all future work, clearly listed as such under "What We Are
Building and What We Need." Worth a look if you want to see how those
pieces are meant to fit together eventually.

So: two different things share a codename. One is a small, currently-live,
honestly-labeled convenience function protecting nothing more sensitive
than a claimed exoplanet address. The other is a real, serious, unbuilt
cryptographic design for a much harder problem. Neither is "24-dimensional
storage for multiversal projects" today — that phrase is closer to the
game's own narrative flavor (a "Parallel-Universe Settlement Beacon" reward
object, an "E8 Wormhole Conduit" easter egg in the dark-matter view) than
to any actual data structure. The lattice math behind that flavor is real.
The storage isn't 24-dimensional. It's a JSON array behind an XOR cipher,
and it's better for everyone if we keep saying so.

---

## What today's pass actually confirmed

- A signed-in member's settlement and its items now genuinely survive a
  cleared cache — tested by creating one, then loading the same account in
  a browser context with zero local data and watching it come back.
- Constructing an item now debits a real, server-checked cost against a
  real points ledger, and is allowed to go negative on purpose — confirmed
  with an actual negative balance rendering the "in debt" state and a link
  to the quiz that earns it back.
- Publishing a settlement makes it appear in the new public directory
  within the same test run, filtered correctly by focus category.
- The bug/feature/security reporting modal opens the right template on the
  right platform, and the security path never offers a public option.
- The original galaxy-sky leak does not recur across repeated navigation.
- The report modal and settlement directory both hold up at a 390px mobile
  viewport with no layout breakage.

Everything above was checked by driving the real running app, not by
inspecting the code and assuming it works. That's the actual point of all
of this tooling — not novelty, just the ability to be sure.
