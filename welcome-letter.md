# WELCOME LETTER TEMPLATE — PON INK / EXOTOPIA
**SCD Hub · GPL v3 · Multi-channel: email / SMS / audio**

---

## VARIABLE REFERENCE

All variables use `{{double_brace}}` syntax (Mailgun Handlebars / Supabase Edge Function compatible).

| Variable | Source | Example |
|---|---|---|
| `{{first_name}}` | artist_profiles.display_name (first word) | `Amara` |
| `{{full_name}}` | artist_profiles.display_name | `Amara Okonkwo` |
| `{{handle}}` | artist_profiles.handle | `@amara_eco` |
| `{{community_name}}` | artist_profiles.community | `Uni-Kibaoni-Peace-Youth-SHG` |
| `{{role}}` | artist_profiles.role | `Eco / Health Educator` |
| `{{planet_name}}` | user_addresses.pl_name | `Kepler-442b` |
| `{{hostname}}` | user_addresses.hostname | `Kepler-442` |
| `{{settlement_name}}` | user_addresses.region_name | `Mpeketoni Basin Station` |
| `{{exo_address}}` | user_addresses.exo_address | `exotopia:surface:kepler-442/kepler-442b/aurora-basin` |
| `{{dist_pc}}` | exoplanets-viz.json sy_dist | `342` |
| `{{eqt_k}}` | exoplanets-viz.json pl_eqt | `233` |
| `{{mule_tier}}` | mule_corpus.tier | `Foal` |
| `{{eco_ops_count}}` | eco_ops_checkins COUNT | `0` |
| `{{facilitator_name}}` | event_schedule.facilitator | `Grace Mwende` |
| `{{invite_code}}` | event_schedule.claim_code | `FANA-2026-042` |
| `{{settlement_url}}` | computed | `https://exotopia.org/surface/Kepler-442/Kepler-442b` |
| `{{ponink_url}}` | computed | `https://pon.ink/@amara_eco` |
| `{{event_name}}` | event_schedule.name | `Fana Ka — June Session` |
| `{{event_date_local}}` | formatted for recipient TZ | `Friday 12 June, 7pm EAT` |
| `{{net_amount_kes}}` | resonance split 99% of 5 USDC | `643` |
| `{{lang}}` | artist_profiles.language | `en` / `sw` |

---

## 1 — EMAIL VERSION (Mailgun HTML template)

**Subject:** `Your settlement is ready — {{settlement_name}} · PON INK`

**Preview text:** `{{first_name}}, you have a permanent address in the cosmos.`

---

```html
<!-- Mailgun template body — inline all CSS before sending -->

<div style="background:#00040e; color:#c0d0e0; font-family:'Courier New',monospace;
            max-width:600px; margin:0 auto; padding:32px 24px;">

  <!-- Header logotype -->
  <div style="text-align:center; margin-bottom:28px;">
    <span style="color:#00ccff; font-size:22px; letter-spacing:0.18em;">EXO</span><span
          style="color:#8899aa; font-size:22px; letter-spacing:0.18em;">TOPIA</span>
    <div style="font-size:8px; letter-spacing:0.22em; color:#335566; margin-top:4px;">
      PON INK PROTOCOL · SCD HUB
    </div>
  </div>

  <!-- Hero line -->
  <p style="font-size:13px; color:#aaddff; letter-spacing:0.04em; margin-bottom:6px;">
    Hello {{first_name}},
  </p>
  <h1 style="font-size:20px; color:#00ccff; margin:0 0 6px; font-weight:400;
             letter-spacing:0.06em; line-height:1.3;">
    Your settlement is established.
  </h1>
  <p style="font-size:11px; color:#556677; margin:0 0 24px; letter-spacing:0.06em;">
    {{settlement_name}} · {{planet_name}} · {{dist_pc}} pc from Earth
  </p>

  <!-- Exolocation address block -->
  <div style="background:#010a1a; border:1px solid #00334d; border-radius:6px;
              padding:14px 16px; margin-bottom:22px;">
    <div style="font-size:7px; letter-spacing:0.18em; color:#334466; margin-bottom:6px;">
      YOUR PERMANENT EXOLOCATION ADDRESS
    </div>
    <div style="font-size:12px; color:#00e5ff; word-break:break-all; letter-spacing:0.03em;">
      {{exo_address}}
    </div>
    <div style="font-size:8px; color:#335566; margin-top:6px; line-height:1.6;">
      This address is yours. It's computed directly from real astronomical data — permanently
      linked to {{hostname}} ({{eqt_k}} K equilibrium temperature, {{dist_pc}} parsecs from
      Earth) — and lives on your own device, no account or blockchain required. Nobody can
      revoke it. You can also pin your settlement to IPFS for extra durability, any time you
      choose — no wallet, no gas fee, entirely optional.
    </div>
  </div>

  <!-- What this means -->
  <p style="font-size:11px; line-height:1.8; color:#99aabb; margin-bottom:20px;">
    You now have a stake in the cosmos. Every eco-ops check-in you submit, every workshop
    you attend, every piece of work you share through PON INK — all of it builds your
    settlement. The dome is yours. The water feature tracks your WATSAN work. The Robot
    Mule learns from everything you add to it.
  </p>

  <!-- What your mule-bot is -->
  <div style="border-left:3px solid #005577; padding:10px 14px; margin-bottom:20px;">
    <div style="font-size:8px; letter-spacing:0.14em; color:#336688; margin-bottom:4px;">
      YOUR MULE-BOT — CURRENT TIER: {{mule_tier}}
    </div>
    <p style="font-size:10px; color:#8899aa; line-height:1.7; margin:0;">
      Your mule-bot is a land-connected knowledge specialist that lives in your settlement.
      As you add corpus items — your bio, your work, your eco-ops story, your land care
      records — it grows through the tiers: Foal → Colt → Stallion → Sovereign. Visitors
      to your settlement meet your mule-bot first. It speaks in your words, not ours.
    </p>
  </div>

  <!-- The resonance split — plain language -->
  <div style="background:#010a1a; border:1px solid #001e2e; border-radius:6px;
              padding:14px 16px; margin-bottom:22px;">
    <div style="font-size:7px; letter-spacing:0.18em; color:#334466; margin-bottom:8px;">
      HOW THE MONEY MOVES — THE RESONANCE SPLIT
    </div>
    <div style="display:flex; gap:0; font-size:10px;">
      <div style="flex:99; background:#003344; padding:8px 10px; border-radius:4px 0 0 4px;
                  text-align:center;">
        <div style="color:#00e5ff; font-size:16px; font-weight:bold;">99%</div>
        <div style="color:#558899; font-size:8px; margin-top:2px;">to you</div>
      </div>
      <div style="flex:1; background:#001e2e; padding:8px 4px; text-align:center;">
        <div style="color:#336655; font-size:11px;">0.75%</div>
        <div style="color:#334455; font-size:7px; margin-top:2px;">hardware</div>
      </div>
      <div style="flex:1; background:#00121c; padding:8px 4px;
                  border-radius:0 4px 4px 0; text-align:center;">
        <div style="color:#224433; font-size:11px;">0.25%</div>
        <div style="color:#223333; font-size:7px; margin-top:2px;">platform</div>
      </div>
    </div>
    <p style="font-size:9px; color:#446677; margin:10px 0 0; line-height:1.6;">
      Every transaction shows you the net amount in KES before you confirm.
      The 0.75% hardware fund goes directly toward WATSAN equipment and
      field infrastructure for communities like yours. The 0.25% platform share
      keeps the network running. We never mix these numbers.
    </p>
  </div>

  <!-- Three things to do first -->
  <div style="font-size:8px; letter-spacing:0.14em; color:#334455; margin-bottom:10px;">
    THREE THINGS TO DO THIS WEEK
  </div>
  <table style="width:100%; border-collapse:collapse; margin-bottom:22px;">
    <tr>
      <td style="padding:8px 10px; border-bottom:1px solid #001e2e; vertical-align:top;
                 width:28px;">
        <span style="color:#00ccff; font-size:14px;">1</span>
      </td>
      <td style="padding:8px 10px; border-bottom:1px solid #001e2e; font-size:10px;
                 color:#88aacc; line-height:1.6;">
        <strong style="color:#aaccdd;">Submit your first eco-ops check-in.</strong>
        Even a single location ping counts. It assigns your exolocation address and
        unlocks your starter settlement objects.
      </td>
    </tr>
    <tr>
      <td style="padding:8px 10px; border-bottom:1px solid #001e2e; vertical-align:top;">
        <span style="color:#00ccff; font-size:14px;">2</span>
      </td>
      <td style="padding:8px 10px; border-bottom:1px solid #001e2e; font-size:10px;
                 color:#88aacc; line-height:1.6;">
        <strong style="color:#aaccdd;">Add three corpus items to your mule-bot.</strong>
        A bio note, a recent project description, and one thing you want visitors to know.
        This moves you from Foal to Colt tier.
      </td>
    </tr>
    <tr>
      <td style="padding:8px 10px; vertical-align:top;">
        <span style="color:#00ccff; font-size:14px;">3</span>
      </td>
      <td style="padding:8px 10px; font-size:10px; color:#88aacc; line-height:1.6;">
        <strong style="color:#aaccdd;">Visit your settlement in Exotopia.</strong>
        Walk through the dome. Find the stone circle. Your mule-bot is waiting.
      </td>
    </tr>
  </table>

  <!-- CTA buttons -->
  <div style="text-align:center; margin-bottom:24px;">
    <a href="{{settlement_url}}"
       style="display:inline-block; background:#006688; color:#00e5ff; text-decoration:none;
              padding:11px 28px; border-radius:4px; font-size:11px; letter-spacing:0.10em;
              margin-bottom:8px; border:1px solid #00aacc;">
      ENTER YOUR SETTLEMENT →
    </a>
    <br>
    <a href="{{ponink_url}}"
       style="display:inline-block; color:#445566; text-decoration:none;
              font-size:9px; letter-spacing:0.08em; margin-top:6px;">
      View your pon.ink dashboard
    </a>
  </div>

  <!-- Community context -->
  {{#if community_name}}
  <div style="border-top:1px solid #001e2e; padding-top:16px; margin-bottom:20px;">
    <div style="font-size:8px; letter-spacing:0.14em; color:#334455; margin-bottom:6px;">
      YOUR COMMUNITY
    </div>
    <p style="font-size:10px; color:#668899; line-height:1.7; margin:0;">
      You are joining through <strong style="color:#88aacc;">{{community_name}}</strong>.
      {{#if facilitator_name}}
      Your facilitator is <strong style="color:#88aacc;">{{facilitator_name}}</strong>.
      Reach out to them with any questions — they know this system and your local context.
      {{/if}}
    </p>
  </div>
  {{/if}}

  <!-- Upcoming event callout -->
  {{#if event_name}}
  <div style="background:#0a0820; border:1px solid #332255; border-radius:6px;
              padding:12px 16px; margin-bottom:20px;">
    <div style="font-size:7px; letter-spacing:0.18em; color:#443366; margin-bottom:4px;">
      UPCOMING EVENT
    </div>
    <div style="font-size:12px; color:#cc88ff; margin-bottom:3px;">{{event_name}}</div>
    <div style="font-size:9px; color:#665577; margin-bottom:8px;">{{event_date_local}}</div>
    <div style="font-size:9px; color:#8877aa;">
      Your claim code: <strong style="color:#cc88ff; letter-spacing:0.08em;">{{invite_code}}</strong>
    </div>
  </div>
  {{/if}}

  <!-- Footer -->
  <div style="border-top:1px solid #001e2e; padding-top:16px;
              font-size:8px; color:#223344; line-height:1.8;">
    <div>SCD Hub · Non-profit · GPL v3 · Community owns its data</div>
    <div>Nothing in this message is financial advice.
         Net amounts shown are estimates based on current rates.</div>
    <div style="margin-top:8px;">
      <a href="{{ponink_url}}/unsubscribe" style="color:#223344;">Unsubscribe</a>
      &nbsp;·&nbsp;
      <a href="https://pon.ink/privacy" style="color:#223344;">Privacy</a>
    </div>
  </div>

</div>
```

---

## 2 — SMS VERSION (Twilio · 2 segments max · 306 chars)

**Version A — General welcome:**
```
PON INK: {{first_name}}, your settlement is live at {{planet_name}}. 
Exolocation: {{exo_address}}
Enter: {{settlement_url}}
First check-in unlocks your starter objects. Reply HELP for guide.
```
*(~180 chars)*

**Version B — Event invite (short):**
```
PON INK: {{first_name}} — {{event_name}} is {{event_date_local}}.
Your code: {{invite_code}}
{{settlement_url}}
```
*(~110 chars)*

**Version C — Eco-ops milestone:**
```
PON INK: {{first_name}}, {{eco_ops_count}} check-ins reached. 
New settlement object unlocked at {{planet_name}}.
Net reward: KES {{net_amount_kes}} to your wallet.
{{ponink_url}}
```
*(~175 chars)*

**Version D — Swahili (for +254 Kenya):**
```
PON INK: Habari {{first_name}}! Makazi yako yako tayari kwenye {{planet_name}}.
Ingiza hapa: {{settlement_url}}
Msaada: jibu MSAADA
```
*(~140 chars)*

---

## 3 — AUDIO SCRIPT (Twilio · TTS / IVR · ~35 seconds at medium pace)

*Format: plain text optimised for Polly / Twilio text-to-speech. Avoid symbols.
Suggested voice: `Joanna` (en-US) or `Salli` for warmer tone. Rate: 90%.*

**Full welcome audio script:**

```
Hello, {{first_name}}. This is a message from PON INK and SCD Hub.

Your settlement is now established. Your location in the cosmos is {{planet_name}},
part of the {{hostname}} star system, {{dist_pc}} parsecs from Earth.

Your permanent address is: {{exo_address}}.

This address is computed from real astronomical data and lives on your own device.
It is yours permanently, with no account and no blockchain required.

Here is what to do next.

First: open the link we sent you and enter your settlement. Your dome is waiting.

Second: add your story to your mule-bot. The more you share, the more it can
represent you to people who visit.

Third: submit your first eco-ops check-in through the pon ink app. Even one
check-in activates your starter objects.

If you are part of {{community_name}}, speak to your facilitator
{{#if facilitator_name}}{{facilitator_name}}{{else}}for your group{{/if}}
if you have questions.

We are glad you are here. The community is building something real.

To hear this message again, press 1. To reach your dashboard, press 2.
To speak with a community support line, press 3.
```
*(~38 seconds at 90% rate)*

**Short welcome audio (IVR prompt, ~12 seconds):**
```
Hello {{first_name}}, your PON INK settlement at {{planet_name}} is ready.
Check the link we sent for next steps. Goodbye.
```

**Eco-ops milestone audio (~18 seconds):**
```
Hello {{first_name}}. Congratulations. You have reached {{eco_ops_count}}
eco-ops check-ins. A new settlement object has been added to your dome at
{{planet_name}}. Your estimated reward is {{net_amount_kes}} Kenyan shillings,
ninety-nine percent of the total. Visit your pon ink dashboard to view it.
```

---

## 4 — SUPABASE EDGE FUNCTION NOTES

Trigger: `eco_ops_milestones` table → `milestone_reached = true` → call `send_welcome`

```typescript
// supabase/functions/send_welcome/index.ts  (scaffold)

import { serve }   from 'https://deno.land/std/http/server.ts'
import { Mailgun } from 'npm:mailgun.js'
import twilio      from 'npm:twilio'

serve(async (req) => {
  const { user_id, trigger, milestone } = await req.json()

  // 1. Fetch user profile from Supabase
  const { data: profile } = await supabase
    .from('artist_profiles')
    .select('*, user_addresses(*), mule_corpus(*)')
    .eq('id', user_id)
    .single()

  // 2. Build template variables (never flatten community payout + gas)
  const vars = {
    first_name:      profile.display_name.split(' ')[0],
    planet_name:     profile.user_addresses?.pl_name ?? '—',
    exo_address:     profile.user_addresses?.exo_address ?? '—',
    settlement_url:  `https://exotopia.org/surface/${encodeURIComponent(profile.user_addresses?.hostname)}/${encodeURIComponent(profile.user_addresses?.pl_name)}`,
    ponink_url:      `https://pon.ink/@${profile.handle}`,
    mule_tier:       profile.mule_corpus?.tier ?? 'Foal',
    eco_ops_count:   milestone?.checkin_count ?? 0,
    net_amount_kes:  Math.round((milestone?.reward_usdc ?? 0) * 0.99 * 130).toString(),
    community_name:  profile.community ?? '',
    facilitator_name: profile.facilitator ?? '',
    lang:            profile.language ?? 'en',
  }

  // 3. Email via Mailgun
  if (profile.email && trigger === 'welcome') {
    await mg.messages.create('mg.pon.ink', {
      from:    'PON INK <welcome@pon.ink>',
      to:      profile.email,
      subject: `Your settlement is ready — ${vars.planet_name} · PON INK`,
      template: 'welcome_letter_v1',        // upload HTML template to Mailgun first
      'h:X-Mailgun-Variables': JSON.stringify(vars),
    })
  }

  // 4. SMS via Twilio (Africa's Talking for +254 first)
  if (profile.phone && profile.sms_opt_in) {
    const body = vars.lang === 'sw'
      ? `PON INK: Habari ${vars.first_name}! Makazi yako yako tayari kwenye ${vars.planet_name}.\nIngiza: ${vars.settlement_url}`
      : `PON INK: ${vars.first_name}, your settlement is live at ${vars.planet_name}.\n${vars.settlement_url}`

    await twilioClient.messages.create({
      from: process.env.TWILIO_FROM_NUMBER,
      to:   profile.phone,
      body,
    })
  }

  // 5. Audio call for key milestones (facilitator opt-in only)
  if (profile.audio_call_opt_in && trigger === 'welcome') {
    // TwiML: read the short welcome audio, collect keypress
    await twilioClient.calls.create({
      from: process.env.TWILIO_PHONE,
      to:   profile.phone,
      twiml: `<Response>
        <Say voice="Polly.Joanna" rate="90%">
          Hello ${vars.first_name}. Your PON INK settlement at ${vars.planet_name} is ready.
          We sent a link to your phone. Press 1 to hear your address, or hang up.
        </Say>
        <Gather numDigits="1">
          <Say voice="Polly.Joanna">Press 1 now.</Say>
        </Gather>
      </Response>`,
    })
  }

  return new Response(JSON.stringify({ ok: true }), { status: 200 })
})
```

---

## 5 — MAILGUN TEMPLATE UPLOAD

```bash
# Upload the email HTML template to Mailgun via API
curl -s --user "api:${MAILGUN_API_KEY}" \
  https://api.mailgun.net/v3/mg.pon.ink/templates \
  -F template="welcome_letter_v1" \
  -F description="PON INK new user welcome" \
  -F template="$(cat welcome-email.html)" \
  -F engine="handlebars"
```

---

## 6 — CONTENT NOTES

**Tone:**
- Address the person directly. No passive voice.
- Plain language throughout — Grade 8 English reading level.
- Never use crypto jargon in user-facing copy ("exolocation" is fine; "ARC-3 NFT" is not).
- The resonance split numbers are always shown. Never hide fees.

**Localisation priority:**
1. **Swahili** — Lamu / Nairobi communities (Uni-Kibaoni, Fana Ka)
2. **English** — All communities; default
3. **Patois** — OT Kulcha, Jamaican/Caribbean connections (develop with community)

**Facilitator personalisation:**
When `facilitator_name` is known, address the letter partly *to* them:
> *"Your facilitator {{facilitator_name}} can walk you through your first check-in."*

**Do not include in any channel:**
- Raw wallet addresses in SMS (too long, unsafe)
- Seed phrases or private keys (ever)
- `Total = yield − gas` calculations (fee isolation rule)
- Promises of financial return

---

*Generated: {{today}} · SCD Hub · Community owns its data · GPL v3*
