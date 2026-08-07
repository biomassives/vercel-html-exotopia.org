# exotopia-support-inbox

Cloudflare Worker behind the site's contact form (`src/pages/SiteContactPage.vue`).

Receives a message + Turnstile token, validates it, rate-limits by IP, writes it
into Supabase `support_messages` using the service-role key (the browser never
sees that key), and sends the submitter an auto-reply via Resend with `reply_to`
set to a real monitored inbox. Bug reports also trigger an immediate admin alert.

## Setup

```
npm install
wrangler kv namespace create RATE_LIMIT_KV   # paste the id into wrangler.toml
wrangler secret put SUPABASE_URL
wrangler secret put SUPABASE_SERVICE_ROLE_KEY
wrangler secret put RESEND_API_KEY
wrangler secret put RESEND_FROM_EMAIL        # e.g. "Exotopia Support <support@exotopia.org>"
wrangler secret put SUPPORT_REPLY_TO         # e.g. support@exotopia.org
wrangler secret put TURNSTILE_SECRET_KEY
wrangler secret put ADMIN_ALERT_EMAIL
```

Also set the Turnstile *site* key (the public counterpart of the secret above)
and this worker's deployed URL in the frontend's `.env` as
`VITE_TURNSTILE_SITE_KEY` / `VITE_SUPPORT_WORKER_URL`.

## Testing (dummy Turnstile keys)

Don't point local dev or CI at a real Turnstile site — automated browsers
(Playwright, Cypress, Selenium) get flagged as bots and the challenge blocks
the run. Use Cloudflare's documented test key pairs instead, which return
predictable results with no real challenge:

Copy `.dev.vars.example` to `.dev.vars` (gitignored) — it already defaults
`TURNSTILE_SECRET_KEY` to the "always passes" test secret
(`1x0000000000000000000000000000000AA`). Pair it with the matching test
sitekey `1x00000000000000000000AA` as `VITE_TURNSTILE_SITE_KEY` in the
frontend's `.env` for the same "always passes" flow end-to-end. Swap in the
`2x...` variants to exercise the form's error-handling path instead. See
`.dev.vars.example` and the root `.env.example` for the full key table.

## Dev

```
npm run dev
```

## Deploy

```
npm run deploy
```

Deploys to the worker's `*.workers.dev` subdomain by default (the site's DNS
isn't on Cloudflare yet — see SPEC_SELF_HOSTED_NETWORK.md). The frontend calls
it cross-origin; `ALLOWED_ORIGIN` in `wrangler.toml` must match the site's
production origin(s) exactly or requests are rejected.
