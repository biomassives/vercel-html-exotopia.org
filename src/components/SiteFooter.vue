<template>
  <div class="sf-bar">
    <div class="sf-links">
      <button type="button" class="sf-about" @click="aboutOpen = true">About</button>
      <router-link to="/terms">Terms</router-link>
      <router-link to="/privacy">Privacy</router-link>
      <router-link to="/community-guidelines">Community Guidelines</router-link>
      <router-link to="/account">Your Data</router-link>
      <button type="button" class="sf-about sf-report" @click="reportOpen = true">Report a problem</button>
      <a :href="REPO_URL" target="_blank" rel="noopener">Source</a>
    </div>
  </div>

  <AboutExotopiaModal v-model="aboutOpen" />
  <ReportIssueModal v-model="reportOpen" />
</template>

<script setup lang="ts">
import { ref } from 'vue'
import AboutExotopiaModal from 'src/components/AboutExotopiaModal.vue'
import ReportIssueModal from 'src/components/ReportIssueModal.vue'

const REPO_URL = 'https://github.com/biomassives/vercel-html-exotopia.org'
const aboutOpen = ref(false)
const reportOpen = ref(false)
</script>

<style scoped>
/* Always visible, no collapse toggle — a legal-links footer that hides
   itself behind a click isn't actually discoverable. See the "toggle out
   of view in an unusable manner" bug report this replaced. */
.sf-bar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 8000;
  display: flex;
  align-items: center;
  padding: 4px 12px;
  background: rgba(3, 6, 12, 0.82);
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  backdrop-filter: blur(4px);
  font-family: 'Courier New', monospace;
  pointer-events: none;
}
.sf-bar > * { pointer-events: auto; }

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

.sf-about {
  background: none;
  border: none;
  padding: 0;
  margin: 0;
  font: inherit;
  letter-spacing: inherit;
  color: rgba(0, 212, 180, 0.72);
  cursor: pointer;
}
.sf-about:hover { color: rgba(0, 240, 210, 0.95); }
.sf-report { color: rgba(255, 170, 90, 0.65) !important; }
.sf-report:hover { color: rgba(255, 190, 120, 0.90) !important; }

@media (max-width: 560px) {
  .sf-links { gap: 4px 10px; }
}
</style>
