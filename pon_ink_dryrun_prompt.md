# Claude Code Prompt — pon.ink Dry Run Event: Glipish DJ & _am_lunchmeat
*Working directory: `/home/solstice/Desktop/art/pon.ink`*
*Target date: May 2026 event (dry run before)*

---

## Context you need before starting

pon.ink is the production portal for SCD Hub — an open infrastructure network for sound,
environment, health, and economic access. It currently serves communities in Nairobi and
East Africa, with three archetypes: Ghetto Youth (music), Educator in Exile, and Community
Builder (eco ops). The technology stack is Vue 3 / Quasar / Pinia / TypeScript / Supabase
(Postgres + Edge Functions / Deno). Supabase Edge Functions are in `/supabase/functions/`.
There are no Vercel server functions yet — this is a pure SPA deployed on Vercel with
Supabase as the backend.

We are onboarding two local USA artists as the first North American participants:

- **Glipish DJ** — DJ and music producer. Handle: `glipish`. Role: `dj`. He will contribute
  music content (sound lab sessions, $BARS NFTs) and co-host the event as its sonic anchor.
  
- **_am_lunchmeat** — Visual artist. Handle: `am_lunchmeat`. Role: `visual_artist`. Creates
  new paintings that interpret contemporary life — work that inspires rhyme, invites reflection
  on what it means to survive creatively right now. His paintings will anchor the visual 
  identity of the event bundle.

Admin (acmeideal@gmail.com) will send login invitations to both artists. They need to be
able to log into pon.ink, see a personalized "Event Prep" space, configure their Robot Mule
corpus, and preview their airdrop bundle before the real event fires. Everything runs in
**dry run mode** — no real minting, no real payments, but the full interface is live and
the data is real.

The event is a **Band / Collective** type campaign featuring:
- Glipish DJ sound content (Sound Lab $BARS)
- _am_lunchmeat visual art (generative art anchored by his paintings)
- A shared Exotopia property (the event settlement)
- POAP tokens issued on attendance
- Lesson domain: `cultural_preservation` — "Painting what you can't say out loud."

---

## What to build — in this exact order

---

### 1. Supabase schema (SQL migration file)

Create `/supabase/migrations/20260419_dryrun_event.sql` with:

```sql
-- Artist profiles (extends Supabase auth.users)
create table if not exists public.artist_profiles (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid references auth.users(id) on delete cascade,
  handle          text unique not null,          -- 'glipish', 'am_lunchmeat'
  display_name    text not null,
  role            text not null,                 -- 'dj', 'visual_artist', 'producer', 'eco_ops'
  group_tag       text,                          -- 'OT Kulcha', 'Fana Ka', 'SCD Hub USA', etc.
  bio             text,
  portfolio_url   text,
  exo_planet_id   text,                          -- assigned after first login
  sphere_id       text,                          -- e.g. 'EXO-SPHERE-GLIPISH-01'
  status          text not null default 'invited', -- 'invited' | 'active' | 'dry_run_ready'
  is_dry_run      boolean not null default true,
  invited_at      timestamptz default now(),
  activated_at    timestamptz,
  created_by      uuid references auth.users(id)
);

-- Events (dry run + live)
create table if not exists public.events (
  id              uuid primary key default gen_random_uuid(),
  slug            text unique not null,           -- 'glipish-lunchmeat-dryrun-01'
  name            text not null,
  tagline         text,
  description     text,
  group_type      text not null default 'band',
  lesson_domain   text not null default 'cultural_preservation',
  event_date      timestamptz,
  status          text not null default 'draft',  -- 'draft' | 'dry_run' | 'live' | 'complete'
  exo_planet_id   text,                           -- shared settlement planet
  hostname        text,
  poap_claim_code text,
  bundle_preview  jsonb,                          -- snapshot of the airdrop bundle
  created_by      uuid references auth.users(id),
  created_at      timestamptz default now()
);

-- Event participants (many artists per event)
create table if not exists public.event_participants (
  id              uuid primary key default gen_random_uuid(),
  event_id        uuid references public.events(id) on delete cascade,
  artist_id       uuid references public.artist_profiles(id) on delete cascade,
  role_in_event   text,                           -- 'headliner', 'visual', 'co-host'
  dry_run_token   text unique,                    -- single-use invite token in email
  accepted_at     timestamptz,
  unique(event_id, artist_id)
);

-- Corpus items (what the Robot Mule knows about an artist)
create table if not exists public.mule_corpus (
  id              uuid primary key default gen_random_uuid(),
  artist_id       uuid references public.artist_profiles(id) on delete cascade,
  type            text not null,                  -- 'audio_nft' | 'art_nft' | 'bio_note' | 'settlement_note'
  title           text not null,
  body            text,
  asset_url       text,
  is_dry_run      boolean not null default true,
  created_at      timestamptz default now()
);

-- RLS policies
alter table public.artist_profiles    enable row level security;
alter table public.events             enable row level security;
alter table public.event_participants enable row level security;
alter table public.mule_corpus        enable row level security;

-- Artists can read their own profile; admin can read all
create policy "artist_read_own"   on public.artist_profiles for select using (auth.uid() = user_id);
create policy "admin_read_all_ap" on public.artist_profiles for all    using (auth.jwt() ->> 'email' = 'acmeideal@gmail.com');
create policy "artist_read_event" on public.events           for select using (
  id in (select event_id from public.event_participants where artist_id in (
    select id from public.artist_profiles where user_id = auth.uid()
  ))
);
create policy "admin_read_all_ev" on public.events           for all    using (auth.jwt() ->> 'email' = 'acmeideal@gmail.com');
create policy "corpus_own"        on public.mule_corpus      for all    using (
  artist_id in (select id from public.artist_profiles where user_id = auth.uid())
);
create policy "admin_corpus"      on public.mule_corpus      for all    using (auth.jwt() ->> 'email' = 'acmeideal@gmail.com');
```

Seed the dry run event and both artist profiles with INSERT statements at the bottom of
the migration. Use deterministic UUIDs via `'00000000-0000-0000-0000-000000000001'` style
for the seed records so they are stable across re-runs. Seed:
- Event: slug `'glipish-lunchmeat-dryrun-01'`, name `'Paint What You Can't Say Out Loud'`,
  status `'dry_run'`, lesson_domain `'cultural_preservation'`, exo_planet_id `'Kepler-452 b'`,
  hostname `'Kepler-452'`
- Artist: handle `'glipish'`, display_name `'Glipish DJ'`, role `'dj'`, group_tag `'SCD Hub USA'`,
  sphere_id `'EXO-SPHERE-GLIPISH-01'`, exo_planet_id `'Kepler-452 b'`, status `'invited'`
- Artist: handle `'am_lunchmeat'`, display_name `'_am_lunchmeat'`, role `'visual_artist'`,
  group_tag `'SCD Hub USA'`, sphere_id `'EXO-SPHERE-LUNCHMEAT-01'`,
  exo_planet_id `'Kepler-22 b'`, status `'invited'`

---

### 2. Supabase Edge Function — `invite-artist`

Create `/supabase/functions/invite-artist/index.ts`:

This function is called by admin only. It:
1. Validates that the caller is `acmeideal@gmail.com` (check `Authorization` header JWT)
2. Creates a Supabase auth invite for the artist's email via
   `supabase.auth.admin.inviteUserByEmail(email, { data: { handle, role, event_slug } })`
3. Writes a `dry_run_token` to the `event_participants` row for that artist
4. Calls the `messaging-hub` function to send a custom onboarding email

Request body:
```json
{
  "artist_email": "...",
  "artist_handle": "glipish",
  "event_slug": "glipish-lunchmeat-dryrun-01",
  "role_in_event": "headliner"
}
```

Response: `{ "status": "invited", "handle": "glipish", "dry_run_token": "..." }`

Handle errors: duplicate handle (409), non-admin caller (403), missing fields (400).

---

### 3. Supabase Edge Function — update `messaging-hub`

Rewrite `/supabase/functions/messaging-hub/index.ts` to handle three message types:

**Type A: `artist_invite`** (new)
- Uses Mailgun to send a styled plain-text email to a USA address
- Subject: `"You're invited to prep your space on pon.ink — [Event Name]"`
- Body template:
  ```
  Hey [display_name],

  You've been invited to prep your creative space on pon.ink before the event
  "[Event Name]".

  This is a dry run — nothing goes live until you and the team are ready.
  Your role: [role_in_event]
  Your planet: [exo_planet_id]

  Set up your space → https://pon.ink/event-prep/[dry_run_token]

  Questions? Reply to this email.

  — Greg / SCD Hub
  ```
- All fields injected from the `artist_invite` payload; no hardcoded names.

**Type B: `sms_alert`** (existing stub — now implemented)
- Routes +254 numbers to Africa's Talking
- Routes +1 (USA) numbers to Twilio
- Routes everything else to Twilio as fallback

**Type C: `receipt`** (existing stub — now implemented)
- Sends Mailgun email receipt after a payment event
- Include `order_id`, `amount`, `currency`, `item_label`, `recipient_email`

All three types share a single Deno serve handler with a `switch(type)` block. Use
environment variables for all API keys: `MAILGUN_API_KEY`, `MAILGUN_DOMAIN`,
`AT_API_KEY`, `AT_USERNAME`, `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM`.
Log every dispatch attempt with `[messaging-hub] type=artist_invite to=...` format.

---

### 4. New Vue page — `EventPrep.vue`

Create `/src/pages/EventPrep.vue`. Route: `/event-prep/:token`

This is the landing page an artist sees after clicking their invite link. The `token` param
is the `dry_run_token` from `event_participants`.

**On mount:**
- Query Supabase: `select * from event_participants where dry_run_token = :token`
  join `artist_profiles` and `events`
- If token not found or already used: show "This invite link has expired or been used."
- If found and `accepted_at` is null: show the prep interface (see below)
- If found and `accepted_at` is set: redirect to `/event-prep/dashboard/:artist_handle`

**Prep interface sections (all in one scroll):**

**A. Event banner** — dark card showing:
- `DRY RUN — [Event Name]` in monospace with a pulsing amber badge `● DRY RUN`
- Event tagline: "Paint What You Can't Say Out Loud"
- Their role: "Your role: [role_in_event]"
- Planet assignment: "Your settlement: [exo_planet_id]" with a link to
  `exotopia.org/surface/[hostname]/[planet]` (opens in new tab)
- "View on Exotopia →" button

**B. Robot Mule setup** — corpus builder:
- Display Mule tier (Foal by default)
- "Tell your Mule who you are" — two fields:
  - Bio note (textarea, 280 char, label: "A line about your work")
  - One corpus item upload: title + body text (for dry run — no file upload yet)
- Submit button: writes to `mule_corpus` table, increments corpus depth display
- After submit: show mule greeting dynamically: "I know [N] things about you now."

**C. Bundle preview** — read-only display of what will be in the airdrop:
- List the bundle_preview JSON from the events table
- If artist is `dj` role: show Sound Lab chip + $BARS chip + POAP chip
- If artist is `visual_artist` role: show Art NFT chip + POAP chip + Exolocation chip
- "Bundle is locked for dry run — changes before go-live" note

**D. Confirm & activate button**:
- Label: "I'm ready — activate my dry run profile"
- On click: UPDATE `event_participants` SET `accepted_at = now()` for this token
  UPDATE `artist_profiles` SET `status = 'dry_run_ready'` for this artist
- Then redirect to `/event-prep/dashboard/:handle`

Use the same dark aesthetic as the rest of pon.ink (bg-black, font-mono, minimal borders).
Include a `DRY RUN` amber pill in the top-right corner of every section.

---

### 5. New Vue page — `EventPrepDashboard.vue`

Create `/src/pages/EventPrepDashboard.vue`. Route: `/event-prep/dashboard/:handle`

Requires auth (Supabase session). If not logged in, redirect to Supabase magic link login
(call `supabase.auth.signInWithOtp({ email })` — show email input dialog first).

**Sections:**

**A. Status bar** — shows:
- Artist handle + display name
- `DRY RUN ACTIVE` badge
- Event name + countdown: "Event in X days" (compute from `event_date`)
- Exotopia settlement link

**B. My corpus** — lists `mule_corpus` items for this artist:
- Table: type | title | preview (truncated body)
- Add new item button (same form as EventPrep section B)
- Total count + Mule tier indicator

**C. Co-artists** — shows the other participants in this event:
- List `event_participants` for same event, join `artist_profiles`
- Show handle, role, status (invited / dry_run_ready)
- "Waiting for [handle] to accept invite" if not yet activated

**D. Event bundle preview** — same as EventPrep section C

**E. Admin actions** (only if current user email === `acmeideal@gmail.com`):
- "Resend invite" button for each participant not yet activated
  (calls `invite-artist` Edge Function with same payload)
- "Mark event live" button (updates event status to `'live'` — with confirm dialog)

---

### 6. Update router

In `/src/router/routes.ts`, add inside the layout children array:

```ts
{
  path: 'event-prep/:token',
  component: () => import('pages/EventPrep.vue'),
  meta: { objective: 'Artist dry run onboarding — event prep space.' }
},
{
  path: 'event-prep/dashboard/:handle',
  component: () => import('pages/EventPrepDashboard.vue'),
  meta: { objective: 'Artist dashboard for event preparation.' }
},
```

---

### 7. Update messaging in `Nairobi.vue`

In the `archetypes` array, add a fourth archetype:

```ts
{
  id: 'usa_artist',
  label: 'USA Artist / Creator',
  icon: 'palette',
  hex: '#ff6090',
  desc: 'Painters, DJs, producers — your work connects the local and the cosmic. pon.ink gives your creative output a permanent address and a community that builds with you.',
  tags: ['$BARS', 'Art NFT', 'Exotopia', 'POAP'],
},
```

Update the `phases[2]` (Voice) `items` list to include:
`'Attach your paintings to a 40-acre exoplanet property'`

Update `ecoNodes` to add:
```ts
{ label: 'USA Artist Node',  status: 'pending', value: 'Onboarding' },
```

---

### 8. Update messaging in `IndexPage.vue`

In the `nodes` array, find the `'Exotopia'` node and update its `details` array to include:
`'USA artists: connect your music and paintings to the cosmos'`

Update the `'Airdrop'` node `desc` to:
`'Build group campaigns that combine music, paintings, eco data, and virtual land into one drop. Nairobi to New York.'`

In the header tagline (line 44), update to:
```html
<h2 class="text-h3 text-weight-bold q-mt-none line-height-tight">
  Built for those building<br>
  <span class="text-italic font-serif text-weight-light">from the margins.</span>
  <span class="text-italic font-serif text-weight-light text-grey-7"> Everywhere.</span>
</h2>
```

---

### 9. Update `AirdropBuilder.vue` — seed data and dry run mode

In `AirdropBuilder.vue`, add a `isDryRun` prop (default `false`) and a `eventSlug` prop.
When `isDryRun` is true:
- Show a amber `● DRY RUN` badge in the step rail
- Replace the "Submit for review" button (step 4) with "Save dry run bundle"
- Disable the "Request assisted launch" CTA block (replace with "Admin review pending")

Pre-populate `narrative` ref with dry run defaults when `isDryRun`:
```ts
narrative.value = {
  lesson_domain: 'cultural_preservation',
  title: "Paint what you can't say out loud.",
  body: '',
  call_to_action: 'Come to the settlement. Bring what you made.',
}
```

Pre-select `selectedGroup` with `'band'` when `isDryRun`.

Add a new route in `routes.ts`:
```ts
{
  path: 'airdrop/dryrun/:eventSlug',
  component: () => import('pages/AirdropBuilder.vue'),
  props: route => ({ isDryRun: true, eventSlug: route.params.eventSlug }),
  meta: { objective: 'Dry run airdrop builder for event prep.' }
},
```

---

### 10. Update `ExoProperty.vue` — dry run banner and artist binding

At the top of the template (inside `.exo-inner`, before the breadcrumb), add:

```html
<div v-if="isDryRun" class="dryrun-banner font-mono q-mb-lg row items-center q-gutter-sm">
  <span class="dryrun-dot" />
  <span class="text-caption text-warning">DRY RUN — this property is reserved for the upcoming event.</span>
  <q-space />
  <span class="text-caption text-grey-8 font-mono">{{ property.name }}</span>
</div>
```

Add `isDryRun` computed as `property.is_dry_run ?? false`.

Add CSS:
```css
.dryrun-banner { border: 1px solid #3a2a00; background: #1a1000; padding: 8px 16px; }
.dryrun-dot { width: 6px; height: 6px; border-radius: 50%; background: #ffa726;
              animation: pulse-amber 1.6s infinite; flex-shrink: 0; }
@keyframes pulse-amber {
  0%, 100% { opacity: 1; } 50% { opacity: 0.3; }
}
```

Update the mock property `robot_mule.corpus_types` to include `'bio_note'` for future
corpus integration.

---

## Success criteria

The implementation is complete when:

1. `supabase/migrations/20260419_dryrun_event.sql` runs without error and seeds the
   event + both artist profiles
2. `supabase/functions/invite-artist/index.ts` can be invoked with a test payload and
   returns `{ status: "invited" }` without runtime errors (actual email send is
   environment-dependent)
3. `supabase/functions/messaging-hub/index.ts` handles all three type branches without
   throwing; the `artist_invite` branch builds the correct email body
4. `/event-prep/:token` renders the prep interface with DRY RUN badge, corpus form,
   bundle preview, and activation button
5. `/event-prep/dashboard/:handle` renders the dashboard (with mock/seed data for
   Glipish and _am_lunchmeat) when accessed with a valid session
6. `npx tsc --noEmit` passes with no new errors introduced by this work
7. The `Nairobi.vue` archetype grid shows four cards including USA Artist
8. The `IndexPage.vue` Airdrop node description includes "Nairobi to New York"

---

## Design constraints (non-negotiable)

- **No hardcoded artist names in logic.** All artist-specific data (handles, display names,
  planet assignments) lives in Supabase seed rows, not in component logic. Components query
  by `handle` or `user_id`, never by string comparison to `'glipish'`.
- **Dry run ≠ fake.** The data written during dry run (corpus items, event participant
  records, mule updates) is real Supabase data. Only the airdrop dispatch is stubbed.
- **No wallet required.** The event prep flow must work entirely without a wallet connection.
  Email magic link (Supabase OTP) is the auth method.
- **Mobile-first.** EventPrep.vue and EventPrepDashboard.vue must be usable at 375px width.
  One section per screen, no horizontal scrolling.
- **Existing aesthetic.** Match pon.ink's existing dark monospace style precisely.
  No new color variables; use the existing palette (`#3d5afe`, `#21ba45`, `#ab47bc`,
  `#ff9800`, `#ff3d00`, `#ffa726` for amber/warning).

---

## Files to create or modify (checklist)

- [ ] CREATE `/supabase/migrations/20260419_dryrun_event.sql`
- [ ] CREATE `/supabase/functions/invite-artist/index.ts`
- [ ] REWRITE `/supabase/functions/messaging-hub/index.ts`
- [ ] CREATE `/src/pages/EventPrep.vue`
- [ ] CREATE `/src/pages/EventPrepDashboard.vue`
- [ ] MODIFY `/src/router/routes.ts` — add 3 new routes
- [ ] MODIFY `/src/pages/Nairobi.vue` — add USA Artist archetype + node + Voice item
- [ ] MODIFY `/src/pages/IndexPage.vue` — update Airdrop desc + Exotopia details + tagline
- [ ] MODIFY `/src/pages/AirdropBuilder.vue` — add isDryRun prop + dry run UI + new route
- [ ] MODIFY `/src/pages/ExoProperty.vue` — add dry run banner + CSS

Do not modify any other files. Run `npx tsc --noEmit` after all changes and fix any type
errors before considering the work done.
