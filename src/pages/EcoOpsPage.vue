<template>
  <q-page class="eco-page">

    <!-- ── Dome + star landscape header ──────────────────────────────── -->
    <div class="eco-header" ref="headerWrap">
      <canvas ref="headerCanvas" class="eco-canvas" />
      <div class="eco-header-text">
        <div class="eco-header-label">ECO OPS · FIELD STATION</div>
        <div class="eco-header-title">Eco Operations Library</div>
        <div class="eco-header-sub" v-if="!loading">
          {{ totalVideos }} video resources across {{ areas.length }} domains
          <span v-if="dirty" class="eco-dirty-badge">● unsaved changes</span>
        </div>
        <div class="eco-header-sub" v-else>Loading resources…</div>
      </div>
      <!-- Edit / Export controls (top-right of header) -->
      <div class="eco-header-controls" v-if="!loading">
        <q-btn
          v-if="editMode"
          flat dense size="sm"
          icon="mdi-plus-box-outline"
          label="Add area"
          color="teal-4"
          @click="openAddArea"
        />
        <q-btn
          flat dense size="sm"
          :icon="editMode ? 'mdi-pencil-off-outline' : 'mdi-pencil-outline'"
          :label="editMode ? 'Done editing' : 'Edit library'"
          :color="editMode ? 'amber-5' : 'blue-grey-4'"
          @click="editMode = !editMode"
        />
        <q-btn
          flat dense size="sm"
          icon="mdi-download-outline"
          label="Export JSON"
          color="teal-5"
          @click="exportJson"
          :class="{ 'eco-export-pulse': dirty }"
        />
      </div>
    </div>

    <!-- ── Loading ────────────────────────────────────────────────────── -->
    <div v-if="loading" class="eco-loading">
      <q-spinner-dots color="teal-6" size="28px" />
    </div>

    <template v-else>

      <!-- ── Domain tabs ──────────────────────────────────────────────── -->
      <div class="eco-tabs-wrap">
        <div class="eco-tabs">
          <button
            v-for="tab in tabs" :key="tab.key"
            :class="['eco-tab', { 'eco-tab--active': activeTab === tab.key }]"
            :style="activeTab === tab.key ? { borderColor: tab.accent, color: tab.accent } : {}"
            @click="switchTab(tab.key)"
          >
            <q-icon :name="tab.icon" size="13px" />
            <span>{{ tab.label }}</span>
            <span class="eco-tab-badge" :style="activeTab === tab.key ? { background: tab.accent + '33' } : {}">
              {{ tab.count }}
            </span>
          </button>
        </div>
      </div>

      <!-- ── All-areas overview grid ──────────────────────────────────── -->
      <div v-if="activeTab === 'all'" class="eco-overview-grid">
        <div
          v-for="(area, ai) in areas" :key="area.area"
          class="eco-area-tile"
          :style="{ '--tile-accent': areaAccent(area.area) }"
          @click="switchTab(area.area.toLowerCase())"
          role="button" tabindex="0"
          @keyup.enter="switchTab(area.area.toLowerCase())"
        >
          <!-- Reference image banner -->
          <div v-if="area.image" class="eco-tile-img-wrap">
            <img :src="area.image" class="eco-tile-img"
              @error="(e) => ((e.target as HTMLImageElement).style.display = 'none')" />
            <div class="eco-tile-img-fade" />
          </div>

          <div class="eco-tile-head">
            <q-icon v-if="!area.image" :name="areaIcon(area.area)" size="26px" :color="areaColor(area.area)" />
            <div class="eco-tile-name">{{ area.area }}</div>
            <q-badge
              :style="{ background: areaAccent(area.area) + '30', color: areaAccent(area.area) }"
              class="eco-tile-badge"
            >{{ videoCount(area) }} videos</q-badge>
          </div>
          <div class="eco-tile-subs">
            <span v-for="sub in area.subcategories" :key="sub.uniqueId" class="eco-sub-chip">
              {{ sub.title }}
            </span>
          </div>
          <div class="eco-tile-footer">
            <span class="eco-tile-enter">Browse →</span>
            <q-btn
              v-if="editMode"
              flat round dense size="xs" icon="mdi-pencil-outline" color="blue-grey-5"
              title="Edit area"
              @click.stop="openEditArea(ai)"
            />
          </div>
        </div>

        <!-- Add area card (edit mode) -->
        <div
          v-if="editMode"
          class="eco-area-tile eco-area-tile--add"
          @click="openAddArea"
        >
          <q-icon name="mdi-plus-circle-outline" size="32px" color="teal-6" />
          <div class="eco-tile-name" style="margin-top:8px">New area</div>
        </div>
      </div>

      <!-- ── Area detail — subcategory accordion ──────────────────────── -->
      <div v-else class="eco-detail">

        <!-- Area-level edit toolbar -->
        <div v-if="editMode" class="eco-area-toolbar">
          <q-btn flat dense size="sm" icon="mdi-pencil-box-outline" label="Edit area"
            color="amber-5" @click="openEditArea(activeAreaIdx)" />
          <q-btn flat dense size="sm" icon="mdi-trash-can-outline" label="Delete area"
            color="red-4" @click="deleteArea(activeAreaIdx)" />
        </div>

        <div
          v-for="(sub, si) in activeArea?.subcategories ?? []"
          :key="sub.uniqueId"
          class="eco-subcat"
          :class="{ 'eco-subcat--open': openSubcats.has(sub.uniqueId) }"
        >
          <!-- Subcat header (reference image + toggle row + tag filter strip) -->
          <div class="eco-subcat-head" @click="toggleSubcat(sub.uniqueId)">

            <!-- Reference image strip (always visible when image exists) -->
            <div v-if="sub.image" class="eco-subcat-img-strip">
              <img :src="sub.image" class="eco-subcat-ref-img"
                @error="(e) => ((e.target as HTMLImageElement).style.display = 'none')" />
              <div class="eco-subcat-img-fade" />
            </div>

            <!-- Title row -->
            <div class="eco-subcat-top">
              <div class="eco-subcat-title-wrap">
                <span class="eco-subcat-title">{{ sub.title }}</span>
                <span
                  v-if="sub.subtitle && sub.subtitle !== sub.title"
                  class="eco-subcat-subtitle"
                >{{ sub.subtitle }}</span>
              </div>
              <div class="eco-subcat-right">
                <span class="eco-subcat-vcount">
                  <q-icon name="mdi-play-circle-outline" size="12px" class="q-mr-xs" />
                  <span v-if="tagFilters.get(sub.uniqueId)">
                    {{ filteredVideos(sub).length }}/{{ sub.videos?.length ?? 0 }}
                  </span>
                  <span v-else>{{ sub.videos?.length ?? 0 }}</span>
                </span>
                <q-btn
                  v-if="editMode"
                  flat round dense size="xs" icon="mdi-pencil-outline" color="blue-grey-5"
                  title="Edit subcategory"
                  @click.stop="openEditSubcat(activeAreaIdx, si)"
                />
                <q-icon
                  :name="openSubcats.has(sub.uniqueId) ? 'mdi-chevron-up' : 'mdi-chevron-down'"
                  size="18px" color="blue-grey-6"
                />
              </div>
            </div>

            <!-- Tag filter strip (always visible when tags exist) -->
            <div
              v-if="subcatVideoTags(sub).length"
              class="eco-tag-strip"
              @click.stop
            >
              <button
                class="eco-tag-chip"
                :class="{ 'eco-tag-chip--all': true, 'eco-tag-chip--active': !tagFilters.get(sub.uniqueId) }"
                @click="clearTagFilter(sub.uniqueId)"
              >All</button>
              <button
                v-for="tag in subcatVideoTags(sub)" :key="tag"
                class="eco-tag-chip"
                :class="{ 'eco-tag-chip--active': tagFilters.get(sub.uniqueId) === tag }"
                @click="setTagFilter(sub.uniqueId, tag)"
              >{{ tag }}</button>
            </div>

          </div>

          <!-- Subcat body -->
          <Transition name="subcat-slide">
            <div v-if="openSubcats.has(sub.uniqueId)" class="eco-subcat-body">

              <div v-if="sub.description" class="eco-subcat-desc">{{ sub.description }}</div>

              <!-- Video list (tag-filtered) -->
              <div v-if="sub.videos?.length" class="eco-videos">
                <div
                  v-for="{ vid, origIdx } in filteredVideos(sub)"
                  :key="`${sub.uniqueId}-${origIdx}`"
                  class="eco-video-wrap"
                  :class="{ 'eco-video-wrap--edit': editMode }"
                >
                  <!-- Video card -->
                  <a
                    :href="!editMode && isValidYtId(vid.youtubeId)
                      ? `https://www.youtube.com/watch?v=${vid.youtubeId}`
                      : undefined"
                    :class="['eco-video', {
                      'eco-video--no-link': editMode || !isValidYtId(vid.youtubeId),
                    }]"
                    target="_blank" rel="noopener noreferrer"
                  >
                    <div class="eco-video-thumb">
                      <template v-if="isValidYtId(vid.youtubeId)">
                        <img
                          :src="`https://img.youtube.com/vi/${vid.youtubeId}/mqdefault.jpg`"
                          class="eco-video-img"
                          loading="lazy"
                          @error="(e) => ((e.target as HTMLImageElement).style.opacity = '0.08')"
                        />
                      </template>
                      <div v-else class="eco-video-img-placeholder">
                        <q-icon name="mdi-video-outline" size="24px" color="blue-grey-8" />
                      </div>
                      <div v-if="!editMode && isValidYtId(vid.youtubeId)" class="eco-play-overlay">
                        <q-icon name="mdi-play-circle" size="32px" style="color:rgba(255,255,255,0.88)" />
                      </div>
                    </div>

                    <div class="eco-video-info">
                      <div class="eco-video-title">{{ vid.title }}</div>
                      <div
                        v-if="vid.description && vid.description.length > 2"
                        class="eco-video-desc"
                      >{{ vid.description.slice(0, 120) }}{{ vid.description.length > 120 ? '…' : '' }}</div>
                      <div v-if="vid.authors" class="eco-video-author">{{ vid.authors }}</div>
                      <!-- Video tags (read-only display) -->
                      <div v-if="vid.tags?.length" class="eco-video-tags">
                        <span
                          v-for="tag in vid.tags" :key="tag"
                          class="eco-vtag"
                          :class="{ 'eco-vtag--active': tagFilters.get(sub.uniqueId) === tag }"
                          @click.prevent="setTagFilter(sub.uniqueId, tag)"
                        >{{ tag }}</span>
                      </div>
                      <div v-if="!isValidYtId(vid.youtubeId)" class="eco-video-soon">
                        <q-icon name="mdi-clock-outline" size="11px" class="q-mr-xs" />link coming soon
                      </div>
                    </div>
                  </a>

                  <!-- Edit-mode action buttons -->
                  <div v-if="editMode" class="eco-video-actions">
                    <q-btn
                      flat round dense size="xs"
                      icon="mdi-pencil"
                      color="amber-5"
                      title="Edit video"
                      @click.stop="openEditVideo(activeAreaIdx, si, origIdx)"
                    />
                    <q-btn
                      flat round dense size="xs"
                      icon="mdi-delete-outline"
                      color="red-4"
                      title="Delete video"
                      @click.stop="deleteVideo(activeAreaIdx, si, origIdx)"
                    />
                  </div>
                </div>

                <!-- Empty-filter state -->
                <div v-if="!filteredVideos(sub).length" class="eco-no-videos">
                  <q-icon name="mdi-filter-off-outline" size="16px" color="blue-grey-7" />
                  <span>No videos tagged "{{ tagFilters.get(sub.uniqueId) }}"</span>
                </div>
              </div>

              <!-- Add video button (edit mode) -->
              <div v-if="editMode" class="eco-add-video-row">
                <q-btn
                  flat dense size="sm"
                  icon="mdi-plus-circle-outline"
                  label="Add video"
                  color="teal-5"
                  @click="openAddVideo(activeAreaIdx, si)"
                />
              </div>

              <div v-if="!editMode && !sub.videos?.length" class="eco-no-videos">
                <q-icon name="mdi-video-off-outline" size="16px" color="blue-grey-7" />
                <span>Videos being sourced for this topic.</span>
              </div>

            </div>
          </Transition>
        </div>

        <!-- Add subcategory (edit mode, bottom of list) -->
        <div v-if="editMode" class="eco-add-subcat-row">
          <q-btn
            unelevated dense size="sm" color="teal-9"
            icon="mdi-plus-circle-outline" label="Add subcategory"
            @click="openAddSubcat(activeAreaIdx)"
          />
        </div>

      </div>

    </template>

    <!-- ── Video edit / add dialog ─────────────────────────────────── -->
    <q-dialog v-model="editDialog" persistent>
      <q-card class="eco-edit-card">

        <div class="eco-edit-header">
          <span class="text-subtitle2 text-blue-grey-2">
            {{ editForm.mode === 'add' ? 'Add Video' : 'Edit Video' }}
          </span>
          <span class="text-caption text-blue-grey-6 q-mx-sm">
            {{ editForm.areaName }} › {{ editForm.subcatName }}
          </span>
          <q-space />
          <q-btn flat round dense size="sm" icon="mdi-close" color="blue-grey-5" @click="editDialog = false" />
        </div>

        <div class="eco-edit-body">

          <!-- YouTube URL / ID input -->
          <div class="eco-edit-field-label">YouTube URL or ID</div>
          <div class="eco-url-row">
            <input
              v-model.trim="editForm.ytRaw"
              class="eco-edit-input eco-url-input"
              :class="{ 'eco-edit-input--error': editForm.ytRaw && !editForm.youtubeId }"
              placeholder="Paste YouTube URL or 11-char ID"
              @input="onYtRawInput"
              @paste.prevent="onYtPaste"
            />
            <q-btn
              unelevated dense size="sm" class="eco-fetch-btn"
              icon="mdi-cloud-download-outline" label="Fetch"
              :color="fetchStatus === 'ok' ? 'teal-6' : fetchStatus === 'error' ? 'red-8' : 'teal-9'"
              :loading="fetchingMeta"
              :disable="!editForm.youtubeId || fetchingMeta"
              @click="fetchYtMeta"
              title="Auto-fill title and channel from YouTube"
            />
          </div>

          <!-- Parse status -->
          <div v-if="editForm.ytRaw && !editForm.youtubeId" class="eco-edit-error">
            Couldn't find a valid YouTube video ID in that input
          </div>
          <div v-else-if="editForm.youtubeId" class="eco-id-badge">
            <q-icon name="mdi-youtube" size="11px" color="red-5" />
            <span>ID: {{ editForm.youtubeId }}</span>
          </div>
          <div v-if="fetchStatus === 'ok'" class="eco-fetch-status eco-fetch-status--ok">
            <q-icon name="mdi-check-circle-outline" size="11px" /> Fields filled from YouTube
          </div>
          <div v-if="fetchStatus === 'error'" class="eco-fetch-status eco-fetch-status--err">
            <q-icon name="mdi-alert-outline" size="11px" /> Couldn't fetch — fill title manually
          </div>

          <!-- Thumbnail preview -->
          <div v-if="previewThumbUrl" class="eco-edit-preview">
            <img :src="previewThumbUrl" class="eco-edit-preview-img"
              @error="(e) => ((e.target as HTMLImageElement).style.opacity = '0.2')" />
            <a
              :href="`https://www.youtube.com/watch?v=${editForm.youtubeId}`"
              target="_blank" rel="noopener" class="eco-edit-yt-link"
            >
              <q-icon name="mdi-open-in-new" size="12px" /> verify on YouTube
            </a>
          </div>

          <!-- Title -->
          <div class="eco-edit-field-label">Title <span class="eco-field-required">*</span></div>
          <input
            v-model="editForm.title"
            class="eco-edit-input"
            placeholder="Video title"
          />

          <!-- Description -->
          <div class="eco-edit-field-label">
            Description
            <span class="eco-field-hint"> · add context or paste from YouTube page</span>
          </div>
          <textarea
            v-model="editForm.description"
            class="eco-edit-input eco-edit-textarea"
            placeholder="Brief description of the video content"
            rows="3"
          />

          <!-- Authors -->
          <div class="eco-edit-field-label">Author / Channel</div>
          <input
            v-model="editForm.authors"
            class="eco-edit-input"
            placeholder="Creator or channel name"
          />

          <!-- Tags -->
          <div class="eco-edit-field-label">
            Tags <span class="eco-field-hint"> · press Enter or comma to add</span>
          </div>
          <div class="eco-tag-editor">
            <span
              v-for="(tag, i) in editForm.tags" :key="tag"
              class="eco-tag-pill"
            >
              {{ tag }}
              <button class="eco-tag-pill-rm" @click="removeTag(i)" title="Remove tag">×</button>
            </span>
            <input
              v-model="newTagInput"
              class="eco-tag-inline-input"
              placeholder="add tag…"
              maxlength="32"
              @keydown.enter.prevent="addTag"
              @keydown.exact.prevent.capture.code.Comma="addTag"
            />
          </div>

        </div>

        <div class="eco-edit-footer">
          <q-btn flat label="Cancel" color="blue-grey-5" @click="editDialog = false" />
          <q-btn
            unelevated label="Save"
            color="teal-7"
            :disable="!editForm.title.trim()"
            @click="saveVideo"
          />
        </div>

      </q-card>
    </q-dialog>

    <!-- ── Area (category) add / edit dialog ────────────────────────── -->
    <q-dialog v-model="areaDialog" persistent>
      <q-card class="eco-edit-card">

        <div class="eco-edit-header">
          <span class="text-subtitle2 text-blue-grey-2">
            {{ areaForm.mode === 'add' ? 'New Area' : 'Edit Area' }}
          </span>
          <q-space />
          <q-btn flat round dense size="sm" icon="mdi-close" color="blue-grey-5" @click="areaDialog = false" />
        </div>

        <div class="eco-edit-body">

          <!-- Reference image -->
          <div class="eco-edit-field-label">Reference Image</div>
          <div class="eco-img-input-row">
            <input
              v-model="areaForm.image"
              class="eco-edit-input eco-url-input"
              placeholder="Paste image URL…"
            />
            <label class="eco-img-upload-btn">
              <q-icon name="mdi-upload-outline" size="16px" />
              <input type="file" accept="image/*" style="display:none"
                @change="(e) => handleImgUpload(e, areaForm)" />
            </label>
          </div>
          <div v-if="areaForm.image" class="eco-img-preview">
            <img :src="areaForm.image" class="eco-img-preview-img"
              @error="(e) => ((e.target as HTMLImageElement).style.opacity = '0.15')" />
            <button class="eco-img-clear" @click="areaForm.image = ''" title="Remove image">×</button>
          </div>

          <!-- Name -->
          <div class="eco-edit-field-label">Area Name <span class="eco-field-required">*</span></div>
          <input
            v-model="areaForm.name"
            class="eco-edit-input"
            placeholder="e.g. Water, Energy, Food…"
          />

          <!-- Icon -->
          <div class="eco-edit-field-label">Icon <span class="eco-field-hint"> · MDI icon name</span></div>
          <div class="eco-icon-row">
            <input
              v-model="areaForm.icon"
              class="eco-edit-input"
              placeholder="mdi-leaf"
              style="flex:1"
            />
            <div class="eco-icon-preview">
              <q-icon :name="areaForm.icon || 'mdi-leaf'" size="22px" color="teal-4" />
            </div>
          </div>

          <!-- Accent colour -->
          <div class="eco-edit-field-label">Accent colour <span class="eco-field-hint"> · hex</span></div>
          <div class="eco-icon-row">
            <input
              v-model="areaForm.accent"
              class="eco-edit-input"
              placeholder="#4caf50"
              style="flex:1"
            />
            <div class="eco-color-swatch" :style="{ background: areaForm.accent || '#4caf50' }" />
          </div>

        </div>

        <div class="eco-edit-footer">
          <q-btn flat label="Cancel" color="blue-grey-5" @click="areaDialog = false" />
          <q-btn
            unelevated label="Save area"
            color="teal-7"
            :disable="!areaForm.name.trim()"
            @click="saveArea"
          />
        </div>

      </q-card>
    </q-dialog>

    <!-- ── Subcategory add / edit dialog ─────────────────────────────── -->
    <q-dialog v-model="subcatDialog" persistent>
      <q-card class="eco-edit-card">

        <div class="eco-edit-header">
          <span class="text-subtitle2 text-blue-grey-2">
            {{ subcatForm.mode === 'add' ? 'New Subcategory' : 'Edit Subcategory' }}
          </span>
          <span v-if="subcatForm.areaName" class="text-caption text-blue-grey-6 q-mx-sm">
            {{ subcatForm.areaName }}
          </span>
          <q-space />
          <q-btn flat round dense size="sm" icon="mdi-close" color="blue-grey-5" @click="subcatDialog = false" />
        </div>

        <div class="eco-edit-body">

          <!-- Reference image -->
          <div class="eco-edit-field-label">Reference Image</div>
          <div class="eco-img-input-row">
            <input
              v-model="subcatForm.image"
              class="eco-edit-input eco-url-input"
              placeholder="Paste image URL…"
            />
            <label class="eco-img-upload-btn">
              <q-icon name="mdi-upload-outline" size="16px" />
              <input type="file" accept="image/*" style="display:none"
                @change="(e) => handleImgUpload(e, subcatForm)" />
            </label>
          </div>
          <div v-if="subcatForm.image" class="eco-img-preview">
            <img :src="subcatForm.image" class="eco-img-preview-img"
              @error="(e) => ((e.target as HTMLImageElement).style.opacity = '0.15')" />
            <button class="eco-img-clear" @click="subcatForm.image = ''" title="Remove image">×</button>
          </div>

          <!-- Title -->
          <div class="eco-edit-field-label">Title <span class="eco-field-required">*</span></div>
          <input
            v-model="subcatForm.title"
            class="eco-edit-input"
            placeholder="Subcategory title"
          />

          <!-- Subtitle -->
          <div class="eco-edit-field-label">Subtitle <span class="eco-field-hint"> · optional tagline</span></div>
          <input
            v-model="subcatForm.subtitle"
            class="eco-edit-input"
            placeholder="Short description shown in the header"
          />

          <!-- Description -->
          <div class="eco-edit-field-label">Description <span class="eco-field-hint"> · shown when expanded</span></div>
          <textarea
            v-model="subcatForm.description"
            class="eco-edit-input eco-edit-textarea"
            placeholder="Longer context for this subcategory"
            rows="3"
          />

          <!-- Delete subcategory (edit mode only) -->
          <div v-if="subcatForm.mode === 'edit'" style="margin-top:4px">
            <q-btn flat dense size="sm" icon="mdi-trash-can-outline" label="Delete subcategory"
              color="red-4" @click="deleteSubcat" />
          </div>

        </div>

        <div class="eco-edit-footer">
          <q-btn flat label="Cancel" color="blue-grey-5" @click="subcatDialog = false" />
          <q-btn
            unelevated label="Save"
            color="teal-7"
            :disable="!subcatForm.title.trim()"
            @click="saveSubcat"
          />
        </div>

      </q-card>
    </q-dialog>

  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'

// ── Types ──────────────────────────────────────────────────────────────────────
interface OtVideo {
  title: string
  youtubeId: string
  description?: string
  authors?: string
  tags?: string[]
  icon_tag_fa?: string
  color_tag?: string
  [key: string]: unknown
}

interface OtSubcategory {
  uniqueId: string
  title: string
  subtitle?: string
  description?: string
  image?: string
  tags?: string[]
  videos?: OtVideo[]
}

interface OtArea {
  area: string
  featherIcon?: string
  image?: string
  subcategories: OtSubcategory[]
}

// ── Data & Persistence Config ──────────────────────────────────────────────────
const STORAGE_KEY = 'eco_ops_library_data'

const route  = useRoute()
const router = useRouter()

const loading = ref(true)
const areas   = ref<OtArea[]>([])
const dirty   = ref(false)

// 1. Core Persistence Function: Saves working state locally
function saveToLocalStorage() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(areas.value))
  } catch (e) {
    console.error('EcoOps: Failed to save data to localStorage', e)
  }
}

// 2. Updated Load Lifecycle
async function loadData() {
  try {
    // Try gathering locally cached data first
    const localData = localStorage.getItem(STORAGE_KEY)
    
    if (localData) {
      areas.value = JSON.parse(localData)
      // Check if it differs from pristine state to maintain the "unsaved changes" badge
      dirty.value = localStorage.getItem(`${STORAGE_KEY}_dirty`) === 'true'
    } else {
      // Fallback to network JSON asset if local cache is empty
      const res = await fetch('/ot6a.json')
      areas.value = (await res.json()) as OtArea[]
    }
  } catch (e) {
    console.error('EcoOps: failed to load library data', e)
  } finally {
    loading.value = false
  }
}

// Watch dirty state so badge survives refreshing as well
watch(dirty, (newVal) => {
  localStorage.setItem(`${STORAGE_KEY}_dirty`, String(newVal))
})

// ── Area config ────────────────────────────────────────────────────────────────
const AREA_ICONS: Record<string, string> = {
  Water:            'mdi-water',
  Energy:           'mdi-lightning-bolt',
  Waste:            'mdi-recycle',
  Food:             'mdi-sprout',
  Shelter:          'mdi-home-outline',
  Health:           'mdi-heart-outline',
  Decontamination:  'mdi-biohazard',
  'Ecology & Biodiversity': 'mdi-paw-outline',
  Microplastics:    'mdi-microscope',
}
const AREA_COLORS: Record<string, string> = {
  Water:            'cyan-4',
  Energy:           'amber-4',
  Waste:            'green-4',
  Food:             'light-green-3',
  Shelter:          'blue-grey-4',
  Health:           'red-3',
  Decontamination:  'deep-orange-4',
  'Ecology & Biodiversity': 'teal-7',
  Microplastics:    'indigo-4',
}
const AREA_ACCENTS: Record<string, string> = {
  Water:            '#26c6da',
  Energy:           '#ffca28',
  Waste:            '#66bb6a',
  Food:             '#9ccc65',
  Shelter:          '#78909c',
  Health:           '#ef9a9a',
  Decontamination:  '#ff7043',
  'Ecology & Biodiversity': '#00695c',
  Microplastics:    '#5c6bc0',
}

const areaIcon   = (n: string) => AREA_ICONS[n]   ?? 'mdi-leaf'
const areaColor  = (n: string) => AREA_COLORS[n]  ?? 'teal-4'
const areaAccent = (n: string) => AREA_ACCENTS[n] ?? '#4caf50'
const videoCount = (a: OtArea) => a.subcategories.reduce((s, c) => s + (c.videos?.length ?? 0), 0)

// ── Tabs ───────────────────────────────────────────────────────────────────────
const activeTab     = ref('all')
const totalVideos   = computed(() => areas.value.reduce((s, a) => s + videoCount(a), 0))
const activeAreaIdx = computed(() => areas.value.findIndex(a => a.area.toLowerCase() === activeTab.value))
const activeArea    = computed(() => areas.value[activeAreaIdx.value] ?? null)

const tabs = computed(() => [
  { key: 'all', label: 'All', icon: 'mdi-view-grid-outline', count: totalVideos.value, accent: '#4caf50' },
  ...areas.value.map(a => ({
    key: a.area.toLowerCase(), label: a.area,
    icon: areaIcon(a.area), count: videoCount(a), accent: areaAccent(a.area),
  })),
])

// ── Accordion ─────────────────────────────────────────────────────────────────
const openSubcats = ref(new Set<string>())

function toggleSubcat(id: string) {
  const s = new Set(openSubcats.value)
  s.has(id) ? s.delete(id) : s.add(id)
  openSubcats.value = s
  const openList = [...s]
  void router.replace({
    name: 'eco-ops',
    params: route.params,
    query: openList.length ? { sub: openList.join(',') } : {},
  })
}

function switchTab(key: string) {
  activeTab.value = key
  openSubcats.value = new Set()
  tagFilters.value = new Map()
  if (key !== 'all') {
    const area = areas.value.find(a => a.area.toLowerCase() === key)
    if (area?.subcategories[0]) openSubcats.value = new Set([area.subcategories[0].uniqueId])
  }
  void router.replace({
    name: 'eco-ops',
    params: { area: key === 'all' ? '' : key },
    query: {},
  })
}

watch(activeArea, area => {
  if (area && openSubcats.value.size === 0 && area.subcategories[0]) {
    openSubcats.value = new Set([area.subcategories[0].uniqueId])
  }
})

// ── Tag filter ─────────────────────────────────────────────────────────────────
// Maps subcatId → active tag string (undefined = no filter)
const tagFilters = ref(new Map<string, string>())

/** All unique tags from all videos in a subcat, sorted alphabetically. */
function subcatVideoTags(sub: OtSubcategory): string[] {
  const seen = new Set<string>()
  for (const vid of sub.videos ?? []) {
    for (const t of vid.tags ?? []) seen.add(t)
  }
  return [...seen].sort()
}

/** Return videos for display — filtered by active tag if set, with original index preserved. */
function filteredVideos(sub: OtSubcategory): { vid: OtVideo; origIdx: number }[] {
  const tag = tagFilters.value.get(sub.uniqueId)
  return (sub.videos ?? [])
    .map((vid, origIdx) => ({ vid, origIdx }))
    .filter(({ vid }) => !tag || (vid.tags ?? []).includes(tag))
}

function setTagFilter(subcatId: string, tag: string) {
  const m = new Map(tagFilters.value)
  m.set(subcatId, tag)
  tagFilters.value = m
  // Open the subcat so the filtered results are visible
  const s = new Set(openSubcats.value)
  s.add(subcatId)
  openSubcats.value = s
}

function clearTagFilter(subcatId: string) {
  const m = new Map(tagFilters.value)
  m.delete(subcatId)
  tagFilters.value = m
}

// ── YouTube helpers ────────────────────────────────────────────────────────────
const isValidYtId = (id: string) => /^[A-Za-z0-9_-]{11}$/.test(id ?? '')

/** Extract an 11-char video ID from any YouTube URL format or a bare ID. */
function extractYtId(raw: string): string | null {
  if (!raw) return null
  const s = raw.trim()
  // Bare ID
  if (/^[A-Za-z0-9_-]{11}$/.test(s)) return s
  // URL formats: watch?v=, youtu.be/, /embed/, /shorts/, /v/
  const m = s.match(
    /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|v\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/
  )
  return m?.[1] ?? null
}

function onThumbError(e: Event) {
  const img = e.target as HTMLImageElement
  img.style.display = 'none'
  const next = img.nextElementSibling as HTMLElement | null
  if (next?.classList.contains('eco-video-img-placeholder')) next.style.display = 'flex'
}

// ── YouTube oEmbed fetch ────────────────────────────────────────────────────────
const fetchingMeta = ref(false)
const fetchStatus  = ref<'idle' | 'ok' | 'error'>('idle')

async function fetchYtMeta() {
  const id = editForm.value.youtubeId
  if (!id) return
  fetchingMeta.value = true
  fetchStatus.value  = 'idle'
  try {
    const res = await fetch(
      `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${id}&format=json`
    )
    if (!res.ok) throw new Error(`${res.status}`)
    const data = await res.json() as { title: string; author_name: string }
    if (!editForm.value.title)   editForm.value.title   = data.title       ?? ''
    if (!editForm.value.authors) editForm.value.authors = data.author_name ?? ''
    // Overwrite only if both fields were already empty; otherwise respect manual edits
    if (editForm.value.title && editForm.value.authors) {
      editForm.value.title   = data.title       || editForm.value.title
      editForm.value.authors = data.author_name || editForm.value.authors
    }
    fetchStatus.value = 'ok'
  } catch {
    fetchStatus.value = 'error'
  } finally {
    fetchingMeta.value = false
  }
}

function onYtRawInput() {
  const id = extractYtId(editForm.value.ytRaw)
  editForm.value.youtubeId = id ?? ''
  fetchStatus.value = 'idle'
}

async function onYtPaste(e: ClipboardEvent) {
  const text = e.clipboardData?.getData('text') ?? ''
  editForm.value.ytRaw = text
  const id = extractYtId(text)
  editForm.value.youtubeId = id ?? ''
  fetchStatus.value = 'idle'
  // Auto-fetch when pasting a recognisable YouTube URL
  if (id && text.includes('youtube') || text.includes('youtu.be')) {
    await fetchYtMeta()
  }
}

// ── Edit mode ─────────────────────────────────────────────────────────────────
const editMode   = ref(false)
const editDialog = ref(false)

interface EditForm {
  mode: 'add' | 'edit'
  areaIdx: number
  subcatIdx: number
  videoIdx: number
  areaName: string
  subcatName: string
  ytRaw: string      // raw URL or ID pasted by the user
  youtubeId: string  // extracted 11-char ID
  title: string
  description: string
  authors: string
  tags: string[]
  _original: OtVideo | null
}

const editForm = ref<EditForm>({
  mode: 'add', areaIdx: 0, subcatIdx: 0, videoIdx: -1,
  areaName: '', subcatName: '',
  ytRaw: '', youtubeId: '', title: '', description: '', authors: '', tags: [],
  _original: null,
})

// ── Tag editing in dialog ──────────────────────────────────────────────────────
const newTagInput = ref('')

function addTag() {
  const t = newTagInput.value.trim().toLowerCase().replace(/[\s,]+/g, '-').replace(/[^a-z0-9-]/g, '')
  if (t && !editForm.value.tags.includes(t)) editForm.value.tags.push(t)
  newTagInput.value = ''
}

function removeTag(i: number) {
  editForm.value.tags.splice(i, 1)
}

const previewThumbUrl = computed(() =>
  isValidYtId(editForm.value.youtubeId)
    ? `https://img.youtube.com/vi/${editForm.value.youtubeId}/mqdefault.jpg`
    : null
)

function openAddVideo(areaIdx: number, subcatIdx: number) {
  const area  = areas.value[areaIdx]
  const subcat = area?.subcategories[subcatIdx]
  if (!area || !subcat) return
  fetchStatus.value = 'idle'
  newTagInput.value = ''
  editForm.value = {
    mode: 'add', areaIdx, subcatIdx, videoIdx: -1,
    areaName: area.area, subcatName: subcat.title,
    ytRaw: '', youtubeId: '', title: '', description: '', authors: '', tags: [],
    _original: null,
  }
  editDialog.value = true
}

function openEditVideo(areaIdx: number, subcatIdx: number, videoIdx: number) {
  const area   = areas.value[areaIdx]
  const subcat = area?.subcategories[subcatIdx]
  const vid    = subcat?.videos?.[videoIdx]
  if (!vid) return
  fetchStatus.value = 'idle'
  newTagInput.value = ''
  editForm.value = {
    mode: 'edit', areaIdx, subcatIdx, videoIdx,
    areaName: area.area, subcatName: subcat.title,
    ytRaw:       vid.youtubeId ?? '',
    youtubeId:   vid.youtubeId ?? '',
    title:       vid.title ?? '',
    description: vid.description ?? '',
    authors:     vid.authors ?? '',
    tags:        [...(vid.tags ?? [])],
    _original:   vid,
  }
  editDialog.value = true
}

function saveVideo() {
  const { mode, areaIdx, subcatIdx, videoIdx, youtubeId, title, description, authors, _original } = editForm.value
  const area   = areas.value[areaIdx]
  const subcat = area?.subcategories[subcatIdx]
  if (!subcat) return

  const { tags } = editForm.value
  const newVid: OtVideo = {
    ...(_original ?? {}),
    title:       title.trim(),
    youtubeId:   youtubeId.trim(),
    description: description.trim(),
    authors:     authors.trim(),
    tags:        tags.length ? tags : undefined,
  }

  if (mode === 'add') {
    if (!subcat.videos) subcat.videos = []
    subcat.videos.push(newVid)
  } else {
    if (subcat.videos) subcat.videos[videoIdx] = newVid
  }

  dirty.value = true
  saveToLocalStorage() // 🔥 Persist addition/modification instantly
  editDialog.value = false
}

function deleteVideo(areaIdx: number, subcatIdx: number, videoIdx: number) {
  const subcat = areas.value[areaIdx]?.subcategories[subcatIdx]
  if (!subcat?.videos) return
  const vid = subcat.videos[videoIdx]
  if (!vid) return
  if (!confirm(`Delete "${vid.title}"?`)) return
  subcat.videos.splice(videoIdx, 1)
  
  dirty.value = true
  saveToLocalStorage() // 🔥 Persist deletion instantly
}

// ── Area (category) CRUD ──────────────────────────────────────────────────────
const areaDialog = ref(false)

interface AreaForm {
  mode: 'add' | 'edit'
  areaIdx: number
  name:   string
  icon:   string
  accent: string
  image:  string
}

const areaForm = ref<AreaForm>({
  mode: 'add', areaIdx: -1,
  name: '', icon: 'mdi-leaf', accent: '#4caf50', image: '',
})

function openAddArea() {
  areaForm.value = { mode: 'add', areaIdx: -1, name: '', icon: 'mdi-leaf', accent: '#4caf50', image: '' }
  areaDialog.value = true
}

function openEditArea(areaIdx: number) {
  const area = areas.value[areaIdx]
  if (!area) return
  areaForm.value = {
    mode: 'edit', areaIdx,
    name:   area.area,
    icon:   AREA_ICONS[area.area]  ?? area.featherIcon ?? 'mdi-leaf',
    accent: AREA_ACCENTS[area.area] ?? '#4caf50',
    image:  area.image ?? '',
  }
  areaDialog.value = true
}

function saveArea() {
  const { mode, areaIdx, name, icon, accent, image } = areaForm.value
  const trimmed = name.trim()
  if (!trimmed) return

  if (mode === 'add') {
    areas.value.push({
      area: trimmed,
      featherIcon: icon,
      image: image || undefined,
      subcategories: [],
    })
    // Register dynamic icon/accent so the tab bar picks them up immediately
    AREA_ICONS[trimmed]   = icon
    AREA_ACCENTS[trimmed] = accent
    AREA_COLORS[trimmed]  = 'teal-4'
  } else {
    const area = areas.value[areaIdx]
    if (!area) return
    const oldName = area.area
    area.area    = trimmed
    area.featherIcon = icon
    area.image   = image || undefined
    // Update maps if name changed
    if (oldName !== trimmed) {
      AREA_ICONS[trimmed]   = AREA_ICONS[oldName]   ?? icon
      AREA_ACCENTS[trimmed] = AREA_ACCENTS[oldName] ?? accent
      AREA_COLORS[trimmed]  = AREA_COLORS[oldName]  ?? 'teal-4'
    }
    AREA_ICONS[trimmed]   = icon
    AREA_ACCENTS[trimmed] = accent
  }

  dirty.value = true
  saveToLocalStorage()
  areaDialog.value = false
}

function deleteArea(areaIdx: number) {
  const area = areas.value[areaIdx]
  if (!area) return
  const total = area.subcategories.reduce((n, s) => n + (s.videos?.length ?? 0), 0)
  if (!confirm(`Delete "${area.area}" and its ${area.subcategories.length} subcategories (${total} videos)?`)) return
  areas.value.splice(areaIdx, 1)
  switchTab('all')
  dirty.value = true
  saveToLocalStorage()
}

// ── Subcategory CRUD ───────────────────────────────────────────────────────────
const subcatDialog = ref(false)

interface SubcatForm {
  mode: 'add' | 'edit'
  areaIdx:   number
  subcatIdx: number
  areaName:  string
  title:       string
  subtitle:    string
  description: string
  image:       string
}

const subcatForm = ref<SubcatForm>({
  mode: 'add', areaIdx: -1, subcatIdx: -1, areaName: '',
  title: '', subtitle: '', description: '', image: '',
})

function openAddSubcat(areaIdx: number) {
  const area = areas.value[areaIdx]
  if (!area) return
  subcatForm.value = {
    mode: 'add', areaIdx, subcatIdx: -1, areaName: area.area,
    title: '', subtitle: '', description: '', image: '',
  }
  subcatDialog.value = true
}

function openEditSubcat(areaIdx: number, subcatIdx: number) {
  const area  = areas.value[areaIdx]
  const sub   = area?.subcategories[subcatIdx]
  if (!sub) return
  subcatForm.value = {
    mode: 'edit', areaIdx, subcatIdx, areaName: area.area,
    title:       sub.title,
    subtitle:    sub.subtitle  ?? '',
    description: sub.description ?? '',
    image:       sub.image ?? '',
  }
  subcatDialog.value = true
}

function saveSubcat() {
  const { mode, areaIdx, subcatIdx, title, subtitle, description, image } = subcatForm.value
  const area = areas.value[areaIdx]
  if (!area) return

  if (mode === 'add') {
    const uid = `${area.area.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`
    area.subcategories.push({
      uniqueId:    uid,
      title:       title.trim(),
      subtitle:    subtitle.trim() || undefined,
      description: description.trim() || undefined,
      image:       image || undefined,
      videos:      [],
    })
  } else {
    const sub = area.subcategories[subcatIdx]
    if (!sub) return
    sub.title       = title.trim()
    sub.subtitle    = subtitle.trim() || undefined
    sub.description = description.trim() || undefined
    sub.image       = image || undefined
  }

  dirty.value = true
  saveToLocalStorage()
  subcatDialog.value = false
}

function deleteSubcat() {
  const { areaIdx, subcatIdx } = subcatForm.value
  const sub = areas.value[areaIdx]?.subcategories[subcatIdx]
  if (!sub) return
  const n = sub.videos?.length ?? 0
  if (!confirm(`Delete "${sub.title}"${n ? ` and its ${n} videos` : ''}?`)) return
  areas.value[areaIdx]!.subcategories.splice(subcatIdx, 1)
  dirty.value = true
  saveToLocalStorage()
  subcatDialog.value = false
}

// ── Image upload helper ────────────────────────────────────────────────────────
function handleImgUpload(e: Event, form: { image: string }) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = () => { form.image = reader.result as string }
  reader.readAsDataURL(file)
  // Reset the input so the same file can be re-selected if needed
  ;(e.target as HTMLInputElement).value = ''
}

// ── Export ────────────────────────────────────────────────────────────────────
function exportJson() {
  const json = JSON.stringify(areas.value, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = 'ot6a.json'
  a.click()
  URL.revokeObjectURL(url)
  
  dirty.value = false
  saveToLocalStorage() // Update local copy to clear the dirty flag locally
}

// ── Canvas header ──────────────────────────────────────────────────────────────
const headerCanvas = ref<HTMLCanvasElement>()
const headerWrap   = ref<HTMLDivElement>()

function mulberry32(seed: number) {
  return function () {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function drawHeader() {
  const canvas = headerCanvas.value
  const wrap   = headerWrap.value
  if (!canvas || !wrap) return
  const dpr = Math.min(window.devicePixelRatio, 2)
  const W   = wrap.clientWidth, H = wrap.clientHeight
  canvas.width = W * dpr; canvas.height = H * dpr
  const ctx = canvas.getContext('2d')!
  ctx.scale(dpr, dpr)
  const rng = mulberry32(0x4EC0B5)
  const horizY = H * 0.62

  const sky = ctx.createLinearGradient(0, 0, 0, H)
  sky.addColorStop(0.00, '#010912'); sky.addColorStop(0.55, '#031614')
  sky.addColorStop(0.80, '#06201a'); sky.addColorStop(1.00, '#0a2a14')
  ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H)

  for (let i = 0; i < 220; i++) {
    const x = rng() * W, y = rng() * horizY * 1.05
    if (y >= horizY) continue
    ctx.beginPath(); ctx.arc(x, y, 0.4 + rng() * 1.3, 0, Math.PI * 2)
    ctx.fillStyle = `rgba(200,230,255,${(0.25 + rng() * 0.75).toFixed(2)})`; ctx.fill()
  }

  const sx = W * 0.82, sy = H * 0.17
  const sg = ctx.createRadialGradient(sx, sy, 0, sx, sy, 75)
  sg.addColorStop(0, 'rgba(255,250,220,0.96)'); sg.addColorStop(0.04, 'rgba(255,235,170,0.72)')
  sg.addColorStop(0.16, 'rgba(255,210,110,0.22)'); sg.addColorStop(1, 'rgba(255,190,80,0)')
  ctx.fillStyle = sg; ctx.fillRect(sx - 75, sy - 75, 150, 150)

  const hg = ctx.createLinearGradient(0, horizY - 28, 0, horizY + 28)
  hg.addColorStop(0, 'rgba(30,130,80,0)'); hg.addColorStop(0.5, 'rgba(30,130,80,0.11)'); hg.addColorStop(1, 'rgba(20,90,60,0)')
  ctx.fillStyle = hg; ctx.fillRect(0, horizY - 28, W, 56)

  const drawTerrain = (color: string, pts: number[]) => {
    ctx.beginPath(); ctx.moveTo(0, H); ctx.lineTo(0, pts[0])
    for (let i = 0; i < pts.length - 1; i += 5)
      ctx.bezierCurveTo(pts[i+1]*W, pts[i+2]*H, pts[i+3]*W, pts[i+4]*H, pts[i+5]*W, pts[i+5+1] !== undefined ? pts[i+6]*H : H * 0.65)
    ctx.lineTo(W, H); ctx.closePath(); ctx.fillStyle = color; ctx.fill()
  }
  drawTerrain('#061510', [horizY + H*0.05, 0.10,horizY/H-0.06, 0.22,horizY/H+0.02, 0.33,horizY/H-0.05, 0.46,horizY/H-0.10, 0.58,horizY/H+0.01, 0.70,horizY/H-0.04, 0.82,horizY/H-0.08, 0.92,horizY/H+0.01])
  drawTerrain('#0a1c11', [horizY + H*0.10, 0.12,horizY/H+0.04, 0.26,horizY/H+0.13, 0.38,horizY/H+0.08, 0.52,horizY/H+0.03, 0.64,horizY/H+0.12, 0.76,horizY/H+0.06, 0.88,horizY/H+0.02, 0.94,horizY/H+0.09])

  const gg = ctx.createLinearGradient(0, horizY + H*0.10, 0, H)
  gg.addColorStop(0, '#0e2416'); gg.addColorStop(1, '#05100a')
  ctx.fillStyle = gg; ctx.fillRect(0, horizY + H*0.10, W, H)

  const dX = W*0.29, dY = horizY + H*0.03, dR = H*0.235
  const dg = ctx.createRadialGradient(dX, dY, 0, dX, dY, dR*1.05)
  dg.addColorStop(0, 'rgba(50,180,130,0.07)'); dg.addColorStop(1, 'rgba(20,100,80,0)')
  ctx.fillStyle = dg; ctx.beginPath(); ctx.arc(dX, dY, dR*1.05, Math.PI, 0, true); ctx.closePath(); ctx.fill()

  ctx.save(); ctx.strokeStyle = 'rgba(55,195,145,0.48)'; ctx.lineWidth = 0.9
  ctx.beginPath(); ctx.arc(dX, dY, dR, Math.PI, 0, true); ctx.stroke()
  ctx.beginPath(); ctx.moveTo(dX-dR, dY); ctx.lineTo(dX+dR, dY); ctx.stroke()
  ctx.globalAlpha = 0.38
  for (let i = 1; i < 8; i++) {
    const ang = (i/8)*Math.PI
    ctx.beginPath(); ctx.moveTo(dX, dY); ctx.lineTo(dX+Math.cos(ang)*dR, dY-Math.sin(ang)*dR); ctx.stroke()
  }
  for (let i = 1; i <= 3; i++) {
    const t = i/4
    ctx.beginPath(); ctx.ellipse(dX, dY-t*dR, Math.sqrt(1-t*t)*dR, Math.sqrt(1-t*t)*dR*0.18, 0, 0, Math.PI*2); ctx.stroke()
  }
  ctx.restore()

  const d2X = W*0.70, d2Y = horizY+H*0.01, d2R = H*0.13
  ctx.save(); ctx.strokeStyle = 'rgba(55,195,145,0.22)'; ctx.lineWidth = 0.65
  ctx.beginPath(); ctx.arc(d2X, d2Y, d2R, Math.PI, 0, true); ctx.stroke()
  ctx.beginPath(); ctx.moveTo(d2X-d2R, d2Y); ctx.lineTo(d2X+d2R, d2Y); ctx.stroke(); ctx.restore()

  const pX = dX+dR*0.88, pY = horizY+H*0.04, pH = H*0.11, pW = H*0.065
  ctx.save(); ctx.strokeStyle = 'rgba(255,200,60,0.58)'; ctx.lineWidth = 0.9
  ctx.beginPath(); ctx.moveTo(pX, pY-pH); ctx.lineTo(pX-pW/2, pY); ctx.lineTo(pX+pW/2, pY); ctx.closePath(); ctx.stroke()
  ctx.beginPath(); ctx.moveTo(pX, pY-pH); ctx.lineTo(pX, pY); ctx.stroke(); ctx.restore()
}

function restoreFromUrl() {
  const areaParam = String(route.params.area ?? '').trim()
  if (areaParam) {
    const match = areas.value.find(a => a.area.toLowerCase() === areaParam)
    if (match) {
      activeTab.value = areaParam
      openSubcats.value = new Set()
      tagFilters.value = new Map()
    }
  }
  const subParam = String(route.query.sub ?? '').trim()
  if (subParam) {
    openSubcats.value = new Set(subParam.split(',').filter(Boolean))
  } else if (activeTab.value !== 'all' && openSubcats.value.size === 0) {
    const area = areas.value.find(a => a.area.toLowerCase() === activeTab.value)
    if (area?.subcategories[0]) openSubcats.value = new Set([area.subcategories[0].uniqueId])
  }
}

let resizeObs: ResizeObserver | null = null
onMounted(async () => {
  drawHeader()
  resizeObs = new ResizeObserver(drawHeader)
  if (headerWrap.value) resizeObs.observe(headerWrap.value)
  await loadData()
  restoreFromUrl()
})
onBeforeUnmount(() => resizeObs?.disconnect())
</script>

<style scoped>
.eco-page { min-height: 100vh; background: #010912; }

/* ── Header ─────────────────────────────────────────────────────── */
.eco-header { position: relative; width: 100%; height: 236px; overflow: hidden; }
.eco-canvas { position: absolute; inset: 0; width: 100%; height: 100%; display: block; }
.eco-header-text { position: absolute; bottom: 20px; left: 20px; z-index: 2; }
.eco-header-label { font-size: 9px; letter-spacing: 0.14em; color: rgba(70,195,135,0.68); text-transform: uppercase; margin-bottom: 4px; }
.eco-header-title { font-size: 21px; font-weight: 600; color: #c0e8d0; line-height: 1.15; }
.eco-header-sub { font-size: 11px; color: rgba(90,170,130,0.62); margin-top: 4px; }
.eco-dirty-badge { color: rgba(255,190,60,0.80); font-weight: 500; margin-left: 6px; }

.eco-header-controls {
  position: absolute; top: 14px; right: 14px; z-index: 2;
  display: flex; gap: 6px; align-items: center;
  background: rgba(2,8,14,0.65); padding: 4px 8px; border-radius: 20px;
  backdrop-filter: blur(6px);
}

@keyframes pulse-glow {
  0%, 100% { box-shadow: 0 0 0 0 rgba(38,198,218,0); }
  50%       { box-shadow: 0 0 0 4px rgba(38,198,218,0.25); }
}
.eco-export-pulse { animation: pulse-glow 2s ease-in-out infinite; border-radius: 20px; }

.eco-loading { display: flex; justify-content: center; padding: 48px 0; }

/* ── Tabs ───────────────────────────────────────────────────────── */
.eco-tabs-wrap { overflow-x: auto; padding: 0 12px; scrollbar-width: none; }
.eco-tabs-wrap::-webkit-scrollbar { display: none; }
.eco-tabs { display: flex; gap: 6px; padding: 12px 4px 6px; white-space: nowrap; min-width: max-content; }
.eco-tab {
  display: inline-flex; align-items: center; gap: 5px; padding: 5px 10px;
  border-radius: 20px; border: 1px solid transparent;
  background: rgba(10,30,20,0.7); color: rgba(120,160,135,0.80);
  font-size: 11px; cursor: pointer; transition: border-color 0.18s, color 0.18s;
}
.eco-tab:hover { border-color: rgba(80,180,120,0.30); color: #a8ccb8; }
.eco-tab--active { border-color: currentColor; }
.eco-tab-badge {
  font-size: 9px; padding: 1px 5px; border-radius: 8px;
  background: rgba(255,255,255,0.06); color: inherit; opacity: 0.85;
}

/* ── Overview grid ──────────────────────────────────────────────── */
.eco-overview-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 12px; padding: 12px 14px 24px; }
@media (max-width: 640px) { .eco-overview-grid { grid-template-columns: repeat(2,1fr); } }
@media (max-width: 380px) { .eco-overview-grid { grid-template-columns: 1fr; } }

.eco-area-tile {
  background: rgba(5,18,14,0.88); border-radius: 10px;
  padding: 0 0 12px; overflow: hidden;
  cursor: pointer; transition: border-color 0.18s, background 0.18s;
  border: 1px solid rgba(35,90,65,0.30);
  display: flex; flex-direction: column;
}
.eco-area-tile:hover { background: rgba(10,30,22,0.95); border-color: rgba(60,160,100,0.45); }
.eco-area-tile--add {
  align-items: center; justify-content: center; min-height: 120px;
  border-style: dashed; border-color: rgba(40,120,80,0.35);
  background: rgba(5,20,14,0.50);
}
.eco-area-tile--add:hover { border-color: rgba(55,175,110,0.55); background: rgba(10,35,22,0.70); }

/* Reference image banner on area tile */
.eco-tile-img-wrap { position: relative; width: 100%; height: 80px; overflow: hidden; }
.eco-tile-img { width: 100%; height: 100%; object-fit: cover; display: block; }
.eco-tile-img-fade {
  position: absolute; inset: 0;
  background: linear-gradient(to bottom, rgba(3,12,8,0) 40%, rgba(3,12,8,0.88) 100%);
}

.eco-tile-head { display: flex; align-items: center; gap: 8px; margin: 10px 14px 6px; }
.eco-tile-name { font-size: 13px; font-weight: 600; color: #a8ccba; flex: 1; }
.eco-tile-badge { font-size: 9px; padding: 2px 6px; border-radius: 8px; }
.eco-tile-subs { display: flex; flex-wrap: wrap; gap: 4px; margin: 0 14px 8px; }
.eco-sub-chip {
  font-size: 9px; padding: 2px 7px; border-radius: 10px;
  background: rgba(30,80,55,0.5); color: rgba(120,185,145,0.85);
  border: 1px solid rgba(40,100,70,0.35);
}
.eco-tile-footer { display: flex; align-items: center; justify-content: space-between; padding: 0 14px; margin-top: auto; }
.eco-tile-enter { font-size: 10px; color: rgba(70,195,135,0.55); }

/* Area-level edit toolbar */
.eco-area-toolbar {
  display: flex; gap: 6px; padding: 4px 0 8px;
  border-bottom: 1px solid rgba(35,90,60,0.20); margin-bottom: 4px;
}

/* Add subcategory row */
.eco-add-subcat-row { padding: 10px 0 4px; }

/* Subcat reference image strip */
.eco-subcat-img-strip {
  position: relative; width: 100%; height: 90px; overflow: hidden;
  border-radius: 0;
}
.eco-subcat-ref-img { width: 100%; height: 100%; object-fit: cover; display: block; }
.eco-subcat-img-fade {
  position: absolute; inset: 0;
  background: linear-gradient(to bottom, rgba(5,18,14,0) 30%, rgba(5,18,14,0.92) 100%);
}

/* ── Detail accordion ───────────────────────────────────────────── */
.eco-detail { padding: 8px 14px 32px; display: flex; flex-direction: column; gap: 6px; }
.eco-subcat { background: rgba(5,18,14,0.82); border: 1px solid rgba(35,90,60,0.30); border-radius: 9px; overflow: hidden; }
.eco-subcat--open { border-color: rgba(50,140,90,0.50); }
.eco-subcat-head { padding: 12px 14px; cursor: pointer; user-select: none; transition: background 0.15s; }
.eco-subcat-head:hover { background: rgba(20,60,40,0.40); }
.eco-subcat-top { display: flex; align-items: center; justify-content: space-between; }
.eco-subcat-title-wrap { display: flex; flex-direction: column; gap: 2px; }
.eco-subcat-title { font-size: 13px; font-weight: 600; color: #a8ccba; }
.eco-subcat-subtitle { font-size: 10px; color: rgba(90,150,115,0.80); }
.eco-subcat-right { display: flex; align-items: center; gap: 10px; }
.eco-subcat-vcount { font-size: 10px; color: rgba(90,150,115,0.75); display: flex; align-items: center; }
.eco-subcat-body { padding: 0 14px 14px; border-top: 1px solid rgba(35,90,60,0.25); }
.eco-subcat-desc { font-size: 11px; color: rgba(100,160,125,0.80); line-height: 1.55; margin: 10px 0 8px; }

/* Tag filter strip in subcat header */
.eco-tag-strip {
  display: flex; flex-wrap: wrap; gap: 4px;
  margin-top: 9px; padding-top: 8px;
  border-top: 1px solid rgba(35,90,60,0.20);
}
.eco-tag-chip {
  display: inline-flex; align-items: center;
  font-size: 9px; padding: 2px 8px; border-radius: 10px;
  background: rgba(15,50,33,0.70); color: rgba(90,170,120,0.75);
  border: 1px solid rgba(40,100,70,0.30);
  cursor: pointer; transition: background 0.14s, border-color 0.14s, color 0.14s;
  line-height: 1.6; white-space: nowrap;
}
.eco-tag-chip:hover { background: rgba(25,80,52,0.85); color: rgba(120,210,150,0.95); border-color: rgba(55,150,90,0.55); }
.eco-tag-chip--active {
  background: rgba(30,100,65,0.75); color: #6ee09a;
  border-color: rgba(60,180,100,0.60); font-weight: 600;
}
.eco-tag-chip--all { letter-spacing: 0.04em; }

/* Per-video tag pills (inside the video card) */
.eco-video-tags { display: flex; flex-wrap: wrap; gap: 3px; margin-top: 3px; }
.eco-vtag {
  font-size: 8px; padding: 1px 6px; border-radius: 8px;
  background: rgba(15,50,33,0.65); color: rgba(80,160,110,0.75);
  border: 1px solid rgba(35,90,60,0.28); cursor: pointer;
  transition: background 0.12s, color 0.12s;
}
.eco-vtag:hover { background: rgba(25,75,50,0.85); color: rgba(120,210,150,0.95); }
.eco-vtag--active { background: rgba(28,90,58,0.80); color: #6ee09a; border-color: rgba(55,160,90,0.55); }

/* ── Video cards ────────────────────────────────────────────────── */
.eco-videos { display: flex; flex-direction: column; gap: 6px; margin-top: 6px; }

.eco-video-wrap { position: relative; }
.eco-video-wrap--edit .eco-video { pointer-events: none; cursor: default; }

.eco-video {
  display: flex; gap: 10px; align-items: flex-start;
  background: rgba(8,25,18,0.75); border-radius: 8px;
  border: 1px solid rgba(35,90,60,0.25); text-decoration: none; overflow: hidden;
  transition: border-color 0.16s, background 0.16s;
}
.eco-video:not(.eco-video--no-link):hover { border-color: rgba(50,165,100,0.55); background: rgba(12,38,26,0.90); }
.eco-video--no-link { cursor: default; }

.eco-video-thumb { position: relative; width: 130px; flex-shrink: 0; background: #070f0a; overflow: hidden; display: flex; align-items: center; }
.eco-video-img { width: 130px; height: 74px; object-fit: cover; display: block; }
.eco-video-img-placeholder { width: 130px; height: 74px; display: flex; align-items: center; justify-content: center; background: #0a1810; }
.eco-play-overlay { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,0.28); opacity: 0; transition: opacity 0.16s; }
.eco-video:hover .eco-play-overlay { opacity: 1; }

.eco-video-info { flex: 1; padding: 8px 10px 8px 2px; min-width: 0; display: flex; flex-direction: column; gap: 3px; }
.eco-video-title { font-size: 12px; font-weight: 500; color: #9ec4b0; line-height: 1.35; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.eco-video-desc { font-size: 10px; color: rgba(80,140,105,0.78); line-height: 1.45; }
.eco-video-author { font-size: 9px; color: rgba(70,120,90,0.65); }
.eco-video-soon { font-size: 9px; color: rgba(90,130,105,0.55); display: flex; align-items: center; }

/* ── Edit mode overlays ─────────────────────────────────────────── */
.eco-video-actions {
  position: absolute; top: 6px; right: 6px;
  display: flex; gap: 2px;
  background: rgba(2,8,14,0.82); border-radius: 8px; padding: 2px;
  border: 1px solid rgba(40,90,65,0.40);
  backdrop-filter: blur(4px);
}

.eco-add-video-row { padding: 8px 0 2px; }

.eco-no-videos { display: flex; align-items: center; gap: 6px; padding: 12px 0; font-size: 11px; color: rgba(70,110,88,0.60); }

/* ── Edit dialog ────────────────────────────────────────────────── */
.eco-edit-card {
  background: #081410;
  border: 1px solid rgba(45,120,80,0.45);
  border-radius: 12px;
  min-width: 340px; max-width: 500px; width: 90vw;
  box-shadow: 0 8px 32px rgba(0,0,0,0.6);
}
.eco-edit-header {
  display: flex; align-items: center; padding: 14px 16px 10px;
  border-bottom: 1px solid rgba(40,100,70,0.28);
}
.eco-edit-body { padding: 14px 16px; display: flex; flex-direction: column; gap: 8px; }
.eco-edit-footer {
  display: flex; justify-content: flex-end; gap: 8px;
  padding: 10px 16px 14px; border-top: 1px solid rgba(40,100,70,0.28);
}

.eco-edit-field-label { font-size: 10px; color: rgba(90,160,120,0.80); margin-bottom: 2px; }
.eco-field-hint { color: rgba(70,120,90,0.55); font-size: 9px; }
.eco-field-required { color: rgba(220,80,60,0.80); }

.eco-edit-input {
  width: 100%; background: rgba(5,20,14,0.90); border: 1px solid rgba(40,110,75,0.40);
  border-radius: 6px; padding: 7px 10px; color: #a8ccba; font-size: 12px;
  outline: none; transition: border-color 0.16s;
  font-family: inherit; box-sizing: border-box;
}
.eco-edit-input:focus { border-color: rgba(55,195,145,0.65); }
.eco-edit-input--error { border-color: rgba(220,80,60,0.65) !important; }
.eco-edit-textarea { resize: vertical; min-height: 72px; line-height: 1.5; }
.eco-edit-error { font-size: 10px; color: rgba(220,100,80,0.85); margin-top: -4px; }

/* ── Image input (area + subcat dialogs) ────────────────────────── */
.eco-img-input-row { display: flex; gap: 6px; align-items: center; }
.eco-img-upload-btn {
  display: inline-flex; align-items: center; justify-content: center;
  width: 34px; height: 34px; flex-shrink: 0;
  background: rgba(20,65,45,0.70); border: 1px solid rgba(45,120,80,0.40);
  border-radius: 6px; cursor: pointer; color: rgba(80,180,120,0.80);
  transition: background 0.14s, border-color 0.14s;
}
.eco-img-upload-btn:hover { background: rgba(30,90,60,0.85); border-color: rgba(60,160,100,0.60); }

.eco-img-preview {
  position: relative; border-radius: 6px; overflow: hidden;
  background: #040c08; margin-top: 2px;
}
.eco-img-preview-img { width: 100%; display: block; max-height: 130px; object-fit: cover; }
.eco-img-clear {
  position: absolute; top: 5px; right: 6px;
  background: rgba(0,0,0,0.55); border: none; border-radius: 50%;
  width: 20px; height: 20px; color: rgba(220,220,220,0.90);
  cursor: pointer; font-size: 13px; line-height: 1; display: flex; align-items: center; justify-content: center;
}
.eco-img-clear:hover { background: rgba(180,40,30,0.75); }

.eco-icon-row { display: flex; gap: 8px; align-items: center; }
.eco-icon-preview {
  width: 36px; height: 34px; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  background: rgba(15,55,38,0.55); border: 1px solid rgba(40,110,70,0.35); border-radius: 6px;
}
.eco-color-swatch {
  width: 36px; height: 34px; flex-shrink: 0;
  border-radius: 6px; border: 1px solid rgba(255,255,255,0.10);
}

/* ── Tag editor in dialog ───────────────────────────────────────── */
.eco-tag-editor {
  display: flex; flex-wrap: wrap; align-items: center; gap: 5px;
  background: rgba(5,20,14,0.90); border: 1px solid rgba(40,110,75,0.40);
  border-radius: 6px; padding: 6px 8px; min-height: 36px;
  transition: border-color 0.16s;
}
.eco-tag-editor:focus-within { border-color: rgba(55,195,145,0.65); }
.eco-tag-pill {
  display: inline-flex; align-items: center; gap: 3px;
  font-size: 10px; padding: 2px 6px 2px 8px; border-radius: 10px;
  background: rgba(25,80,52,0.80); color: #7ee8a8;
  border: 1px solid rgba(50,150,85,0.45);
}
.eco-tag-pill-rm {
  background: none; border: none; cursor: pointer; color: rgba(120,200,155,0.60);
  font-size: 11px; line-height: 1; padding: 0 1px;
  transition: color 0.12s;
}
.eco-tag-pill-rm:hover { color: rgba(220,80,60,0.85); }
.eco-tag-inline-input {
  flex: 1; min-width: 90px; background: none; border: none; outline: none;
  color: #a8ccba; font-size: 11px; font-family: inherit; padding: 0 2px;
}
.eco-tag-inline-input::placeholder { color: rgba(70,120,90,0.50); }

.eco-url-row { display: flex; gap: 6px; align-items: center; }
.eco-url-input { flex: 1; min-width: 0; }
.eco-fetch-btn { flex-shrink: 0; height: 34px; border-radius: 6px !important; }

.eco-id-badge {
  display: inline-flex; align-items: center; gap: 4px; font-size: 9px;
  color: rgba(80,190,130,0.70); background: rgba(10,50,30,0.60);
  padding: 2px 8px; border-radius: 8px; border: 1px solid rgba(40,110,70,0.28);
  margin-top: -4px;
}

.eco-fetch-status {
  font-size: 10px; display: flex; align-items: center; gap: 4px;
  padding: 3px 0; margin-top: -4px;
}
.eco-fetch-status--ok  { color: rgba(60,195,120,0.85); }
.eco-fetch-status--err { color: rgba(220,100,70,0.80); }

.eco-edit-preview { border-radius: 6px; overflow: hidden; background: #040c08; }
.eco-edit-preview-img { width: 100%; display: block; max-height: 150px; object-fit: cover; }
.eco-edit-yt-link {
  display: block; text-align: right; font-size: 9px; color: rgba(80,180,130,0.65);
  padding: 4px 8px; text-decoration: none;
}
.eco-edit-yt-link:hover { color: rgba(80,220,150,0.90); }

/* ── Transition ─────────────────────────────────────────────────── */
.subcat-slide-enter-active, .subcat-slide-leave-active { transition: opacity 0.22s ease, max-height 0.28s ease; max-height: 2000px; }
.subcat-slide-enter-from, .subcat-slide-leave-to { opacity: 0; max-height: 0; }
</style>
