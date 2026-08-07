<template>
  <Transition name="ri-fade">
    <div v-if="modelValue" class="ri-backdrop" @click.self="close">
      <div class="ri-card" role="dialog" aria-modal="true" aria-labelledby="ri-title">
        <button class="ri-close" aria-label="Close" @click="close">✕</button>

        <div class="ri-badge">REPORT SOMETHING</div>
        <h2 id="ri-title" class="ri-title">What kind of report is this?</h2>
        <p class="ri-lead">
          Filing directly on GitHub or GitLab gets it in front of maintainers fastest and lets you
          track its status. Pick whichever account you already have — both repos are kept in sync.
        </p>

        <div class="ri-type-grid">
          <button v-for="t in TYPES" :key="t.id" class="ri-type-btn"
            :class="{ 'ri-type-btn--active': activeType === t.id }"
            @click="activeType = t.id">
            <span class="ri-type-icon">{{ t.icon }}</span>
            <span class="ri-type-label">{{ t.label }}</span>
          </button>
        </div>

        <!-- Bug / Feature: platform picker -->
        <div v-if="activeType !== 'security'" class="ri-panel">
          <p class="ri-panel-desc">{{ current.desc }}</p>
          <div class="ri-platform-row">
            <a :href="current.githubUrl" target="_blank" rel="noopener" class="ri-platform-btn ri-platform-btn--github">
              File on GitHub ↗
            </a>
            <a :href="current.gitlabUrl" target="_blank" rel="noopener" class="ri-platform-btn ri-platform-btn--gitlab">
              File on GitLab ↗
            </a>
          </div>
        </div>

        <!-- Security: private disclosure only, no public issue path -->
        <div v-else class="ri-panel ri-panel--security">
          <p class="ri-panel-desc">
            Please don't file security issues as a public bug report — it gives anyone a head
            start before we can fix it. Use one of these private paths instead:
          </p>
          <div class="ri-security-list">
            <a :href="SECURITY.githubAdvisory" target="_blank" rel="noopener" class="ri-security-item">
              <strong>GitHub Private Vulnerability Reporting</strong> — recommended, if you have a GitHub account ↗
            </a>
            <a :href="SECURITY.gitlabConfidential" target="_blank" rel="noopener" class="ri-security-item">
              <strong>GitLab confidential issue</strong> — automatically hidden from public view ↗
            </a>
            <a :href="`mailto:${SECURITY.email}`" class="ri-security-item">
              <strong>Email {{ SECURITY.email }}</strong> — if neither account works for you
            </a>
          </div>
        </div>

        <div class="ri-footlinks">
          <a :href="REPO_URL" target="_blank" rel="noopener">Source</a>
          <a :href="GITLAB_URL" target="_blank" rel="noopener">GitLab mirror</a>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

defineProps<{ modelValue: boolean }>()
const emit = defineEmits<{ 'update:modelValue': [value: boolean] }>()

function close() {
  emit('update:modelValue', false)
}

const REPO_URL = 'https://github.com/biomassives/vercel-html-exotopia.org'
// Keep this in sync with the GITLAB_REPO secret used by
// .github/workflows/mirror-to-gitlab.yml — if that path changes, update here too.
const GITLAB_URL = 'https://gitlab.com/biomassives/exotopia-org'

const SECURITY = {
  githubAdvisory: `${REPO_URL}/security/advisories/new`,
  gitlabConfidential: `${GITLAB_URL}/-/issues/new?issuable_template=Security`,
  email: 'legal@exotopia.org',
}

type ReportType = 'bug' | 'feature' | 'security'

const TYPES: { id: ReportType; label: string; icon: string }[] = [
  { id: 'bug',      label: 'Bug',              icon: '🐛' },
  { id: 'feature',  label: 'Feature request',  icon: '💡' },
  { id: 'security', label: 'Security issue',   icon: '🔒' },
]

const activeType = ref<ReportType>('bug')

const PANELS: Record<Exclude<ReportType, 'security'>, { desc: string; githubUrl: string; gitlabUrl: string }> = {
  bug: {
    desc: 'Something broken or behaving unexpectedly.',
    githubUrl: `${REPO_URL}/issues/new?template=bug_report.yml`,
    gitlabUrl: `${GITLAB_URL}/-/issues/new?issuable_template=Bug`,
  },
  feature: {
    desc: 'An idea, improvement, or new capability.',
    githubUrl: `${REPO_URL}/issues/new?template=feature_request.yml`,
    gitlabUrl: `${GITLAB_URL}/-/issues/new?issuable_template=Feature`,
  },
}

const current = computed(() => PANELS[activeType.value as Exclude<ReportType, 'security'>])
</script>

<style scoped>
.ri-backdrop {
  position: fixed;
  inset: 0;
  z-index: 8500;
  background: rgba(0, 2, 10, 0.82);
  backdrop-filter: blur(6px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  font-family: 'Courier New', monospace;
}

.ri-card {
  position: relative;
  width: min(520px, 100%);
  max-height: calc(100vh - 48px);
  overflow-y: auto;
  background: rgba(4, 8, 20, 0.97);
  border: 1px solid rgba(255, 170, 90, 0.25);
  border-radius: 12px;
  padding: 30px 28px 26px;
  color: #c8d8e8;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.6);
}

.ri-close {
  position: absolute;
  top: 14px; right: 14px;
  background: none;
  border: 1px solid rgba(255,255,255,0.12);
  border-radius: 5px;
  color: #8898b0;
  width: 26px; height: 26px;
  cursor: pointer;
  font-size: 12px;
  line-height: 1;
}
.ri-close:hover { color: #cfe8f0; border-color: rgba(255,170,90,0.4); }

.ri-badge {
  display: inline-block;
  font-size: 9px;
  letter-spacing: 0.16em;
  color: #ffaa5a;
  border: 1px solid rgba(255, 170, 90, 0.35);
  border-radius: 3px;
  padding: 2px 8px;
  margin-bottom: 12px;
}

.ri-title { font-size: 18px; font-weight: 700; color: #e8f0ff; margin: 0 0 10px; letter-spacing: -0.01em; line-height: 1.25; }
.ri-lead  { font-size: 12px; line-height: 1.65; color: #93a5bd; margin: 0 0 18px; }

.ri-type-grid { display: flex; gap: 8px; margin-bottom: 16px; }
.ri-type-btn {
  flex: 1; display: flex; flex-direction: column; align-items: center; gap: 4px;
  background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08);
  border-radius: 8px; padding: 10px 6px; cursor: pointer;
  color: #93a5bd; font-family: inherit;
}
.ri-type-btn:hover { border-color: rgba(255,170,90,0.35); }
.ri-type-btn--active { background: rgba(255,170,90,0.08); border-color: rgba(255,170,90,0.5); color: #ffd8ae; }
.ri-type-icon { font-size: 18px; }
.ri-type-label { font-size: 10px; letter-spacing: 0.02em; }

.ri-panel { background: rgba(0,0,0,0.28); border: 1px solid rgba(255,255,255,0.08); border-radius: 10px; padding: 16px 18px; }
.ri-panel-desc { font-size: 11.5px; line-height: 1.6; color: #a8bcd8; margin: 0 0 14px; }

.ri-platform-row { display: flex; gap: 10px; flex-wrap: wrap; }
.ri-platform-btn {
  flex: 1; min-width: 140px; text-align: center;
  padding: 9px 12px; border-radius: 6px; font-size: 11.5px; text-decoration: none;
  border: 1px solid rgba(255,255,255,0.14); color: #dbe6f4;
}
.ri-platform-btn--github { background: rgba(255,255,255,0.06); }
.ri-platform-btn--github:hover { border-color: rgba(255,255,255,0.4); }
.ri-platform-btn--gitlab { background: rgba(252,109,38,0.08); border-color: rgba(252,109,38,0.3); }
.ri-platform-btn--gitlab:hover { border-color: rgba(252,109,38,0.6); }

.ri-panel--security { border-color: rgba(255, 90, 90, 0.25); }
.ri-security-list { display: flex; flex-direction: column; gap: 10px; }
.ri-security-item {
  display: block; font-size: 11.5px; line-height: 1.5; color: #a8bcd8;
  text-decoration: none; padding: 10px 12px; border-radius: 6px;
  background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08);
}
.ri-security-item strong { color: #ffb0b0; }
.ri-security-item:hover { border-color: rgba(255,90,90,0.4); }

.ri-footlinks {
  display: flex; flex-wrap: wrap; gap: 6px 14px;
  margin-top: 18px; padding-top: 14px;
  border-top: 1px solid rgba(255,255,255,0.08);
  font-size: 10.5px;
}
.ri-footlinks a { color: #6a8ab0; text-decoration: none; }
.ri-footlinks a:hover { color: #8ab0d8; }

.ri-fade-enter-active { transition: opacity 0.2s ease; }
.ri-fade-leave-active  { transition: opacity 0.15s ease; }
.ri-fade-enter-from, .ri-fade-leave-to { opacity: 0; }

@media (max-width: 480px) {
  .ri-card { padding: 24px 18px 20px; }
  .ri-type-grid { flex-direction: column; }
}
</style>
