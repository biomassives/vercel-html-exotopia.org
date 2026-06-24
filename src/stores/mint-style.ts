/**
 * src/stores/mint-style.ts
 *
 * Pinia store for saved MintingStyles.
 * Persisted to localStorage under 'exo_mint_styles' so styles survive page refresh.
 * Scoped to the exo_ namespace to play nicely with the 48-hour session clearance.
 */

import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import {
  createMintingStyle,
  type MintingStyle,
} from 'src/lib/mint-style'

const STORAGE_KEY = 'exo_mint_styles'

function loadFromStorage(): MintingStyle[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    return JSON.parse(raw) as MintingStyle[]
  } catch {
    return []
  }
}

function saveToStorage(styles: MintingStyle[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(styles))
  } catch { /* quota exceeded */ }
}

export const useMintStyleStore = defineStore('mint-style', () => {
  const styles        = ref<MintingStyle[]>(loadFromStorage())
  const activeStyleId = ref<string | null>(styles.value[0]?.id ?? null)

  const activeStyle = computed<MintingStyle | null>(() =>
    styles.value.find(s => s.id === activeStyleId.value) ?? null
  )

  // Persist on every change
  watch(styles, s => saveToStorage(s), { deep: true })

  // ── CRUD ─────────────────────────────────────────────────────────────────

  function createStyle(name = 'New Style'): MintingStyle {
    const s = createMintingStyle(name)
    styles.value.push(s)
    activeStyleId.value = s.id
    return s
  }

  function duplicateStyle(id: string): MintingStyle | null {
    const src = styles.value.find(s => s.id === id)
    if (!src) return null
    const copy: MintingStyle = {
      ...JSON.parse(JSON.stringify(src)) as MintingStyle,
      id:       crypto.randomUUID(),
      name:     `${src.name} (copy)`,
      created:  new Date().toISOString(),
      updated:  new Date().toISOString(),
      mintCount: 0,
    }
    styles.value.push(copy)
    activeStyleId.value = copy.id
    return copy
  }

  function deleteStyle(id: string) {
    const idx = styles.value.findIndex(s => s.id === id)
    if (idx === -1) return
    styles.value.splice(idx, 1)
    // Switch active style
    if (activeStyleId.value === id) {
      activeStyleId.value = styles.value[0]?.id ?? null
    }
  }

  function updateStyle(id: string, patch: Partial<MintingStyle>) {
    const s = styles.value.find(s => s.id === id)
    if (!s) return
    Object.assign(s, patch, { updated: new Date().toISOString() })
  }

  /** Mark a style as used — increments mintCount. */
  function incrementMintCount(id: string) {
    const s = styles.value.find(s => s.id === id)
    if (!s) return
    s.mintCount++
    s.updated = new Date().toISOString()
  }

  function selectStyle(id: string) {
    activeStyleId.value = id
  }

  /** Export a style to a JSON string for sharing or backup. */
  function exportStyle(id: string): string | null {
    const s = styles.value.find(s => s.id === id)
    if (!s) return null
    return JSON.stringify(s, null, 2)
  }

  /** Import a style from JSON string. Returns the imported style or null on error. */
  function importStyle(json: string): MintingStyle | null {
    try {
      const parsed = JSON.parse(json) as MintingStyle
      if (!parsed.name || !parsed.id || !parsed.sources) return null
      // Generate a fresh ID to avoid collisions
      const s: MintingStyle = { ...parsed, id: crypto.randomUUID() }
      styles.value.push(s)
      activeStyleId.value = s.id
      return s
    } catch {
      return null
    }
  }

  return {
    styles, activeStyleId, activeStyle,
    createStyle, duplicateStyle, deleteStyle, updateStyle,
    incrementMintCount, selectStyle, exportStyle, importStyle,
  }
})
