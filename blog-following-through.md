# Following Through

## A press release promised a working zero-knowledge payment system for our Kenya field partners. It doesn't exist yet. Here's what we actually shipped instead, and what changes about how we talk about this platform going forward.

*SCD Hub / Exotopia.org — July 2026*

---

In June, we put out a press release for the Mpeketoni Eco Ops Group in Lamu County — Muirithi Jariffe's team, who do real coastal plastics collection and water monitoring work. It described a zero-knowledge proof system built on the E8 root lattice that verifies field work offline, on a phone, with no internet connection, and triggers an M-Pesa payout the moment connectivity returns — no personal data, no GPS coordinates, no phone number ever touching a server.

That system does not exist. There is no `zk-e8` implementation anywhere in this codebase, and no M-Pesa integration outside of documentation and specs. It was real, well-considered design work — the kind of thing this platform should eventually build for exactly the reasons the release described, field workers in politically sensitive contexts have legitimate reasons not to trust where their data goes — but it was written and published as if it were running, and it wasn't.

We found this out the plain way: by going back to check what a specific pilot group could actually use, and reading our own code instead of our own copy. Separately, the Platform page had been telling visitors for weeks that finishing a personal-finance quiz would unlock a settlement reward, before any quiz, ledger, or unlock mechanism existed to make that true.

Two different claims, same underlying failure: describing the target as if it were the current state.

## What we actually built

We're not shipping the ZK-proof payment system this pass — that's a real project, not a quick fix, and it deserves to be built once, correctly, not rushed out to cover for the release. What we did build is smaller and considerably more honest about what it is.

**A rewards ledger.** Three things this platform had been promising without any backing store — finance-literacy education, volunteering, and educating others — now write into one shared points-and-certificate system in Supabase. It's a plain append-only ledger, not a cryptographic proof of anything. No payments move through it. If you complete the P-Fin 8 quiz (eight original questions covering the same areas TIAA Institute–GFLEC's real personal-finance framework does — earning, saving, investing, borrowing, insuring, and so on, but ours, not theirs), you get a certificate and a settlement-object unlock, for real now, at `/rewards`. Master the full 28-question version and you get a bigger one.

**Volunteer logging that fits real field work.** The plastics-collection tally the Mpeketoni group actually needs — kilograms, site, date — logs into the same ledger. No GPS, no photo verification, no automated payout. Someone types in what they collected; it's recorded; it counts.

**Mentor credit that can't be faked solo.** Educating someone else is worth crediting too, and it's the one place in this system where the trust model is actually enforced server-side rather than just taken on faith — both the mentor and the mentee have to independently confirm a session happened before either one gets points, and a database trigger — not client code — is what actually issues them, so a single person can't just award themselves both sides of a mentorship.

| What the release said | What's actually running |
|---|---|
| ZK proof verifies field work offline | Nothing verifies anything — entries are self-reported, same trust level as everything else on this platform today |
| M-Pesa payout triggered automatically | No payment integration exists; any real payout is handled manually, outside the app |
| No personal data ever touches a server | True of the current system too — it just doesn't have the field-proof capability the release described in the first place |

## Also this pass: void navigation

Unrelated to any of the above, but shipped in the same stretch of work — three pages for navigating cosmic voids (`/cluster-interior/local-void`, `/void/:voidId`, `/void-galaxy/:voidId/:gid`) had no bottom navigation at all, unlike every other scene on the site. They have one now: a list of the real named objects in a void, and a 360° "edge ring" view of the galaxies sitting on the void's boundary wall — the near wall of the Local Void, for instance, is where NGC 6503, IC 342, and the Fireworks Galaxy actually sit. Building it surfaced a real camera bug (a fixed zoom offset tuned for tight galaxy clusters, that put you nowhere near anything when applied to a void 130 megaparsecs across) and a real data gap: the Local Void's own galaxy catalog hasn't been fetched yet, because the fetch script's first real run had no network access to NASA/IPAC's NED archive. Right now that view shows procedurally generated placeholder galaxies, not the real ones. It's labeled as such, and the fix is one command once someone runs it with a working connection — but it's not done, and we're saying so here instead of waiting for someone to notice.

## What changes

Nothing about this platform's ambitions gets smaller. The ZK-proof field-verification system is still worth building — probably more worth building now that we've had to write this post. What changes is sequencing: a public claim about this platform, in a press release, in app copy, in a spec document, should describe what's running in production, not what a design doc describes as the target. Where something is aspirational, that has to be in the same sentence, not a caveat three paragraphs later that nobody reads.

`SPEC.md` — the platform's living technical spec — got the same treatment this pass: its MVP status table was checked line by line against the actual codebase, corrected in both directions (a couple of things marked "still to build" already existed), and a new closing section makes this same commitment in writing, as something to be held to, not just this post.

If you're one of the people this affects most directly — Muirithi's group, or anyone else counting on a specific claim we made — and you want a straight answer on where something actually stands, ask. That's a better outcome than finding out from a blog post.
