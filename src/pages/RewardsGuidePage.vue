<template>
  <q-page class="rg-page">
    <div class="rg-wrap">

      <router-link to="/rewards" class="rg-back">← Back to Rewards</router-link>

      <div class="rg-badge">HOW REWARDS WORK</div>
      <h1 class="rg-title">A plain-language guide to earning here</h1>
      <p class="rg-lede">
        There are three ways to earn on this platform: learning about your own money, doing real
        volunteer work, and helping someone else learn. All three feed the same points system, and
        points unlock things you can add to your settlement. This page explains each one — no
        jargon, no assumptions about what you already know.
      </p>

      <div class="rg-callout">
        <strong>This is not a financial product.</strong> Nothing here moves money, extends credit,
        or invests anything. Points are not currency and cannot be cashed out. If a payout or
        payment system is ever added, it will be described separately and clearly — it is not part
        of what's described on this page.
      </div>

      <!-- ── Track 1 ─────────────────────────────────────────────────────── -->
      <section class="rg-section">
        <div class="rg-section__num">1</div>
        <h2 class="rg-h2">Learning about money (Personal Finance Literacy)</h2>
        <p class="rg-p">
          There are two quizzes, both original questions we wrote ourselves — not copied from anyone
          else's test. They cover the same basic ground a good personal-finance course would:
          earning, spending, saving, investing, borrowing, insurance, understanding risk, and knowing
          where to go for trustworthy financial information.
        </p>
        <ul class="rg-list">
          <li><strong>The short quiz</strong> — 8 questions, one per topic. Answer 6 or more correctly and
            you earn a certificate plus a starter object for your settlement.</li>
          <li><strong>The full quiz</strong> — 28 questions, going deeper into the same 8 topics. This one
            only unlocks after you've passed the short quiz. Answer 20 or more correctly and you earn a
            bigger certificate and a bigger settlement unlock.</li>
        </ul>
        <p class="rg-p">
          You can take either quiz as many times as you want — nothing bad happens if you don't pass
          the first time. Find both at <router-link to="/learn" class="rg-inline-link">/learn</router-link>.
        </p>
      </section>

      <!-- ── Track 2 ─────────────────────────────────────────────────────── -->
      <section class="rg-section">
        <div class="rg-section__num">2</div>
        <h2 class="rg-h2">Volunteering — real work, logged honestly</h2>
        <p class="rg-p">
          If you do real-world field work — a beach or roadside cleanup, water testing, anything
          along those lines — you log it and it counts. A concrete example: you collect 5 kg of
          plastic at a cleanup site. You go to
          <router-link to="/rewards" class="rg-inline-link">/rewards</router-link>, fill in the
          amount, the site, and a short description, and submit it. That's it — there's no photo
          verification or GPS check right now, which means this system runs on trust. Please log
          honestly; the whole point is that this becomes a real record of real work, for you and for
          whoever your group reports to.
        </p>
        <p class="rg-p">
          Points build up over time. Once you've logged enough (currently 50 points' worth), you earn
          a Field Volunteer certificate and a settlement object automatically — you don't need to
          apply for it, it just appears once you cross the line.
        </p>
        <p class="rg-p rg-p--dim">
          If your group coordinator has already been submitting data through a connected field-data
          system, some of this may log itself automatically — you'll see it appear in your history
          without needing to fill in the form.
        </p>
      </section>

      <!-- ── Track 3 ─────────────────────────────────────────────────────── -->
      <section class="rg-section">
        <div class="rg-section__num">3</div>
        <h2 class="rg-h2">Educating others (mentorship)</h2>
        <p class="rg-p">
          Teaching someone else something you know is worth crediting too. To do this, you first
          need to be <em>green-light connected</em> to the other person — a mutual opt-in connection,
          not something either of you can do to the other one-sidedly. Once connected, either of you
          can request a session on a topic.
        </p>
        <p class="rg-p">
          Here's the part that matters: <strong>both people have to confirm the session happened</strong>
          before anyone gets points. This isn't just a courtesy — it's built so that nobody, including
          us, can hand out mentor credit without the other person actually agreeing it happened. Once
          you've mentored someone through four confirmed sessions, you earn a Mentorship certificate.
        </p>
      </section>

      <!-- ── Track: PFAS citizen science ─────────────────────────────────── -->
      <section class="rg-section">
        <div class="rg-section__num">+</div>
        <h2 class="rg-h2">Want to work on PFAS/PFOA cleanup specifically?</h2>
        <p class="rg-p">
          There's a dedicated space for this — real remediation-method research, a place to log
          progress on a decontamination project (real or simulated/practice), and a fully public
          system for proposing a cleanup method with supporting evidence that anyone can read and
          endorse. It plugs into the same two tracks above: logging progress earns volunteering
          points, and publishing or endorsing a method proposal earns educating-others points.
        </p>
        <router-link to="/pfas-citizen-science" class="rg-inline-link">Open PFAS Citizen Science →</router-link>
        <span> · </span>
        <router-link to="/method-proposals" class="rg-inline-link">Browse method proposals →</router-link>
      </section>

      <!-- ── What points actually do ─────────────────────────────────────── -->
      <section class="rg-section">
        <div class="rg-section__num">?</div>
        <h2 class="rg-h2">Common questions</h2>

        <div class="rg-faq">
          <div class="rg-faq__q">What's a "certificate"?</div>
          <div class="rg-faq__a">A record that you've reached a specific milestone — passed a quiz,
            crossed a volunteering threshold, completed a mentorship cycle. You can see all of yours
            listed on your <router-link to="/rewards" class="rg-inline-link">Rewards</router-link> page
            under Impact Profile.</div>
        </div>
        <div class="rg-faq__q">What's a "settlement object"?</div>
        <div class="rg-faq__a">Something visual you can add to your settlement — your spot in this
          platform's world — as a sign of what you've done. Certificates unlock them; from your Rewards
          page you can attach an unlocked object to any settlement you already have.</div>

        <div class="rg-faq__q">Do I need a wallet or any crypto knowledge?</div>
        <div class="rg-faq__a">No. Signing in uses a simple email magic link. Nothing described on this
          page requires a wallet, a token, or any blockchain knowledge.</div>

        <div class="rg-faq__q">Can I lose points, or do they expire?</div>
        <div class="rg-faq__a">No — the ledger only ever adds. There's no penalty for inactivity right
          now.</div>

        <div class="rg-faq__q">What if I don't have reliable internet when I do the work?</div>
        <div class="rg-faq__a">Log it whenever you next have a connection — there's no time limit on
          when you submit a volunteering entry after the fact.</div>

        <div class="rg-faq__q">Is any of this connected to a payment or payout?</div>
        <div class="rg-faq__a">No — see the note near the top of this page. If that ever changes, it
          will be announced as its own thing, not folded quietly into this system.</div>
      </section>

      <router-link to="/rewards" class="rg-cta">Go to your Rewards page →</router-link>

    </div>
  </q-page>
</template>

<script setup lang="ts">
</script>

<style scoped>
.rg-page {
  background: #020408;
  min-height: 100vh;
  padding: 36px 24px 60px;
  font-family: 'Courier New', monospace;
  color: rgba(200,225,245,0.90);
}
.rg-wrap { max-width: 680px; margin: 0 auto; }

.rg-back { font-size: 10px; color: rgba(0,190,230,0.65); text-decoration: none; display: inline-block; margin-bottom: 20px; }
.rg-back:hover { text-decoration: underline; }

.rg-badge { font-size: 8.5px; letter-spacing: 0.22em; color: rgba(160,120,255,0.60); margin-bottom: 8px; }
.rg-title { font-size: 22px; font-weight: 300; color: rgba(215,238,255,0.94); line-height: 1.3; margin: 0 0 16px; }
.rg-lede  { font-size: 12.5px; line-height: 1.75; color: rgba(160,195,220,0.85); margin-bottom: 20px; }

.rg-callout {
  border-left: 3px solid rgba(255,180,60,0.55); background: rgba(255,180,60,0.06);
  border-radius: 0 6px 6px 0; padding: 12px 16px; font-size: 11px; line-height: 1.7;
  color: rgba(230,205,160,0.90); margin-bottom: 32px;
}

.rg-section { margin-bottom: 32px; position: relative; padding-left: 34px; }
.rg-section__num {
  position: absolute; left: 0; top: 2px; width: 24px; height: 24px; border-radius: 50%;
  border: 1px solid rgba(0,190,230,0.35); display: flex; align-items: center; justify-content: center;
  font-size: 11px; color: rgba(0,210,255,0.80);
}
.rg-h2 { font-size: 15px; font-weight: 600; color: rgba(215,238,255,0.92); margin: 0 0 10px; }
.rg-p  { font-size: 12px; line-height: 1.75; color: rgba(175,205,228,0.85); margin: 0 0 12px; }
.rg-p--dim { color: rgba(130,165,190,0.65); font-style: italic; }
.rg-list { font-size: 12px; line-height: 1.75; color: rgba(175,205,228,0.85); padding-left: 20px; margin: 0 0 12px; }
.rg-list li { margin-bottom: 8px; }

.rg-inline-link { color: rgba(0,210,255,0.85); text-decoration: underline; }

.rg-faq__q { font-size: 12px; font-weight: 600; color: rgba(210,235,255,0.90); margin: 16px 0 6px; }
.rg-faq__a { font-size: 11.5px; line-height: 1.7; color: rgba(160,195,220,0.80); }

.rg-cta {
  display: inline-block; margin-top: 12px; font-size: 12px; color: rgba(0,210,255,0.85);
  text-decoration: none; border: 1px solid rgba(0,190,230,0.35); border-radius: 6px; padding: 10px 18px;
}
.rg-cta:hover { background: rgba(0,190,230,0.10); }
</style>
