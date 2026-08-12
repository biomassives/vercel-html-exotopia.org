<template>
  <q-page class="sc-page">
    <div class="sc-wrap">

      <div class="sc-header">
        <div class="sc-badge">CONTACT &amp; SUPPORT</div>
        <h1 class="sc-title">Get in touch</h1>
        <p class="sc-sub">
          Bug reports, support questions, partnership or press inquiries — pick the closest
          category below. You'll get an automatic confirmation email right away, and replying
          to it reaches a real, monitored inbox.
        </p>
      </div>

      <form class="sc-form" @submit.prevent="submit">
        <div class="sc-row">
          <input v-model="name" class="sc-input" placeholder="Your name" :disabled="submitting" />
          <input v-model="email" type="email" class="sc-input" placeholder="Your email" :disabled="submitting" />
        </div>

        <select v-model="messageType" class="sc-input sc-select" :disabled="submitting">
          <option value="general">General question</option>
          <option value="support">Support / account issue</option>
          <option value="bug">Bug report</option>
          <option value="partnership">Partnership inquiry</option>
          <option value="press">Press inquiry</option>
        </select>

        <input v-model="subject" class="sc-input" placeholder="Subject (optional)" :disabled="submitting" />
        <textarea
          v-model="body"
          class="sc-textarea"
          rows="6"
          placeholder="Your message"
          :disabled="submitting"
        />

        <div ref="turnstileEl" class="sc-turnstile" />

        <button type="submit" class="sc-btn" :disabled="!canSubmit">
          {{ submitting ? 'Sending…' : 'Send message' }}
        </button>

        <p v-if="statusMessage" class="sc-status" :class="{ 'sc-status--error': statusIsError }">
          {{ statusMessage }}
        </p>
      </form>

    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { SUPPORT_WORKER_URL, TURNSTILE_SITE_KEY } from 'src/lib/support-inbox'

type MessageType = 'general' | 'support' | 'bug' | 'partnership' | 'press'

declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, opts: { sitekey: string; callback: (token: string) => void; 'expired-callback'?: () => void }) => string
      reset: (widgetId?: string) => void
    }
  }
}

const name = ref('')
const email = ref('')
const messageType = ref<MessageType>('general')
const subject = ref('')
const body = ref('')
const submitting = ref(false)
const statusMessage = ref('')
const statusIsError = ref(false)

const turnstileEl = ref<HTMLElement | null>(null)
const turnstileToken = ref('')
const turnstileWidgetId = ref<string | undefined>(undefined)

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const canSubmit = computed(() =>
  !submitting.value &&
  name.value.trim().length > 0 &&
  EMAIL_RE.test(email.value.trim()) &&
  body.value.trim().length > 0 &&
  turnstileToken.value.length > 0,
)

const TURNSTILE_SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js'

function loadTurnstileScript(): Promise<void> {
  if (window.turnstile) return Promise.resolve()
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${TURNSTILE_SCRIPT_SRC}"]`)
    if (existing) {
      existing.addEventListener('load', () => resolve())
      return
    }
    const script = document.createElement('script')
    script.src = TURNSTILE_SCRIPT_SRC
    script.async = true
    script.defer = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Failed to load Turnstile'))
    document.head.appendChild(script)
  })
}

onMounted(async () => {
  const siteKey = TURNSTILE_SITE_KEY
  if (!siteKey) {
    statusMessage.value = 'Contact form is not configured yet — missing verification key.'
    statusIsError.value = true
    return
  }
  try {
    await loadTurnstileScript()
    if (turnstileEl.value && window.turnstile) {
      turnstileWidgetId.value = window.turnstile.render(turnstileEl.value, {
        sitekey: siteKey,
        callback: (token: string) => { turnstileToken.value = token },
        'expired-callback': () => { turnstileToken.value = '' },
      })
    }
  } catch {
    statusMessage.value = 'Could not load verification widget — try refreshing the page.'
    statusIsError.value = true
  }
})

onBeforeUnmount(() => {
  if (turnstileWidgetId.value && window.turnstile) {
    window.turnstile.reset(turnstileWidgetId.value)
  }
})

async function submit() {
  if (!canSubmit.value) return
  const workerUrl = SUPPORT_WORKER_URL
  if (!workerUrl) {
    statusMessage.value = 'Contact form is not configured yet — missing worker URL.'
    statusIsError.value = true
    return
  }

  submitting.value = true
  statusMessage.value = ''
  statusIsError.value = false

  try {
    const res = await fetch(workerUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: name.value.trim(),
        email: email.value.trim(),
        messageType: messageType.value,
        subject: subject.value.trim() || undefined,
        body: body.value.trim(),
        turnstileToken: turnstileToken.value,
      }),
    })

    if (res.ok) {
      statusMessage.value = "Sent — check your email for a confirmation, and thanks for reaching out."
      statusIsError.value = false
      name.value = ''; email.value = ''; subject.value = ''; body.value = ''; messageType.value = 'general'
      turnstileToken.value = ''
      if (turnstileWidgetId.value && window.turnstile) window.turnstile.reset(turnstileWidgetId.value)
    } else {
      const data = (await res.json().catch(() => ({}))) as { error?: string }
      statusMessage.value = data.error || 'Something went wrong — please try again.'
      statusIsError.value = true
    }
  } catch {
    statusMessage.value = 'Something went wrong — please try again.'
    statusIsError.value = true
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.sc-page { background: #020408; min-height: 100vh; padding: 36px 24px 60px; font-family: 'Courier New', monospace; color: rgba(200,225,245,0.90); }
.sc-wrap { max-width: 640px; margin: 0 auto; }

.sc-badge { font-size: 8.5px; letter-spacing: 0.22em; color: rgba(160,120,255,0.60); margin-bottom: 8px; }
.sc-title { font-size: 22px; font-weight: 300; color: rgba(215,238,255,0.94); margin: 0 0 12px; }
.sc-sub   { font-size: 11.5px; line-height: 1.7; color: rgba(160,195,220,0.82); margin-bottom: 22px; }

.sc-form { display: flex; flex-direction: column; gap: 8px; }
.sc-row { display: flex; gap: 8px; }
.sc-row .sc-input { flex: 1; }

.sc-input, .sc-textarea, .sc-select {
  background: rgba(0,15,35,0.70); border: 1px solid rgba(0,100,160,0.25); border-radius: 5px;
  color: rgba(200,230,255,0.85); font-family: inherit; font-size: 10.5px; padding: 8px 10px;
  width: 100%; box-sizing: border-box;
}
.sc-textarea { resize: vertical; }
.sc-select { appearance: auto; }

.sc-turnstile { margin: 4px 0; }

.sc-btn {
  background: rgba(0,40,80,0.55); border: 1px solid rgba(0,160,220,0.35); border-radius: 5px;
  color: rgba(200,235,255,0.90); font-family: inherit; font-size: 10.5px; padding: 9px 18px; cursor: pointer; align-self: flex-start;
}
.sc-btn:hover:not(:disabled) { border-color: rgba(0,190,240,0.55); }
.sc-btn:disabled { opacity: 0.4; cursor: default; }

.sc-status { font-size: 10.5px; color: rgba(100,240,150,0.85); margin-top: 4px; }
.sc-status--error { color: rgba(230,120,120,0.85); }
</style>
