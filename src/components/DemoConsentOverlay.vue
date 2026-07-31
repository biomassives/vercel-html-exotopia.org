<template>
  <Transition name="dco-fade">
    <div v-if="visible" class="dco-backdrop">
      <div class="dco-card" role="dialog" aria-modal="true" aria-labelledby="dco-title">

        <div class="dco-badge">LIVE DEMO</div>
        <h2 id="dco-title" class="dco-title">Welcome to Exotopia</h2>
        <p class="dco-lead">
          This is a live, evolving demo. Features, wording, and behavior may change —
          sometimes subtly — as the project develops. Nothing here is a finished,
          guaranteed product.
        </p>
        <p class="dco-lead">
          Your data stays on your own device by default (localStorage / IndexedDB) —
          you choose what, if anything, to submit anywhere.
        </p>
        <p class="dco-lead">
          Exotopia mints digital collectibles and does not operate a resale
          marketplace for them. Some countries restrict or prohibit resident
          participation in crypto-asset features — it's your responsibility to
          know whether that applies to you; we don't screen by location.
        </p>

        <div class="dco-links">
          <router-link to="/terms" target="_blank">Terms of Service</router-link>
          <router-link to="/privacy" target="_blank">Privacy Policy</router-link>
          <router-link to="/community-guidelines" target="_blank">Community Guidelines</router-link>
        </div>

        <div class="dco-repo-links">
          <a :href="REPO_URL" target="_blank" rel="noopener">View source on GitHub</a>
          <a :href="`${REPO_URL}/issues`" target="_blank" rel="noopener">File an issue</a>
          <a :href="`${REPO_URL}/pulls`" target="_blank" rel="noopener">Open pull requests</a>
        </div>

        <!-- Two separate consents, not one bundled checkbox — distinguishing
             "I agree to the contract terms" from "I consent to my data being
             processed off-device" is expected practice under several regimes
             (e.g. South Korea's PIPA requires unbundled consent for exactly
             this split) and is better practice generally, not just there.
             Both are required to pass this gate today — a future pass could
             make the second one truly optional for users who never sign in,
             gated instead at the sign-in step itself, but that needs each
             sign-in path updated to check for it, not just this modal. -->
        <label class="dco-checkbox">
          <input v-model="agreedTerms" type="checkbox" />
          <span>I understand this is a live demo that may change, and I've read the linked Terms, Privacy Policy, and Community Guidelines.</span>
        </label>

        <label class="dco-checkbox">
          <input v-model="agreedProcessing" type="checkbox" />
          <span>I consent to my data being processed and stored off-device — potentially across borders — when I sign in or submit data (comments, citizen-science reports, reward activity), as described in the Privacy Policy.</span>
        </label>

        <button class="dco-continue" :disabled="!agreedTerms || !agreedProcessing" @click="acknowledge">
          Continue
        </button>

      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRoute } from 'vue-router'

// Bump this if Terms/Privacy/Guidelines change materially — re-prompts everyone.
const CONSENT_VERSION = '2026-07-22-v3'
const CONSENT_KEY = 'exo_demo_consent'

const REPO_URL = 'https://github.com/biomassives/vercel-html-exotopia.org'

// The modal asks you to confirm you've read the Terms/Privacy/Guidelines —
// it can't also block the page that lets you actually read them, or that
// becomes an unreadable circular gate. Suppressed on those three routes
// specifically; still prompts on every other route until consent is given,
// via the route watcher below rather than a one-time onMounted check (this
// component mounts once for the whole SPA session, so a plain onMounted
// check would permanently skip the prompt for anyone who happened to land
// on /terms first, even after they navigate elsewhere).
const EXEMPT_PATHS = ['/terms', '/privacy', '/community-guidelines']

const route = useRoute()
const visible = ref(false)
const agreedTerms      = ref(false)
const agreedProcessing = ref(false)

function alreadyConsented(): boolean {
  try {
    return localStorage.getItem(CONSENT_KEY) === CONSENT_VERSION
  } catch { return false }   // private mode — fall through and prompt every time
}

watch(() => route.path, (path) => {
  visible.value = !EXEMPT_PATHS.includes(path) && !alreadyConsented()
}, { immediate: true })

// Logged the same way as MintPage.vue's mint-disclaimer acceptance — a
// per-action, timestamped record beats "by using this site you agree" in a
// footer for evidentiary purposes (RISK_REDUCTION_RECOMMENDATIONS.md §7).
// Both consents are logged as distinct entries, not one combined flag, so
// the record itself reflects that they're separate.
function logConsentAcceptance() {
  try {
    const key = 'exo.consent-log'
    const log = JSON.parse(localStorage.getItem(key) ?? '[]') as unknown[]
    const acceptedAt = new Date().toISOString()
    log.push({ version: CONSENT_VERSION, consent: 'terms', acceptedAt })
    log.push({ version: CONSENT_VERSION, consent: 'data-processing', acceptedAt })
    localStorage.setItem(key, JSON.stringify(log))
  } catch { /* private mode / quota */ }
}

function acknowledge() {
  if (!agreedTerms.value || !agreedProcessing.value) return
  visible.value = false
  logConsentAcceptance()
  try { localStorage.setItem(CONSENT_KEY, CONSENT_VERSION) } catch { /* private mode */ }
}
</script>

<style scoped>
.dco-backdrop {
  position: fixed;
  inset: 0;
  z-index: 9000;
  background: rgba(0, 2, 10, 0.86);
  backdrop-filter: blur(6px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  font-family: 'Courier New', monospace;
}

.dco-card {
  width: min(460px, 100%);
  max-height: calc(100vh - 48px);
  overflow-y: auto;
  background: rgba(4, 8, 20, 0.96);
  border: 1px solid rgba(0, 212, 180, 0.25);
  border-radius: 12px;
  padding: 28px 26px 24px;
  color: #c8d8e8;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.6);
}

.dco-badge {
  display: inline-block;
  font-size: 9px;
  letter-spacing: 0.16em;
  color: #00d4b4;
  border: 1px solid rgba(0, 212, 180, 0.35);
  border-radius: 3px;
  padding: 2px 8px;
  margin-bottom: 12px;
}

.dco-title { font-size: 19px; font-weight: 700; color: #e8f0ff; margin: 0 0 12px; letter-spacing: -0.01em; }
.dco-lead  { font-size: 12px; line-height: 1.65; color: #93a5bd; margin: 0 0 12px; }

.dco-links {
  display: flex; flex-wrap: wrap; gap: 6px 16px;
  margin: 16px 0 10px;
  padding-top: 12px;
  border-top: 1px solid rgba(255,255,255,0.08);
}
.dco-links a { font-size: 11.5px; color: #4fb8e8; text-decoration: none; }
.dco-links a:hover { color: #7ad0ff; }

.dco-repo-links {
  display: flex; flex-wrap: wrap; gap: 6px 16px;
  margin-bottom: 18px;
  font-size: 11px;
}
.dco-repo-links a { color: #6a8ab0; text-decoration: none; }
.dco-repo-links a:hover { color: #8ab0d8; }

.dco-checkbox {
  display: flex; align-items: flex-start; gap: 8px;
  font-size: 11.5px; line-height: 1.5; color: #a8b8d0;
  margin-bottom: 16px;
  cursor: pointer;
}
.dco-checkbox input { margin-top: 2px; flex-shrink: 0; }

.dco-continue {
  display: block;
  width: 100%;
  padding: 10px 16px;
  border: 1px solid rgba(0, 212, 180, 0.45);
  border-radius: 6px;
  background: rgba(0, 212, 180, 0.16);
  color: #00ffdd;
  font-family: inherit;
  font-weight: 600;
  font-size: 11px;
  letter-spacing: 0.1em;
  cursor: pointer;
  transition: background 0.2s, border-color 0.2s;
}
.dco-continue:hover:not(:disabled) { background: rgba(0, 212, 180, 0.26); }
.dco-continue:disabled { opacity: 0.35; cursor: default; }

.dco-fade-enter-active { transition: opacity 0.3s ease; }
.dco-fade-leave-active  { transition: opacity 0.2s ease; }
.dco-fade-enter-from, .dco-fade-leave-to { opacity: 0; }

@media (max-width: 480px) {
  .dco-card { padding: 22px 18px 20px; }
}
</style>
