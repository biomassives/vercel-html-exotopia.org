# Run Your Own Exotopia

## A three-step, blockchain-free path to standing up an independent instance — and why we want you to

*SCD Hub · Exotopia.org · August 2026*

---

## The short version

You don't need a wallet, a blockchain, or our permission to run Exotopia. You need three
things, none of which lock you into us:

1. **Supabase** — a free project, and the migrations already sitting in
   `supabase/migrations/`.
2. **Git** — a fork or clone on whichever host you already trust: GitLab, Gitea, or GitHub.
3. **Vercel** — connect the repo, set two environment variables, deploy.

That's the whole baseline. No faucet, no chain selection screen, no seed phrase to write
down. `npm install && npx quasar dev` runs the front end with zero configuration at all —
the galaxy is static JSON, not a chain read.

---

## Why we changed this

Exotopia used to ask a new settler to connect a wallet before they could do anything —
Polygon or Celo, a browser wallet or an extension, testnet tokens from a faucet. That was
never really about the visualization or the field work; it was overhead borrowed from the
NFT-minting flow that used to sit underneath settlements. When that flow moved off-chain
onto locally-computed addresses and optional IPFS pinning, the wallet requirement stopped
making sense for anyone except the small slice of users actually touching a token. Everyone
else — the person who wants to look at exoplanets, log a water-quality reading, or run a
citizen-science cohort — was paying an onboarding tax for a feature they didn't use.

Cutting the baseline down to Supabase / Git / Vercel does two things at once: it removes
that tax, and it makes "stand up your own instance" a realistic three-step afternoon project
instead of something that assumes blockchain literacy.

---

## Refinements, once the baseline is running

The three-step stack is enough to run a full instance by itself. Past that, there's an
optional layer for anyone scaling up, hardening a public deployment, or wanting to drop
external SaaS dependencies entirely:

- **Cloudflare** in front of the deploy — CDN, DNS, and additional edge security headers.
  `vercel.json` already ships a baseline CSP and cache policy; Cloudflare sits in front of
  that rather than replacing it.
- **Redis** for caching, rate limiting, and queues — useful once an instance is serving a
  large enough community that the default Supabase-only setup starts to strain.
- **Appwrite, standalone**, as a full alternative to the Supabase + Vercel pairing — for a
  fully offline-capable home-network deployment with no external SaaS dependency at all. If
  the point of your instance is running quietly on hardware you control, this is the path.

---

## The actual pitch: independent, but not isolated

None of this is really about making deployment easier for its own sake. The point is what
it enables: instances that are genuinely independent — your data, your hardware or your
Vercel account, your moderation, your community — while still being part of the same
collaborative effort on visualization, citizen science, humanitarian engineering, and
biodiversity work that Exotopia exists for in the first place.

A home-network instance run by a local watershed group, a public instance run by a
university field-science program, and the instance you're reading this on right now should
be able to improve the same shared body of work without any of them having to merge into
one central platform to do it. That's the model we want: forkable and self-hostable by
default, not forkable-in-theory-but-nobody-actually-does-it.

We're being direct about the part that isn't solved yet: **we don't yet have a real answer
for how independent instances actually share data with each other.** "Shares data and
encourages collaborative improvements" is the goal, not a shipped protocol. The deploy path
above is real and working today. The federation layer between instances — what gets shared,
what stays local, how conflicting contributions get reconciled — is an open engineering
question, written up honestly as such in `SPEC_SELF_HOSTED_NETWORK.md` rather than
papered over here.

If you stand up an instance before that part exists, you're not stuck waiting on us: you
have a fully functional independent deployment either way. The federation layer is additive,
not a prerequisite.

---

## Related

- `SPEC_SELF_HOSTED_NETWORK.md` — the architecture writeup and open questions
- `README.md` → Developer setup — the exact commands, kept in one place rather than restated
  here
- `SPEC_COMMUNITY_NODES.md` §4 — the existing `exportForSelfHost()` data-export feature,
  the closest prior art to instance-to-instance portability
- `/docs` → *Getting Started → Run Your Own Instance* — the in-app version of the three
  steps above
