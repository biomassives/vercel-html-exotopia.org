<template>
  <section class="bc-section">
    <div class="bc-header">
      <h3 class="bc-heading">
        Comments
        <span v-if="comments.length" class="bc-count">{{ comments.length }}</span>
      </h3>
      <div class="bc-green-light" v-if="store.isSignedIn && store.connectedIds.length">
        <span class="bc-gl-dot" />
        <span class="bc-gl-label">green-lit with {{ store.connectedIds.length }} member{{ store.connectedIds.length !== 1 ? 's' : '' }}</span>
      </div>
    </div>

    <!-- Sign-in gate -->
    <div class="bc-signin-gate" v-if="!store.isSignedIn">
      <p class="bc-gate-msg">Sign in to read and leave comments visible to your green-lit group.</p>
      <MemberSignIn />
    </div>

    <!-- Comments list -->
    <template v-else>
      <!-- Loading -->
      <div v-if="loading" class="bc-loading">loading…</div>

      <!-- Thread list -->
      <div v-else-if="threaded.length" class="bc-thread">
        <CommentItem
          v-for="c in threaded"
          :key="c.id"
          :comment="c"
          :depth="0"
          @reply="openReply"
          @react="react"
          @edit="edit"
          @remove="remove"
        />
      </div>

      <p v-else class="bc-empty">No comments yet — be the first.</p>

      <!-- Compose -->
      <div class="bc-compose">
        <div class="bc-compose-avatar">
          <span
            class="bc-avatar"
            :style="store.profile
              ? `background:${store.profile.avatar_color}22;border-color:${store.profile.avatar_color}`
              : 'border-color:#3a4a6a'"
          >
            <span :style="store.profile ? `color:${store.profile.avatar_color}` : 'color:#3a4a6a'">
              {{ store.profile ? initials(store.profile.display_name) : '?' }}
            </span>
          </span>
        </div>
        <div class="bc-compose-body">
          <p v-if="replyingTo" class="bc-reply-context">
            Replying to <strong>{{ replyingTo.author?.display_name }}</strong>
            <button class="bc-cancel-reply" @click="replyingTo = null">✕ cancel</button>
          </p>
          <textarea
            v-model="draft"
            class="bc-textarea"
            :placeholder="replyingTo ? 'Write a reply…' : 'Add a comment…'"
            rows="3"
            @keydown.ctrl.enter="submit"
            @keydown.meta.enter="submit"
          />
          <div class="bc-compose-footer">
            <span class="bc-shortcut">⌘ / Ctrl + Enter to send</span>
            <button
              class="bc-submit"
              :disabled="!draft.trim() || sending"
              @click="submit"
            >{{ sending ? 'Sending…' : replyingTo ? 'Reply' : 'Comment' }}</button>
          </div>
          <p v-if="error" class="bc-err">{{ error }}</p>
        </div>
      </div>
    </template>
  </section>
</template>

<script setup lang="ts">
import { ref, onMounted, defineAsyncComponent } from 'vue'
import { useMemberStore, initials } from 'src/stores/member'
import { useComments } from 'src/composables/useComments'
import type { Comment, Reaction } from 'src/lib/supabase'
import MemberSignIn from './MemberSignIn.vue'

const CommentItem = defineAsyncComponent(() => import('./CommentItem.vue'))

const props = defineProps<{ postSlug: string }>()

const store = useMemberStore()
const { comments, threaded, loading, sending, error, load, post, edit, remove, react } =
  useComments(props.postSlug)

const draft      = ref('')
const replyingTo = ref<Comment | null>(null)

onMounted(() => { if (store.isSignedIn) load() })

function openReply (comment: Comment) {
  replyingTo.value = comment
  // scroll to compose
  document.querySelector('.bc-compose')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
}

async function submit () {
  if (!draft.value.trim()) return
  await post(draft.value, replyingTo.value?.id)
  draft.value      = ''
  replyingTo.value = null
}
</script>

<style scoped lang="scss">
.bc-section {
  margin-top: 56px;
  padding-top: 32px;
  border-top: 1px solid rgba(255,255,255,0.07);
  font-family: 'Roboto', sans-serif;
}

/* header */
.bc-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}
.bc-heading {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #7888aa;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  display: flex;
  align-items: center;
  gap: 8px;
}
.bc-count {
  font-size: 11px;
  background: rgba(255,255,255,0.07);
  border-radius: 10px;
  padding: 1px 8px;
  color: #5a6a8a;
  font-weight: 400;
  letter-spacing: 0;
}
.bc-green-light {
  display: flex;
  align-items: center;
  gap: 6px;
}
.bc-gl-dot {
  width: 6px; height: 6px;
  border-radius: 50%;
  background: #44ff88;
  box-shadow: 0 0 6px #44ff8888;
}
.bc-gl-label { font-size: 11px; color: #44ff88; }

/* sign-in gate */
.bc-signin-gate {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 20px;
  background: rgba(255,255,255,0.02);
  border: 1px dashed rgba(255,255,255,0.1);
  border-radius: 8px;
  margin-bottom: 24px;
}
.bc-gate-msg { margin: 0; font-size: 13px; color: #5a6a8a; }

/* thread */
.bc-thread   { display: flex; flex-direction: column; gap: 2px; margin-bottom: 28px; }
.bc-loading  { font-size: 13px; color: #3a4a6a; padding: 24px 0; text-align: center; }
.bc-empty    { font-size: 13px; color: #3a4a6a; padding: 16px 0; margin-bottom: 24px; }

/* compose */
.bc-compose {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}
.bc-compose-avatar { flex-shrink: 0; padding-top: 2px; }
.bc-avatar {
  width: 32px; height: 32px;
  border-radius: 50%;
  border: 1px solid;
  display: flex; align-items: center; justify-content: center;
  font-size: 12px; font-weight: 700;
}
.bc-compose-body { flex: 1; display: flex; flex-direction: column; gap: 8px; }

.bc-reply-context {
  margin: 0;
  font-size: 12px;
  color: #5a6a8a;
  display: flex; align-items: center; gap: 8px;
  strong { color: #9aaac8; }
}
.bc-cancel-reply {
  background: none; border: none;
  font-size: 11px; color: #3a4a6a;
  cursor: pointer;
  &:hover { color: #ff6644; }
}

.bc-textarea {
  width: 100%;
  background: #080e1c;
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 6px;
  padding: 10px 12px;
  color: #c8d4e8;
  font-size: 14px;
  font-family: inherit;
  resize: vertical;
  outline: none;
  transition: border-color 0.15s;
  &::placeholder { color: #3a4a6a; }
  &:focus { border-color: rgba(0,229,255,0.3); }
}
.bc-compose-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.bc-shortcut { font-size: 11px; color: #2a3a5a; }

.bc-submit {
  padding: 7px 18px;
  background: rgba(0,229,255,0.08);
  border: 1px solid rgba(0,229,255,0.25);
  border-radius: 6px;
  color: #00e5ff;
  font-size: 13px;
  cursor: pointer;
  transition: background 0.15s;
  &:hover:not(:disabled) { background: rgba(0,229,255,0.14); }
  &:disabled { opacity: 0.4; cursor: default; }
}
.bc-err { font-size: 12px; color: #ff6644; margin: 0; }
</style>
