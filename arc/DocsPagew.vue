<template>
  <q-page class="dp-page">

    <!-- TOPBAR -->
    <div class="dp-topbar">

      <router-link to="/" class="dp-home-link">
        <span class="dp-home-exo">EXO</span>
        <span class="dp-home-topia">TOPIA</span>
        <span class="dp-home-arrow">↗</span>
      </router-link>

      <div class="dp-topbar-title">
        Documentation
      </div>

      
<div
  class="dp-search-wrap"
  ref="searchWrap"
>

  <q-input
    v-model="query"

    dense
    dark
    outlined

    color="cyan"

    placeholder="Search docs…"

    input-class="dp-search-input"

    style="min-width: 240px"

    @update:model-value="onQuery"

    @focus="searchFocused = true"

    @blur="onBlur"

    @keydown.down.prevent="
      hintIdx =
        Math.min(
          hintIdx + 1,
          hints.length - 1
        )
    "

    @keydown.up.prevent="
      hintIdx =
        Math.max(
          hintIdx - 1,
          0
        )
    "

    @keydown.enter="
      selectHint(
        hints[hintIdx]
      )
    "

    @keydown.escape="
      closeSearch()
    "
  >

    <template #prepend>

      <q-icon
        name="search"
        size="14px"
        color="blue-grey-6"
      />

    </template>

    <template #append>

      <div class="dp-search-actions">

        <q-icon
          v-if="query"
          name="close"
          size="13px"
          color="blue-grey-6"
          class="cursor-pointer"
          @click="clearSearch"
        />

        <div class="dp-search-kbd">
          ⌘K
        </div>

      </div>

    </template>

  </q-input>

  <!-- SEARCH HINTS -->

  <transition name="dp-search-panel">

    <div
      v-if="
        hints.length &&
        searchFocused
      "
      class="dp-hints"
    >

      <div
        v-for="(hint, i) in hints"

        :key="hint.id"

        class="dp-hint"

        :class="{
          'dp-hint--active':
            i === hintIdx
        }"

        @mousedown.prevent="
          selectHint(hint)
        "
      >

        <div class="dp-hint-meta">
          {{ hint.section }}
        </div>

        <div class="dp-hint-title">
          {{ hint.title }}
        </div>

      </div>

    </div>

  </transition>

    </div>

    <!-- LAYOUT -->
    <div
      class="dp-layout"
      :class="{
        'dp-layout--nav-collapsed': navCollapsed
      }"
    >

      <!-- SIDEBAR TOGGLE -->
      <button
        class="dp-nav-toggle"
        :class="{
          'dp-nav-toggle--collapsed': navCollapsed
        }"
        @click="toggleSidebar"
      >
        <q-icon
          :name="
            navCollapsed
              ? 'chevron_right'
              : 'chevron_left'
          "
          size="18px"
        />
      </button>

      <!-- SIDEBAR -->
      <nav
        class="dp-nav"
        :class="{
          'dp-nav--collapsed': navCollapsed
        }"
      >

        <div
          v-for="section in NAV"
          :key="section.id"
          class="dp-nav-section"
        >

          <div
            class="dp-nav-section-head"
            @click="toggleNav(section.id)"
          >

            <span>
              {{ section.icon }}
              {{ section.label }}
            </span>

            <q-icon
              :name="
                openNav.has(section.id)
                  ? 'expand_less'
                  : 'expand_more'
              "
              size="12px"
              color="blue-grey-6"
            />

          </div>

          <transition name="dp-nav-items">

            <div
              v-if="openNav.has(section.id)"
              class="dp-nav-items"
            >

              <a
                v-for="item in section.items"
                :key="item.id"
                class="dp-nav-item"
                :class="{
                  'dp-nav-item--active':
                    activeSection === item.id
                }"
                @click.prevent="scrollTo(item.id)"
              >
                {{ item.label }}
              </a>

            </div>

          </transition>

        </div>

      </nav>

      <!-- CONTENT -->
      <main class="dp-content">

        <section
          id="getting-started"
          class="dp-section"
        >

          <h1 class="dp-h1">
            Getting Started
          </h1>

          <p class="dp-p">
            Exotopia is an open browser-based
            virtual settlement protocol for
            exoplanet civilization simulation,
            NFT ownership, eco-ops coordination,
            and decentralized cultural archives.
          </p>

          <div class="dp-callout">
            Reader Mode enabled:
            collapse the sidebar to maximize
            reading focus.
          </div>

        </section>

        <section
          id="visualization"
          class="dp-section"
        >

          <h1 class="dp-h1">
            Visualization
          </h1>

          <p class="dp-p">
            The cosmic web renderer visualizes
            galaxy clusters, supervoids,
            exoplanetary systems,
            and deterministic settlement
            generation layers.
          </p>

        </section>

        <section
          id="protocol"
          class="dp-section"
        >

          <h1 class="dp-h1">
            Protocol & Economy
          </h1>

          <p class="dp-p">
            The Resonance Split distributes:
            99% creator,
            0.75% community infrastructure,
            0.25% platform maintenance.
          </p>

        </section>

      </main>

    </div>

  </q-page>
</template>

<script setup lang="ts">
import {
  ref,
  watch,
  onMounted
} from 'vue'

/* -------------------------------------------------- */
/* SEARCH */
/* -------------------------------------------------- */

const query = ref('')

/* -------------------------------------------------- */
/* NAVIGATION */
/* -------------------------------------------------- */

const NAV = [
  {
    id: 'getting-started',
    icon: '🚀',
    label: 'Getting Started',
    items: [
      {
        id: 'getting-started',
        label: 'Overview'
      }
    ]
  },

  {
    id: 'visualization',
    icon: '🌌',
    label: 'Visualization',
    items: [
      {
        id: 'visualization',
        label: 'Overview'
      }
    ]
  },

  {
    id: 'protocol',
    icon: '⬡',
    label: 'Protocol',
    items: [
      {
        id: 'protocol',
        label: 'Overview'
      }
    ]
  }
]

/* -------------------------------------------------- */
/* SIDEBAR STATE */
/* -------------------------------------------------- */

const navCollapsed = ref(false)

function toggleSidebar() {
  navCollapsed.value =
    !navCollapsed.value
}

/* -------------------------------------------------- */
/* OPEN GROUPS */
/* -------------------------------------------------- */

const openNav = ref(
  new Set(
    NAV.map(section => section.id)
  )
)

function toggleNav(id: string) {

  if (openNav.value.has(id)) {
    openNav.value.delete(id)
  } else {
    openNav.value.add(id)
  }

  openNav.value =
    new Set(openNav.value)
}

/* -------------------------------------------------- */
/* ACTIVE SECTION */
/* -------------------------------------------------- */

const activeSection = ref(
  'getting-started'
)

function scrollTo(id: string) {

  activeSection.value = id

  const el =
    document.getElementById(id)

  if (!el) return

  const yOffset = -70

  const y =
    el.getBoundingClientRect().top +
    window.pageYOffset +
    yOffset

  window.scrollTo({
    top: y,
    behavior: 'smooth'
  })
}

/* -------------------------------------------------- */
/* PERSIST SIDEBAR */
/* -------------------------------------------------- */

onMounted(() => {

  const saved =
    localStorage.getItem(
      'exo_docs_nav'
    )

  if (saved === 'collapsed') {
    navCollapsed.value = true
  }
})

watch(navCollapsed, (collapsed) => {

  localStorage.setItem(
    'exo_docs_nav',
    collapsed
      ? 'collapsed'
      : 'open'
  )
})
</script>

<style scoped>

/* -------------------------------------------------- */
/* PAGE */
/* -------------------------------------------------- */

.dp-page {
  background: #020408;
  min-height: 100vh;

  font-family:
    Inter,
    system-ui,
    sans-serif;

  color: white;
}

/* -------------------------------------------------- */
/* TOPBAR */
/* -------------------------------------------------- */

.dp-topbar {

  position: fixed;

  top: 0;
  left: 0;
  right: 0;

  z-index: 300;

  height: 48px;

  display: flex;
  align-items: center;
  gap: 16px;

  padding: 0 20px;

  background:
    rgba(0, 4, 14, 0.94);

  backdrop-filter: blur(10px);

  border-bottom:
    1px solid rgba(0,80,130,0.20);
}

.dp-home-link {
  text-decoration: none;

  display: flex;
  align-items: center;

  font-size: 12px;

  letter-spacing: 0.14em;
}

.dp-home-exo {
  color: #4dd0e1;
}

.dp-home-topia {
  color: #90a4ae;
}

.dp-home-arrow {
  color: rgba(80,160,200,0.5);
  margin-left: 4px;
}

.dp-topbar-title {

  flex: 1;

  font-size: 10px;

  letter-spacing: 0.18em;

  color:
    rgba(100,160,200,0.55);
}

/* -------------------------------------------------- */
/* LAYOUT */
/* -------------------------------------------------- */

.dp-layout {

  display: flex;

  margin-top: 48px;

  min-height:
    calc(100vh - 48px);

  position: relative;
}

/* -------------------------------------------------- */
/* SIDEBAR */
/* -------------------------------------------------- */

.dp-nav {

  width: 240px;

  flex-shrink: 0;

  position: sticky;

  top: 48px;

  max-height:
    calc(100vh - 48px);

  overflow-y: auto;
  overflow-x: hidden;

  background:
    linear-gradient(
      180deg,
      rgba(0, 6, 18, 0.96),
      rgba(0, 3, 10, 0.96)
    );

  border-right:
    1px solid rgba(0,80,130,0.18);

  transition:
    width 0.26s cubic-bezier(.4,0,.2,1),
    border-color 0.2s ease,
    opacity 0.2s ease;

  will-change: width;
}

.dp-nav--collapsed {

  width: 0;

  overflow: hidden;

  border-right-color: transparent;
}

/* -------------------------------------------------- */
/* TOGGLE */
/* -------------------------------------------------- */

.dp-nav-toggle {

  position: fixed;

  top: 72px;
  left: 240px;

  width: 24px;
  height: 56px;

  z-index: 250;

  display: flex;
  align-items: center;
  justify-content: center;

  cursor: pointer;

  color:
    rgba(0,220,255,0.82);

  background:
    linear-gradient(
      180deg,
      rgba(0,18,40,0.96),
      rgba(0,8,24,0.96)
    );

  border:
    1px solid rgba(0,140,220,0.24);

  border-left: none;

  border-radius: 0 8px 8px 0;

  transition:
    left 0.26s cubic-bezier(.4,0,.2,1),
    background 0.18s ease,
    border-color 0.18s ease,
    transform 0.18s ease;
}

.dp-nav-toggle:hover {

  background:
    rgba(0,40,90,0.96);

  border-color:
    rgba(0,220,255,0.42);

  transform: translateX(1px);
}

.dp-nav-toggle--collapsed {
  left: 0;
}

/* -------------------------------------------------- */
/* NAV ITEMS */
/* -------------------------------------------------- */

.dp-nav-section {
  padding-top: 8px;
}

.dp-nav-section-head {

  display: flex;
  align-items: center;
  justify-content: space-between;

  padding:
    8px 14px;

  cursor: pointer;

  user-select: none;

  font-size: 10px;

  letter-spacing: 0.08em;

  color:
    rgba(0,200,240,0.65);

  transition:
    color 0.14s ease;
}

.dp-nav-section-head:hover {
  color:
    rgba(0,220,255,0.92);
}

.dp-nav-items {
  display: flex;
  flex-direction: column;
}

.dp-nav-item {

  position: relative;

  padding:
    6px 14px 6px 22px;

  font-size: 10px;

  color:
    rgba(120,175,215,0.7);

  text-decoration: none;

  cursor: pointer;

  transition:
    background 0.14s ease,
    color 0.14s ease;
}

.dp-nav-item:hover {

  background:
    rgba(0,30,70,0.5);

  color:
    rgba(0,220,255,0.92);
}

.dp-nav-item--active {

  color:
    rgba(0,220,255,0.95);

  background:
    rgba(0,40,90,0.45);
}

.dp-nav-item--active::before {

  content: '';

  position: absolute;

  left: 0;
  top: 0;
  bottom: 0;

  width: 2px;

  background: #00d8ff;

  box-shadow:
    0 0 10px rgba(0,220,255,0.45);
}

/* -------------------------------------------------- */
/* CONTENT */
/* -------------------------------------------------- */

.dp-content {

  flex: 1;

  min-width: 0;

  padding:
    36px 56px 120px;

  transition:
    padding 0.26s cubic-bezier(.4,0,.2,1);
}

/* READER MODE */

.dp-layout--nav-collapsed
.dp-content {

  padding-left: 80px;
  padding-right: 80px;
}

.dp-section {

  max-width: 760px;

  margin-bottom: 56px;

  transition:
    max-width 0.26s ease;
}

.dp-layout--nav-collapsed
.dp-section {

  max-width: 920px;
}

/* -------------------------------------------------- */
/* TYPOGRAPHY */
/* -------------------------------------------------- */

.dp-h1 {

  font-size: 28px;

  font-weight: 300;

  letter-spacing: 0.04em;

  margin-bottom: 18px;

  color:
    rgba(220,240,255,0.95);
}

.dp-p {

  font-size: 14px;

  line-height: 1.8;

  color:
    rgba(140,190,220,0.76);
}

.dp-callout {

  margin-top: 20px;

  padding: 14px 16px;

  border-left:
    3px solid rgba(0,180,240,0.5);

  background:
    rgba(0,30,60,0.36);

  border-radius:
    0 6px 6px 0;

  color:
    rgba(160,210,240,0.8);
}

/* -------------------------------------------------- */
/* NAV ANIMATION */
/* -------------------------------------------------- */

.dp-nav-items-enter-active,
.dp-nav-items-leave-active {

  transition:
    opacity 0.18s ease,
    transform 0.18s ease;
}

.dp-nav-items-enter-from,
.dp-nav-items-leave-to {

  opacity: 0;

  transform: translateY(-4px);
}

/* -------------------------------------------------- */
/* MOBILE */
/* -------------------------------------------------- */

@media (max-width: 900px) {

  .dp-nav {

    position: fixed;

    left: 0;
    top: 48px;
    bottom: 0;

    z-index: 220;

    max-height: none;
  }

  .dp-nav--collapsed {

    width: 240px;

    transform:
      translateX(-100%);
  }

  .dp-nav-toggle {
    top: 58px;
  }

  .dp-content {

    padding:
      24px
      20px
      80px;
  }

  .dp-layout--nav-collapsed
  .dp-content {

    padding-left: 20px;
    padding-right: 20px;
  }

  .dp-layout--nav-collapsed
  .dp-section {

    max-width: 100%;
  }
}

</style>