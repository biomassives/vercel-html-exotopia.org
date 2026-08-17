<template>
  <q-page class="rw-page">

    <div class="rw-header">
      <div class="rw-badge">SETTLEMENT INCENTIVES</div>
      <h1 class="rw-title">Rewards &amp; Impact Profile</h1>
      <p class="rw-sub">
        Three tracks feed one ledger: volunteering, personal finance literacy, and educating others.
        Points and certificates here unlock objects for your settlement.
      </p>
      <router-link to="/rewards-guide" class="rw-cta rw-cta--guide">How does this work? →</router-link>
    </div>

    <div v-if="!member.isSignedIn" class="rw-signin-gate">
      <p class="rw-p">Sign in to start earning and see your Impact Profile.</p>
      <MemberSignIn />
    </div>

    <template v-else>

      <!-- ── Points summary ─────────────────────────────────────────────── -->
      <div class="rw-tiles">
        <div class="rw-tile rw-tile--total">
          <div class="rw-tile__value">{{ rewards.totalPoints }}</div>
          <div class="rw-tile__label">total points</div>
        </div>
        <div class="rw-tile" style="--tcolor:#ffaa33">
          <div class="rw-tile__value">{{ rewards.pointsByTrack.volunteering }}</div>
          <div class="rw-tile__label">volunteering</div>
        </div>
        <div class="rw-tile" style="--tcolor:#44ff88">
          <div class="rw-tile__value">{{ rewards.pointsByTrack.finance_literacy }}</div>
          <div class="rw-tile__label">finance literacy</div>
        </div>
        <div class="rw-tile" style="--tcolor:#00e5ff">
          <div class="rw-tile__value">{{ rewards.pointsByTrack.educating_others }}</div>
          <div class="rw-tile__label">educating others</div>
        </div>
      </div>

      <!-- ── Finance literacy ───────────────────────────────────────────── -->
      <section class="rw-section">
        <div class="rw-section__eyebrow">TRACK 1</div>
        <h2 class="rw-h2">Personal Finance Literacy</h2>
        <p class="rw-p">P-Fin 8 unlocks a settlement seed. The full P-Fin Index unlocks a parallel-universe settlement.</p>
        <div class="rw-pfin-row">
          <div class="rw-pfin-status" :class="{ 'rw-pfin-status--done': rewards.certificateTypes.has('pfin8') }">
            {{ rewards.certificateTypes.has('pfin8') ? '✓ P-Fin 8 complete' : 'P-Fin 8 not yet complete' }}
          </div>
          <div class="rw-pfin-status" :class="{ 'rw-pfin-status--done': rewards.certificateTypes.has('pfin28') }">
            {{ rewards.certificateTypes.has('pfin28') ? '✓ Full P-Fin Index complete' : 'Full P-Fin Index not yet complete' }}
          </div>
        </div>
        <router-link to="/learn" class="rw-cta">Open the quizzes →</router-link>
      </section>

      <!-- ── Volunteering ────────────────────────────────────────────────── -->
      <section class="rw-section">
        <div class="rw-section__eyebrow">TRACK 2</div>
        <h2 class="rw-h2">Volunteering</h2>
        <p class="rw-p">Field submissions synced through Eco Ops are logged automatically. Use this form for anything not yet wired to that pipeline — for example, a plastics-collection tally.</p>

        <div class="rw-progress">
          <div class="rw-progress__label">
            <span>{{ rewards.volunteerProgress.done ? '✓ Field Volunteer certificate earned' : 'Field Volunteer certificate' }}</span>
            <span>{{ Math.min(rewards.volunteerProgress.current, rewards.volunteerProgress.target) }} / {{ rewards.volunteerProgress.target }}</span>
          </div>
          <div class="rw-progress__track">
            <div class="rw-progress__fill" :class="{ 'rw-progress__fill--done': rewards.volunteerProgress.done }"
              :style="{ width: Math.min(100, rewards.volunteerProgress.current / rewards.volunteerProgress.target * 100) + '%' }" />
          </div>
        </div>

        <form class="rw-form" @submit.prevent="submitVolunteerAction">
          <select v-model="volunteerActionKey" class="rw-input">
            <option value="plastic_collection_kg">Plastics collected (kg)</option>
            <option value="eco_field_hours">Field hours (general)</option>
            <option value="other_volunteer_action">Other</option>
          </select>
          <input v-model.number="volunteerQuantity" type="number" min="0" step="0.1" class="rw-input" placeholder="Quantity" />
          <input v-model="volunteerDescription" type="text" class="rw-input rw-input--wide" placeholder="Site / description" />
          <button type="submit" class="rw-btn" :disabled="volunteerSubmitting">Log it</button>
        </form>

        <div v-if="volunteerEvents.length" class="rw-event-list">
          <div v-for="e in volunteerEvents" :key="e.id" class="rw-event-row">
            <span class="rw-event-key">{{ e.action_key }}</span>
            <span class="rw-event-meta">{{ describeMetadata(e.metadata) }}</span>
            <span class="rw-event-pts">+{{ e.points }}</span>
          </div>
        </div>
      </section>

      <!-- ── Educating others ────────────────────────────────────────────── -->
      <section class="rw-section">
        <div class="rw-section__eyebrow">TRACK 3</div>
        <h2 class="rw-h2">Educating Others</h2>
        <p class="rw-p">Mentor sessions with a green-light connection. Both sides confirm before points are awarded — four confirmed sessions earns a Mentorship certificate.</p>

        <div class="rw-progress">
          <div class="rw-progress__label">
            <span>{{ rewards.mentorProgress.done ? '✓ Mentorship certificate earned' : 'Mentorship certificate (as mentor)' }}</span>
            <span>{{ Math.min(rewards.mentorProgress.current, rewards.mentorProgress.target) }} / {{ rewards.mentorProgress.target }} sessions</span>
          </div>
          <div class="rw-progress__track">
            <div class="rw-progress__fill" :class="{ 'rw-progress__fill--done': rewards.mentorProgress.done }"
              :style="{ width: Math.min(100, rewards.mentorProgress.current / rewards.mentorProgress.target * 100) + '%' }" />
          </div>
        </div>

        <div v-if="connections.length" class="rw-form">
          <select v-model="mentorTargetId" class="rw-input">
            <option value="" disabled>Choose a connection…</option>
            <option v-for="c in connections" :key="c.id" :value="c.id">{{ c.display_name }}</option>
          </select>
          <input v-model="mentorTopic" type="text" class="rw-input rw-input--wide" placeholder="Topic (e.g. water testing basics)" />
          <button class="rw-btn" :disabled="!mentorTargetId || !mentorTopic || (menteeIsYouth && !youthAck)" @click="submitMentorRequest">Request session</button>
        </div>
        <label v-if="menteeIsYouth" class="rw-p rw-youth-notice">
          <input type="checkbox" v-model="youthAck" />
          This connection has indicated they're a youth participant (13–17). I understand conduct
          and content standards for mentoring a minor apply, and I'll keep session topics
          age-appropriate.
        </label>
        <p v-else class="rw-p rw-p--dim">No green-light connections yet — connect with someone first to request or receive mentor sessions.</p>

        <p class="rw-p rw-p--dim">
          Mentoring someone? You can share a settlement design with them — open your settlement's
          inventory, expand an item and choose "Share this design" to generate a code they can redeem.
          No settlement yet?
          <router-link to="/galaxy?suggestedFocus=learning" class="rw-cta"
            @click="setSuggestedFocus('learning')">Start one focused on learning &amp; mentoring →</router-link>
        </p>

        <div v-if="rewards.pendingMentorConfirmations.length" class="rw-event-list">
          <div v-for="s in rewards.pendingMentorConfirmations" :key="s.id" class="rw-event-row">
            <span class="rw-event-key">{{ s.topic }}</span>
            <span class="rw-event-meta">{{ s.mentor_id === member.userId ? 'you are mentoring' : 'you are the mentee' }}</span>
            <button class="rw-btn rw-btn--small" @click="rewards.confirmMentorSession(s.id)">Confirm</button>
          </div>
        </div>
      </section>

      <!-- ── Group leader view — your mentees, by domain ─────────────────── -->
      <section v-if="rewards.mentorMenteeGroups.length" class="rw-section">
        <div class="rw-section__eyebrow">MENTORING · GROUP VIEW</div>
        <h2 class="rw-h2">Your Mentees</h2>
        <p class="rw-p">
          Everyone you've run a mentor session with, grouped by domain (guessed from each
          session's topic — see the domain framework in
          <a href="https://github.com/biomassives/vercel-html-exotopia.org/blob/main/SPEC_DOMAIN_COMPETENCY.md" target="_blank" rel="noopener">SPEC_DOMAIN_COMPETENCY.md</a>).
          Leading a group through WATSAN, biodiversity, remediation, or library-research work?
          This is the same underlying mentor_sessions data, just rolled up per person instead of per request.
        </p>

        <div class="rw-form">
          <select v-model="menteeDomainFilter" class="rw-input">
            <option value="">All domains</option>
            <option v-for="d in menteeDomainsPresent" :key="d" :value="d">{{ domainInfo(d).label }}</option>
          </select>
        </div>

        <div class="rw-mentee-list">
          <div v-for="g in filteredMenteeGroups" :key="g.menteeId" class="rw-mentee">
            <div class="rw-mentee__head">
              <span class="rw-mentee__name">{{ menteeName(g.menteeId) }}</span>
              <span class="rw-mentee__count">{{ g.confirmedCount }} confirmed{{ g.pendingCount ? ` · ${g.pendingCount} pending` : '' }}</span>
            </div>
            <div class="rw-mentee__domains">
              <router-link v-for="d in g.domains" :key="d" :to="domainInfo(d).route"
                class="rw-domain-badge" :style="{ '--dcolor': domainInfo(d).color }">
                {{ domainInfo(d).label }}
              </router-link>
            </div>
            <div class="rw-mentee__topics">
              <span v-for="s in g.sessions" :key="s.id" class="rw-mentee__topic" :class="{ 'rw-mentee__topic--pending': !s.confirmed_at }">
                {{ s.topic }}
              </span>
            </div>
          </div>
        </div>
      </section>

      <!-- ── Impact profile ──────────────────────────────────────────────── -->
      <section class="rw-section">
        <div class="rw-section__eyebrow">IMPACT PROFILE</div>
        <h2 class="rw-h2">Certificates &amp; Unlocked Objects</h2>

        <div v-if="rewards.certificates.length" class="rw-cert-list">
          <div v-for="c in rewards.certificates" :key="c.id" class="rw-cert">🏅 {{ c.certificate_type }}</div>
        </div>
        <p v-else class="rw-p rw-p--dim">No certificates yet.</p>

        <div v-if="rewards.unlockedObjects.length" class="rw-object-list">
          <div v-for="o in rewards.unlockedObjects" :key="o.key" class="rw-object" :style="{ '--ocolor': o.color }">
            <div class="rw-object__label">{{ o.label }}</div>
            <div class="rw-object__desc">{{ o.description }}</div>
            <div v-if="settlements.length" class="rw-object__attach">
              <select v-model="attachTarget[o.key]" class="rw-input rw-input--small">
                <option value="" disabled>Attach to settlement…</option>
                <option v-for="s in settlements" :key="s.key" :value="s.key">{{ s.displayName }}</option>
              </select>
              <button class="rw-btn rw-btn--small" :disabled="!attachTarget[o.key]" @click="attachObject(o.key)">Attach</button>
            </div>
          </div>
        </div>
        <p v-if="attachError" class="rw-p rw-attach-error">{{ attachError }}</p>
        <p v-if="rewards.unlockedObjects.length" class="rw-p rw-p--dim">
          Attached objects appear as lit structures inside that settlement's dome.
        </p>
      </section>

    </template>

  </q-page>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { supabase } from 'src/lib/supabase'
import { useMemberStore } from 'src/stores/member'
import { useRewardsStore, type RewardEvent } from 'src/stores/rewards'
import { useSettlements } from 'src/lib/settlements'
import { useSettlementItems } from 'src/lib/settlement-items'
import { SETTLEMENT_OBJECT_MESH } from 'src/data/rewards-catalog'
import { setSuggestedFocus } from 'src/lib/settlement-focus-intent'
import { DOMAINS } from 'src/data/domain-competency'
import MemberSignIn from 'src/components/MemberSignIn.vue'

const member  = useMemberStore()
const rewards = useRewardsStore()
const { settlements, updateSettlement } = useSettlements()

onMounted(() => {
  void rewards.loadMyRewards()
  void loadConnections()
})

// auth resolves asynchronously (magic-link redirect, session restore) — reload once it lands
watch(() => member.userId, (id) => {
  if (id) {
    void rewards.loadMyRewards()
    void loadConnections()
  }
})

// ── Volunteering ────────────────────────────────────────────────────────────

const volunteerActionKey   = ref('plastic_collection_kg')
const volunteerQuantity    = ref<number | null>(null)
const volunteerDescription = ref('')
const volunteerSubmitting  = ref(false)

const volunteerEvents = computed<RewardEvent[]>(() =>
  rewards.rewardEvents.filter(e => e.track === 'volunteering')
)

function describeMetadata(metadata: Record<string, unknown>): string {
  const parts: string[] = []
  if (typeof metadata.quantity === 'number') parts.push(`${metadata.quantity}`)
  if (typeof metadata.description === 'string' && metadata.description) parts.push(metadata.description)
  return parts.join(' — ')
}

async function submitVolunteerAction() {
  volunteerSubmitting.value = true
  await rewards.logVolunteerAction(volunteerActionKey.value, {
    quantity:    volunteerQuantity.value,
    description: volunteerDescription.value,
  })
  volunteerQuantity.value    = null
  volunteerDescription.value = ''
  volunteerSubmitting.value  = false
}

// ── Educating others ─────────────────────────────────────────────────────────

interface ConnectionOption { id: string; display_name: string }
const connections   = ref<ConnectionOption[]>([])
const mentorTargetId = ref('')
const mentorTopic    = ref('')
const menteeIsYouth  = ref(false)
const youthAck       = ref(false)

async function loadConnections() {
  if (!supabase || !member.connectedIds.length) return
  const { data } = await supabase.from('members').select('id, display_name').in('id', member.connectedIds)
  connections.value = (data as ConnectionOption[]) ?? []
}

// Re-check on every target change — this is the mentor-safety surfacing
// from 018_member_participation_mode.sql, not just a UX nicety: the request
// button stays disabled for a youth mentee until the box below is checked.
watch(mentorTargetId, async (id) => {
  youthAck.value = false
  menteeIsYouth.value = id ? await rewards.checkMenteeIsYouth(id) : false
})

async function submitMentorRequest() {
  if (!mentorTargetId.value || !mentorTopic.value) return
  if (menteeIsYouth.value && !youthAck.value) return
  await rewards.requestMentorSession(mentorTargetId.value, mentorTopic.value)
  mentorTargetId.value = ''
  mentorTopic.value    = ''
  menteeIsYouth.value  = false
  youthAck.value       = false
}

// ── Group leader view — mentee display names + domain filter ────────────────

const menteeNames = ref<Record<string, string>>({})

// mentor_sessions gives us mentee ids, not names — same public members-table
// read used by loadConnections() above, just keyed by whoever's in the group.
watch(() => rewards.mentorMenteeGroups.map(g => g.menteeId).join(','), async () => {
  const ids = rewards.mentorMenteeGroups.map(g => g.menteeId).filter(id => !menteeNames.value[id])
  if (!supabase || !ids.length) return
  const { data } = await supabase.from('members').select('id, display_name').in('id', ids)
  for (const row of (data ?? []) as { id: string; display_name: string }[]) {
    menteeNames.value[row.id] = row.display_name
  }
}, { immediate: true })

function menteeName(id: string): string {
  return menteeNames.value[id] ?? `Member ${id.slice(0, 8)}`
}

function domainInfo(code: string) {
  return DOMAINS[code] ?? DOMAINS.unclassified!
}

const menteeDomainFilter = ref('')

const menteeDomainsPresent = computed(() => {
  const set = new Set<string>()
  for (const g of rewards.mentorMenteeGroups) for (const d of g.domains) set.add(d)
  return [...set]
})

const filteredMenteeGroups = computed(() => {
  if (!menteeDomainFilter.value) return rewards.mentorMenteeGroups
  return rewards.mentorMenteeGroups.filter(g => g.domains.includes(menteeDomainFilter.value))
})

// ── Impact profile — attach an unlocked object to a settlement ──────────────

const attachTarget = reactive<Record<string, string>>({})
const attachError  = ref('')

// Attaching does two things: records the unlock on the settlement record, and
// places a real lit object in the settlement's interior. Before the second call
// existed, an earned certificate only ever produced a badge on this page.
function attachObject(objectKey: string) {
  const settlementKey = attachTarget[objectKey]
  if (!settlementKey) return
  const target = settlements.value.find(s => s.key === settlementKey)
  if (!target) return
  const existing = target.objects ?? []
  if (existing.includes(objectKey)) return

  const meshPreset = SETTLEMENT_OBJECT_MESH[objectKey]
  if (!meshPreset) return

  attachError.value = ''
  try {
    const skRef = ref(settlementKey)
    useSettlementItems(skRef).addItem({
      type:       'reward',
      meshPreset,
      zone:       'courtyard',
      color:      rewards.unlockedObjects.find(o => o.key === objectKey)?.color,
    })
  } catch {
    attachError.value = 'That object could not be placed in the selected settlement.'
    return
  }

  updateSettlement(settlementKey, { objects: [...existing, objectKey] })
  attachTarget[objectKey] = ''
}
</script>

<style scoped>
.rw-page {
  background: #020408;
  min-height: 100vh;
  padding: 36px 28px;
  font-family: 'Courier New', monospace;
  color: rgba(200,230,255,0.88);
}

.rw-header { margin-bottom: 24px; }
.rw-badge  { font-size: 8.5px; letter-spacing: 0.22em; color: rgba(160,120,255,0.60); margin-bottom: 8px; }
.rw-title  { font-size: 24px; font-weight: 300; color: rgba(210,235,255,0.90); letter-spacing: 0.05em; margin: 0 0 8px; }
.rw-sub    { font-size: 11px; color: rgba(110,165,200,0.65); line-height: 1.65; max-width: 560px; }

.rw-signin-gate {
  border: 1px dashed rgba(0,150,210,0.25); border-radius: 6px; padding: 14px 16px; max-width: 420px;
}

.rw-tiles { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 12px; margin-bottom: 28px; }
.rw-tile {
  background: rgba(0,8,22,0.80); border: 1px solid rgba(255,255,255,0.06); border-radius: 8px;
  padding: 16px; border-top: 2px solid var(--tcolor, rgba(0,190,230,0.5));
}
.rw-tile--total { border-top-color: #7c4dff; }
.rw-tile__value { font-size: 26px; color: rgba(220,240,255,0.92); }
.rw-tile__label { font-size: 9px; letter-spacing: 0.08em; color: rgba(120,170,205,0.65); text-transform: uppercase; margin-top: 4px; }

.rw-section {
  background: rgba(0,8,22,0.55); border: 1px solid rgba(255,255,255,0.06); border-radius: 8px;
  padding: 20px; margin-bottom: 18px;
}
.rw-section__eyebrow { font-size: 8.5px; letter-spacing: 0.22em; color: rgba(160,120,255,0.55); margin-bottom: 6px; }
.rw-h2 { font-size: 15px; font-weight: 600; color: rgba(210,235,255,0.90); margin: 0 0 8px; }
.rw-p  { font-size: 10.5px; color: rgba(130,185,220,0.72); line-height: 1.6; margin: 0 0 12px; }
.rw-p--dim { color: rgba(100,140,170,0.55); }
.rw-attach-error { color: rgba(255,120,120,0.85); }
.rw-youth-notice {
  display: flex; align-items: flex-start; gap: 8px; cursor: pointer;
  padding: 8px 10px; margin-top: -4px;
  background: rgba(242,192,55,0.08); border: 1px solid rgba(242,192,55,0.25); border-radius: 6px;
  color: rgba(230,210,150,0.85);
}
.rw-youth-notice input { margin-top: 2px; flex-shrink: 0; }

.rw-pfin-row { display: flex; flex-direction: column; gap: 6px; margin-bottom: 12px; }
.rw-pfin-status { font-size: 10.5px; color: rgba(150,180,205,0.60); }
.rw-pfin-status--done { color: rgba(80,230,130,0.85); }

.rw-cta { font-size: 10.5px; color: rgba(0,210,255,0.80); text-decoration: none; }
.rw-cta:hover { text-decoration: underline; }
.rw-cta--guide { display: inline-block; margin-top: 10px; }

.rw-progress { margin-bottom: 14px; }
.rw-progress__label {
  display: flex; justify-content: space-between;
  font-size: 9.5px; color: rgba(150,180,205,0.65); margin-bottom: 5px;
}
.rw-progress__track {
  height: 5px; border-radius: 3px; background: rgba(255,255,255,0.06); overflow: hidden;
}
.rw-progress__fill {
  height: 100%; border-radius: 3px; background: rgba(0,190,230,0.65);
  transition: width 0.3s ease;
}
.rw-progress__fill--done { background: rgba(80,230,130,0.85); }

.rw-form { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 14px; }
.rw-input {
  background: rgba(0,15,35,0.70); border: 1px solid rgba(0,100,160,0.25); border-radius: 5px;
  color: rgba(200,230,255,0.85); font-family: 'Courier New', monospace; font-size: 10.5px;
  padding: 8px 10px;
}
.rw-input--wide  { flex: 1; min-width: 180px; }
.rw-input--small { font-size: 9.5px; padding: 5px 8px; }

.rw-btn {
  background: rgba(0,40,80,0.55); border: 1px solid rgba(0,160,220,0.35); border-radius: 5px;
  color: rgba(200,235,255,0.90); font-family: 'Courier New', monospace; font-size: 10.5px;
  padding: 8px 14px; cursor: pointer;
}
.rw-btn:hover:not(:disabled) { border-color: rgba(0,190,240,0.55); }
.rw-btn:disabled { opacity: 0.4; cursor: default; }
.rw-btn--small { padding: 4px 10px; font-size: 9.5px; }

.rw-event-list { display: flex; flex-direction: column; gap: 4px; }
.rw-event-row {
  display: flex; align-items: center; gap: 10px; padding: 6px 0;
  border-bottom: 1px solid rgba(100,140,200,0.06); font-size: 10px;
}
.rw-event-key  { color: rgba(200,230,255,0.85); min-width: 160px; }
.rw-event-meta { color: rgba(120,170,205,0.60); flex: 1; }
.rw-event-pts  { color: rgba(80,230,130,0.85); }

.rw-mentee-list { display: flex; flex-direction: column; gap: 10px; }
.rw-mentee {
  background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.06);
  border-radius: 6px; padding: 10px 12px;
}
.rw-mentee__head { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 6px; }
.rw-mentee__name  { font-size: 11px; color: rgba(210,235,255,0.90); }
.rw-mentee__count { font-size: 9.5px; color: rgba(120,170,205,0.60); }
.rw-mentee__domains { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 6px; }
.rw-domain-badge {
  font-size: 9px; letter-spacing: 0.03em; padding: 3px 8px; border-radius: 10px;
  color: var(--dcolor, #78909c); border: 1px solid var(--dcolor, #78909c);
  background: color-mix(in srgb, var(--dcolor, #78909c) 12%, transparent);
  text-decoration: none;
}
.rw-domain-badge:hover { background: color-mix(in srgb, var(--dcolor, #78909c) 24%, transparent); }
.rw-mentee__topics { display: flex; flex-wrap: wrap; gap: 6px; }
.rw-mentee__topic {
  font-size: 9.5px; color: rgba(140,190,215,0.70); background: rgba(255,255,255,0.03);
  border-radius: 4px; padding: 2px 6px;
}
.rw-mentee__topic--pending { color: rgba(230,190,90,0.75); }

.rw-cert-list, .rw-object-list { display: flex; flex-direction: column; gap: 8px; }
.rw-cert { font-size: 10.5px; color: rgba(200,170,60,0.85); }

.rw-object {
  border-left: 3px solid var(--ocolor, #44ff88); background: rgba(255,255,255,0.02);
  border-radius: 0 5px 5px 0; padding: 10px 12px;
}
.rw-object__label { font-size: 11px; color: rgba(210,235,255,0.88); margin-bottom: 3px; }
.rw-object__desc  { font-size: 9.5px; color: rgba(120,170,205,0.62); line-height: 1.5; margin-bottom: 8px; }
.rw-object__attach { display: flex; gap: 6px; }
</style>
