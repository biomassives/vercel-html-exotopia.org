import { ref, computed, watch }       from 'vue'
import { useEcoOfflineStore }          from 'src/stores/eco-offline'
import { resizePhoto }                 from 'src/lib/photo-resize'
import type { MonitoringDraft, RecordType } from 'src/stores/eco-offline'

export type { RecordType }

// ── Step definitions ──────────────────────────────────────────────────────

export const STEPS: Record<RecordType, string[]> = {
  water_quality:      ['Site & time', 'Physical params', 'Nutrients', 'Biological', 'Photos & notes'],
  macroinvertebrate:  ['Site & time', 'Families found', 'BMWP score', 'Photos & notes'],
  tick_drag:          ['Site & time', 'Transect details', 'Count by stage', 'Photos & notes'],
  phenology:          ['Site & time', 'Species observed', 'Phenophase', 'Photos & notes'],
  pfas_sample:        ['Site & time', 'Sample details', 'Results (if known)', 'Chain of custody', 'Photos & notes'],
  cso_event:          ['Site & time', 'Outfall details', 'Observation', 'Photos & notes'],
}

// ── Composable ────────────────────────────────────────────────────────────

export function useMonitoringWizard(
  siteId: string,
  siteName: string,
  resumeDraftKey?: string,   // pass to resume an existing draft
) {
  const store = useEcoOfflineStore()

  // ── Draft initialisation ───────────────────────────────────────────────

  function freshDraft(): MonitoringDraft {
    return {
      draftKey:   crypto.randomUUID(),
      siteId,
      siteName,
      recordType: null,
      step:       0,
      observedAt: new Date().toISOString(),
      formData:   {},
      photos:     [],
      notes:      '',
      savedAt:    new Date().toISOString(),
    }
  }

  const existing = resumeDraftKey
    ? store.drafts.find(d => d.draftKey === resumeDraftKey)
    : store.draftsForSite(siteId)[0]    // resume most-recent draft for this site

  const draft = ref<MonitoringDraft>(existing ? { ...existing } : freshDraft())

  // ── Debounced auto-save to IDB ─────────────────────────────────────────

  let saveTimer: ReturnType<typeof setTimeout> | null = null

  watch(draft, () => {
    if (saveTimer) clearTimeout(saveTimer)
    saveTimer = setTimeout(() => {
      void store.saveDraft({ ...draft.value })
    }, 500)
  }, { deep: true })

  // ── Derived state ──────────────────────────────────────────────────────

  const steps = computed<string[]>(() =>
    draft.value.recordType ? STEPS[draft.value.recordType] : ['Site & time', 'Record type']
  )
  const totalSteps  = computed(() => steps.value.length)
  const isLastStep  = computed(() => draft.value.step >= totalSteps.value - 1)
  const isFirstStep = computed(() => draft.value.step === 0)
  const hasDraft    = computed(() =>
    !!(draft.value.recordType || Object.keys(draft.value.formData).length)
  )

  const errors = computed<string[]>(() => {
    const d = draft.value
    const errs: string[] = []
    if (!d.siteId)     errs.push('Site is required')
    if (!d.recordType) errs.push('Record type is required')
    if (!d.observedAt) errs.push('Observation time is required')
    return errs
  })

  const canSubmit = computed(() => errors.value.length === 0 && isLastStep.value)

  // ── Navigation ─────────────────────────────────────────────────────────

  function setRecordType(type: RecordType) {
    draft.value.recordType = type
    draft.value.step       = 0
    draft.value.formData   = {}
  }

  function setField(key: string, value: unknown) {
    draft.value.formData = { ...draft.value.formData, [key]: value }
  }

  function setNote(text: string) { draft.value.notes = text }

  function nextStep() { if (!isLastStep.value)  draft.value.step++ }
  function prevStep() { if (!isFirstStep.value) draft.value.step-- }

  // ── Photos ─────────────────────────────────────────────────────────────

  const addingPhoto = ref(false)

  async function addPhoto(source: File | Blob | string) {
    addingPhoto.value = true
    try {
      const resized = await resizePhoto(source)
      draft.value.photos = [...draft.value.photos, resized]
    } finally {
      addingPhoto.value = false
    }
  }

  function removePhoto(index: number) {
    draft.value.photos = draft.value.photos.filter((_, i) => i !== index)
  }

  // ── Submit ─────────────────────────────────────────────────────────────

  const submitting  = ref(false)
  const submitError = ref<string | null>(null)
  const submitted   = ref(false)

  async function submit(): Promise<boolean> {
    if (!canSubmit.value) return false
    submitting.value  = true
    submitError.value = null
    try {
      const d = draft.value
      await store.enqueue({
        type:     'monitoring_record',
        siteId:   d.siteId,
        siteName: d.siteName,
        photos:   d.photos,
        payload: {
          site_id:     d.siteId,
          record_type: d.recordType,
          observed_at: d.observedAt,
          notes:       d.notes || undefined,
          ...d.formData,
        },
      })
      // Remove the draft from IDB on successful enqueue
      await store.deleteDraft(d.draftKey)
      submitted.value = true
      return true
    } catch (err) {
      submitError.value = String(err)
      return false
    } finally {
      submitting.value = false
    }
  }

  // ── Reset ──────────────────────────────────────────────────────────────

  async function reset() {
    if (saveTimer) clearTimeout(saveTimer)
    await store.deleteDraft(draft.value.draftKey)
    draft.value    = freshDraft()
    submitted.value   = false
    submitError.value = null
  }

  return {
    draft, steps, totalSteps,
    isFirstStep, isLastStep, canSubmit, hasDraft,
    errors, submitting, submitError, submitted,
    addingPhoto,
    online:       store.online,
    pendingQueue: store.pending,
    setRecordType, setField, setNote,
    nextStep, prevStep,
    addPhoto, removePhoto,
    submit, reset,
  }
}
