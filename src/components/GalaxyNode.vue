<template>
  <div 
    class="galaxy-node" 
    :class="{ 'galaxy-node--named': galaxy.is_named }"
    :style="{ '--hubble-color': hubbleColor(galaxy.hubble) }"
  >
    <div class="galaxy-morph-glyph" :class="'morph--' + cleanHubbleClass">
      <svg viewBox="0 0 24 24" class="morph-svg">
        <ellipse v-if="morphType === 'elliptical'" cx="12" cy="12" rx="9" ry="6" />
        
        <g v-else-if="morphType === 'spiral'">
          <circle cx="12" cy="12" r="3" />
          <path d="M12,2 C16,2 20,6 20,12 C20,16 16,20 12,20 C8,20 4,16 4,12" fill="none" stroke="currentColor" stroke-width="1.5" stroke-dasharray="2 1" />
          <path d="M12,6 C14,6 16,8 16,12 C16,14 14,16 12,16 C10,16 8,14 8,12" fill="none" stroke="currentColor" stroke-width="1.5" />
        </g>
        
        <g v-else-if="morphType === 'lenticular'">
          <ellipse cx="12" cy="12" rx="10" ry="2" />
          <circle cx="12" cy="12" r="4" />
        </g>
        
        <g v-else>
          <circle cx="9" cy="10" r="2.5" />
          <circle cx="15" cy="14" r="2" />
          <circle cx="13" cy="8" r="1.5" />
        </g>
      </svg>
    </div>

    <div class="galaxy-identity">
      <span class="g-id">{{ galaxy.name ?? galaxy.id }}</span>
      <span v-if="galaxy.aliases?.length" class="g-alias">{{ galaxy.aliases[0] }}</span>
    </div>

    <div class="galaxy-spec">
      <span class="g-hubble">{{ galaxy.hubble }}</span>
      <span class="g-mag">{{ galaxy.bt_mag != null ? galaxy.bt_mag.toFixed(1) + ' B' : '—' }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface MemberGalaxy {
  id:        string
  name?:     string
  aliases?:  string[]
  hubble:    string
  bt_mag?:   number
  is_named?: boolean
}

const props = defineProps<{
  galaxy: MemberGalaxy
}>()

const cleanHubbleClass = computed(() => props.galaxy.hubble?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'unk')

const morphType = computed(() => {
  const t = props.galaxy.hubble?.toUpperCase() || ''
  if (t.startsWith('CD') || t.startsWith('E')) return 'elliptical'
  if (t.startsWith('S0' || t.startsWith('SB0'))) return 'lenticular'
  if (t.startsWith('SA') || t.startsWith('SB') || t.startsWith('S')) return 'spiral'
  return 'irregular'
})

function hubbleColor(type: string): string {
  if (!type) return '#607d8b'
  const t = type.toUpperCase()
  if (t.startsWith('CD') || t.startsWith('C'))  return '#ffd2a1'
  if (t.startsWith('E'))  return '#ffe0a8'
  if (t.startsWith('S0')) return '#c8d8e8'
  if (t.startsWith('SA') || t.startsWith('SB') || t === 'S') return '#80c8ff'
  return '#a8ff80' // Irregulars
}
</script>

<style scoped>
.galaxy-node {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 6px 10px;
  background: radial-gradient(circle at 10% 50%, rgba(0, 40, 90, 0.15), transparent);
  border: 1px solid rgba(0, 80, 140, 0.12);
  border-radius: 20px; /* Rounds out the box outline completely */
  margin-bottom: 4px;
  transition: all 0.2s ease;
}

.galaxy-node:hover {
  border-color: var(--hubble-color);
  background: rgba(0, 20, 50, 0.4);
  box-shadow: 0 0 8px rgba(0, 180, 255, 0.1);
}

.galaxy-node--named {
  border-inline-start: 3px solid var(--hubble-color);
}

/* Rounded Vector Icon container */
.galaxy-morph-glyph {
  width: 22px;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--hubble-color);
  flex-shrink: 0;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.3);
}

.morph-svg {
  width: 100%;
  height: 100%;
  fill: currentColor;
}

.galaxy-identity {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
}

.g-id {
  font-size: 9px;
  font-weight: bold;
  color: rgba(200, 230, 255, 0.85);
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
}

.g-alias {
  font-size: 7.5px;
  color: rgba(200, 180, 100, 0.5);
}

.galaxy-spec {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 8px;
}

.g-hubble {
  color: var(--hubble-color);
  font-weight: 600;
}

.g-mag {
  color: rgba(80, 140, 180, 0.6);
}
</style>
