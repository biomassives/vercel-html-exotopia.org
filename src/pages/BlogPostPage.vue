<template>
  <q-page class="bp-page">
    <div v-if="post" class="bp-inner">

      <!-- breadcrumb -->
      <nav class="bp-nav">
        <router-link to="/docs" class="bp-navlink">Docs</router-link>
        <span class="bp-sep">/</span>
        <router-link to="/blog" class="bp-navlink">Blog</router-link>
        <span class="bp-sep">/</span>
        <span class="bp-navlink bp-navlink--current">{{ post.title }}</span>
      </nav>

      <!-- header -->
      <header class="bp-header">
        <div class="bp-meta-top">
          <span
            class="bp-status"
            :style="`color:${STATUS_COLOR[post.status]};border-color:${STATUS_COLOR[post.status]}`"
          >{{ STATUS_LABEL[post.status] }}</span>
          <span class="bp-series">{{ SERIES_LABEL[post.series] }}</span>
          <span class="bp-date">{{ post.date }}</span>
          <span class="bp-time">{{ mins }} min read</span>
        </div>
        <h1 class="bp-title">{{ post.title }}</h1>
        <p v-if="post.subtitle" class="bp-subtitle">{{ post.subtitle }}</p>
        <div class="bp-audiences">
          <span
            v-for="a in post.audience"
            :key="a"
            class="bp-audience"
            :style="`color:${AUDIENCE_COLOR[a]};border-color:${AUDIENCE_COLOR[a]}`"
          >{{ AUDIENCE_LABEL[a] }}</span>
        </div>
      </header>

      <!-- editorial callout -->
      <div v-if="post.editorialNote" class="bp-callout">
        <span class="bp-callout-label">Editorial note</span>
        {{ post.editorialNote }}
      </div>

      <!-- content -->
      <article class="bp-content" v-html="html" />

      <!-- related posts -->
      <section v-if="related.length" class="bp-related">
        <h3 class="bp-related-heading">Related</h3>
        <div class="bp-related-grid">
          <router-link
            v-for="r in related"
            :key="r.slug"
            :to="`/blog/${r.slug}`"
            class="bp-related-card"
          >
            <span
              v-for="a in r.audience"
              :key="a"
              class="bp-aud-dot"
              :style="`background:${AUDIENCE_COLOR[a]}`"
            />
            <span class="bp-related-title">{{ r.title }}</span>
            <span class="bp-related-date">{{ r.date }}</span>
          </router-link>
        </div>
      </section>

      <div class="bp-footer">
        <router-link to="/blog" class="bp-back-link">← Back to all posts</router-link>
      </div>

      <!-- Member comments -->
      <BlogComments :post-slug="post.slug" />

    </div>

    <!-- 404 state -->
    <div v-else class="bp-not-found">
      <p>Post not found.</p>
      <router-link to="/blog">← Back to blog</router-link>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import {
  BLOG_POSTS, SERIES_LABEL, AUDIENCE_COLOR, AUDIENCE_LABEL,
  STATUS_COLOR, STATUS_LABEL, getBlogContent, readingTime,
  renderMarkdown, getRelatedPosts,
} from 'src/data/blog-posts'
import BlogComments from 'src/components/BlogComments.vue'

const route  = useRoute()
const slug   = computed(() => route.params.slug as string)
const post   = computed(() => BLOG_POSTS.find(p => p.slug === slug.value) ?? null)
const raw    = computed(() => post.value ? getBlogContent(post.value.slug) : '')
const html   = computed(() => raw.value ? renderMarkdown(raw.value) : '')
const mins   = computed(() => readingTime(raw.value))
const related = computed(() => post.value ? getRelatedPosts(post.value) : [])
</script>

<style scoped lang="scss">
.bp-page {
  min-height: 100vh;
  background: #050912;
  color: #c8d4e8;
  font-family: 'Roboto', sans-serif;
}
.bp-inner {
  max-width: 760px;
  margin: 0 auto;
  padding: 28px 24px 80px;
}

/* breadcrumb */
.bp-nav {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 28px;
  font-size: 12px;
}
.bp-navlink {
  color: #4488cc;
  text-decoration: none;
  &:hover { color: #66aaee; }
  &--current { color: #5a6a8a; cursor: default; }
}
.bp-sep { color: #2a3a5a; }

/* header */
.bp-header { margin-bottom: 24px; }
.bp-meta-top {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 16px;
}
.bp-status {
  font-size: 10px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  border: 1px solid;
  border-radius: 4px;
  padding: 2px 7px;
}
.bp-series {
  font-size: 11px;
  color: #3a4a6a;
  letter-spacing: 0.05em;
}
.bp-date, .bp-time {
  font-size: 11px;
  color: #3a4a6a;
}
.bp-date::before, .bp-time::before { content: '·'; margin-right: 10px; }
.bp-title {
  margin: 0 0 8px;
  font-size: clamp(22px, 4vw, 30px);
  font-weight: 700;
  color: #e8f0ff;
  letter-spacing: -0.02em;
  line-height: 1.25;
}
.bp-subtitle {
  margin: 0 0 14px;
  font-size: 16px;
  color: #6a7a9a;
  line-height: 1.5;
  font-style: italic;
}
.bp-audiences {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.bp-audience {
  font-size: 10px;
  letter-spacing: 0.06em;
  border: 1px solid;
  border-radius: 3px;
  padding: 2px 7px;
}

/* editorial callout */
.bp-callout {
  margin: 0 0 32px;
  padding: 12px 16px;
  background: rgba(255, 170, 51, 0.06);
  border-left: 3px solid #ffaa33;
  border-radius: 0 6px 6px 0;
  font-size: 13px;
  color: #a89060;
  line-height: 1.6;
}
.bp-callout-label {
  display: block;
  font-size: 10px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #ffaa33;
  margin-bottom: 6px;
}

/* ── Markdown content ── */
.bp-content {
  line-height: 1.75;
  font-size: 15px;
  color: #b0c0dc;
  margin-bottom: 56px;

  :deep(h1) {
    font-size: 22px;
    font-weight: 700;
    color: #d8e8ff;
    margin: 40px 0 16px;
    letter-spacing: -0.01em;
  }
  :deep(h2) {
    font-size: 18px;
    font-weight: 600;
    color: #c8d8f8;
    margin: 36px 0 14px;
    padding-bottom: 8px;
    border-bottom: 1px solid rgba(255,255,255,0.07);
    letter-spacing: -0.01em;
  }
  :deep(h3) {
    font-size: 15px;
    font-weight: 600;
    color: #a8b8d8;
    margin: 28px 0 10px;
    letter-spacing: 0.01em;
  }
  :deep(p) { margin: 0 0 18px; }
  :deep(strong) { color: #d0dff8; font-weight: 600; }
  :deep(em) { color: #8898b8; font-style: italic; }
  :deep(a) { color: #4488cc; text-decoration: underline; &:hover { color: #66aaee; } }
  :deep(hr) { border: none; border-top: 1px solid rgba(255,255,255,0.08); margin: 32px 0; }

  :deep(blockquote) {
    margin: 20px 0;
    padding: 12px 18px;
    border-left: 3px solid #2a4a7a;
    background: rgba(40,70,120,0.12);
    color: #7888aa;
    font-style: italic;
    p { margin: 0; }
  }

  :deep(code) {
    font-family: 'Courier New', monospace;
    font-size: 13px;
    background: rgba(255,255,255,0.07);
    border-radius: 4px;
    padding: 2px 6px;
    color: #88ddff;
  }
  :deep(pre) {
    background: #080e1c;
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 6px;
    padding: 16px 20px;
    overflow-x: auto;
    margin: 20px 0;
    code {
      background: none;
      padding: 0;
      font-size: 13px;
      color: #a0c8f0;
    }
  }

  :deep(table) {
    width: 100%;
    border-collapse: collapse;
    margin: 20px 0;
    font-size: 13px;
  }
  :deep(th) {
    text-align: left;
    padding: 8px 12px;
    background: #0d1628;
    color: #7888aa;
    font-weight: 600;
    font-size: 11px;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    border-bottom: 1px solid rgba(255,255,255,0.1);
  }
  :deep(td) {
    padding: 8px 12px;
    border-bottom: 1px solid rgba(255,255,255,0.05);
    color: #a0b0c8;
    vertical-align: top;
  }
  :deep(tr:hover td) { background: rgba(255,255,255,0.02); }

  :deep(ul), :deep(ol) {
    margin: 0 0 18px;
    padding-left: 22px;
    li { margin-bottom: 6px; }
  }
}

/* related posts */
.bp-related { margin-bottom: 48px; }
.bp-related-heading {
  font-size: 11px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #3a4a6a;
  margin: 0 0 14px;
}
.bp-related-grid {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.bp-related-card {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  background: #0a1020;
  border: 1px solid rgba(255,255,255,0.07);
  border-radius: 6px;
  text-decoration: none;
  color: inherit;
  transition: border-color 0.15s;
  &:hover { border-color: rgba(100,160,255,0.2); }
}
.bp-aud-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}
.bp-related-title {
  flex: 1;
  font-size: 13px;
  color: #9aaac8;
}
.bp-related-date {
  font-size: 11px;
  color: #3a4a6a;
}

.bp-footer {
  border-top: 1px solid rgba(255,255,255,0.06);
  padding-top: 20px;
}
.bp-back-link {
  font-size: 13px;
  color: #4488cc;
  text-decoration: none;
  &:hover { color: #66aaee; }
}

.bp-not-found {
  padding: 80px 24px;
  text-align: center;
  color: #5a6a8a;
  a { color: #4488cc; }
}
</style>
