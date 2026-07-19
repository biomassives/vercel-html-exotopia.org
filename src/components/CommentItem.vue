<template>
  <div class="ci-wrap" :class="{ 'ci-wrap--reply': depth > 0 }">
    <!-- Main comment -->
    <div class="ci-row">
      <div class="ci-left">
        <span
          class="ci-avatar"
          :style="`background:${color}22;border-color:${color}`"
          :title="comment.author?.display_name"
        >
          <span :style="`color:${color}`">{{ avInitials }}</span>
        </span>
        <div v-if="comment.replies?.length" class="ci-thread-line" />
      </div>

      <div class="ci-body">
        <div class="ci-meta">
          <span class="ci-author" :style="`color:${color}`">{{ comment.author?.display_name }}</span>
          <span class="ci-handle">@{{ comment.author?.handle }}</span>
          <span class="ci-time">{{ timeAgo(comment.created_at) }}</span>
          <span v-if="comment.edited_at" class="ci-edited">edited</span>
        </div>

        <!-- body / edit mode -->
        <div v-if="editing" class="ci-edit-wrap">
          <textarea v-model="editDraft" class="ci-edit-input" rows="3" />
          <div class="ci-edit-actions">
            <button class="ci-btn ci-btn--save"   @click="saveEdit">Save</button>
            <button class="ci-btn ci-btn--cancel"  @click="editing = false">Cancel</button>
          </div>
        </div>
        <p v-else class="ci-text" v-html="safeBody" />

        <!-- reaction row -->
        <div class="ci-reactions">
          <button
            v-for="emoji in EMOJIS"
            :key="emoji"
            class="ci-emoji-btn"
            :class="{ 'ci-emoji-btn--active': hasMyReaction(emoji) }"
            @click="$emit('react', comment.id, emoji)"
            :title="reactionCount(emoji) > 0 ? `${reactionCount(emoji)} reaction${reactionCount(emoji) > 1 ? 's' : ''}` : ''"
          >
            {{ emoji }}<span v-if="reactionCount(emoji)" class="ci-emoji-count">{{ reactionCount(emoji) }}</span>
          </button>

          <!-- actions (only for own comments) -->
          <span class="ci-actions" v-if="isOwnComment">
            <button class="ci-act" @click="startEdit">edit</button>
            <button class="ci-act ci-act--del" @click="$emit('remove', comment.id)">delete</button>
          </span>

          <!-- moderation (non-own comments only) -->
          <span class="ci-actions" v-else>
            <button
              class="ci-act ci-act--report"
              :class="{ 'ci-act--reported': reported }"
              @click="doReport"
              :title="reported ? 'Reported' : 'Report this comment'"
            >{{ reported ? '🚩 reported' : '🚩' }}</button>
            <button
              class="ci-act ci-act--block"
              :class="{ 'ci-act--blocked': isBlocked }"
              @click="toggleBlock"
              :title="isBlocked ? 'Unblock this member' : 'Block this member'"
            >{{ isBlocked ? 'unblock' : 'block' }}</button>
          </span>

          <!-- reply (only for root comments, not already-replies) -->
          <button v-if="depth === 0" class="ci-act ci-act--reply" @click="$emit('reply', comment)">
            reply
          </button>
        </div>
      </div>
    </div>

    <!-- Replies -->
    <div v-if="comment.replies?.length" class="ci-replies">
      <CommentItem
        v-for="r in comment.replies"
        :key="r.id"
        :comment="r"
        :depth="depth + 1"
        :post-slug="postSlug"
        @reply="$emit('reply', $event)"
        @react="$emit('react', $event)"
        @edit="$emit('edit', $event)"
        @remove="$emit('remove', $event)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useMemberStore, initials } from 'src/stores/member'
import { type Comment, type Reaction, EMOJIS } from 'src/lib/supabase'
import { timeAgo, useComments } from 'src/composables/useComments'

const props = defineProps<{
  comment:  Comment
  depth:    number
  postSlug: string
}>()

const emit = defineEmits<{
  (e: 'reply',  comment: Comment): void
  (e: 'react',  commentId: string, emoji: Reaction['emoji']): void
  (e: 'edit',   commentId: string, newBody: string): void
  (e: 'remove', commentId: string): void
}>()

defineOptions({ name: 'CommentItem' })

const store      = useMemberStore()
const { report } = useComments(props.postSlug)
const editing    = ref(false)
const editDraft  = ref('')
const reported   = ref(false)

const color        = computed(() => props.comment.author?.avatar_color ?? '#5a6a8a')
const avInitials   = computed(() => initials(props.comment.author?.display_name ?? '?'))
const isOwnComment = computed(() => props.comment.author_id === store.userId)
const isBlocked    = computed(() => store.blockedIds.has(props.comment.author_id))

async function doReport () {
  if (reported.value) return
  await report(props.comment.id, '')
  reported.value = true
}

async function toggleBlock () {
  if (isBlocked.value) {
    await store.unblockMember(props.comment.author_id)
  } else {
    await store.blockMember(props.comment.author_id)
  }
}

// Simple markdown-ish: escape HTML, preserve newlines, linkify URLs
const safeBody = computed(() => {
  const escaped = props.comment.body
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/\n/g, '<br>')
    .replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" rel="noopener">$1</a>')
  return escaped
})

function reactionCount (emoji: Reaction['emoji']): number {
  return props.comment.reactions?.filter(r => r.emoji === emoji).length ?? 0
}
function hasMyReaction (emoji: Reaction['emoji']): boolean {
  return !!props.comment.reactions?.find(r => r.emoji === emoji && r.member_id === store.userId)
}

function startEdit () {
  editDraft.value = props.comment.body
  editing.value = true
}
function saveEdit () {
  if (!editDraft.value.trim()) return
  emit('edit', props.comment.id, editDraft.value)
  editing.value = false
}
</script>

<style scoped lang="scss">
.ci-wrap {
  display: flex;
  flex-direction: column;
  padding: 12px 0;
  &--reply {
    padding-left: 44px;
    border-left: 1px solid rgba(255,255,255,0.05);
    margin-left: 16px;
  }
}

.ci-row  { display: flex; gap: 12px; }
.ci-left { display: flex; flex-direction: column; align-items: center; flex-shrink: 0; }

.ci-avatar {
  width: 32px; height: 32px;
  border-radius: 50%;
  border: 1px solid;
  display: flex; align-items: center; justify-content: center;
  font-size: 12px; font-weight: 700;
  flex-shrink: 0;
}
.ci-thread-line {
  flex: 1;
  width: 1px;
  background: rgba(255,255,255,0.06);
  margin-top: 6px;
}

.ci-body { flex: 1; min-width: 0; }

.ci-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 6px;
}
.ci-author { font-size: 13px; font-weight: 600; }
.ci-handle { font-size: 11px; color: #3a4a6a; }
.ci-time   { font-size: 11px; color: #3a4a6a; }
.ci-edited { font-size: 10px; color: #3a4a6a; font-style: italic; }

.ci-text {
  margin: 0 0 10px;
  font-size: 14px;
  color: #b0c0dc;
  line-height: 1.65;
  word-break: break-word;
  :deep(a) { color: #4488cc; &:hover { color: #66aaee; } }
}

/* edit mode */
.ci-edit-wrap { display: flex; flex-direction: column; gap: 8px; margin-bottom: 10px; }
.ci-edit-input {
  width: 100%;
  background: #080e1c;
  border: 1px solid rgba(255,255,255,0.12);
  border-radius: 6px;
  padding: 8px 10px;
  color: #c8d4e8;
  font-size: 14px;
  font-family: inherit;
  resize: vertical;
  outline: none;
}
.ci-edit-actions { display: flex; gap: 8px; }
.ci-btn {
  padding: 5px 14px;
  border-radius: 5px;
  font-size: 12px;
  cursor: pointer;
  border: 1px solid;
  &--save   { background: rgba(0,229,255,0.08); border-color: rgba(0,229,255,0.3); color: #00e5ff; }
  &--cancel { background: transparent; border-color: rgba(255,255,255,0.12); color: #5a6a8a; }
}

/* reactions */
.ci-reactions {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-wrap: wrap;
}
.ci-emoji-btn {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 3px 7px;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 12px;
  font-size: 13px;
  cursor: pointer;
  transition: background 0.12s, border-color 0.12s;
  &:hover { background: rgba(255,255,255,0.08); }
  &--active { background: rgba(0,229,255,0.08); border-color: rgba(0,229,255,0.3); }
}
.ci-emoji-count { font-size: 10px; color: #7888aa; }

.ci-actions { display: flex; gap: 10px; margin-left: 4px; }
.ci-act {
  background: none; border: none;
  font-size: 11px; color: #3a4a6a;
  cursor: pointer;
  transition: color 0.12s;
  &:hover          { color: #7888aa; }
  &--del:hover     { color: #ff6644; }
  &--reply:hover   { color: #00e5ff; }
  &--report        { color: #3a4a6a; }
  &--report:hover  { color: #ffaa33; }
  &--reported      { color: #ffaa33; cursor: default; }
  &--block         { color: #3a4a6a; }
  &--block:hover   { color: #ff4444; }
  &--blocked       { color: #ff4444; }
  &--blocked:hover { color: #5a6a8a; }
}

.ci-replies { margin-top: 4px; }
</style>
