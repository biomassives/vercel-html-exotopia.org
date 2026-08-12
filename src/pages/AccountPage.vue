<template>
  <q-page class="acc-page">
    <div class="acc-wrap">

      <div class="acc-header">
        <div class="acc-badge">ACCOUNT &amp; PRIVACY</div>
        <h1 class="acc-title">Your data</h1>
        <p class="acc-sub">
          Access, correction, and cancellation — the self-service rights described in
          <router-link to="/privacy">the Privacy Policy</router-link> § 8, in one place.
        </p>
      </div>

      <div v-if="!member.isSignedIn" class="acc-signin-gate">
        <p class="acc-p">Sign in to view or export your data, or request account deletion.</p>
        <MemberSignIn />
      </div>

      <template v-else>
        <!-- Profile summary -->
        <section class="acc-section">
          <h2 class="acc-h2">Profile</h2>
          <div class="acc-row"><span class="acc-lbl">Handle</span><span>{{ member.profile?.handle }}</span></div>
          <div class="acc-row"><span class="acc-lbl">Display name</span><span>{{ member.profile?.display_name }}</span></div>
          <div class="acc-row"><span class="acc-lbl">Member since</span><span>{{ formatDate(member.profile?.created_at) }}</span></div>
          <p class="acc-hint">
            To correct your display name or handle, sign in and update it from where you set it —
            a dedicated edit form isn't built yet; <a :href="issueUrl" target="_blank" rel="noopener">file a request</a> if you need this sooner.
          </p>
        </section>

        <!-- Export -->
        <section class="acc-section">
          <h2 class="acc-h2">Export my data</h2>
          <p class="acc-p">
            Downloads every row associated with your account across the whole platform —
            profile, connections, comments, reward events, certificates, mentor sessions,
            citizen-science submissions, and endorsements — as a single JSON file.
          </p>
          <button class="acc-btn" :disabled="exporting" @click="doExport">
            {{ exporting ? 'Gathering your data…' : 'Download my data (JSON)' }}
          </button>

          <div class="acc-encrypted-block">
            <p class="acc-hint acc-hint--strong">
              Want the download itself protected — in case it ends up in a synced
              Downloads folder or an email attachment? Encrypt it with a passphrase
              first. This uses AES-256-GCM with the passphrase run through PBKDF2 —
              standard, real encryption, not something we invented. We never see or
              store the passphrase, which also means: if you lose it, the file is
              unrecoverable. There's no reset link for a secret we never had.
            </p>
            <input v-model="backupPassphrase" type="password" class="acc-input"
              placeholder="Choose a passphrase for this backup" />
            <button class="acc-btn" :disabled="exporting || !backupPassphrase" @click="doEncryptedExport">
              {{ exporting ? 'Encrypting…' : 'Download encrypted backup' }}
            </button>
            <p v-if="backupError" class="acc-error">{{ backupError }}</p>
          </div>
        </section>

        <!-- Decrypt a backup -->
        <section class="acc-section">
          <h2 class="acc-h2">Read an encrypted backup</h2>
          <p class="acc-p">
            Decrypts a file made with "Download encrypted backup" above, entirely in
            your browser — the file and passphrase never leave your device.
          </p>
          <input type="file" accept=".json" class="acc-file" @change="onBackupFilePicked" />
          <input v-model="restorePassphrase" type="password" class="acc-input"
            placeholder="Passphrase for this file" />
          <button class="acc-btn" :disabled="restoring || !restoreFile || !restorePassphrase" @click="doDecryptBackup">
            {{ restoring ? 'Decrypting…' : 'Decrypt and download as plain JSON' }}
          </button>
          <p v-if="restoreError" class="acc-error">{{ restoreError }}</p>
          <p v-if="restoreOk" class="acc-ok">Decrypted successfully — check your downloads.</p>
        </section>

        <!-- Deletion -->
        <section class="acc-section">
          <h2 class="acc-h2">Delete my account</h2>
          <p class="acc-p">
            We can't safely delete your account directly from your browser — that step needs
            elevated access we don't expose to the client, for the same reason your bank doesn't
            let you delete your own account from its mobile app without a human step in between.
            Requesting it here queues a real, timestamped deletion request that a team member
            processes — it isn't a form email into a void.
          </p>

          <div v-if="pendingRequest" class="acc-pending">
            <span>Deletion requested {{ formatDate(pendingRequest.requested_at) }} — status: <strong>{{ pendingRequest.status }}</strong></span>
            <button v-if="pendingRequest.status === 'pending'" class="acc-btn acc-btn--ghost" @click="doCancel">
              Cancel request
            </button>
          </div>
          <template v-else>
            <textarea v-model="deleteNote" class="acc-textarea" rows="2"
              placeholder="Optional — anything you want us to know before processing this" />
            <button class="acc-btn acc-btn--danger" :disabled="requesting" @click="doRequestDeletion">
              {{ requesting ? 'Submitting…' : 'Request account deletion' }}
            </button>
          </template>
        </section>
      </template>

    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useMemberStore } from 'src/stores/member'
import type { DeletionRequest } from 'src/lib/supabase'
import MemberSignIn from 'src/components/MemberSignIn.vue'
import { encryptBackup, decryptBackup } from 'src/lib/encrypted-backup'

function downloadBlob(contents: string, mime: string, filename: string) {
  const blob = new Blob([contents], { type: mime })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

const member = useMemberStore()

function formatDate(iso?: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

const issueUrl = 'https://github.com/biomassives/vercel-html-exotopia.org/issues'

// ── Export ────────────────────────────────────────────────────────────────
const exporting = ref(false)
async function doExport() {
  exporting.value = true
  try {
    const data = await member.exportMyData()
    downloadBlob(JSON.stringify(data, null, 2), 'application/json',
      `exotopia-data-export-${new Date().toISOString().slice(0, 10)}.json`)
  } finally {
    exporting.value = false
  }
}

// ── Encrypted export ─────────────────────────────────────────────────────
const backupPassphrase = ref('')
const backupError      = ref('')
async function doEncryptedExport() {
  exporting.value = true
  backupError.value = ''
  try {
    const data = await member.exportMyData()
    const envelope = await encryptBackup(backupPassphrase.value, data)
    downloadBlob(envelope, 'application/json',
      `exotopia-data-export-encrypted-${new Date().toISOString().slice(0, 10)}.json`)
    backupPassphrase.value = ''
  } catch (e) {
    backupError.value = e instanceof Error ? e.message : 'Could not encrypt the backup.'
  } finally {
    exporting.value = false
  }
}

// ── Decrypt a backup ─────────────────────────────────────────────────────
const restorePassphrase = ref('')
const restoreFile       = ref<File | null>(null)
const restoring         = ref(false)
const restoreError      = ref('')
const restoreOk         = ref(false)

function onBackupFilePicked(ev: Event) {
  restoreFile.value = (ev.target as HTMLInputElement).files?.[0] ?? null
  restoreError.value = ''
  restoreOk.value = false
}

async function doDecryptBackup() {
  if (!restoreFile.value) return
  restoring.value = true
  restoreError.value = ''
  restoreOk.value = false
  try {
    const contents = await restoreFile.value.text()
    const data = await decryptBackup(restorePassphrase.value, contents)
    downloadBlob(JSON.stringify(data, null, 2), 'application/json',
      `exotopia-data-export-decrypted-${new Date().toISOString().slice(0, 10)}.json`)
    restoreOk.value = true
    restorePassphrase.value = ''
  } catch (e) {
    restoreError.value = e instanceof Error ? e.message : 'Could not decrypt this file.'
  } finally {
    restoring.value = false
  }
}

// ── Deletion request ─────────────────────────────────────────────────────
const pendingRequest = ref<DeletionRequest | null>(null)
const deleteNote      = ref('')
const requesting      = ref(false)

async function refreshDeletionStatus() {
  const rows = await member.getMyDeletionRequests()
  pendingRequest.value = rows.find(r => r.status === 'pending') ?? null
}

async function doRequestDeletion() {
  requesting.value = true
  try {
    await member.requestDeletion(deleteNote.value)
    await refreshDeletionStatus()
  } finally {
    requesting.value = false
  }
}

async function doCancel() {
  if (!pendingRequest.value) return
  await member.cancelDeletionRequest(pendingRequest.value.id)
  await refreshDeletionStatus()
}

onMounted(() => {
  if (member.isSignedIn) void refreshDeletionStatus()
})
</script>

<style scoped>
.acc-page { background: #020408; min-height: 100vh; padding: 36px 24px 60px; font-family: 'Courier New', monospace; color: rgba(200,225,245,0.90); }
.acc-wrap { max-width: 640px; margin: 0 auto; }

/* Clears RecordWidget.vue's mobile FAB (fixed at bottom:88px + 44px tall) so
   it doesn't sit on top of the last button on a tall page. */
@media (max-width: 640px) {
  .acc-page { padding-bottom: 160px; }
}

.acc-badge { font-size: 8.5px; letter-spacing: 0.22em; color: rgba(0,190,230,0.60); margin-bottom: 8px; }
.acc-title { font-size: 22px; font-weight: 300; color: rgba(215,238,255,0.94); margin: 0 0 10px; }
.acc-sub   { font-size: 11.5px; line-height: 1.7; color: rgba(160,195,220,0.82); margin-bottom: 28px; }
.acc-sub a { color: rgba(0,210,255,0.85); }

.acc-signin-gate { border: 1px dashed rgba(0,150,210,0.25); border-radius: 6px; padding: 16px 18px; }

.acc-section { background: rgba(0,8,22,0.55); border: 1px solid rgba(255,255,255,0.06); border-radius: 8px; padding: 18px 20px; margin-bottom: 16px; }
.acc-h2 { font-size: 13px; font-weight: 600; color: rgba(215,238,255,0.92); margin: 0 0 12px; }
.acc-p  { font-size: 11px; line-height: 1.7; color: rgba(175,205,228,0.85); margin: 0 0 12px; }
.acc-hint { font-size: 9.5px; line-height: 1.6; color: rgba(130,165,190,0.55); font-style: italic; margin: 10px 0 0; }
.acc-hint a { color: rgba(0,190,230,0.65); }

.acc-row { display: flex; justify-content: space-between; font-size: 11px; padding: 5px 0; border-bottom: 1px solid rgba(255,255,255,0.04); }
.acc-lbl { color: rgba(120,160,190,0.60); }

.acc-textarea {
  width: 100%; background: rgba(0,15,35,0.70); border: 1px solid rgba(0,100,160,0.25); border-radius: 5px;
  color: rgba(200,230,255,0.85); font-family: inherit; font-size: 10.5px; padding: 8px 10px; resize: vertical;
  margin-bottom: 10px;
}

.acc-btn {
  background: rgba(0,40,80,0.55); border: 1px solid rgba(0,160,220,0.35); border-radius: 5px;
  color: rgba(200,235,255,0.90); font-family: inherit; font-size: 10.5px; padding: 8px 16px; cursor: pointer;
}
.acc-btn:hover:not(:disabled) { border-color: rgba(0,190,240,0.55); }
.acc-btn:disabled { opacity: 0.4; cursor: default; }
.acc-btn--ghost { background: none; border-color: rgba(150,170,200,0.25); color: rgba(150,180,205,0.70); margin-left: 10px; }
.acc-btn--danger { background: rgba(80,10,10,0.45); border-color: rgba(220,60,60,0.35); color: rgba(255,150,150,0.90); }
.acc-btn--danger:hover:not(:disabled) { border-color: rgba(255,90,90,0.60); }

.acc-pending { display: flex; align-items: center; flex-wrap: wrap; gap: 6px; font-size: 11px; color: rgba(255,195,120,0.85); }

.acc-encrypted-block { margin-top: 16px; padding-top: 14px; border-top: 1px solid rgba(255,255,255,0.06); }
.acc-hint--strong { color: rgba(160,195,220,0.75); font-style: normal; margin-bottom: 10px; }
.acc-input, .acc-file {
  display: block; width: 100%; box-sizing: border-box;
  background: rgba(0,15,35,0.70); border: 1px solid rgba(0,100,160,0.25); border-radius: 5px;
  color: rgba(200,230,255,0.85); font-family: inherit; font-size: 10.5px; padding: 8px 10px;
  margin-bottom: 10px;
}
.acc-error { font-size: 10.5px; color: rgba(255,120,120,0.90); margin: 8px 0 0; }
.acc-ok    { font-size: 10.5px; color: rgba(100,220,150,0.90); margin: 8px 0 0; }
</style>
