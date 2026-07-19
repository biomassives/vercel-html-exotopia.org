<template>
  <q-page class="print-decisions-page">

    <div class="pd-toolbar">
      <div class="pd-toolbar-left">
        <q-btn
          flat dense round
          icon="mdi-arrow-left"
          color="grey-6"
          @click="$router.back()"
        />
        <span class="pd-title">Eco Ops API — 8 Architectural Decisions</span>
        <q-badge color="teal-7" label="Discussion doc" class="q-ml-sm" />
      </div>
      <div class="pd-toolbar-right">
        <q-btn
          flat dense
          icon="mdi-open-in-new"
          label="Open standalone"
          color="grey-6"
          size="sm"
          @click="openStandalone"
        />
        <q-btn
          flat dense
          icon="mdi-printer-outline"
          label="Print / Save PDF"
          color="teal-6"
          size="sm"
          class="q-ml-xs"
          @click="triggerPrint"
        />
      </div>
    </div>

    <iframe
      ref="frame"
      class="pd-frame"
      :src="docUrl"
      title="Eco Ops API — 8 Architectural Decisions"
      frameborder="0"
    />

  </q-page>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const frame = ref<HTMLIFrameElement | null>(null)
const docUrl = '/print/eco-ops-decisions.html'

function openStandalone () {
  window.open(docUrl, '_blank')
}

function triggerPrint () {
  frame.value?.contentWindow?.print()
}
</script>

<style scoped>
.print-decisions-page {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.pd-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  background: #1a1a2e;
  flex-shrink: 0;
  gap: 8px;
  flex-wrap: wrap;
}

.pd-toolbar-left {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.pd-title {
  font-size: 0.85rem;
  font-weight: 600;
  color: #e0e0e0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.pd-toolbar-right {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.pd-frame {
  flex: 1;
  width: 100%;
  border: none;
  background: #fff;
}
</style>
