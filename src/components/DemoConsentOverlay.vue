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
          Settlements here are address records you can optionally pin to IPFS
          to keep durable — no wallet, no blockchain, no purchase. There's no
          collision-proof claim on an address by design; durability comes
          from someone keeping the content pinned, not from exclusive
          ownership.
        </p>

        <!-- Scroll-to-read gate: a self-attested "I've read this" checkbox is
             weak evidence of actual notice. Requiring — and logging — that the
             full text of each document actually passed under the viewport at
             least once is the stronger, more defensible pattern regulators and
             courts look for (RISK_REDUCTION_RECOMMENDATIONS.md §1's same logic
             applied to consent capture generally, not just the mint flow). -->
        <div class="dco-reader">
          <div class="dco-tabs">
            <button
              v-for="key in DOC_KEYS" :key="key"
              type="button"
              class="dco-tab"
              :class="{ 'dco-tab--active': activeTab === key }"
              @click="activeTab = key"
            >
              <span class="dco-tab-check" :class="{ 'dco-tab-check--done': readDoc[key] }">{{ readDoc[key] ? '✓' : '○' }}</span>
              {{ LEGAL_DOC_LABEL[key] }}
            </button>
          </div>

          <div ref="scrollPane" class="dco-doc" @scroll="onScroll(activeTab)" v-html="renderedDocs[activeTab]" />

          <div class="dco-reader-foot">
            <span v-if="!readDoc[activeTab]" class="dco-reader-hint">Scroll to the end to mark this document read.</span>
            <span v-else class="dco-reader-hint dco-reader-hint--done">Read ✓</span>
            <a :href="DOC_ROUTE[activeTab]" target="_blank" rel="noopener" class="dco-open-full">Open full page ↗</a>
          </div>
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
             sign-in path updated to check for it, not just this modal. Both
             stay disabled until all three documents above have been scrolled
             through at least once. -->
        <label class="dco-checkbox" :class="{ 'dco-checkbox--locked': !allRead }">
          <input v-model="agreedTerms" type="checkbox" :disabled="!allRead" />
          <span>I've read the Terms of Service, Privacy Policy, and Community Guidelines above and agree to them.</span>
        </label>

        <label class="dco-checkbox" :class="{ 'dco-checkbox--locked': !allRead }">
          <input v-model="agreedProcessing" type="checkbox" :disabled="!allRead" />
          <span>I consent to my data being processed and stored off-device — potentially across borders — when I sign in or submit data (comments, citizen-science reports, reward activity), as described in the Privacy Policy.</span>
        </label>

        <button class="dco-continue" :disabled="!canContinue" @click="acknowledge">
          {{ allRead ? 'Continue' : `Scroll through all three documents to continue (${readCount}/${DOC_KEYS.length})` }}
        </button>

      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, watch } from 'vue'
import { useRoute } from 'vue-router'
import { renderLegalDoc, LEGAL_DOC_LABEL, type LegalDocKey } from 'src/data/legal-docs'

// Bump this if Terms/Privacy/Guidelines change materially, or if this
// scroll-to-read flow itself changes materially — re-prompts everyone.
const CONSENT_VERSION = '2026-08-04-v4'
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

const DOC_KEYS: LegalDocKey[] = ['terms', 'privacy', 'community-guidelines']
const DOC_ROUTE: Record<LegalDocKey, string> = {
  terms: '/terms',
  privacy: '/privacy',
  'community-guidelines': '/community-guidelines',
}

const route = useRoute()
const visible = ref(false)
const agreedTerms      = ref(false)
const agreedProcessing = ref(false)

const activeTab = ref<LegalDocKey>('terms')
const readDoc = ref<Record<LegalDocKey, boolean>>({
  terms: false,
  privacy: false,
  'community-guidelines': false,
})
// Timestamps for the evidentiary log — not reactive state, just captured
// once per document the first time it's confirmed read.
const readAt: Partial<Record<LegalDocKey, string>> = {}

const renderedDocs: Record<LegalDocKey, string> = {
  terms:                  renderLegalDoc('terms'),
  privacy:                renderLegalDoc('privacy'),
  'community-guidelines': renderLegalDoc('community-guidelines'),
}

const readCount   = computed(() => DOC_KEYS.filter(k => readDoc.value[k]).length)
const allRead     = computed(() => readCount.value === DOC_KEYS.length)
const canContinue = computed(() => allRead.value && agreedTerms.value && agreedProcessing.value)

const scrollPane = ref<HTMLElement | null>(null)

function markRead(key: LegalDocKey) {
  if (!readDoc.value[key]) {
    readDoc.value[key] = true
    readAt[key] = new Date().toISOString()
  }
}

// A pane short enough to need no scrolling shouldn't trap the user on a
// technicality — check whenever a tab becomes active whether there's
// actually anything to scroll.
function checkFits() {
  const el = scrollPane.value
  if (!el) return
  if (el.scrollHeight <= el.clientHeight + 2) markRead(activeTab.value)
}

function onScroll(key: LegalDocKey) {
  const el = scrollPane.value
  if (!el) return
  if (el.scrollTop + el.clientHeight >= el.scrollHeight - 4) markRead(key)
}

// The three tabs share one scrollable element (only its v-html content
// swaps) — scrollTop is a property of that element, not the content, so it
// carries over across the swap. Left alone, scrolling a long document to
// the bottom then switching to a shorter one lands the shorter one's
// scrollTop past its own (smaller) scrollHeight, which reads as "already at
// the bottom" and silently marks it read with zero actual scrolling. Reset
// to the top on every tab switch before checking anything.
watch(activeTab, () => {
  void nextTick(() => {
    if (scrollPane.value) scrollPane.value.scrollTop = 0
    checkFits()
  })
})

function alreadyConsented(): boolean {
  try {
    return localStorage.getItem(CONSENT_KEY) === CONSENT_VERSION
  } catch { return false }   // private mode — fall through and prompt every time
}

watch(() => route.path, (path) => {
  const shouldShow = !EXEMPT_PATHS.includes(path) && !alreadyConsented()
  visible.value = shouldShow
  if (shouldShow) void nextTick(checkFits)
}, { immediate: true })

// Logged the same way as MintPage.vue's mint-disclaimer acceptance — a
// per-action, timestamped record beats "by using this site you agree" in a
// footer for evidentiary purposes (RISK_REDUCTION_RECOMMENDATIONS.md §7).
// Both consents are logged as distinct entries, not one combined flag, and
// each carries the per-document read timestamps that unlocked it.
function logConsentAcceptance() {
  try {
    const key = 'exo.consent-log'
    const log = JSON.parse(localStorage.getItem(key) ?? '[]') as unknown[]
    const acceptedAt = new Date().toISOString()
    log.push({ version: CONSENT_VERSION, consent: 'terms', acceptedAt, readAt: { ...readAt } })
    log.push({ version: CONSENT_VERSION, consent: 'data-processing', acceptedAt, readAt: { ...readAt } })
    localStorage.setItem(key, JSON.stringify(log))
  } catch { /* private mode / quota */ }
}

function acknowledge() {
  if (!canContinue.value) return
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
  width: min(560px, 100%);
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

.dco-reader {
  margin: 18px 0 14px;
  padding-top: 14px;
  border-top: 1px solid rgba(255,255,255,0.08);
}

.dco-tabs { display: flex; flex-wrap: wrap; gap: 4px; margin-bottom: 8px; }
.dco-tab {
  display: flex; align-items: center; gap: 5px;
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 5px 5px 0 0;
  color: #8898b0;
  font-family: inherit;
  font-size: 10.5px;
  padding: 6px 10px;
  cursor: pointer;
}
.dco-tab--active { background: rgba(0,212,180,0.10); border-color: rgba(0,212,180,0.35); color: #cfe8f0; }
.dco-tab-check { font-size: 10px; color: #4a5a70; }
.dco-tab-check--done { color: #00d4b4; }

.dco-doc {
  height: 190px;
  overflow-y: auto;
  background: rgba(0,0,0,0.25);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 0 6px 6px 6px;
  padding: 12px 14px;
  font-family: 'Roboto', sans-serif;
  font-size: 11px;
  line-height: 1.6;
  color: #a8b8d0;
}
.dco-doc :deep(h1) { font-size: 15px; font-weight: 700; color: #e0ecff; margin: 0 0 10px; }
.dco-doc :deep(h2) { font-size: 12.5px; font-weight: 600; color: #c0d0f0; margin: 18px 0 8px; padding-bottom: 4px; border-bottom: 1px solid rgba(255,255,255,0.07); }
.dco-doc :deep(h3) { font-size: 11.5px; font-weight: 600; color: #a0b0d0; margin: 14px 0 6px; }
.dco-doc :deep(p) { margin: 0 0 10px; }
.dco-doc :deep(a) { color: #4fb8e8; }
.dco-doc :deep(ul), .dco-doc :deep(ol) { margin: 0 0 10px; padding-left: 18px; }
.dco-doc :deep(li) { margin-bottom: 4px; }
.dco-doc :deep(strong) { color: #c8d8f0; }
.dco-doc :deep(hr) { border: none; border-top: 1px solid rgba(255,255,255,0.08); margin: 16px 0; }
.dco-doc :deep(table) { width: 100%; border-collapse: collapse; margin: 0 0 12px; font-size: 10px; }
.dco-doc :deep(th), .dco-doc :deep(td) { border: 1px solid rgba(255,255,255,0.08); padding: 4px 6px; text-align: left; }

.dco-reader-foot {
  display: flex; align-items: center; justify-content: space-between;
  margin-top: 6px; font-size: 10px;
}
.dco-reader-hint { color: #7888a0; }
.dco-reader-hint--done { color: #00d4b4; }
.dco-open-full { color: #5a8ac0; text-decoration: none; }
.dco-open-full:hover { color: #7ab0e8; }

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
.dco-checkbox--locked { color: #5a6a80; cursor: default; }
.dco-checkbox--locked input { cursor: default; }

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
  .dco-doc { height: 150px; }
}
</style>
