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

        <div class="dco-links">
          <router-link to="/terms" target="_blank">Terms of Service</router-link>
          <router-link to="/privacy" target="_blank">Privacy Policy</router-link>
          <router-link to="/community-guidelines" target="_blank">Community Guidelines</router-link>
        </div>

        <div class="dco-repo-links">
          <a :href="REPO_URL" target="_blank" rel="noopener">View source on GitHub</a>
          <a :href="`${REPO_URL}/issues/new`" target="_blank" rel="noopener">File an issue</a>
          <a :href="`${REPO_URL}/pulls`" target="_blank" rel="noopener">Open pull requests</a>
        </div>

        <label class="dco-checkbox">
          <input v-model="agreed" type="checkbox" />
          <span>I understand this is a live demo that may change, and I've read the linked Terms, Privacy Policy, and Community Guidelines.</span>
        </label>

        <button class="dco-continue" :disabled="!agreed" @click="acknowledge">
          Continue
        </button>

      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

// Bump this if Terms/Privacy/Guidelines change materially — re-prompts everyone.
const CONSENT_VERSION = '2026-07-21-v1'
const CONSENT_KEY = 'exo_demo_consent'

const REPO_URL = 'https://github.com/biomassives/vercel-html-exotopia.org'

const visible = ref(false)
const agreed  = ref(false)

onMounted(() => {
  try {
    if (localStorage.getItem(CONSENT_KEY) === CONSENT_VERSION) return
  } catch { /* private mode — fall through and show it every time */ }
  visible.value = true
})

function acknowledge() {
  if (!agreed.value) return
  visible.value = false
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
