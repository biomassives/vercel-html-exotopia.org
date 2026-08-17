# Your Browser Is the Database

## Why most of Exotopia runs on localStorage, what that buys you, and where the line to a server actually sits

*SCD Hub · Exotopia.org · August 2026*

---

## The short version

Open Exotopia in a fresh browser, place a settlement, style a mint, fill out onboarding —
and none of it touches a server. It's sitting in `localStorage`, on your device, before
you've created an account or typed a password anywhere. Sign in later, and the things
worth keeping in sync quietly upload themselves and merge with whatever's already on the
server. Stay signed out, and the app still works exactly the same — it just stays local.

That's not a fallback path for when the network is down. It's the primary design. Supabase
exists for the handful of things that genuinely need a shared, durable record — accounts,
cross-device sync, moderation — not as the place every click gets written to first.

---

## What actually lives in your browser

Look at the storage keys and it reads like a small local database, one table per key:

| Key | What it holds | File |
|---|---|---|
| `e8.1` | Settlement records — every planet, moon, orbital, and cluster world you've placed | `src/lib/settlements.ts` |
| `e8.3` | Placed decorative items, and your recent-locations list | `src/stores/staged-entries.ts`, `src/composables/useRecentLocations.ts` |
| `exo_mint_styles` | Saved mint styling presets | `src/stores/mint-style.ts` |
| `scd_guest_profile` | Onboarding progress and role/community selection before you have an account | `src/composables/useGuestProfile.ts` |
| `scd_blocked_members` | Your block list | `src/stores/member.ts` |

This is the same `blocked_members` table the app queries at
`127.0.0.1:54321/rest/v1/blocked_members` in local dev — but that Supabase call only ever
fires *after* `scd_blocked_members` has already been read from localStorage and rendered.
The server copy is a mirror, not the source you're waiting on.

Each of these follows the same shape: a module-level reactive `ref`, loaded synchronously
from `localStorage` at import time, written back on every change. No loading spinner, no
network round-trip, no empty state while a fetch resolves — the data is just there the
instant the page runs.

---

## The sync pattern, once you sign in

`settlements.ts` and `member.ts`'s block list both implement the same merge strategy, and
it's worth naming because it's not the obvious one:

1. **localStorage is always the source of truth for reads.** Every page load renders
   straight from it — signed in or not.
2. **Writes are fire-and-forget.** `addSettlement()`, `updateSettlement()`,
   `removeSettlement()` stay synchronous for the caller; if you're signed in, they also
   kick off an unawaited `supabase.upsert(...)` in the background. The UI never blocks on
   the network.
3. **Sign-in triggers a one-time merge**, not a wholesale replace. `loadMySettlements()`
   pulls every server row for your account, treats server data as authoritative for keys
   that exist on both sides, and pushes up whatever was local-only — settlements you
   created anonymously, or on a browser that later logged in. The block list does the
   union version of the same idea: server IDs and local IDs get combined rather than one
   side winning outright.

The effect: a settlement placed before you ever created an account survives signing up.
The same browser, cleared and revisited signed out, starts from empty again — that's the
trade you're making by staying anonymous, and it's an explicit one, not a bug.

---

## Two different kinds of "encrypted," on purpose

There are two separate cipher implementations in the codebase, and conflating them would
be dishonest, so they don't share code:

- **`storage-cipher.ts`** obfuscates what sits in `localStorage` day to day — an XOR stream
  keyed off the 240 roots of the E8 lattice. Its own header comment says plainly what it
  is: *"not a cryptographic primitive — the key is in the source."* It stops a browser
  extension or a curious glance at DevTools from reading your settlement list as plain
  JSON. It does not stop anyone who can read the client bundle.
- **`encrypted-backup.ts`** is real, standard AES-256-GCM with a PBKDF2-derived key (250k
  iterations, the OWASP 2023 floor) — used only when you explicitly export a backup file
  with a passphrase. That passphrase is never stored anywhere, including by us, which is
  what makes it an honest claim of "unreadable without the passphrase" rather than
  security theater.

Two different threat models, two different tools, and the code says so instead of letting
one implementation imply more than it delivers.

---

## Why bother, instead of just using Supabase everywhere

A few reasons, stacked:

- **Nothing gates the first click.** Placing a settlement, exploring the galaxy,
  configuring a mint style — all of it works before an account exists, because none of it
  is waiting on one.
- **It works offline**, or on a flaky connection, because reads and writes never leave the
  device unless you've opted into an account.
- **Signing out doesn't strand you.** Local data isn't a cache of server data that
  evaporates without a session — it's the primary copy, and the server is the thing that's
  optional.
- **It matches the self-hosting story.** [Run Your Own Exotopia](/blog/self-hosted-exotopia)
  already frames Supabase as one piece of an intentionally minimal, swappable stack. A
  design where the client can't function without that piece would undercut the pitch.

---

## Where this genuinely falls short

Worth being direct about, rather than leaving implicit:

- **No cross-device sync until you sign in.** A settlement placed on your phone, signed
  out, does not show up on your laptop. That's the anonymous-use trade-off from above,
  stated again because it surprises people.
- **`localStorage` has a quota** (commonly ~5–10MB per origin, browser-dependent), and a
  write past it silently no-ops (`catch { /* quota */ }` throughout the codebase) rather
  than erroring loudly. Nobody's hit it yet with the current data shapes, but it's a real
  ceiling, not a hypothetical one.
- **Clearing site data is destructive**, same as it would be for any local-first app —
  there's no undo for an anonymous user who clears their browser. `encrypted-backup.ts`'s
  export flow exists specifically as the answer to that, but it's opt-in, not automatic.
- **The obfuscation cipher is exactly as strong as its own comment says it is** — worth
  repeating so nobody mistakes it for the AES-GCM backup path's guarantees.

None of these are hidden — they're the direct, visible cost of the trade this architecture
makes, in exchange for an app that works instantly, offline, and without an account wall.
If you're building against this codebase, or forking it for your own instance, that's the
shape to design new features around: local first, server as sync, not the other way round.
