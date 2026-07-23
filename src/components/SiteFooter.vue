<template>
  <div class="sf-bar" :class="{ 'sf-bar--collapsed': collapsed }">
    <button class="sf-toggle" :aria-label="collapsed ? 'Show site links' : 'Hide site links'" @click="collapsed = !collapsed">
      {{ collapsed ? '⌃' : '⌄' }}
    </button>
    <div v-if="!collapsed" class="sf-links">
      <router-link to="/terms">Terms</router-link>
      <router-link to="/privacy">Privacy</router-link>
      <router-link to="/community-guidelines">Community Guidelines</router-link>
      <router-link to="/account">Your Data</router-link>
      <a :href="`${REPO_URL}/issues/new`" target="_blank" rel="noopener" class="sf-report">Report a problem</a>
      <a :href="REPO_URL" target="_blank" rel="noopener">Source</a>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const REPO_URL = 'https://github.com/biomassives/vercel-html-exotopia.org'
const collapsed = ref(true)
</script>

<style scoped>
.sf-bar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 8000;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 4px 12px;
  background: rgba(3, 6, 12, 0.82);
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  backdrop-filter: blur(4px);
  font-family: 'Courier New', monospace;
  pointer-events: none;
}
.sf-bar > * { pointer-events: auto; }

.sf-toggle {
  flex-shrink: 0;
  background: none;
  border: none;
  color: rgba(140, 170, 200, 0.55);
  font-size: 11px;
  line-height: 1;
  cursor: pointer;
  padding: 3px 6px;
}
.sf-toggle:hover { color: rgba(180, 210, 240, 0.85); }

.sf-links {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 14px;
  font-size: 10px;
  letter-spacing: 0.04em;
}
.sf-links a {
  color: rgba(120, 160, 200, 0.62);
  text-decoration: none;
}
.sf-links a:hover { color: rgba(160, 200, 240, 0.90); }
.sf-report { color: rgba(255, 170, 90, 0.65) !important; }
.sf-report:hover { color: rgba(255, 190, 120, 0.90) !important; }

@media (max-width: 560px) {
  .sf-links { gap: 4px 10px; }
}
</style>
