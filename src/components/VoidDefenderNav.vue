<template>
  <div class="vdn" :class="{ 'is-collapsed': collapsed }" :style="{ bottom: bottomPx + 'px' }">
    <div class="vdn-header">
      <span class="vdn-title">VOID NAV</span>
      <span class="vdn-sep">│</span>
      <span class="vdn-current">{{ voidName }}</span>
      <span class="vdn-count">{{ members.length }} objects</span>

      <div class="vdn-mode-switch">
        <button class="vdn-mode-btn" :class="{ 'vdn-mode-btn--active': mode === 'objects' }" @click="mode = 'objects'">LIST</button>
        <button class="vdn-mode-btn" :class="{ 'vdn-mode-btn--active': mode === 'ring' }" @click="mode = 'ring'">EDGE RING</button>
      </div>

      <button class="vdn-collapse" @click="collapsed = !collapsed">{{ collapsed ? '▲' : '▼' }}</button>
    </div>

    <div v-show="!collapsed" class="vdn-body">

      <!-- Objects list mode — the limited catalogued objects within the void -->
      <div v-if="mode === 'objects'" class="vdn-list">
        <div v-for="group in groupedMembers" :key="group.zone" class="vdn-zone-group">
          <div class="vdn-zone-label" :class="`vdn-zone-label--${group.zone}`">{{ zoneLabel(group.zone) }} · {{ group.items.length }}</div>
          <div class="vdn-zone-items">
            <button
              v-for="m in group.items" :key="m.id"
              class="vdn-item"
              :class="{ 'vdn-item--current': m.id === currentId }"
              @click="emit('select', m.id)"
            >{{ m.name }}</button>
          </div>
        </div>
        <div v-if="!members.length" class="vdn-empty">No catalogued objects in this void yet.</div>
      </div>

      <!-- Edge ring mode — wall / far-wall galaxies positioned around the void's boundary shell -->
      <div v-else class="vdn-ring-wrap">
        <div class="vdn-ring">
          <div class="vdn-ring-centre">
            <span>{{ voidName }}</span>
            <span class="vdn-ring-centre-sub">interior</span>
          </div>
          <button
            v-for="m in ringMembers" :key="m.id"
            class="vdn-ring-dot"
            :class="[`vdn-ring-dot--${m.zone}`, { 'vdn-ring-dot--current': m.id === currentId }]"
            :style="ringDotStyle(m.angleDeg)"
            :title="m.name"
            @click="emit('select', m.id)"
          >
            <span class="vdn-ring-label">{{ m.name }}</span>
          </button>
        </div>
        <div v-if="!ringMembers.length" class="vdn-empty">No wall-zone objects catalogued yet.</div>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

export interface VoidNavMember {
  id:       string
  name:     string
  zone:     'wall' | 'interior' | 'far_wall'
  angleDeg: number    // position around the void centre (atan2 of XZ offset) — real, not arbitrary
}

const props = withDefaults(defineProps<{
  voidId:     string
  voidName:   string
  members:    VoidNavMember[]
  currentId?: string
  bottomPx?:  number    // clears other bottom-anchored page furniture — default matches BlackHoleDefenderNav
}>(), {
  bottomPx: 18,
})

const emit = defineEmits<{ select: [memberId: string] }>()

const collapsed = ref(false)
const mode      = ref<'objects' | 'ring'>('objects')

const ZONE_ORDER: VoidNavMember['zone'][] = ['wall', 'far_wall', 'interior']
const ZONE_LABELS: Record<VoidNavMember['zone'], string> = {
  wall:      'NEAR WALL',
  far_wall:  'FAR WALL',
  interior:  'DEEP INTERIOR',
}
function zoneLabel(z: VoidNavMember['zone']): string { return ZONE_LABELS[z] }

const groupedMembers = computed(() =>
  ZONE_ORDER
    .map(zone => ({ zone, items: props.members.filter(m => m.zone === zone) }))
    .filter(g => g.items.length)
)

// Edge ring only shows boundary-shell objects — deep interior objects have no
// meaningful position on a wall ring.
const ringMembers = computed(() => props.members.filter(m => m.zone !== 'interior'))

function ringDotStyle(angleDeg: number) {
  return { transform: `rotate(${angleDeg}deg) translate(var(--vdn-ring-radius)) rotate(${-angleDeg}deg)` }
}
</script>

<style scoped>
.vdn {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  width: min(720px, 92vw);
  background: rgba(1, 8, 16, 0.92);
  border: 1px solid rgba(0, 229, 255, 0.25);
  border-radius: 6px;
  font-family: 'Roboto Mono', monospace;
  font-size: 11px;
  color: #b0c8e8;
  backdrop-filter: blur(4px);
  z-index: 20;
}

.vdn-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  border-bottom: 1px solid rgba(0, 229, 255, 0.15);
}
.is-collapsed .vdn-header { border-bottom: none; }

.vdn-title   { color: #00e5ff; font-weight: 700; letter-spacing: 0.05em; }
.vdn-sep     { color: rgba(176, 200, 232, 0.3); }
.vdn-current { color: #b0c8e8; }
.vdn-count   { color: rgba(176, 200, 232, 0.5); flex: 1; font-size: 9px; }

.vdn-mode-switch { display: flex; gap: 4px; }
.vdn-mode-btn {
  background: rgba(0, 80, 120, 0.18);
  border: 1px solid rgba(0, 180, 220, 0.25);
  color: #b0c8e8;
  border-radius: 3px;
  padding: 2px 8px;
  font-size: 9px;
  letter-spacing: 0.05em;
  cursor: pointer;
  font-family: inherit;
}
.vdn-mode-btn:hover           { background: rgba(0, 180, 220, 0.20); color: #00e5ff; }
.vdn-mode-btn--active         { background: rgba(0, 229, 255, 0.18); color: #00e5ff; border-color: #00e5ff; }

.vdn-collapse {
  background: none;
  border: none;
  color: #00e5ff;
  cursor: pointer;
  padding: 0 4px;
  font-size: 10px;
}

.vdn-body { padding: 12px 16px 14px; }
.vdn-empty { font-size: 10px; color: rgba(176, 200, 232, 0.45); font-style: italic; padding: 6px 0; }

/* ── Objects list mode ─────────────────────────────────────────────────── */

.vdn-list { display: flex; flex-direction: column; gap: 10px; max-height: 140px; overflow-y: auto; }
.vdn-zone-label {
  font-size: 9px;
  letter-spacing: 0.08em;
  margin-bottom: 5px;
  color: rgba(176, 200, 232, 0.55);
}
.vdn-zone-label--wall     { color: #00e5ff; }
.vdn-zone-label--far_wall { color: #ff9955; }
.vdn-zone-items { display: flex; flex-wrap: wrap; gap: 6px; }

.vdn-item {
  background: rgba(0, 80, 120, 0.18);
  border: 1px solid rgba(0, 180, 220, 0.25);
  color: #b0c8e8;
  border-radius: 3px;
  padding: 3px 8px;
  font-size: 10px;
  cursor: pointer;
  font-family: inherit;
}
.vdn-item:hover        { background: rgba(0, 180, 220, 0.20); color: #00e5ff; }
.vdn-item--current      { background: rgba(0, 229, 255, 0.18); color: #00e5ff; border-color: #00e5ff; }

/* ── Edge ring mode ────────────────────────────────────────────────────── */

.vdn-ring-wrap { display: flex; justify-content: center; padding: 6px 0 2px; }
.vdn-ring {
  --vdn-ring-radius: 76px;
  position: relative;
  width: calc(var(--vdn-ring-radius) * 2 + 24px);
  height: calc(var(--vdn-ring-radius) * 2 + 24px);
  max-height: 168px;
}

.vdn-ring-centre {
  position: absolute;
  top: 50%; left: 50%;
  transform: translate(-50%, -50%);
  display: flex; flex-direction: column; align-items: center;
  font-size: 9px;
  color: rgba(176, 200, 232, 0.65);
  text-align: center;
  width: 72px;
}
.vdn-ring-centre-sub { font-size: 8px; color: rgba(176, 200, 232, 0.4); letter-spacing: 0.08em; }

.vdn-ring-dot {
  position: absolute;
  top: 50%; left: 50%;
  width: 9px; height: 9px;
  margin: -4.5px 0 0 -4.5px;
  border-radius: 50%;
  border: none;
  cursor: pointer;
  padding: 0;
  background: #00e5ff;
  box-shadow: 0 0 6px currentColor;
}
.vdn-ring-dot--wall      { background: #00e5ff; color: #00e5ff; }
.vdn-ring-dot--far_wall  { background: #ff9955; color: #ff9955; }
.vdn-ring-dot--current   { outline: 2px solid #fff; outline-offset: 1px; }

.vdn-ring-label {
  position: absolute;
  top: 12px; left: 50%;
  transform: translateX(-50%);
  font-size: 8px;
  color: rgba(176, 200, 232, 0.7);
  white-space: nowrap;
  pointer-events: none;
}
</style>
