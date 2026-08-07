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

Also set `TURNSTILE_SITE_KEY` (the public counterpart) and this worker's deployed
URL in the frontend's `.env` as `VITE_TURNSTILE_SITE_KEY` / `VITE_SUPPORT_WORKER_URL`.

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
