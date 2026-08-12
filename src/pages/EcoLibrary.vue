<template>
  <q-page class="eco-page">

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
      <div class="eco-header-controls" v-if="!loading">
        <div class="eco-search-wrap" ref="searchWrapEl">
          <q-btn
            flat dense size="sm" round
            icon="mdi-magnify"
            color="blue-grey-4"
            title="Search subcategories & videos"
            @click="searchOpen = !searchOpen"
          />
          <div v-if="searchOpen" class="eco-search-panel">
            <input
              ref="searchInputEl"
              v-model="searchQuery"
              class="eco-search-input"
              placeholder="Search subcategories & videos…"
              @keydown.esc="closeSearch"
            />
            <div v-if="searchQuery.trim()" class="eco-search-results">
              <template v-if="searchResults.subs.length">
                <div class="eco-search-group-label">Subcategories</div>
                <div
                  v-for="r in searchResults.subs" :key="`s-${r.uniqueId}`"
                  class="eco-search-item"
                  @click="goToSubcat(r)"
                >
                  <q-icon name="mdi-folder-outline" size="13px" class="q-mr-xs" />
                  <span v-html="highlightMatch(r.title)" />
                </div>
              </template>
              <template v-if="searchResults.vids.length">
                <div class="eco-search-group-label">Videos</div>
                <div
                  v-for="r in searchResults.vids" :key="`v-${r.subcatUniqueId}-${r.title}`"
                  class="eco-search-item"
                  @click="goToVideo(r)"
                >
                  <q-icon name="mdi-play-circle-outline" size="13px" class="q-mr-xs" />
                  <span v-html="highlightMatch(r.title)" />
                </div>
              </template>
              <div v-if="!searchResults.subs.length && !searchResults.vids.length" class="eco-search-empty">
                No results found.
              </div>
            </div>
          </div>
        </div>
        <q-btn
          v-if="member.isSignedIn && !rewards.isAdmin"
          flat dense size="sm"
          icon="mdi-lightbulb-on-outline"
          label="Suggest a video"
          color="teal-4"
          @click="openSuggestVideo()"
        />
        <q-btn
          flat dense size="sm"
          icon="mdi-map-marker-plus"
          label="Start a settlement"
          color="blue-grey-4"
          @click="setSuggestedFocus('library'); $router.push('/galaxy?suggestedFocus=library')"
        />
        <q-btn
          v-if="rewards.isAdmin"
          flat dense size="sm"
          icon="mdi-inbox-arrow-down-outline"
          :label="`Suggestions${pendingSuggestions.length ? ' (' + pendingSuggestions.length + ')' : ''}`"
          :color="pendingSuggestions.length ? 'amber-5' : 'blue-grey-4'"
          @click="openReviewQueue"
        />
        <q-btn
          v-if="canEditLibrary"
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
        <q-btn
          v-if="isLocalhost"
          flat dense size="sm"
          icon="mdi-source-commit-end"
          :label="pushing ? 'Pushing…' : 'Save to repo'"
          :color="dirty ? 'green-5' : 'blue-grey-5'"
          :disable="pushing"
          :class="{ 'eco-export-pulse': dirty }"
          @click="saveToRepo"
        />
      </div>
    </div>

    <div v-if="loading" class="eco-loading">
      <q-spinner-dots color="teal-6" size="28px" />
    </div>

    <template v-else>

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

      <div v-if="activeTab === 'all'" class="eco-overview-grid">
        <div
          v-for="area in areas" :key="area.area"
          class="eco-area-tile"
          :style="{ '--tile-accent': areaAccent(area.area) }"
          @click="switchTab(area.area.toLowerCase())"
          role="button" tabindex="0"
          @keyup.enter="switchTab(area.area.toLowerCase())"
        >
          <div class="eco-tile-head">
            <q-icon :name="areaIcon(area.area)" size="28px" :color="areaColor(area.area)" />
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
          <div class="eco-tile-enter">Browse →</div>
        </div>
      </div>

      <div v-else class="eco-detail">

        <div
          v-for="(sub, si) in activeArea?.subcategories ?? []"
          :key="sub.uniqueId"
          :id="`subcat-${sub.uniqueId}`"
          class="eco-subcat"
          :class="{ 'eco-subcat--open': openSubcats.has(sub.uniqueId) }"
        >
          <div class="eco-subcat-head" @click="toggleSubcat(sub.uniqueId)">
            <div class="eco-subcat-title-wrap">
              <span class="eco-subcat-title">{{ sub.title }}</span>
              <span
                v-if="sub.subtitle && sub.subtitle !== sub.title"
                class="eco-subcat-subtitle"
              >{{ sub.subtitle }}</span>

              <div v-if="getUniqueVideoTags(sub).length" class="eco-header-tags q-mt-xs" @click.stop>
                <span
                  v-for="tag in getUniqueVideoTags(sub)"
                  :key="tag"
                  :class="['eco-header-tag', { 'eco-header-tag--active': activeVideoFilters[sub.uniqueId] === tag }]"
                  @click="toggleTagFilter(sub.uniqueId, tag)"
                >
                  #{{ tag }}
                </span>
              </div>
            </div>
            <div class="eco-subcat-right">
              <q-btn
                v-if="editMode"
                flat round dense size="xs"
                icon="mdi-pencil-outline"
                color="amber-6"
                title="Edit subcategory"
                @click.stop="openEditSubcat(activeAreaIdx, si)"
                class="eco-subcat-edit-btn"
              />
              <span class="eco-subcat-vcount">
                <q-icon name="mdi-play-circle-outline" size="12px" class="q-mr-xs" />
                {{ getFilteredVideos(sub).length }} / {{ sub.videos?.length ?? 0 }}
              </span>
              <q-icon
                :name="openSubcats.has(sub.uniqueId) ? 'mdi-chevron-up' : 'mdi-chevron-down'"
                size="18px" color="blue-grey-6"
              />
            </div>
          </div>

          <Transition name="subcat-slide">
            <div v-if="openSubcats.has(sub.uniqueId)" class="eco-subcat-body">

              <div 
                v-if="activeVideoFilters[sub.uniqueId] && getSelectedTagMeta(sub.uniqueId)" 
                class="eco-tag-meta-box q-my-md animate-fade"
              >
                <div class="row items-center justify-between q-mb-xs">
                  <div class="eco-tag-meta-title text-amber-4 text-weight-medium">
                    <q-icon name="mdi-tag-text" size="14px" class="q-mr-xs" />
                    Focus: #{{ activeVideoFilters[sub.uniqueId] }}
                  </div>
                  <q-btn 
                    v-if="editMode"
                    flat dense round size="xs" 
                    icon="mdi-playlist-edit" 
                    color="amber-4"
                    title="Edit tag metadata"
                    @click="openEditTagMeta(sub.uniqueId, activeVideoFilters[sub.uniqueId]!)"
                  />
                </div>
                <p v-if="getSelectedTagMeta(sub.uniqueId)?.description" class="eco-tag-meta-desc">
                  {{ getSelectedTagMeta(sub.uniqueId)?.description }}
                </p>
                <div v-if="getSelectedTagMeta(sub.uniqueId)?.link" class="q-mt-xs">
                  <a 
                    :href="getSelectedTagMeta(sub.uniqueId)?.link" 
                    target="_blank" 
                    rel="noopener" 
                    class="eco-tag-meta-link"
                  >
                    <q-icon name="mdi-open-in-new" size="12px" class="q-mr-xs" />
                    {{ getSelectedTagMeta(sub.uniqueId)?.linkLabel || 'Reference Resource Link' }}
                  </a>
                </div>
              </div>

              <div 
                v-if="editMode && activeVideoFilters[sub.uniqueId] && !getSelectedTagMeta(sub.uniqueId)" 
                class="eco-tag-meta-box eco-tag-meta-box--empty q-my-md row items-center justify-between"
              >
                <span class="text-caption text-blue-grey-5">No descriptions or resource links attached to #{{ activeVideoFilters[sub.uniqueId] }}.</span>
                <q-btn 
                  flat dense size="xs" 
                  label="Configure Tag" 
                  icon="mdi-plus" 
                  color="teal-4" 
                  @click="openEditTagMeta(sub.uniqueId, activeVideoFilters[sub.uniqueId]!)"
                />
              </div>

              <div v-if="sub.description" class="eco-subcat-desc">{{ sub.description }}</div>

              <div v-if="sub.representativeImage" class="eco-subcat-rep-image">
                <img :src="sub.representativeImage" class="eco-subcat-rep-img" loading="lazy" />
              </div>

              <div v-if="sub.tags?.length" class="eco-tags">
                <span v-for="tag in sub.tags.slice(0, 7)" :key="tag" class="eco-tag">{{ tag }}</span>
              </div>

              <div v-if="getFilteredVideos(sub).length" class="eco-videos">
                <div
                  v-for="(vid, vi) in getFilteredVideos(sub)" :key="`${sub.uniqueId}-${vi}`"
                  :id="`video-${sub.uniqueId}-${sub.videos?.indexOf(vid) ?? vi}`"
                  class="eco-video-wrap"
                  :class="{ 'eco-video-wrap--edit': editMode }"
                >
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
                      <div class="eco-video-title">
                        {{ vid.title }}
                        <span v-if="vid.communitySuggested" class="eco-community-badge" title="Suggested by a community member, approved by the editor">
                          <q-icon name="mdi-account-heart-outline" size="10px" /> community
                        </span>
                      </div>
                      <div
                        v-if="vid.description && vid.description.length > 2"
                        class="eco-video-desc"
                      >{{ vid.description.slice(0, 100) }}{{ vid.description.length > 100 ? '…' : '' }}</div>
                      
                      <div v-if="vid.tags?.length" class="eco-video-card-tags row q-gutter-xs q-mt-xs">
                        <span v-for="t in vid.tags" :key="t" class="eco-video-card-tag">
                          {{ t }}
                        </span>
                      </div>

                      <div v-if="vid.authors" class="eco-video-author q-mt-xs">{{ vid.authors }}</div>
                      <div v-if="!isValidYtId(vid.youtubeId)" class="eco-video-soon">
                        <q-icon name="mdi-clock-outline" size="11px" class="q-mr-xs" />link coming soon
                      </div>
                    </div>
                  </a>

                  <div v-if="editMode" class="eco-video-actions">
                    <q-btn
                      flat round dense size="xs"
                      icon="mdi-pencil"
                      color="amber-5"
                      title="Edit video"
                      @click.stop="openEditVideo(activeAreaIdx, si, vi)"
                    />
                    <q-btn
                      flat round dense size="xs"
                      icon="mdi-delete-outline"
                      color="red-4"
                      title="Delete video"
                      @click.stop="deleteVideo(activeAreaIdx, si, vi)"
                    />
                  </div>
                </div>
              </div>

              <div v-if="editMode" class="eco-add-video-row">
                <q-btn
                  flat dense size="sm"
                  icon="mdi-plus-circle-outline"
                  label="Add video"
                  color="teal-5"
                  @click="openAddVideo(activeAreaIdx, si)"
                />
              </div>
              <div v-else-if="member.isSignedIn && !rewards.isAdmin" class="eco-add-video-row">
                <q-btn
                  flat dense size="sm"
                  icon="mdi-lightbulb-on-outline"
                  label="Suggest a video for this section"
                  color="teal-4"
                  @click="openSuggestVideo(activeAreaIdx, si)"
                />
              </div>

              <div v-if="!getFilteredVideos(sub).length" class="eco-no-videos">
                <q-icon name="mdi-video-off-outline" size="16px" color="blue-grey-7" />
                <span>No video resources match selected criteria here.</span>
              </div>

            </div>
          </Transition>
        </div>

        <div v-if="editMode" class="eco-add-subcat-row">
          <q-btn
            flat dense size="sm"
            icon="mdi-folder-plus-outline"
            label="Add subcategory"
            color="amber-5"
            @click="openAddSubcat(activeAreaIdx)"
          />
        </div>

      </div>

    </template>

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

          <div class="eco-edit-field-label">YouTube URL or ID <span class="eco-field-hint">(paste full URL or 11-char ID)</span></div>
          <div class="eco-yt-input-row">
            <input
              v-model.trim="editForm.youtubeId"
              class="eco-edit-input eco-yt-raw-input"
              :class="{ 'eco-edit-input--error': editForm.youtubeId && !isValidYtId(editForm.youtubeId) }"
              placeholder="https://youtu.be/… or dQw4w9WgXcQ"
            />
            <q-btn
              v-if="isValidYtId(editForm.youtubeId)"
              flat dense size="sm"
              icon="mdi-cloud-download-outline"
              :label="ytFetching ? 'Fetching…' : 'Fetch'"
              color="teal-4"
              :disable="ytFetching"
              @click="fetchYtMeta"
              class="eco-yt-fetch-btn"
            />
          </div>
          <div v-if="editForm.youtubeId && !isValidYtId(editForm.youtubeId)" class="eco-edit-error">
            Could not extract a valid YouTube ID from this URL
          </div>

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

          <div class="eco-edit-field-label">Title <span class="eco-field-required">*</span></div>
          <input
            v-model="editForm.title"
            class="eco-edit-input"
            placeholder="Video title"
          />

          <div class="eco-edit-field-label">Video Tags <span class="eco-field-hint">(Comma separated · e.g. Build, Setup, Solar)</span></div>
          <input
            v-model="editForm.tagsString"
            class="eco-edit-input"
            placeholder="Tools, Inverter, Calibration"
          />

          <div class="eco-edit-field-label">Description</div>
          <textarea
            v-model="editForm.description"
            class="eco-edit-input eco-edit-textarea"
            placeholder="Brief description of the video content"
            rows="3"
          />

          <div class="eco-edit-field-label">Author / Channel</div>
          <input
            v-model="editForm.authors"
            class="eco-edit-input"
            placeholder="Creator or channel name"
          />

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

    <q-dialog v-model="tagMetaDialog" persistent>
      <q-card class="eco-edit-card">
        <div class="eco-edit-header">
          <span class="text-subtitle2 text-amber-4">Configure Tag Properties</span>
          <span class="text-caption text-blue-grey-6 q-mx-sm">#{{ tagMetaForm.tagName }}</span>
          <q-space />
          <q-btn flat round dense size="sm" icon="mdi-close" color="blue-grey-5" @click="tagMetaDialog = false" />
        </div>
        
        <div class="eco-edit-body">
          <div class="eco-edit-field-label">Context Summary / Tag Description</div>
          <textarea
            v-model="tagMetaForm.description"
            class="eco-edit-input eco-edit-textarea"
            placeholder="What should field users understand about this particular category?"
            rows="3"
          />

          <div class="eco-edit-field-label">Reference Documentation Link</div>
          <input
            v-model.trim="tagMetaForm.link"
            class="eco-edit-input"
            placeholder="https://documentation-manual.org/path"
          />

          <div class="eco-edit-field-label">Link Text Label</div>
          <input
            v-model="tagMetaForm.linkLabel"
            class="eco-edit-input"
            placeholder="e.g., Download Technical PDF Specs"
          />
        </div>

        <div class="eco-edit-footer">
          <q-btn flat label="Cancel" color="blue-grey-5" @click="tagMetaDialog = false" />
          <q-btn unelevated label="Save Properties" color="teal-7" @click="saveTagMeta" />
        </div>
      </q-card>
    </q-dialog>

    <q-dialog v-model="subcatDialog" persistent>
      <q-card class="eco-edit-card">
        <div class="eco-edit-header">
          <span class="text-subtitle2 text-amber-4">
            {{ subcatForm.mode === 'add' ? 'Add Subcategory' : 'Edit Subcategory' }}
          </span>
          <span class="text-caption text-blue-grey-6 q-mx-sm">{{ activeArea?.area }}</span>
          <q-space />
          <q-btn flat round dense size="sm" icon="mdi-close" color="blue-grey-5" @click="subcatDialog = false" />
        </div>
        <div class="eco-edit-body">
          <div class="eco-edit-field-label">Title <span class="eco-field-required">*</span></div>
          <input v-model="subcatForm.title" class="eco-edit-input" placeholder="Subcategory name" />

          <div class="eco-edit-field-label">Subtitle</div>
          <input v-model="subcatForm.subtitle" class="eco-edit-input" placeholder="Optional short subtitle" />

          <div class="eco-edit-field-label">Description</div>
          <textarea
            v-model="subcatForm.description"
            class="eco-edit-input eco-edit-textarea"
            placeholder="Overview of this subcategory's focus"
            rows="3"
          />

          <div class="eco-edit-field-label">Representative Image</div>
          <div class="eco-img-field-row">
            <input
              v-model.trim="subcatForm.representativeImage"
              class="eco-edit-input eco-yt-raw-input"
              placeholder="https://… or pick from gallery"
            />
            <q-btn
              flat dense size="sm"
              icon="mdi-upload-outline"
              color="teal-5"
              title="Upload from disk"
              :disable="imgUploading"
              @click="browseUploadImage"
              class="eco-yt-fetch-btn"
            />
            <q-btn
              flat dense size="sm"
              icon="mdi-image-multiple-outline"
              color="blue-grey-4"
              title="Pick from gallery"
              @click="openImgGallery"
              class="eco-yt-fetch-btn"
            />
          </div>

          <div v-if="subcatForm.representativeImage" class="eco-edit-preview eco-subcat-img-preview">
            <img
              :src="subcatForm.representativeImage"
              class="eco-edit-preview-img"
              @error="(e) => ((e.target as HTMLImageElement).style.opacity = '0.1')"
            />
            <span class="eco-edit-yt-link" style="cursor:pointer" @click="subcatForm.representativeImage = ''">
              <q-icon name="mdi-close-circle" size="12px" /> clear
            </span>
          </div>

          <div v-if="imgGalleryOpen" class="eco-img-gallery">
            <div class="eco-img-gallery-head">
              <span class="text-caption text-blue-grey-4">eco-images/ gallery — click to use</span>
              <q-btn flat round dense size="xs" icon="mdi-close" color="blue-grey-6" @click="imgGalleryOpen = false" />
            </div>
            <div v-if="imgGalleryList.length === 0" class="eco-img-gallery-empty">
              No images yet — upload one first.
            </div>
            <div v-else class="eco-img-gallery-grid">
              <div
                v-for="url in imgGalleryList" :key="url"
                class="eco-img-thumb"
                :class="{ 'eco-img-thumb--active': subcatForm.representativeImage === url }"
                @click="subcatForm.representativeImage = url; imgGalleryOpen = false"
              >
                <img :src="url" loading="lazy" />
              </div>
            </div>
          </div>
        </div>
        <div class="eco-edit-footer">
          <q-btn flat label="Cancel" color="blue-grey-5" @click="subcatDialog = false" />
          <q-btn
            unelevated
            :label="subcatForm.mode === 'add' ? 'Add Subcategory' : 'Save Changes'"
            color="amber-7"
            :disable="!subcatForm.title.trim()"
            @click="saveSubcat"
          />
        </div>
      </q-card>
    </q-dialog>

    <!-- ── Suggest a video — queued for editor review, not a direct write ── -->
    <q-dialog v-model="suggestDialog" persistent>
      <q-card class="eco-edit-card">
        <div class="eco-edit-header">
          <span class="text-subtitle2 text-teal-4">Suggest a Video</span>
          <q-space />
          <q-btn flat round dense size="sm" icon="mdi-close" color="blue-grey-5" @click="suggestDialog = false" />
        </div>
        <div class="eco-edit-body">
          <p class="text-caption text-blue-grey-5 q-mb-sm">
            Goes to the editor for review — not added to the library automatically.
          </p>

          <div class="eco-edit-field-label">Area</div>
          <select v-model="suggestForm.areaKey" class="eco-edit-input">
            <option v-for="a in areas" :key="a.area" :value="a.area">{{ a.area }}</option>
          </select>

          <div class="eco-edit-field-label">Section</div>
          <select v-model="suggestForm.subcatId" class="eco-edit-input">
            <option v-for="s in suggestSubcatOptions" :key="s.uniqueId" :value="s.uniqueId">{{ s.title }}</option>
          </select>

          <div class="eco-edit-field-label">YouTube URL or ID <span class="eco-field-required">*</span></div>
          <input
            v-model.trim="suggestForm.youtubeId"
            class="eco-edit-input eco-yt-raw-input"
            :class="{ 'eco-edit-input--error': suggestForm.youtubeId && !isValidYtId(suggestForm.youtubeId) }"
            placeholder="https://youtu.be/… or dQw4w9WgXcQ"
          />
          <div v-if="suggestForm.youtubeId && !isValidYtId(suggestForm.youtubeId)" class="eco-edit-error">
            Could not extract a valid YouTube ID from this URL
          </div>
          <div v-if="isValidYtId(suggestForm.youtubeId)" class="eco-edit-preview">
            <img :src="`https://img.youtube.com/vi/${suggestForm.youtubeId}/mqdefault.jpg`" class="eco-edit-preview-img"
              @error="(e) => ((e.target as HTMLImageElement).style.opacity = '0.2')" />
          </div>

          <div class="eco-edit-field-label">Title <span class="eco-field-required">*</span></div>
          <input v-model="suggestForm.title" class="eco-edit-input" placeholder="Video title" />

          <div class="eco-edit-field-label">Why this fits <span class="eco-field-hint">(shown to the reviewer only)</span></div>
          <textarea v-model="suggestForm.note" class="eco-edit-input eco-edit-textarea" rows="3"
            placeholder="What it covers, why it's a good fit for this section" />
        </div>
        <div class="eco-edit-footer">
          <q-btn flat label="Cancel" color="blue-grey-5" @click="suggestDialog = false" />
          <q-btn unelevated label="Submit for review" color="teal-7"
            :disable="!suggestForm.title.trim() || !isValidYtId(suggestForm.youtubeId) || suggesting"
            @click="submitSuggestion" />
        </div>
        <p v-if="suggestSubmitted" class="text-caption text-teal-4 q-px-md q-pb-md">Submitted — thank you.</p>
      </q-card>
    </q-dialog>

    <!-- ── Admin review queue ──────────────────────────────────────────── -->
    <q-dialog v-model="reviewDialog">
      <q-card class="eco-edit-card" style="max-width:560px">
        <div class="eco-edit-header">
          <span class="text-subtitle2 text-amber-4">Suggested Videos</span>
          <q-space />
          <q-btn flat round dense size="sm" icon="mdi-close" color="blue-grey-5" @click="reviewDialog = false" />
        </div>
        <div class="eco-edit-body">
          <p v-if="!pendingSuggestions.length" class="text-caption text-blue-grey-5">Nothing pending review.</p>
          <div v-for="s in pendingSuggestions" :key="s.id" class="eco-suggestion-row">
            <img v-if="isValidYtId(s.youtube_id)" :src="`https://img.youtube.com/vi/${s.youtube_id}/mqdefault.jpg`" class="eco-suggestion-thumb" />
            <div class="eco-suggestion-body">
              <div class="text-body2 text-blue-grey-2">{{ s.title }}</div>
              <div class="text-caption text-blue-grey-5">{{ s.area }} › {{ subcatTitle(s.area, s.subcat_id) }}</div>
              <div v-if="s.note" class="text-caption text-blue-grey-6 q-mt-xs">{{ s.note }}</div>
              <a :href="`https://www.youtube.com/watch?v=${s.youtube_id}`" target="_blank" rel="noopener" class="eco-edit-yt-link">
                <q-icon name="mdi-open-in-new" size="12px" /> view on YouTube
              </a>
            </div>
            <div class="eco-suggestion-actions">
              <q-btn flat dense size="sm" icon="mdi-check" color="green-5" label="Approve" @click="reviewSuggestion(s.id, 'approved')" />
              <q-btn flat dense size="sm" icon="mdi-close" color="red-4" label="Reject" @click="reviewSuggestion(s.id, 'rejected')" />
            </div>
          </div>
        </div>
      </q-card>
    </q-dialog>

  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { supabase } from 'src/lib/supabase'
import { useMemberStore } from 'src/stores/member'
import { useRewardsStore } from 'src/stores/rewards'
import { setSuggestedFocus } from 'src/lib/settlement-focus-intent'

// ── Types ──────────────────────────────────────────────────────────────────────
interface OtVideo {
  title: string
  youtubeId: string
  description?: string
  authors?: string
  icon_tag_fa?: string
  color_tag?: string
  tags?: string[] // Integrated tagging array support
  [key: string]: unknown
}

interface OtTagMeta {
  tagName: string
  description: string
  link: string
  linkLabel: string
}

interface OtSubcategory {
  uniqueId: string
  title: string
  subtitle?: string
  description?: string
  representativeImage?: string
  tags?: string[] // Subcategory system tags
  videoTagDirectory?: Record<string, OtTagMeta> // Maps specific video tags to structured content descriptions
  videos?: OtVideo[]
}

interface OtArea {
  area: string
  featherIcon?: string
  subcategories: OtSubcategory[]
}

// ── Storage Engine Configuration ───────────────────────────────────────────────
const STORAGE_KEY = 'eco_ops_library_data'

const loading = ref(true)
const areas   = ref<OtArea[]>([])
const dirty   = ref(false)

const member  = useMemberStore()
const rewards = useRewardsStore()
// "Edit library" mode used to render for every visitor with no gate at all —
// saving only ever worked for the site owner running locally anyway (see
// isLocalhost/saveToRepo below), but the toggle itself was visible and
// interactive to anyone. Gated on the same trust model saveToRepo already
// uses (localhost) plus real admin status for production.
const canEditLibrary = computed(() => isLocalhost || rewards.isAdmin)

// Runtime filtering states tracking subcategory components individually
const activeVideoFilters = ref<Record<string, string | null>>({})

function saveToLocalStorage() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(areas.value))
  } catch (e) {
    console.error('EcoOps: LocalStorage preservation failure', e)
  }
}

async function loadData() {
  try {
    const localData = localStorage.getItem(STORAGE_KEY)
    if (localData) {
      areas.value = JSON.parse(localData)
      dirty.value = localStorage.getItem(`${STORAGE_KEY}_dirty`) === 'true'
    } else {
      const res = await fetch('/ot6a.json')
      areas.value = (await res.json()) as OtArea[]
    }
    await mergeApprovedSuggestions()
  } catch (e) {
    console.error('EcoOps: Initialization stream broke down', e)
  } finally {
    loading.value = false
  }
}

watch(dirty, (newVal) => {
  localStorage.setItem(`${STORAGE_KEY}_dirty`, String(newVal))
})

// ── Video Filtering Operations ──────────────────────────────────────────────────
function getUniqueVideoTags(subcat: OtSubcategory): string[] {
  if (!subcat.videos) return []
  const collector = new Set<string>()
  subcat.videos.forEach(v => {
    v.tags?.forEach(tag => { if (tag.trim()) collector.add(tag.trim()) })
  })
  return Array.from(collector).sort()
}

function toggleTagFilter(subcatId: string, tag: string) {
  if (activeVideoFilters.value[subcatId] === tag) {
    activeVideoFilters.value[subcatId] = null
  } else {
    activeVideoFilters.value[subcatId] = tag
  }
}

function getFilteredVideos(subcat: OtSubcategory): OtVideo[] {
  if (!subcat.videos) return []
  const currentCriteria = activeVideoFilters.value[subcat.uniqueId]
  if (!currentCriteria) return subcat.videos
  
  return subcat.videos.filter(v => v.tags?.includes(currentCriteria))
}

function getSelectedTagMeta(subcatId: string): OtTagMeta | null {
  const currentSub = areas.value.flatMap(a => a.subcategories).find(s => s.uniqueId === subcatId)
  const activeTag = activeVideoFilters.value[subcatId]
  if (!currentSub || !activeTag || !currentSub.videoTagDirectory) return null
  return currentSub.videoTagDirectory[activeTag] ?? null
}

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
}

function switchTab(key: string) {
  activeTab.value = key
  openSubcats.value = new Set()
  if (key !== 'all') {
    const area = areas.value.find(a => a.area.toLowerCase() === key)
    if (area?.subcategories[0]) openSubcats.value = new Set([area.subcategories[0].uniqueId])
  }
}

watch(activeArea, area => {
  if (area && openSubcats.value.size === 0 && area.subcategories[0]) {
    openSubcats.value = new Set([area.subcategories[0].uniqueId])
  }
})

// ── Search — Vue-native equivalent of the live-search-as-you-type feature on
// hub.approvideo.org (searches subcategories + videos, jumps straight to the
// result). Built as a flat index over the same `areas` data already loaded,
// rather than porting any of their DOM/vanilla-JS implementation directly. ──

interface SearchSubcatHit { uniqueId: string; areaKey: string; title: string }
interface SearchVideoHit  { subcatUniqueId: string; areaKey: string; title: string }

const searchOpen    = ref(false)
const searchQuery   = ref('')
const searchWrapEl   = ref<HTMLElement>()
const searchInputEl  = ref<HTMLInputElement>()

const searchIndex = computed(() => {
  const subs: (SearchSubcatHit & { subtitle?: string; description?: string })[] = []
  const vids: (SearchVideoHit & { description?: string })[] = []
  for (const area of areas.value) {
    const areaKey = area.area.toLowerCase()
    for (const sub of area.subcategories) {
      subs.push({ uniqueId: sub.uniqueId, areaKey, title: sub.title, subtitle: sub.subtitle, description: sub.description })
      for (const v of sub.videos ?? []) {
        vids.push({ subcatUniqueId: sub.uniqueId, areaKey, title: v.title, description: v.description })
      }
    }
  }
  return { subs, vids }
})

const searchResults = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) return { subs: [] as typeof searchIndex.value.subs, vids: [] as typeof searchIndex.value.vids }
  const matchSub = (s: (typeof searchIndex.value.subs)[number]) =>
    s.title.toLowerCase().includes(q) || (s.subtitle?.toLowerCase().includes(q) ?? false) || (s.description?.toLowerCase().includes(q) ?? false)
  const matchVid = (v: (typeof searchIndex.value.vids)[number]) =>
    v.title.toLowerCase().includes(q) || (v.description?.toLowerCase().includes(q) ?? false)
  return {
    subs: searchIndex.value.subs.filter(matchSub).slice(0, 8),
    vids: searchIndex.value.vids.filter(matchVid).slice(0, 8),
  }
})

function highlightMatch(text: string): string {
  const q = searchQuery.value.trim()
  if (!q) return text
  const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return text.replace(new RegExp(`(${escaped})`, 'gi'), '<mark>$1</mark>')
}

function closeSearch() {
  searchOpen.value  = false
  searchQuery.value = ''
}

function revealSubcat(areaKey: string, uniqueId: string) {
  switchTab(areaKey)
  void nextTick(() => {
    openSubcats.value = new Set([...openSubcats.value, uniqueId])
    void nextTick(() => {
      document.getElementById(`subcat-${uniqueId}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  })
}

function goToSubcat(r: SearchSubcatHit) {
  revealSubcat(r.areaKey, r.uniqueId)
  closeSearch()
}

function goToVideo(r: SearchVideoHit) {
  switchTab(r.areaKey)
  void nextTick(() => {
    openSubcats.value = new Set([...openSubcats.value, r.subcatUniqueId])
    void nextTick(() => {
      const el = document.getElementById(`subcat-${r.subcatUniqueId}`)
      // Scroll to the subcategory first (it needs a tick to render its body open),
      // then to the specific video card once it exists in the DOM.
      el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      setTimeout(() => {
        const videoEls = document.querySelectorAll(`[id^="video-${r.subcatUniqueId}-"]`)
        for (const vEl of videoEls) {
          if (vEl.textContent?.includes(r.title)) {
            vEl.scrollIntoView({ behavior: 'smooth', block: 'center' })
            break
          }
        }
      }, 150)
    })
  })
  closeSearch()
}

watch(searchOpen, open => {
  if (open) void nextTick(() => searchInputEl.value?.focus())
})

function onDocumentClick(e: MouseEvent) {
  if (searchOpen.value && searchWrapEl.value && !searchWrapEl.value.contains(e.target as Node)) {
    closeSearch()
  }
}

// ── YouTube helpers ────────────────────────────────────────────────────────────
const isValidYtId = (id: string) => /^[A-Za-z0-9_-]{11}$/.test(id ?? '')

function extractYtId(raw: string): string {
  if (isValidYtId(raw)) return raw
  const m1 = raw.match(/[?&]v=([A-Za-z0-9_-]{11})/)
  if (m1) return m1[1]!
  const m2 = raw.match(/youtu\.be\/([A-Za-z0-9_-]{11})/)
  if (m2) return m2[1]!
  return raw
}

const ytFetching = ref(false)

async function fetchYtMeta() {
  const id = editForm.value.youtubeId
  if (!isValidYtId(id)) return
  ytFetching.value = true
  try {
    const res = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${id}&format=json`)
    if (res.ok) {
      const data = await res.json() as { title?: string; author_name?: string }
      if (data.title) editForm.value.title = data.title
      if (data.author_name) editForm.value.authors = data.author_name
    }
  } catch (e) {
    console.warn('[EcoOps] YouTube metadata fetch failed', e)
  } finally {
    ytFetching.value = false
  }
}

// ── Edit mode configurations ───────────────────────────────────────────────────
const editMode       = ref(false)
const editDialog     = ref(false)
const tagMetaDialog  = ref(false)

interface EditForm {
  mode: 'add' | 'edit'
  areaIdx: number
  subcatIdx: number
  videoIdx: number
  areaName: string
  subcatName: string
  youtubeId: string
  title: string
  description: string
  authors: string
  tagsString: string
  _original: OtVideo | null
}

const editForm = ref<EditForm>({
  mode: 'add', areaIdx: 0, subcatIdx: 0, videoIdx: -1,
  areaName: '', subcatName: '',
  youtubeId: '', title: '', description: '', authors: '', tagsString: '',
  _original: null,
})

watch(() => editForm.value.youtubeId, (raw) => {
  const extracted = extractYtId(raw)
  if (extracted !== raw && isValidYtId(extracted)) {
    editForm.value.youtubeId = extracted
  }
})

interface TagMetaForm {
  subcatId: string
  tagName: string
  description: string
  link: string
  linkLabel: string
}

const tagMetaForm = ref<TagMetaForm>({
  subcatId: '', tagName: '', description: '', link: '', linkLabel: ''
})

const previewThumbUrl = computed(() =>
  isValidYtId(editForm.value.youtubeId)
    ? `https://img.youtube.com/vi/${editForm.value.youtubeId}/mqdefault.jpg`
    : null
)

function openAddVideo(areaIdx: number, subcatIdx: number) {
  const area  = areas.value[areaIdx]
  const subcat = area?.subcategories[subcatIdx]
  if (!area || !subcat) return
  editForm.value = {
    mode: 'add', areaIdx, subcatIdx, videoIdx: -1,
    areaName: area.area, subcatName: subcat.title,
    youtubeId: '', title: '', description: '', authors: '', tagsString: '',
    _original: null,
  }
  editDialog.value = true
}

function openEditVideo(areaIdx: number, subcatIdx: number, videoIdx: number) {
  const area   = areas.value[areaIdx]
  const subcat = area?.subcategories[subcatIdx]
  if (!subcat) return
  
  // Safely translate view list bounds into actual matrix slots
  const filteredList = getFilteredVideos(subcat)
  const vid = filteredList[videoIdx]
  if (!vid) return
  
  const actualIndex = subcat.videos?.indexOf(vid) ?? videoIdx

  editForm.value = {
    mode: 'edit', areaIdx, subcatIdx, videoIdx: actualIndex,
    areaName: area.area, subcatName: subcat.title,
    youtubeId:   vid.youtubeId ?? '',
    title:       vid.title ?? '',
    description: vid.description ?? '',
    authors:     vid.authors ?? '',
    tagsString:  vid.tags ? vid.tags.join(', ') : '',
    _original:   vid,
  }
  editDialog.value = true
}

function saveVideo() {
  const { mode, areaIdx, subcatIdx, videoIdx, youtubeId, title, description, authors, tagsString, _original } = editForm.value
  const area   = areas.value[areaIdx]
  const subcat = area?.subcategories[subcatIdx]
  if (!subcat) return

  const parsedTags = tagsString.split(',').map(t => t.trim()).filter(t => t.length > 0)

  const newVid: OtVideo = {
    ...(_original ?? {}),
    title:       title.trim(),
    youtubeId:   youtubeId.trim(),
    description: description.trim(),
    authors:     authors.trim(),
    tags:        parsedTags
  }

  if (mode === 'add') {
    if (!subcat.videos) subcat.videos = []
    subcat.videos.push(newVid)
  } else {
    if (subcat.videos) subcat.videos[videoIdx] = newVid
  }

  dirty.value = true
  saveToLocalStorage()
  editDialog.value = false
}

function deleteVideo(areaIdx: number, subcatIdx: number, videoIdx: number) {
  const subcat = areas.value[areaIdx]?.subcategories[subcatIdx]
  if (!subcat?.videos) return
  
  const filteredList = getFilteredVideos(subcat)
  const vid = filteredList[videoIdx]
  if (!vid) return
  
  if (!confirm(`Delete "${vid.title}"?`)) return
  
  const actualIndex = subcat.videos.indexOf(vid)
  if (actualIndex !== -1) {
    subcat.videos.splice(actualIndex, 1)
    dirty.value = true
    saveToLocalStorage()
  }
}

// ── Tag Metadata Modifications ─────────────────────────────────────────────────
function openEditTagMeta(subcatId: string, tagName: string) {
  const subcat = areas.value.flatMap(a => a.subcategories).find(s => s.uniqueId === subcatId)
  if (!subcat) return
  
  const currentMeta = subcat.videoTagDirectory?.[tagName]
  
  tagMetaForm.value = {
    subcatId,
    tagName,
    description: currentMeta?.description ?? '',
    link: currentMeta?.link ?? '',
    linkLabel: currentMeta?.linkLabel ?? ''
  }
  tagMetaDialog.value = true
}

function saveTagMeta() {
  const { subcatId, tagName, description, link, linkLabel } = tagMetaForm.value
  const subcat = areas.value.flatMap(a => a.subcategories).find(s => s.uniqueId === subcatId)
  if (!subcat) return

  if (!subcat.videoTagDirectory) {
    subcat.videoTagDirectory = {}
  }

  subcat.videoTagDirectory[tagName] = {
    tagName,
    description: description.trim(),
    link: link.trim(),
    linkLabel: linkLabel.trim()
  }

  dirty.value = true
  saveToLocalStorage()
  tagMetaDialog.value = false
}

// ── Subcategory management ────────────────────────────────────────────────────
interface SubcatForm {
  mode: 'add' | 'edit'
  areaIdx: number
  subcatIdx: number
  title: string
  subtitle: string
  description: string
  representativeImage: string
}

const subcatDialog = ref(false)
const subcatForm = ref<SubcatForm>({
  mode: 'add', areaIdx: 0, subcatIdx: -1,
  title: '', subtitle: '', description: '', representativeImage: '',
})

function openAddSubcat(areaIdx: number) {
  const area = areas.value[areaIdx]
  if (!area) return
  subcatForm.value = {
    mode: 'add', areaIdx, subcatIdx: -1,
    title: '', subtitle: '', description: '', representativeImage: '',
  }
  subcatDialog.value = true
}

function openEditSubcat(areaIdx: number, subcatIdx: number) {
  const subcat = areas.value[areaIdx]?.subcategories[subcatIdx]
  if (!subcat) return
  subcatForm.value = {
    mode: 'edit', areaIdx, subcatIdx,
    title: subcat.title,
    subtitle: subcat.subtitle ?? '',
    description: subcat.description ?? '',
    representativeImage: subcat.representativeImage ?? '',
  }
  subcatDialog.value = true
}

function saveSubcat() {
  const { mode, areaIdx, subcatIdx, title, subtitle, description, representativeImage } = subcatForm.value
  const area = areas.value[areaIdx]
  if (!area || !title.trim()) return

  if (mode === 'add') {
    const uid = `${area.area.toLowerCase()}-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now()}`
    const newSubcat: OtSubcategory = {
      uniqueId: uid,
      title: title.trim(),
      ...(subtitle.trim() ? { subtitle: subtitle.trim() } : {}),
      ...(description.trim() ? { description: description.trim() } : {}),
      ...(representativeImage.trim() ? { representativeImage: representativeImage.trim() } : {}),
      videos: [],
    }
    area.subcategories.push(newSubcat)
    openSubcats.value = new Set([...openSubcats.value, uid])
  } else {
    const subcat = area.subcategories[subcatIdx]
    if (!subcat) return
    subcat.title = title.trim()
    subcat.subtitle = subtitle.trim() || undefined
    subcat.description = description.trim() || undefined
    subcat.representativeImage = representativeImage.trim() || undefined
  }

  dirty.value = true
  saveToLocalStorage()
  subcatDialog.value = false
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
  saveToLocalStorage()
}

// ── Image upload / gallery (localhost dev only) ───────────────────────────────
const imgUploading   = ref(false)
const imgGalleryOpen = ref(false)
const imgGalleryList = ref<string[]>([])

async function browseUploadImage() {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = 'image/*'
  input.onchange = async () => {
    const file = input.files?.[0]
    if (!file) return
    imgUploading.value = true
    try {
      const res = await fetch(`/api/upload-image?name=${encodeURIComponent(file.name)}`, {
        method: 'POST',
        headers: { 'Content-Type': file.type },
        body: file,
      })
      const data = await res.json() as { ok: boolean; url?: string; error?: string }
      if (data.ok && data.url) {
        subcatForm.value.representativeImage = data.url
        imgGalleryList.value = [...imgGalleryList.value.filter(u => u !== data.url), data.url]
      } else {
        console.error('[EcoOps] image upload failed:', data.error)
      }
    } catch (e) {
      console.error('[EcoOps] image upload error:', e)
    } finally {
      imgUploading.value = false
    }
  }
  input.click()
}

async function openImgGallery() {
  try {
    const res = await fetch('/api/eco-images')
    const data = await res.json() as { ok: boolean; images?: string[] }
    if (data.ok) imgGalleryList.value = data.images ?? []
  } catch (e) {
    imgGalleryList.value = []
  }
  imgGalleryOpen.value = true
}

// ── Save to repo (localhost dev only) ─────────────────────────────────────────
const isLocalhost = location.hostname === 'localhost' || location.hostname === '127.0.0.1'
const pushing = ref(false)

async function saveToRepo() {
  pushing.value = true
  try {
    const res = await fetch('/api/save-library', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(areas.value),
    })
    const result = await res.json() as { ok: boolean; committed?: boolean; commitMsg?: string; pushMsg?: string; error?: string }
    if (result.ok) {
      dirty.value = false
      saveToLocalStorage()
      const detail = result.committed
        ? `Committed & pushed — ${result.commitMsg ?? ''}`
        : 'No changes to commit (already up to date)'
      console.info('[EcoOps] save-to-repo:', detail, '|', result.pushMsg ?? '')
    } else {
      console.error('[EcoOps] save-to-repo failed:', result.error)
    }
  } catch (e) {
    console.error('[EcoOps] save-to-repo network error:', e)
  } finally {
    pushing.value = false
  }
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

// ── Video suggestions — a moderation queue, not a direct write ─────────────
// See supabase/migrations/010_video_suggestions.sql. Submitters go through
// this path instead of editMode, which is now gated to canEditLibrary.

interface VideoSuggestion {
  id: string; submitted_by: string; area: string; subcat_id: string
  youtube_id: string; title: string; note: string | null
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
}

const suggestDialog    = ref(false)
const suggestSubmitted = ref(false)
const suggesting       = ref(false)
const suggestForm = ref({ areaKey: '', subcatId: '', youtubeId: '', title: '', note: '' })

const suggestSubcatOptions = computed(() =>
  areas.value.find(a => a.area === suggestForm.value.areaKey)?.subcategories ?? []
)
watch(() => suggestForm.value.areaKey, () => {
  suggestForm.value.subcatId = suggestSubcatOptions.value[0]?.uniqueId ?? ''
})
watch(() => suggestForm.value.youtubeId, (raw) => {
  const extracted = extractYtId(raw)
  if (extracted !== raw && isValidYtId(extracted)) suggestForm.value.youtubeId = extracted
})

function openSuggestVideo(areaIdx?: number, subcatIdx?: number) {
  const area   = areaIdx != null ? areas.value[areaIdx] : (areas.value.find(a => a.area.toLowerCase() === activeTab.value) ?? areas.value[0])
  const subcat = area && subcatIdx != null ? area.subcategories[subcatIdx] : area?.subcategories[0]
  suggestForm.value = {
    areaKey: area?.area ?? '', subcatId: subcat?.uniqueId ?? '',
    youtubeId: '', title: '', note: '',
  }
  suggestSubmitted.value = false
  suggestDialog.value = true
}

async function submitSuggestion() {
  if (!supabase || !member.userId) return
  if (!suggestForm.value.title.trim() || !isValidYtId(suggestForm.value.youtubeId)) return
  suggesting.value = true
  try {
    const { error } = await supabase.from('video_suggestions').insert({
      submitted_by: member.userId,
      area:         suggestForm.value.areaKey,
      subcat_id:    suggestForm.value.subcatId,
      youtube_id:   suggestForm.value.youtubeId,
      title:        suggestForm.value.title.trim(),
      note:         suggestForm.value.note.trim() || null,
    })
    if (!error) {
      suggestSubmitted.value = true
      setTimeout(() => { suggestDialog.value = false }, 1400)
    }
  } finally {
    suggesting.value = false
  }
}

// ── Admin review queue ──────────────────────────────────────────────────────

const reviewDialog       = ref(false)
const pendingSuggestions = ref<VideoSuggestion[]>([])

function subcatTitle(area: string, subcatId: string): string {
  return areas.value.find(a => a.area === area)?.subcategories.find(s => s.uniqueId === subcatId)?.title ?? subcatId
}

async function loadPendingSuggestions() {
  if (!supabase || !rewards.isAdmin) return
  const { data } = await supabase.from('video_suggestions').select('*')
    .eq('status', 'pending').order('created_at', { ascending: false })
  pendingSuggestions.value = (data as VideoSuggestion[]) ?? []
}

function openReviewQueue() {
  reviewDialog.value = true
  void loadPendingSuggestions()
}

async function reviewSuggestion(id: string, status: 'approved' | 'rejected') {
  if (!supabase || !member.userId) return
  await supabase.from('video_suggestions').update({
    status, reviewed_at: new Date().toISOString(), reviewed_by: member.userId,
  }).eq('id', id)
  pendingSuggestions.value = pendingSuggestions.value.filter(s => s.id !== id)
  if (status === 'approved') await mergeApprovedSuggestions()
}

/**
 * Merges status='approved' suggestions into the in-memory library, tagged
 * communitySuggested so the template can badge them. Never written back to
 * localStorage/ot6a.json — this is a read-time overlay, re-fetched fresh on
 * every load, so approving/rejecting elsewhere can't leave a stale copy.
 */
async function mergeApprovedSuggestions() {
  if (!supabase) return
  const { data } = await supabase.from('video_suggestions').select('*').eq('status', 'approved')
  for (const s of (data as VideoSuggestion[] | null) ?? []) {
    const subcat = areas.value.find(a => a.area === s.area)?.subcategories.find(x => x.uniqueId === s.subcat_id)
    if (!subcat) continue
    subcat.videos ??= []
    if (subcat.videos.some(v => v.youtubeId === s.youtube_id)) continue
    subcat.videos.push({ title: s.title, youtubeId: s.youtube_id, communitySuggested: true })
  }
}

let resizeObs: ResizeObserver | null = null
onMounted(async () => {
  drawHeader()
  resizeObs = new ResizeObserver(drawHeader)
  if (headerWrap.value) resizeObs.observe(headerWrap.value)
  document.addEventListener('click', onDocumentClick)
  if (member.isSignedIn) await rewards.checkIsAdmin()
  await loadData()
})
onBeforeUnmount(() => {
  resizeObs?.disconnect()
  document.removeEventListener('click', onDocumentClick)
})
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

/* ── Search ─────────────────────────────────────────────────────── */
.eco-search-wrap { position: relative; }
.eco-search-panel {
  position: absolute; top: calc(100% + 8px); right: 0; z-index: 30;
  width: 320px; max-width: 80vw;
  background: rgba(4, 12, 20, 0.97); border: 1px solid rgba(0, 150, 200, 0.22);
  border-radius: 8px; padding: 10px; backdrop-filter: blur(10px);
  box-shadow: 0 8px 24px rgba(0,0,0,0.4);
}
.eco-search-input {
  width: 100%; box-sizing: border-box;
  background: rgba(0, 20, 35, 0.80); border: 1px solid rgba(0, 100, 160, 0.30);
  border-radius: 5px; color: rgba(200, 230, 255, 0.90);
  font-size: 12px; padding: 7px 10px; outline: none;
}
.eco-search-input:focus { border-color: rgba(0, 180, 220, 0.55); }
.eco-search-results { max-height: 320px; overflow-y: auto; margin-top: 8px; }
.eco-search-group-label {
  font-size: 8.5px; letter-spacing: 0.1em; text-transform: uppercase;
  color: rgba(100, 150, 180, 0.60); margin: 8px 4px 4px;
}
.eco-search-group-label:first-child { margin-top: 0; }
.eco-search-item {
  display: flex; align-items: center;
  font-size: 11.5px; color: rgba(190, 220, 240, 0.88);
  padding: 6px 8px; border-radius: 4px; cursor: pointer;
}
.eco-search-item:hover { background: rgba(0, 100, 160, 0.20); }
.eco-search-item :deep(mark) { background: rgba(255, 210, 60, 0.35); color: inherit; border-radius: 2px; }
.eco-search-empty { font-size: 10.5px; color: rgba(100, 140, 170, 0.55); padding: 8px 4px; font-style: italic; }

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
  background: rgba(5,18,14,0.88); border-radius: 10px; padding: 14px 14px 12px;
  cursor: pointer; transition: border-color 0.18s, background 0.18s;
  border: 1px solid rgba(35,90,65,0.30);
}
.eco-area-tile:hover { background: rgba(10,30,22,0.95); border-color: rgba(60,160,100,0.45); }
.eco-tile-head { display: flex; align-items: center; gap: 8px; margin-bottom: 10px; }
.eco-tile-name { font-size: 13px; font-weight: 600; color: #a8ccba; flex: 1; }
.eco-tile-badge { font-size: 9px; padding: 2px 6px; border-radius: 8px; }
.eco-tile-subs { display: flex; flex-wrap: wrap; gap: 4px; margin-bottom: 10px; }
.eco-sub-chip {
  font-size: 9px; padding: 2px 7px; border-radius: 10px;
  background: rgba(30,80,55,0.5); color: rgba(120,185,145,0.85);
  border: 1px solid rgba(40,100,70,0.35);
}
.eco-tile-enter { font-size: 10px; color: rgba(70,195,135,0.55); text-align: right; }

/* ── Detail accordion ───────────────────────────────────────────── */
.eco-detail { padding: 8px 14px 32px; display: flex; flex-direction: column; gap: 6px; }
.eco-subcat { background: rgba(5,18,14,0.82); border: 1px solid rgba(35,90,60,0.30); border-radius: 9px; overflow: hidden; }
.eco-subcat--open { border-color: rgba(50,140,90,0.50); }
.eco-subcat-head { display: flex; align-items: center; justify-content: space-between; padding: 12px 14px; cursor: pointer; user-select: none; transition: background 0.15s; }
.eco-subcat-head:hover { background: rgba(20,60,40,0.40); }
.eco-subcat-title-wrap { display: flex; flex-direction: column; gap: 2px; flex: 1; min-width: 0; }
.eco-subcat-title { font-size: 13px; font-weight: 600; color: #a8ccba; }
.eco-subcat-subtitle { font-size: 10px; color: rgba(90,150,115,0.80); }
.eco-subcat-right { display: flex; align-items: center; gap: 10px; flex-shrink: 0; }
.eco-subcat-vcount { font-size: 10px; color: rgba(90,150,115,0.75); display: flex; align-items: center; }
.eco-subcat-body { padding: 0 14px 14px; border-top: 1px solid rgba(35,90,60,0.25); }
.eco-subcat-desc { font-size: 11px; color: rgba(100,160,125,0.80); line-height: 1.55; margin: 10px 0 8px; }
.eco-tags { display: flex; flex-wrap: wrap; gap: 4px; margin-bottom: 12px; }
.eco-tag { font-size: 9px; padding: 2px 7px; border-radius: 8px; background: rgba(20,60,42,0.60); color: rgba(100,175,130,0.80); border: 1px solid rgba(40,100,70,0.28); }

/* ── Interactive Video Filtering Tags ───────────────────────────── */
.eco-header-tags { display: flex; flex-wrap: wrap; gap: 5px; }
.eco-header-tag {
  font-size: 10px; padding: 1px 6px; border-radius: 4px;
  background: rgba(30, 80, 55, 0.25); color: rgba(120, 185, 145, 0.65);
  border: 1px solid rgba(40, 100, 70, 0.15); cursor: pointer;
  transition: all 0.15s ease; user-select: none;
}
.eco-header-tag:hover { color: #a8ccba; background: rgba(30, 80, 55, 0.45); border-color: rgba(60, 160, 100, 0.4); }
.eco-header-tag--active {
  color: #ffca28; background: rgba(255, 202, 40, 0.12);
  border-color: rgba(255, 202, 40, 0.45); font-weight: 500;
}

/* ── Tag Context Meta Boxes ─────────────────────────────────────── */
.eco-tag-meta-box {
  background: rgba(255, 202, 40, 0.03); border: 1px dashed rgba(255, 202, 40, 0.25);
  border-radius: 6px; padding: 10px 12px;
}
.eco-tag-meta-box--empty {
  background: rgba(120, 140, 130, 0.02); border: 1px dashed rgba(120, 140, 130, 0.15);
}
.eco-tag-meta-desc { font-size: 11px; color: #b0c4b8; line-height: 1.5; margin: 4px 0; }
.eco-tag-meta-link {
  font-size: 11px; color: #4fc3f7; text-decoration: none;
  display: inline-flex; align-items: center; font-weight: 500;
}
.eco-tag-meta-link:hover { text-decoration: underline; color: #81d4fa; }

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
.eco-community-badge {
  display: inline-flex; align-items: center; gap: 2px; font-size: 8px; letter-spacing: 0.04em;
  color: rgba(120,200,170,0.85); background: rgba(60,180,140,0.14); border-radius: 3px;
  padding: 1px 5px; margin-left: 4px; vertical-align: middle; white-space: nowrap;
}

.eco-suggestion-row { display: flex; gap: 10px; padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.06); }
.eco-suggestion-row:last-child { border-bottom: none; }
.eco-suggestion-thumb { width: 80px; height: 45px; object-fit: cover; border-radius: 4px; flex-shrink: 0; }
.eco-suggestion-body { flex: 1; min-width: 0; }
.eco-suggestion-actions { display: flex; flex-direction: column; gap: 2px; flex-shrink: 0; }
.eco-video-desc { font-size: 10px; color: rgba(80,140,105,0.78); line-height: 1.45; }
.eco-video-author { font-size: 9px; color: rgba(70,120,90,0.65); }
.eco-video-soon { font-size: 9px; color: rgba(90,130,105,0.55); display: flex; align-items: center; }

.eco-video-card-tags { display: flex; flex-wrap: wrap; gap: 3px; }
.eco-video-card-tag {
  font-size: 9px; padding: 0 4px; border-radius: 3px;
  background: rgba(255, 255, 255, 0.04); color: rgba(120, 160, 140, 0.6);
}

/* ── Edit mode overlays ─────────────────────────────────────────── */
.eco-video-actions {
  position: absolute; top: 6px; right: 6px;
  display: flex; gap: 2px;
  background: rgba(2,8,14,0.82); border-radius: 8px; padding: 2px;
  border: 1px solid rgba(40,90,65,0.40); backdrop-filter: blur(4px);
}
.eco-add-video-row { padding: 8px 0 2px; }
.eco-no-videos { display: flex; align-items: center; gap: 6px; padding: 12px 0; font-size: 11px; color: rgba(70,110,88,0.60); }

/* ── Edit dialog ────────────────────────────────────────────────── */
.eco-edit-card {
  background: #081410; border: 1px solid rgba(45,120,80,0.45); border-radius: 12px;
  min-width: 340px; max-width: 500px; width: 90vw; box-shadow: 0 8px 32px rgba(0,0,0,0.6);
}
.eco-edit-header { display: flex; align-items: center; padding: 14px 16px 10px; border-bottom: 1px solid rgba(40,100,70,0.28); }
.eco-edit-body { padding: 14px 16px; display: flex; flex-direction: column; gap: 8px; }
.eco-edit-field-label { font-size: 11px; color: #a8ccb5; font-weight: 500; }
.eco-field-hint { font-size: 10px; color: rgba(120,150,135,0.5); font-weight: normal; }
.eco-field-required { color: #ef9a9a; }
.eco-edit-input {
  width: 100%; background: #040a08; border: 1px solid rgba(45,120,80,0.3); border-radius: 6px;
  padding: 6px 10px; color: #c0e8d0; font-size: 12px; outline: none; transition: border-color 0.15s;
}
.eco-edit-input:focus { border-color: rgba(55,195,145,0.7); }
.eco-edit-input--error { border-color: #ef9a9a !important; }
.eco-edit-textarea { resize: vertical; font-family: inherit; }
.eco-edit-error { font-size: 10px; color: #ef9a9a; margin-top: -2px; }
.eco-edit-preview { position: relative; margin: 4px 0; border-radius: 6px; overflow: hidden; background: #030705; border: 1px solid rgba(45,120,80,0.2); display: flex; flex-direction: column; }
.eco-edit-preview-img { width: 100%; height: 110px; object-fit: cover; }
.eco-edit-yt-link { position: absolute; bottom: 6px; right: 6px; background: rgba(0,0,0,0.75); color: #4fc3f7; font-size: 10px; padding: 2px 6px; border-radius: 4px; text-decoration: none; }
.eco-edit-footer { display: flex; justify-content: flex-end; gap: 8px; padding: 10px 16px 14px; border-top: 1px solid rgba(40,100,70,0.28); }

.animate-fade { animation: fadeIn 0.2s ease-out forwards; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }

/* ── YouTube fetch row ───────────────────────────────────────────── */
.eco-yt-input-row { display: flex; gap: 6px; align-items: flex-start; }
.eco-yt-raw-input { flex: 1; min-width: 0; }
.eco-yt-fetch-btn { flex-shrink: 0; margin-top: 1px; }

/* ── Subcategory representative image ───────────────────────────── */
.eco-subcat-rep-image { margin: 6px 0; border-radius: 6px; overflow: hidden; background: #030705; border: 1px solid rgba(45,120,80,0.2); }
.eco-subcat-rep-img { width: 100%; max-height: 120px; object-fit: cover; display: block; opacity: 0.85; }
.eco-subcat-img-preview .eco-edit-preview-img { height: 90px; }

/* ── Add/edit subcategory ────────────────────────────────────────── */
.eco-add-subcat-row { padding: 10px 0 4px; border-top: 1px dashed rgba(255,200,60,0.15); margin-top: 6px; }
.eco-subcat-edit-btn { opacity: 0.55; transition: opacity 0.15s; }
.eco-subcat-edit-btn:hover { opacity: 1; }

/* ── Image gallery picker ────────────────────────────────────────── */
.eco-img-field-row { display: flex; gap: 4px; align-items: flex-start; }
.eco-img-gallery {
  margin-top: 6px; border: 1px solid rgba(50,140,90,0.30); border-radius: 8px;
  background: rgba(3,10,7,0.92); overflow: hidden;
}
.eco-img-gallery-head {
  display: flex; align-items: center; justify-content: space-between;
  padding: 6px 10px; border-bottom: 1px solid rgba(35,90,60,0.25);
}
.eco-img-gallery-empty { padding: 16px 10px; font-size: 11px; color: rgba(90,130,105,0.55); text-align: center; }
.eco-img-gallery-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 4px; padding: 6px; max-height: 200px; overflow-y: auto; }
.eco-img-thumb {
  border-radius: 5px; overflow: hidden; cursor: pointer; border: 2px solid transparent;
  aspect-ratio: 16/9; background: #040a06; transition: border-color 0.15s;
}
.eco-img-thumb img { width: 100%; height: 100%; object-fit: cover; display: block; opacity: 0.82; }
.eco-img-thumb:hover { border-color: rgba(55,195,145,0.55); }
.eco-img-thumb--active { border-color: #37c391 !important; }
</style>
