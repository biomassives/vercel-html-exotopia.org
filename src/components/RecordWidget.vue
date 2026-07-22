<template>
  <!--
    RecordWidget.vue — persistent audio recorder in the top-right corner.
    Records from the microphone to IndexedDB (never uploaded anywhere).
    Shows live level bars during recording.
    Intended for: field voice notes, oral history, $SUNLIGHT source material,
                  eco-ops documentation, community science observations.
  -->
  <div v-if="!ecoOffline.panelOpen" class="rw-root">

    <!-- Main record button -->
    <button
      class="rw-btn"
      :class="{ 'rw-btn--recording': recording }"
      :title="recording ? `Stop recording · ${formatDuration(recDuration)}` : 'Record field audio'"
      @click="toggle"
    >
      <!-- Outer pulse ring (only while recording) -->
      <span v-if="recording" class="rw-pulse"/>
      <!-- Red dot -->
      <span class="rw-dot"/>
      <!-- REC label when recording -->
      <span v-if="recording" class="rw-rec-label">REC</span>
    </button>

    <!-- Pulldown-menu toggle -->
    <button
      class="rw-menu-btn"
      :class="{ 'rw-menu-btn--active': menuOpen }"
      title="Record & stage an entry"
      @click="menuOpen = !menuOpen"
    >
      <span v-if="stagedStore.unsubmittedCount" class="rw-menu-btn__badge">{{ stagedStore.unsubmittedCount }}</span>
      <q-icon :name="menuOpen ? 'expand_less' : 'expand_more'" size="13px" />
    </button>

    <!-- Level bars — animate with mic input while recording -->
    <Transition name="rw-bars">
      <div v-if="recording" class="rw-levels" aria-label="Audio level">
        <span
          v-for="(h, i) in levelBars"
          :key="i"
          class="rw-bar"
          :style="{ height: Math.max(12, h) + '%' }"
        />
      </div>
    </Transition>

    <!-- Duration timer -->
    <Transition name="rw-bars">
      <div v-if="recording" class="rw-duration">{{ formatDuration(recDuration) }}</div>
    </Transition>

    <!-- Error toast -->
    <Transition name="rw-bars">
      <div v-if="recError && !recording" class="rw-error">{{ recError }}</div>
    </Transition>

    <!-- Saved confirmation flash -->
    <Transition name="rw-bars">
      <div v-if="savedId" class="rw-saved">
        <span>✓ saved</span>
        <button class="rw-dl" @click="downloadRecording(savedId!)">↓ download</button>
      </div>
    </Transition>

    <!-- Pulldown menu: category picker, staging form, staged-entry list -->
    <Transition name="rw-bars">
      <div v-if="menuOpen" class="rw-menu">

        <div v-if="!activeCategory" class="rw-menu__categories">
          <button
            v-for="c in CATEGORIES" :key="c.key"
            class="rw-menu__cat" :style="{ '--ccolor': c.color }"
            @click="selectCategory(c.key)"
          >
            <span class="rw-menu__cat-icon">{{ c.icon }}</span>
            <span class="rw-menu__cat-label">{{ c.label }}</span>
          </button>

          <div v-if="stagedStore.unsubmittedCount" class="rw-menu__staged-toggle" @click="showStagedList = !showStagedList">
            Staged entries ({{ stagedStore.unsubmittedCount }}) {{ showStagedList ? '▲' : '▼' }}
          </div>
          <div v-if="showStagedList" class="rw-menu__staged-list">
            <div v-for="e in stagedStore.unsubmitted" :key="e.id" class="rw-menu__staged-item">
              <span class="rw-menu__staged-cat" :style="{ '--ccolor': CATEGORY_META[e.category].color }">{{ CATEGORY_META[e.category].icon }}</span>
              <span class="rw-menu__staged-title">{{ e.title || '(untitled)' }}</span>
              <button class="rw-menu__staged-submit" @click="submitStaged(e.id)">
                {{ e.category === 'learning_milestone' ? 'Archive' : 'Submit' }}
              </button>
              <button class="rw-menu__staged-del" title="Discard" @click="stagedStore.removeEntry(e.id)">✕</button>
            </div>
          </div>

          <button class="rw-menu__manage-link" @click="openLocalDataPanel">
            Manage all local data &amp; generate a report →
          </button>
        </div>

        <div v-else class="rw-menu__form">
          <div class="rw-menu__form-head">
            <span class="rw-menu__form-title" :style="{ color: CATEGORY_META[activeCategory].color }">
              {{ CATEGORY_META[activeCategory].icon }} {{ CATEGORY_META[activeCategory].label }}
            </span>
            <button class="rw-menu__back" @click="activeCategory = null">← back</button>
          </div>

          <input v-model="formTitle" class="rw-menu__input" placeholder="Short title" />

          <template v-if="activeCategory === 'eco_ops'">
            <select v-model="ecoActionKey" class="rw-menu__input">
              <option value="plastic_collection_kg">Plastics collected (kg)</option>
              <option value="eco_field_hours">Field hours (general)</option>
              <option value="other_volunteer_action">Other</option>
            </select>
            <input v-model.number="ecoQuantity" type="number" min="0" step="0.1" class="rw-menu__input" placeholder="Quantity (optional)" />
          </template>

          <template v-else-if="activeCategory === 'mentoring'">
            <select v-model="mentorTargetId" class="rw-menu__input" :disabled="!connections.length">
              <option value="" disabled>{{ connections.length ? 'Choose a connection…' : 'No connections yet' }}</option>
              <option v-for="c in connections" :key="c.id" :value="c.id">{{ c.display_name }}</option>
            </select>
            <input v-model="mentorTopic" class="rw-menu__input" placeholder="Topic (e.g. water testing basics)" />
          </template>

          <template v-else>
            <input v-model="learningTargetDate" type="date" class="rw-menu__input" title="Target date (optional)" />
          </template>

          <textarea v-model="formNotes" class="rw-menu__textarea" rows="2" placeholder="Notes — or just talk it out while recording"></textarea>

          <button
            class="rw-menu__rec-toggle" :class="{ 'rw-menu__rec-toggle--on': recording }"
            @click="toggle"
          >
            <span class="rw-dot rw-dot--inline" :class="{ 'rw-dot--on': recording }"/>
            {{ recording ? `Recording ${formatDuration(recDuration)}` : 'Record voice note' }}
          </button>

          <button class="rw-menu__stage-btn" :disabled="!canStage" @click="stageCurrent">Stage entry</button>
        </div>

      </div>
    </Transition>

  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  recording, levelBars, recDuration, recError,
  startRecording, stopRecording, downloadRecording, formatDuration,
} from 'src/lib/audio-recorder'
import { useStagedEntriesStore, type StagedCategory } from 'src/stores/staged-entries'
import { useMemberStore } from 'src/stores/member'
import { useEcoOfflineStore } from 'src/stores/eco-offline'
import { supabase } from 'src/lib/supabase'

const stagedStore  = useStagedEntriesStore()
const member       = useMemberStore()
const ecoOffline   = useEcoOfflineStore()

function openLocalDataPanel() {
  menuOpen.value = false
  ecoOffline.panelOpen = true
}

const savedId = ref<string | null>(null)
let savedTimer: ReturnType<typeof setTimeout> | null = null
// Most recently stopped recording, offered to whichever entry gets staged next.
const pendingAudioId = ref<string | null>(null)

async function toggle() {
  if (recording.value) {
    const id = await stopRecording()
    if (id) {
      savedId.value = id
      pendingAudioId.value = id
      if (savedTimer) clearTimeout(savedTimer)
      savedTimer = setTimeout(() => { savedId.value = null }, 6000)
    }
  } else {
    savedId.value = null
    await startRecording()
  }
}

// ── Pulldown menu: category picker + staging form ────────────────────────────

const menuOpen        = ref(false)
const showStagedList   = ref(false)
const activeCategory   = ref<StagedCategory | null>(null)

const CATEGORY_META: Record<StagedCategory, { label: string; icon: string; color: string }> = {
  eco_ops:            { label: 'Eco Ops',             icon: '🌱', color: '#ffaa33' },
  mentoring:          { label: 'Mentoring',           icon: '🤝', color: '#00e5ff' },
  learning_milestone: { label: 'Learning Milestone',  icon: '📘', color: '#44ff88' },
}
const CATEGORIES = (Object.keys(CATEGORY_META) as StagedCategory[]).map(key => ({ key, ...CATEGORY_META[key] }))

const formTitle          = ref('')
const formNotes          = ref('')
const ecoActionKey       = ref('plastic_collection_kg')
const ecoQuantity        = ref<number | null>(null)
const mentorTargetId     = ref('')
const mentorTopic        = ref('')
const learningTargetDate = ref('')

interface ConnectionOption { id: string; display_name: string }
const connections = ref<ConnectionOption[]>([])

async function loadConnections() {
  if (!supabase || !member.connectedIds.length) { connections.value = []; return }
  const { data } = await supabase.from('members').select('id, display_name').in('id', member.connectedIds)
  connections.value = (data as ConnectionOption[]) ?? []
}

function resetForm() {
  formTitle.value = ''; formNotes.value = ''
  ecoActionKey.value = 'plastic_collection_kg'; ecoQuantity.value = null
  mentorTargetId.value = ''; mentorTopic.value = ''
  learningTargetDate.value = ''
}

function selectCategory(cat: StagedCategory) {
  activeCategory.value = cat
  resetForm()
  if (cat === 'mentoring') void loadConnections()
  if (!recording.value) void startRecording()
}

const canStage = computed(() => {
  if (!activeCategory.value) return false
  if (activeCategory.value === 'mentoring') return !!mentorTargetId.value && !!mentorTopic.value
  return true
})

async function stageCurrent() {
  if (!activeCategory.value) return
  let audioId = pendingAudioId.value
  if (recording.value) audioId = await stopRecording()

  const cat = activeCategory.value
  stagedStore.stage({
    category:         cat,
    title:            formTitle.value || CATEGORY_META[cat].label,
    notes:            formNotes.value,
    audioRecordingId: audioId,
    ecoActionKey:       cat === 'eco_ops'   ? ecoActionKey.value   : undefined,
    ecoQuantity:        cat === 'eco_ops'   ? ecoQuantity.value    : undefined,
    mentorTargetId:     cat === 'mentoring' ? mentorTargetId.value : undefined,
    mentorTargetName:   cat === 'mentoring' ? connections.value.find(c => c.id === mentorTargetId.value)?.display_name : undefined,
    mentorTopic:        cat === 'mentoring' ? mentorTopic.value    : undefined,
    learningTargetDate: cat === 'learning_milestone' ? learningTargetDate.value : undefined,
  })

  pendingAudioId.value = null
  activeCategory.value = null
  resetForm()
}

async function submitStaged(id: string) {
  await stagedStore.submitEntry(id)
}
</script>

<style scoped>
/* ── Root — fixed top-right, below the pill ─────────────────────────────────── */

.rw-root {
  position: fixed;
  top: 8px;
  right: 48px;
  z-index: 6100;
  display: flex;
  align-items: center;
  gap: 6px;
  flex-direction: row-reverse;   /* levels appear to the LEFT of the button */
}

/* ── Record button ───────────────────────────────────────────────────────────── */

.rw-btn {
  position: relative;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: rgba(1, 6, 22, 0.82);
  border: 1px solid rgba(180, 30, 30, 0.40);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 2px;
  padding: 0;
  backdrop-filter: blur(8px);
  transition: border-color 0.15s, background 0.15s, box-shadow 0.15s;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.50);
  flex-shrink: 0;
}

.rw-btn:hover {
  border-color: rgba(220, 50, 50, 0.65);
  background: rgba(4, 2, 14, 0.92);
  box-shadow: 0 0 10px rgba(200, 30, 30, 0.28), 0 2px 10px rgba(0,0,0,0.50);
}

.rw-btn--recording {
  border-color: rgba(255, 60, 60, 0.70);
  background: rgba(28, 4, 4, 0.90);
  box-shadow: 0 0 16px rgba(220, 40, 40, 0.45), 0 2px 12px rgba(0,0,0,0.55);
}

/* ── Pulse ring ──────────────────────────────────────────────────────────────── */

.rw-pulse {
  position: absolute;
  inset: -3px;
  border-radius: 50%;
  border: 1.5px solid rgba(255, 60, 60, 0.50);
  animation: rw-pulse 1.4s ease-in-out infinite;
  pointer-events: none;
}

@keyframes rw-pulse {
  0%, 100% { transform: scale(1);    opacity: 0.50; }
  50%       { transform: scale(1.28); opacity: 0.10; }
}

/* ── Red dot ─────────────────────────────────────────────────────────────────── */

.rw-dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: rgba(200, 40, 40, 0.75);
  flex-shrink: 0;
  transition: background 0.15s, width 0.20s, height 0.20s;
}

.rw-btn--recording .rw-dot {
  background: #ff3333;
  box-shadow: 0 0 6px rgba(255, 50, 50, 0.80);
}

/* ── REC label ──────────────────────────────────────────────────────────────── */

.rw-rec-label {
  font-family: 'Courier New', monospace;
  font-size: 5.5px;
  letter-spacing: 0.12em;
  color: rgba(255, 100, 100, 0.80);
  line-height: 1;
}

/* ── Level bars ─────────────────────────────────────────────────────────────── */

.rw-levels {
  display: flex;
  align-items: flex-end;
  gap: 2px;
  height: 20px;
  padding: 0 2px;
}

.rw-bar {
  width: 3px;
  background: #ff3333;
  border-radius: 1.5px;
  transition: height 0.05s linear;
  min-height: 3px;
  opacity: 0.80;
}
.rw-bar:nth-child(1) { background: #ff5533; }
.rw-bar:nth-child(2) { background: #ff4422; }
.rw-bar:nth-child(3) { background: #ff3333; }
.rw-bar:nth-child(4) { background: #ff2244; }
.rw-bar:nth-child(5) { background: #ff1155; }

/* ── Duration ────────────────────────────────────────────────────────────────── */

.rw-duration {
  font-family: 'Courier New', monospace;
  font-size: 9px;
  letter-spacing: 0.10em;
  color: rgba(255, 100, 100, 0.80);
  background: rgba(1, 6, 22, 0.80);
  border: 1px solid rgba(180, 30, 30, 0.28);
  border-radius: 3px;
  padding: 2px 6px;
  backdrop-filter: blur(6px);
}

/* ── Saved / error ────────────────────────────────────────────────────────────── */

.rw-saved {
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: 'Courier New', monospace;
  font-size: 8.5px;
  color: rgba(80, 220, 130, 0.82);
  background: rgba(0, 20, 10, 0.85);
  border: 1px solid rgba(60, 200, 100, 0.28);
  border-radius: 4px;
  padding: 3px 8px;
  backdrop-filter: blur(6px);
}

.rw-dl {
  background: none;
  border: 1px solid rgba(60, 180, 100, 0.30);
  border-radius: 3px;
  color: rgba(80, 220, 130, 0.80);
  font-family: 'Courier New', monospace;
  font-size: 8px;
  padding: 1px 6px;
  cursor: pointer;
  transition: border-color 0.12s;
}
.rw-dl:hover { border-color: rgba(80, 230, 140, 0.55); }

.rw-error {
  font-family: 'Courier New', monospace;
  font-size: 8px;
  color: rgba(255, 120, 80, 0.80);
  background: rgba(30, 5, 0, 0.85);
  border: 1px solid rgba(200, 60, 30, 0.28);
  border-radius: 4px;
  padding: 3px 8px;
  max-width: 240px;
  backdrop-filter: blur(6px);
}

/* ── Menu toggle chevron ───────────────────────────────────────────────────── */

.rw-menu-btn {
  position: relative;
  width: 20px;
  height: 28px;
  border-radius: 6px;
  background: rgba(1, 6, 22, 0.82);
  border: 1px solid rgba(90, 110, 140, 0.28);
  color: rgba(170, 195, 220, 0.70);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  backdrop-filter: blur(8px);
  transition: border-color 0.15s, background 0.15s, color 0.15s;
  flex-shrink: 0;
}
.rw-menu-btn:hover { border-color: rgba(130, 160, 200, 0.50); color: rgba(210, 230, 250, 0.90); }
.rw-menu-btn--active { border-color: rgba(0, 190, 230, 0.55); color: #00e5ff; }

.rw-menu-btn__badge {
  position: absolute;
  top: -5px; left: -5px;
  min-width: 13px; height: 13px;
  border-radius: 7px;
  background: #ffaa33;
  color: #1a1000;
  font-family: 'Courier New', monospace;
  font-size: 8px;
  font-weight: 700;
  line-height: 13px;
  text-align: center;
  padding: 0 2px;
}

/* ── Pulldown menu ────────────────────────────────────────────────────────── */

.rw-menu {
  position: absolute;
  top: 34px;
  right: 0;
  width: 260px;
  background: rgba(3, 8, 20, 0.94);
  border: 1px solid rgba(90, 120, 160, 0.25);
  border-radius: 8px;
  padding: 10px;
  backdrop-filter: blur(10px);
  box-shadow: 0 8px 28px rgba(0, 0, 0, 0.55);
  font-family: 'Courier New', monospace;
}

.rw-menu__categories { display: flex; flex-direction: column; gap: 6px; }

.rw-menu__cat {
  display: flex; align-items: center; gap: 8px;
  background: rgba(255,255,255,0.03);
  border: 1px solid var(--ccolor);
  opacity: 0.80;
  border-radius: 6px;
  padding: 8px 10px;
  cursor: pointer;
  color: rgba(215,235,250,0.90);
  font-family: inherit;
  font-size: 11px;
  text-align: left;
  transition: background 0.12s, opacity 0.12s;
}
.rw-menu__cat:hover { background: rgba(255,255,255,0.06); opacity: 1; }
.rw-menu__cat-icon { font-size: 13px; }
.rw-menu__cat-label { flex: 1; }

.rw-menu__staged-toggle {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid rgba(255,255,255,0.08);
  font-size: 9.5px;
  color: rgba(150,180,205,0.70);
  cursor: pointer;
}
.rw-menu__staged-toggle:hover { color: rgba(0,210,255,0.80); }

.rw-menu__staged-list { display: flex; flex-direction: column; gap: 5px; margin-top: 6px; }
.rw-menu__staged-item {
  display: flex; align-items: center; gap: 6px;
  font-size: 9.5px; color: rgba(190,215,235,0.85);
  padding: 4px 2px;
}
.rw-menu__staged-cat { color: var(--ccolor); flex-shrink: 0; }
.rw-menu__staged-title { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.rw-menu__staged-submit, .rw-menu__staged-del {
  background: none; border: 1px solid rgba(0,160,220,0.30); border-radius: 3px;
  color: rgba(200,235,255,0.85); font-family: inherit; font-size: 8.5px;
  padding: 2px 6px; cursor: pointer; flex-shrink: 0;
}
.rw-menu__staged-del { border-color: rgba(200,80,80,0.30); color: rgba(255,150,150,0.75); padding: 2px 5px; }
.rw-menu__staged-submit:hover { border-color: rgba(0,190,240,0.55); }
.rw-menu__staged-del:hover { border-color: rgba(255,90,90,0.60); }

.rw-menu__manage-link {
  display: block;
  width: 100%;
  margin-top: 8px;
  background: none;
  border: none;
  border-top: 1px solid rgba(255,255,255,0.08);
  color: rgba(0,190,230,0.65);
  font-family: inherit;
  font-size: 9.5px;
  text-align: left;
  padding: 8px 2px 0;
  cursor: pointer;
}
.rw-menu__manage-link:hover { color: rgba(0,220,255,0.90); }

/* ── Category form ────────────────────────────────────────────────────────── */

.rw-menu__form { display: flex; flex-direction: column; gap: 7px; }
.rw-menu__form-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 2px; }
.rw-menu__form-title { font-size: 11.5px; font-weight: 600; }
.rw-menu__back { background: none; border: none; color: rgba(150,180,205,0.65); font-family: inherit; font-size: 9px; cursor: pointer; padding: 0; }
.rw-menu__back:hover { color: rgba(0,210,255,0.80); }

.rw-menu__input, .rw-menu__textarea {
  width: 100%;
  background: rgba(0,15,35,0.70);
  border: 1px solid rgba(0,100,160,0.25);
  border-radius: 5px;
  color: rgba(200,230,255,0.85);
  font-family: inherit;
  font-size: 10.5px;
  padding: 7px 9px;
  box-sizing: border-box;
}
.rw-menu__textarea { resize: vertical; }

.rw-menu__rec-toggle {
  display: flex; align-items: center; gap: 6px;
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(180,30,30,0.30);
  border-radius: 5px;
  color: rgba(230,210,210,0.85);
  font-family: inherit; font-size: 10px;
  padding: 7px 9px;
  cursor: pointer;
}
.rw-menu__rec-toggle--on { border-color: rgba(255,60,60,0.60); color: rgba(255,140,140,0.90); }

.rw-dot--inline { width: 7px; height: 7px; }
.rw-dot--on { background: #ff3333; box-shadow: 0 0 5px rgba(255,50,50,0.75); }

.rw-menu__stage-btn {
  background: rgba(0,40,80,0.55);
  border: 1px solid rgba(0,160,220,0.35);
  border-radius: 5px;
  color: rgba(200,235,255,0.90);
  font-family: inherit; font-size: 10.5px;
  padding: 8px 10px;
  cursor: pointer;
}
.rw-menu__stage-btn:hover:not(:disabled) { border-color: rgba(0,190,240,0.55); }
.rw-menu__stage-btn:disabled { opacity: 0.4; cursor: default; }

/* ── Transitions ────────────────────────────────────────────────────────────── */

.rw-bars-enter-active { transition: opacity 0.20s ease, transform 0.20s ease; }
.rw-bars-leave-active  { transition: opacity 0.14s ease, transform 0.14s ease; }
.rw-bars-enter-from    { opacity: 0; transform: translateX(8px); }
.rw-bars-leave-to      { opacity: 0; transform: translateX(8px); }

/* ── Mobile — move to a bottom-right FAB, out of the cramped top bar
   (burger + wallet already live there), and grow touch targets to
   the ~44px minimum recommended for thumb use. Menu opens upward
   since the anchor is now at the bottom of the screen. ───────────── */

@media (max-width: 640px) {
  .rw-root {
    top: auto;
    /* Cleared above DefenderNav.vue's ~80px fixed bottom bar (present on the
       cosmic/galaxy/surface scene pages) so the FAB never overlaps it there;
       on pages without that bar this just leaves a bit of empty space below. */
    bottom: calc(88px + env(safe-area-inset-bottom, 0px));
    right: 16px;
    gap: 8px;
  }
  .rw-btn { width: 44px; height: 44px; }
  .rw-dot { width: 12px; height: 12px; }
  .rw-menu-btn { width: 28px; height: 44px; }
  .rw-menu {
    top: auto;
    bottom: 50px;
    width: min(280px, calc(100vw - 32px));
  }
  .rw-duration { font-size: 11px; padding: 4px 8px; }
  .rw-saved, .rw-error { font-size: 10px; }
}
</style>
