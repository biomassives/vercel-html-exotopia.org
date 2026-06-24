<template>
  <!--
    RecordWidget.vue — persistent audio recorder in the top-right corner.
    Records from the microphone to IndexedDB (never uploaded anywhere).
    Shows live level bars during recording.
    Intended for: field voice notes, oral history, $SUNLIGHT source material,
                  eco-ops documentation, community science observations.
  -->
  <div class="rw-root">

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

  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import {
  recording, levelBars, recDuration, recError,
  startRecording, stopRecording, downloadRecording, formatDuration,
} from 'src/lib/audio-recorder'

const savedId = ref<string | null>(null)
let savedTimer: ReturnType<typeof setTimeout> | null = null

async function toggle() {
  if (recording.value) {
    const id = await stopRecording()
    if (id) {
      savedId.value = id
      if (savedTimer) clearTimeout(savedTimer)
      savedTimer = setTimeout(() => { savedId.value = null }, 6000)
    }
  } else {
    savedId.value = null
    await startRecording()
  }
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

/* ── Transitions ────────────────────────────────────────────────────────────── */

.rw-bars-enter-active { transition: opacity 0.20s ease, transform 0.20s ease; }
.rw-bars-leave-active  { transition: opacity 0.14s ease, transform 0.14s ease; }
.rw-bars-enter-from    { opacity: 0; transform: translateX(8px); }
.rw-bars-leave-to      { opacity: 0; transform: translateX(8px); }
</style>
