<template>
  <q-page class="bi-page">
    <div class="bi-header">
      <div class="bi-header-inner">
        <div class="bi-back">
          <router-link to="/docs" class="bi-back-link">← Docs</router-link>
        </div>
        <h1 class="bi-title">Working Notes &amp; Blog</h1>
        <p class="bi-lead">
          SCD Hub · Exotopia.org · GPL v3 ·
          {{ BLOG_POSTS.length }} posts across {{ seriesCount }} series
        </p>
        <div class="bi-filters">
          <button
            v-for="f in FILTERS"
            :key="f.key"
            class="bi-chip"
            :class="{ 'bi-chip--active': activeFilter === f.key }"
            :style="activeFilter === f.key && f.color ? `border-color:${f.color};color:${f.color}` : ''"
            @click="activeFilter = f.key"
          >{{ f.label }}</button>
        </div>
      </div>
    </div>

    <div class="bi-body">
      <template v-for="series in visibleSeries" :key="series">
        <div class="bi-series-header">
          <span class="bi-series-label">{{ SERIES_LABEL[series] }}</span>
        </div>
        <div class="bi-grid">
          <router-link
            v-for="post in postsBySeries(series)"
            :key="post.slug"
            :to="`/blog/${post.slug}`"
            class="bi-card"
          >
            <div class="bi-card-top">
              <span
                class="bi-status"
                :style="`color:${STATUS_COLOR[post.status]};border-color:${STATUS_COLOR[post.status]}`"
              >{{ STATUS_LABEL[post.status] }}</span>
              <span class="bi-date">{{ post.date }}</span>
              <span class="bi-time">{{ readingTime(getBlogContent(post.slug)) }} min</span>
            </div>
            <h2 class="bi-card-title">{{ post.title }}</h2>
            <p v-if="post.subtitle" class="bi-card-sub">{{ post.subtitle }}</p>
            <p class="bi-card-desc">{{ post.description }}</p>
            <div class="bi-card-footer">
              <span
                v-for="a in post.audience"
                :key="a"
                class="bi-audience"
                :style="`color:${AUDIENCE_COLOR[a]};border-color:${AUDIENCE_COLOR[a]}`"
              >{{ AUDIENCE_LABEL[a] }}</span>
              <span class="bi-read">Read →</span>
            </div>
          </router-link>
        </div>
      </template>

      <div v-if="visibleSeries.length === 0" class="bi-empty">
        No posts in this category yet.
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  BLOG_POSTS, SERIES_LABEL, AUDIENCE_COLOR, AUDIENCE_LABEL,
  STATUS_COLOR, STATUS_LABEL, getBlogContent, readingTime,
  type BlogAudience, type BlogSeries,
} from 'src/data/blog-posts'

const FILTERS = [
  { key: 'all',       label: 'All',        color: '' },
  { key: 'dev',       label: 'Technical',  color: '#00e5ff' },
  { key: 'community', label: 'Community',  color: '#44ff88' },
  { key: 'field',     label: 'Field',      color: '#ffaa33' },
  { key: 'ecosystem', label: 'Ecosystem',  color: '#cc88ff' },
] as const

const activeFilter = ref<'all' | BlogAudience>('all')

const filteredPosts = computed(() =>
  activeFilter.value === 'all'
    ? BLOG_POSTS
    : BLOG_POSTS.filter(p => p.audience.includes(activeFilter.value as BlogAudience))
)

const visibleSeries = computed<BlogSeries[]>(() => {
  const order: BlogSeries[] = ['navigation', 'science', 'economy', 'ecosystem', 'field']
  return order.filter(s => filteredPosts.value.some(p => p.series === s))
})

const seriesCount = computed(() => new Set(BLOG_POSTS.map(p => p.series)).size)

function postsBySeries (series: BlogSeries) {
  return filteredPosts.value.filter(p => p.series === series)
}
</script>

<style scoped lang="scss">
.bi-page {
  min-height: 100vh;
  background: #050912;
  color: #c8d4e8;
  font-family: 'Roboto', sans-serif;
}

/* ── Header ── */
.bi-header {
  border-bottom: 1px solid rgba(255,255,255,0.06);
  background: linear-gradient(180deg, #080d1a 0%, #050912 100%);
  padding: 32px 0 24px;
}
.bi-header-inner {
  max-width: 1100px;
  margin: 0 auto;
  padding: 0 24px;
}
.bi-back-link {
  color: #4488cc;
  text-decoration: none;
  font-size: 13px;
  letter-spacing: 0.04em;
  &:hover { color: #66aaee; }
}
.bi-title {
  margin: 16px 0 6px;
  font-size: clamp(22px, 4vw, 32px);
  font-weight: 700;
  color: #e8f0ff;
  letter-spacing: -0.02em;
}
.bi-lead {
  margin: 0 0 20px;
  font-size: 13px;
  color: #5a6a8a;
  letter-spacing: 0.03em;
}
.bi-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.bi-chip {
  padding: 5px 14px;
  border-radius: 20px;
  border: 1px solid rgba(255,255,255,0.14);
  background: transparent;
  color: #7888aa;
  font-size: 12px;
  letter-spacing: 0.05em;
  cursor: pointer;
  transition: all 0.15s;
  &:hover { color: #c8d4e8; border-color: rgba(255,255,255,0.3); }
  &--active { background: rgba(255,255,255,0.05); color: #c8d4e8; }
}

/* ── Body ── */
.bi-body {
  max-width: 1100px;
  margin: 0 auto;
  padding: 32px 24px 64px;
}
.bi-series-header {
  margin: 32px 0 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  &::after {
    content: '';
    flex: 1;
    height: 1px;
    background: rgba(255,255,255,0.07);
  }
}
.bi-series-label {
  font-size: 11px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #3a4a6a;
  white-space: nowrap;
}

/* ── Grid ── */
.bi-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  @media (max-width: 900px) { grid-template-columns: repeat(2, 1fr); }
  @media (max-width: 560px) { grid-template-columns: 1fr; }
}
.bi-card {
  display: flex;
  flex-direction: column;
  background: #0a1020;
  border: 1px solid rgba(255,255,255,0.07);
  border-radius: 8px;
  padding: 18px 20px 16px;
  text-decoration: none;
  color: inherit;
  transition: border-color 0.15s, background 0.15s;
  &:hover {
    border-color: rgba(100,160,255,0.25);
    background: #0c1428;
  }
}
.bi-card-top {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}
.bi-status {
  font-size: 10px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  border: 1px solid;
  border-radius: 4px;
  padding: 2px 7px;
}
.bi-date, .bi-time {
  font-size: 11px;
  color: #3a4a6a;
}
.bi-time::before { content: '·'; margin-right: 10px; }

.bi-card-title {
  margin: 0 0 5px;
  font-size: 15px;
  font-weight: 600;
  color: #d8e8ff;
  line-height: 1.35;
}
.bi-card-sub {
  margin: 0 0 10px;
  font-size: 12px;
  color: #5a6a8a;
  line-height: 1.5;
}
.bi-card-desc {
  flex: 1;
  margin: 0 0 16px;
  font-size: 13px;
  color: #7888aa;
  line-height: 1.6;
  display: -webkit-box;
  -webkit-line-clamp: 4;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.bi-card-footer {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
}
.bi-audience {
  font-size: 10px;
  letter-spacing: 0.06em;
  border: 1px solid;
  border-radius: 3px;
  padding: 2px 6px;
}
.bi-read {
  margin-left: auto;
  font-size: 12px;
  color: #3a5a8a;
  transition: color 0.15s;
  .bi-card:hover & { color: #66aaff; }
}
.bi-empty {
  padding: 48px 0;
  text-align: center;
  color: #3a4a6a;
  font-size: 14px;
}
</style>
