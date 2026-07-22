<template>
  <q-page class="learn-page">

    <div class="lp-header">
      <div class="lp-badge">KNOWLEDGE DEVELOPMENT</div>
      <h1 class="lp-title">Learn with Exotopia</h1>
      <p class="lp-sub">
        Short knowledge quizzes across core SCD Hub domains.
        Complete a quiz to earn a knowledge badge on your settlement record.
      </p>
    </div>

    <!-- Quiz area cards -->
    <div class="lp-grid">
      <div
        v-for="area in quizAreas"
        :key="area.id"
        class="lp-card"
        :class="{ 'lp-card--locked': isLocked(area) }"
        :style="{ '--qcolor': area.color }"
        @click="!isLocked(area) && openQuiz(area)"
      >
        <div class="lp-card__icon">{{ area.emoji }}</div>
        <div class="lp-card__body">
          <div class="lp-card__title">{{ area.title }}</div>
          <div class="lp-card__desc">{{ area.description }}</div>
          <div class="lp-card__meta">
            <span>{{ area.questionCount }} questions</span>
            <span>·</span>
            <span :class="`diff--${area.difficulty}`">{{ area.difficulty }}</span>
          </div>
        </div>
        <div class="lp-card__badge" v-if="area.badge">
          <span>🏅 {{ area.badge }}</span>
        </div>
        <div class="lp-card__cta" v-if="!isLocked(area)">Start →</div>
        <div class="lp-card__cta" v-else>🔒 Complete {{ prerequisiteTitle(area) }} first</div>
      </div>
    </div>

    <!-- Quiz modal -->
    <q-dialog v-model="quizOpen" persistent>
      <q-card class="quiz-card" v-if="activeArea && activeQ">
        <q-card-section class="quiz-header">
          <div class="quiz-area-label">{{ activeArea.emoji }} {{ activeArea.title }}</div>
          <div class="quiz-progress">
            {{ qIndex + 1 }} / {{ activeArea.questions.length }}
          </div>
        </q-card-section>

        <q-card-section class="quiz-body">
          <div class="quiz-q">{{ activeQ.question }}</div>

          <div class="quiz-options">
            <button
              v-for="(opt, oi) in activeQ.options"
              :key="oi"
              class="quiz-opt"
              :class="{
                'quiz-opt--selected': selectedOpt === oi,
                'quiz-opt--correct': answered && oi === activeQ.correct,
                'quiz-opt--wrong':   answered && selectedOpt === oi && oi !== activeQ.correct,
              }"
              :disabled="answered"
              @click="selectOpt(oi)"
            >
              <span class="quiz-opt__letter">{{ 'ABCD'[oi] }}</span>
              {{ opt }}
            </button>
          </div>

          <Transition name="quiz-explain">
            <div class="quiz-explain" v-if="answered">
              {{ activeQ.explanation }}
            </div>
          </Transition>
        </q-card-section>

        <q-card-actions class="quiz-actions">
          <q-btn flat label="Exit" color="blue-grey-5" @click="closeQuiz"/>
          <q-space/>
          <q-btn
            v-if="answered && qIndex < activeArea.questions.length - 1"
            unelevated color="cyan-8" label="Next question →"
            @click="nextQ"
          />
          <q-btn
            v-if="answered && qIndex === activeArea.questions.length - 1"
            unelevated color="positive" label="Complete ✓"
            @click="completeQuiz"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Completion toast -->
    <q-dialog v-model="completionOpen">
      <q-card class="complete-card">
        <q-card-section class="text-center q-pa-lg">
          <div style="font-size:48px">{{ activeArea?.emoji }}</div>
          <div class="complete-title">{{ activeArea?.title }}</div>
          <div class="complete-badge">{{ activeArea?.badge }} earned</div>
          <div class="complete-score">{{ score }} / {{ activeArea?.questions.length }} correct</div>
        </q-card-section>
        <q-card-actions align="center">
          <q-btn flat label="Back to quizzes" color="cyan-6" @click="completionOpen = false; quizOpen = false"/>
        </q-card-actions>
      </q-card>
    </q-dialog>

  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { QUIZ_AREAS, type QuizArea } from 'src/data/quizzes'
import { QUIZ_REWARD_MAP } from 'src/data/rewards-catalog'
import { useRewardsStore } from 'src/stores/rewards'
import { useMemberStore } from 'src/stores/member'

const quizAreas = QUIZ_AREAS
const rewards   = useRewardsStore()
const member    = useMemberStore()

onMounted(() => { void rewards.loadMyRewards() })
watch(() => member.userId, (id) => { if (id) void rewards.loadMyRewards() })

const quizOpen       = ref(false)
const completionOpen = ref(false)
const activeArea     = ref<QuizArea | null>(null)
const qIndex         = ref(0)
const selectedOpt    = ref<number | null>(null)
const answered       = ref(false)
const score          = ref(0)

const activeQ = computed(() =>
  activeArea.value ? activeArea.value.questions[qIndex.value] ?? null : null
)

function isLocked(area: QuizArea): boolean {
  const cfg = QUIZ_REWARD_MAP[area.id]
  if (!cfg?.prerequisite) return false
  const prereqType = QUIZ_REWARD_MAP[cfg.prerequisite]?.certificateType
  return !prereqType || !rewards.certificateTypes.has(prereqType)
}

function prerequisiteTitle(area: QuizArea): string {
  const cfg = QUIZ_REWARD_MAP[area.id]
  const prereq = cfg?.prerequisite ? quizAreas.find(a => a.id === cfg.prerequisite) : null
  return prereq?.title ?? 'prerequisite'
}

function openQuiz(area: QuizArea) {
  activeArea.value = area
  qIndex.value     = 0
  selectedOpt.value = null
  answered.value   = false
  score.value      = 0
  quizOpen.value   = true
}

function selectOpt(oi: number) {
  if (answered.value) return
  selectedOpt.value = oi
  answered.value    = true
  if (activeQ.value && oi === activeQ.value.correct) score.value++
}

function nextQ() {
  qIndex.value++
  selectedOpt.value = null
  answered.value    = false
}

function completeQuiz() {
  quizOpen.value       = false
  completionOpen.value = true
  const area = activeArea.value
  if (area && QUIZ_REWARD_MAP[area.id]) {
    void rewards.awardQuizCompletion(area.id, score.value, area.questions.length)
  }
}

function closeQuiz() {
  quizOpen.value    = false
  activeArea.value  = null
}
</script>

<style scoped>
.learn-page {
  background: #020408;
  min-height: 100vh;
  padding: 36px 28px;
  font-family: 'Courier New', monospace;
}

.lp-header { margin-bottom: 28px; }
.lp-badge  { font-size: 8.5px; letter-spacing: 0.22em; color: rgba(160,120,255,0.60); margin-bottom: 8px; }
.lp-title  { font-size: 24px; font-weight: 300; color: rgba(210,235,255,0.90); letter-spacing: 0.05em; margin: 0 0 8px; }
.lp-sub    { font-size: 11px; color: rgba(110,165,200,0.65); line-height: 1.65; max-width: 500px; }

.lp-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 14px;
}

.lp-card {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 18px;
  background: rgba(0, 8, 22, 0.80);
  border: 1px solid rgba(255,255,255,0.06);
  border-radius: 8px;
  cursor: pointer;
  transition: border-color 0.14s, transform 0.12s;
  position: relative;
}
.lp-card:hover {
  border-color: var(--qcolor, rgba(0,180,220,0.35));
  transform: translateY(-2px);
}
.lp-card--locked { cursor: default; opacity: 0.5; }
.lp-card--locked:hover { border-color: rgba(255,255,255,0.06); transform: none; }

.lp-card__icon { font-size: 28px; }
.lp-card__body { flex: 1; }
.lp-card__title { font-size: 12.5px; font-weight: 600; color: rgba(210,235,255,0.88); letter-spacing: 0.05em; margin-bottom: 5px; }
.lp-card__desc  { font-size: 9px; color: rgba(120,170,205,0.65); line-height: 1.55; margin-bottom: 6px; }
.lp-card__meta  { display: flex; gap: 6px; font-size: 8px; color: rgba(80,140,180,0.55); }
.diff--beginner  { color: rgba(80,230,130,0.70); }
.diff--intermediate { color: rgba(255,190,50,0.70); }
.diff--advanced  { color: rgba(255,100,60,0.70); }

.lp-card__badge { font-size: 8px; color: rgba(200,170,80,0.70); letter-spacing: 0.08em; }
.lp-card__cta   { align-self: flex-end; font-size: 9px; color: var(--qcolor, rgba(0,190,230,0.65)); }

/* Quiz modal */
.quiz-card { background: #020c1e; border: 1px solid rgba(0,150,210,0.22); min-width: 480px; max-width: 92vw; }
.quiz-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(0,80,140,0.20); }
.quiz-area-label { font-family: 'Courier New', monospace; font-size: 11px; color: rgba(0,210,255,0.75); letter-spacing: 0.10em; }
.quiz-progress   { font-family: 'Courier New', monospace; font-size: 9px; color: rgba(80,140,180,0.55); }

.quiz-body { display: flex; flex-direction: column; gap: 16px; }
.quiz-q    { font-family: 'Courier New', monospace; font-size: 13px; color: rgba(200,230,255,0.88); line-height: 1.55; }

.quiz-options { display: flex; flex-direction: column; gap: 8px; }
.quiz-opt {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 14px;
  background: rgba(0,15,35,0.70);
  border: 1px solid rgba(0,100,160,0.22);
  border-radius: 5px;
  cursor: pointer;
  font-family: 'Courier New', monospace;
  font-size: 10.5px;
  color: rgba(160,210,240,0.82);
  text-align: left;
  transition: border-color 0.12s, background 0.12s;
}
.quiz-opt:hover:not(:disabled) { border-color: rgba(0,190,240,0.40); background: rgba(0,25,50,0.80); }
.quiz-opt--selected { border-color: rgba(0,160,220,0.55); background: rgba(0,40,80,0.50); }
.quiz-opt--correct  { border-color: rgba(60,220,120,0.70); background: rgba(0,60,30,0.45); color: rgba(100,240,150,0.88); }
.quiz-opt--wrong    { border-color: rgba(220,80,50,0.60); background: rgba(60,0,0,0.40); color: rgba(240,120,100,0.85); }
.quiz-opt__letter   { font-weight: 700; min-width: 16px; color: rgba(0,180,220,0.55); }
.quiz-opt:disabled  { cursor: default; }

.quiz-explain {
  font-family: 'Courier New', monospace;
  font-size: 9.5px;
  color: rgba(130,185,220,0.72);
  line-height: 1.60;
  background: rgba(0,20,45,0.45);
  border-left: 2px solid rgba(0,160,210,0.35);
  padding: 8px 12px;
  border-radius: 0 4px 4px 0;
}
.quiz-explain-enter-active { transition: opacity 0.20s ease; }
.quiz-explain-leave-active { transition: opacity 0.12s ease; }
.quiz-explain-enter-from, .quiz-explain-leave-to { opacity: 0; }

.quiz-actions { border-top: 1px solid rgba(0,60,100,0.20); }

/* Completion card */
.complete-card { background: #020c1e; border: 1px solid rgba(60,200,110,0.25); min-width: 280px; }
.complete-title { font-family: 'Courier New', monospace; font-size: 14px; color: rgba(200,235,255,0.88); letter-spacing: 0.06em; margin: 8px 0 4px; }
.complete-badge { font-size: 10px; color: rgba(200,170,60,0.80); letter-spacing: 0.12em; margin-bottom: 4px; }
.complete-score { font-family: 'Courier New', monospace; font-size: 20px; color: rgba(80,230,130,0.88); }
</style>
