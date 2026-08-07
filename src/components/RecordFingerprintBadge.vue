<template>
  <span v-if="display" class="rfb-badge" :title="hint">{{ display }}</span>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { renderFingerprintFromHex, formatFingerprint } from 'src/lib/record-fingerprint'

const props = defineProps<{
  /**
   * Hex-encoded SHA-256, optionally with PostgREST's bytea `\x` prefix
   * (stripped automatically). Pass the raw column value straight through.
   */
  hex: string | null | undefined
  hint?: string
}>()

const display = ref<string | null>(null)

watch(() => props.hex, async (hex) => {
  display.value = null
  if (!hex) return
  const clean = hex.startsWith('\\x') ? hex.slice(2) : hex
  const e8 = await renderFingerprintFromHex(clean)
  if (hex !== props.hex) return   // prop changed again while awaiting
  display.value = formatFingerprint(e8)
}, { immediate: true })
</script>

<style scoped>
.rfb-badge {
  font-family: 'Courier New', monospace;
  font-size: 8.5px;
  letter-spacing: 0.03em;
  color: rgba(120, 160, 190, 0.55);
  cursor: help;
}
</style>
