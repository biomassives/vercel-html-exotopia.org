<template>
  <q-page class="ldg-page">
    <div class="ldg-wrap">
      <router-link to="/" class="ldg-back-link">← Exotopia</router-link>

      <div class="ldg-tabs">
        <router-link to="/terms" class="ldg-tab" :class="{ 'ldg-tab--active': docKey === 'terms' }">Terms of Service</router-link>
        <router-link to="/privacy" class="ldg-tab" :class="{ 'ldg-tab--active': docKey === 'privacy' }">Privacy Policy</router-link>
        <router-link to="/community-guidelines" class="ldg-tab" :class="{ 'ldg-tab--active': docKey === 'community-guidelines' }">Community Guidelines</router-link>
      </div>

      <div v-if="hasChangelog" class="ldg-changelog-link">
        <router-link v-if="!isChangelog" :to="`/${docKey}/changelog`">View full changelog →</router-link>
        <router-link v-else :to="`/${docKey}`">← Back to {{ LEGAL_DOC_LABEL[docKey] }}</router-link>
      </div>

      <article v-if="hasDoc" class="ldg-content" v-html="html" />
      <div v-else class="ldg-missing">
        <p>{{ LEGAL_DOC_LABEL[docKey] }}{{ isChangelog ? ' changelog' : '' }} hasn't been published yet.</p>
        <p class="ldg-missing-sub">Expected at <code>{{ expectedFile }}</code> (repo root, rendered as Markdown).</p>
      </div>

      <div class="ldg-repo-links">
        <a :href="REPO_URL" target="_blank" rel="noopener">View source on GitHub</a>
        <a :href="`${REPO_URL}/issues`" target="_blank" rel="noopener">File an issue</a>
        <a :href="`${REPO_URL}/pulls`" target="_blank" rel="noopener">Open pull requests</a>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import {
  hasLegalDoc, renderLegalDoc,
  hasLegalChangelog, renderLegalChangelog,
  LEGAL_DOC_LABEL, type LegalDocKey,
} from 'src/data/legal-docs'

const REPO_URL = 'https://github.com/biomassives/vercel-html-exotopia.org'

const route       = useRoute()
const docKey      = computed(() => route.meta.docKey as LegalDocKey)
const isChangelog = computed(() => !!route.meta.changelog)
const hasChangelog = computed(() => hasLegalChangelog(docKey.value))
const hasDoc = computed(() => isChangelog.value ? hasLegalChangelog(docKey.value) : hasLegalDoc(docKey.value))
const html   = computed(() => isChangelog.value ? renderLegalChangelog(docKey.value) : renderLegalDoc(docKey.value))
const expectedFile = computed(() => `legal-${docKey.value}${isChangelog.value ? '-changelog' : ''}.md`)

watch([docKey, isChangelog], ([key, changelog]) => {
  document.title = `${LEGAL_DOC_LABEL[key]}${changelog ? ' — Changelog' : ''} — Exotopia`
}, { immediate: true })
</script>

<style scoped>
.ldg-page { background: #050912; min-height: 100vh; color: #c8d4e8; font-family: 'Roboto', sans-serif; }
.ldg-wrap { max-width: 760px; margin: 0 auto; padding: 28px 24px 80px; }

.ldg-back-link { color: #4488cc; text-decoration: none; font-size: 13px; }
.ldg-back-link:hover { color: #66aaee; }

.ldg-tabs { display: flex; gap: 4px; flex-wrap: wrap; margin: 20px 0 28px; border-bottom: 1px solid rgba(255,255,255,0.08); }
.ldg-tab {
  padding: 8px 12px; font-size: 12.5px; color: #7888aa; text-decoration: none;
  border-bottom: 2px solid transparent; margin-bottom: -1px;
}
.ldg-tab:hover { color: #c8d4e8; }
.ldg-tab--active { color: #00e5ff; border-bottom-color: #00e5ff; }

.ldg-changelog-link { margin: -12px 0 20px; font-size: 12.5px; }
.ldg-changelog-link a { color: #4488cc; text-decoration: none; }
.ldg-changelog-link a:hover { color: #66aaee; }

.ldg-missing { padding: 32px 0; color: #7888aa; font-size: 14px; line-height: 1.7; }
.ldg-missing-sub { font-size: 12px; color: #5a6a8a; }
.ldg-missing code { background: rgba(255,255,255,0.06); padding: 2px 6px; border-radius: 3px; color: #ffaa33; }

.ldg-content { line-height: 1.75; font-size: 15px; color: #b0c0dc; }
.ldg-content :deep(h1) { font-size: 24px; font-weight: 700; color: #e8f0ff; margin: 0 0 20px; letter-spacing: -0.02em; }
.ldg-content :deep(h2) { font-size: 17px; font-weight: 600; color: #c8d8f8; margin: 32px 0 12px; padding-bottom: 6px; border-bottom: 1px solid rgba(255,255,255,0.07); }
.ldg-content :deep(h3) { font-size: 14px; font-weight: 600; color: #a8b8d8; margin: 24px 0 8px; }
.ldg-content :deep(p) { margin: 0 0 16px; }
.ldg-content :deep(a) { color: #4488cc; }
.ldg-content :deep(a):hover { color: #66aaee; }
.ldg-content :deep(ul), .ldg-content :deep(ol) { margin: 0 0 16px; padding-left: 22px; }
.ldg-content :deep(li) { margin-bottom: 6px; }
.ldg-content :deep(strong) { color: #d0dff8; font-weight: 600; }
.ldg-content :deep(hr) { border: none; border-top: 1px solid rgba(255,255,255,0.08); margin: 28px 0; }

.ldg-repo-links {
  display: flex; flex-wrap: wrap; gap: 16px;
  margin-top: 48px; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.06);
  font-size: 12.5px;
}
.ldg-repo-links a { color: #5a8ac0; text-decoration: none; }
.ldg-repo-links a:hover { color: #7ab0e8; }
</style>
