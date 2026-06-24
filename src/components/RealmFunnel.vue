<template>
  <!--
    RealmFunnel.vue — four graphical action cards for funnelling users to:
    1. Explore (find a planet)
    2. Get a property (claim or buy)
    3. Collect & sell (gallery, aftermarket)
    4. Sponsor eco-ops (earn resellable reward tokens)

    Props:
      compact  — 2-column grid, smaller cards (for sidebar / widget use)
      hideIds  — array of card ids to suppress (e.g. ['sponsor'] on the eco-ops page)
  -->
  <div class="rf-root" :class="{ 'rf-root--compact': compact }">
    <div class="rf-grid">

      <!-- ── EXPLORE ─────────────────────────────────────────────────── -->
      <div v-if="!hideIds.includes('explore')"
           class="rf-card rf-card--explore"
           @click="go('/galaxy')">
        <div class="rf-card__glow"/>
        <div class="rf-card__top">
          <span class="rf-icon">🌌</span>
          <div class="rf-titles">
            <div class="rf-title">FIND A PLANET</div>
            <div class="rf-tag">5,000+ confirmed worlds</div>
          </div>
        </div>
        <div class="rf-desc">
          Navigate the cosmic web, zoom into galaxy clusters, and browse
          confirmed exoplanet systems. Filter by habitable zone, distance,
          and spectral type.
        </div>
        <div class="rf-links">
          <span class="rf-link" @click.stop="go('/')">Cosmic Web</span>
          <span class="rf-sep">·</span>
          <span class="rf-link" @click.stop="go('/galaxy')">Milky Way</span>
          <span class="rf-sep">·</span>
          <span class="rf-link" @click.stop="go('/')">Universe Entry</span>
        </div>
        <button class="rf-cta" @click.stop="go('/galaxy')">Browse planets →</button>
      </div>

      <!-- ── GET A PROPERTY ──────────────────────────────────────────── -->
      <div v-if="!hideIds.includes('claim')"
           class="rf-card rf-card--claim"
           @click="go('/mint')">
        <div class="rf-card__glow"/>
        <div class="rf-card__top">
          <span class="rf-icon">⬡</span>
          <div class="rf-titles">
            <div class="rf-title">GET A PROPERTY</div>
            <div class="rf-tag rf-tag--green">FREE TO MINT</div>
          </div>
        </div>
        <div class="rf-desc">
          Claim 40 virtual acres on any confirmed exoplanet. Choose your
          settlement pathway, select your plot, and mint your Exolocation
          deed on-chain. No purchase required — 0% aftermarket draw only.
        </div>
        <div class="rf-links">
          <span class="rf-link" @click.stop="go('/galaxy')">Find a planet</span>
          <span class="rf-sep">·</span>
          <span class="rf-link" @click.stop="go('/mint')">Mint deed</span>
          <span class="rf-sep">·</span>
          <span class="rf-link" @click.stop="go('/gallery')">Buy from gallery</span>
        </div>
        <button class="rf-cta rf-cta--green" @click.stop="go('/mint')">Claim 40 acres →</button>
      </div>

      <!-- ── COLLECT & SELL ──────────────────────────────────────────── -->
      <div v-if="!hideIds.includes('collect')"
           class="rf-card rf-card--collect"
           @click="go('/gallery')">
        <div class="rf-card__glow"/>
        <div class="rf-card__top">
          <span class="rf-icon">🎨</span>
          <div class="rf-titles">
            <div class="rf-title">COLLECT &amp; SELL</div>
            <div class="rf-tag">Orbital gallery · aftermarket</div>
          </div>
        </div>
        <div class="rf-desc">
          Browse collector-card NFTs from current and past editions.
          List your Exolocation deeds on the aftermarket — 80% of every
          secondary sale goes directly to the original creator.
        </div>
        <div class="rf-links">
          <span class="rf-link" @click.stop="go('/gallery')">View gallery</span>
          <span class="rf-sep">·</span>
          <span class="rf-link" @click.stop="go('/gallery')">List property</span>
          <span class="rf-sep">·</span>
          <span class="rf-link" @click.stop="go('/mint')">Mint new</span>
        </div>
        <button class="rf-cta" @click.stop="go('/gallery')">Open gallery →</button>
      </div>

      <!-- ── SPONSOR ECO-OPS ─────────────────────────────────────────── -->
      <div v-if="!hideIds.includes('sponsor')"
           class="rf-card rf-card--sponsor"
           @click="go('/eco-ops')">
        <div class="rf-card__glow"/>
        <div class="rf-card__top">
          <span class="rf-icon">💧</span>
          <div class="rf-titles">
            <div class="rf-title">SPONSOR ECO-OPS</div>
            <div class="rf-tag rf-tag--amber">Earn resellable tokens</div>
          </div>
        </div>
        <div class="rf-desc">
          Fund real-world field activities — water quality readings, farm
          maps, waste collection. Sponsors receive <strong>Activity Reward Tokens</strong>
          (ARTs) proportional to the verified impact of sponsored check-ins.
          ARTs are transferable and can be listed on the secondary market.
        </div>
        <div class="rf-links">
          <span class="rf-link" @click.stop="go('/eco-ops')">Browse activities</span>
          <span class="rf-sep">·</span>
          <span class="rf-link" @click.stop="go('/glossary?q=art')">ART tokens</span>
          <span class="rf-sep">·</span>
          <span class="rf-link" @click.stop="go('/gallery')">Resell rewards</span>
        </div>
        <!-- Sponsor reward breakdown -->
        <div class="rf-reward-strip">
          <div class="rf-reward">
            <span class="rf-reward__icon">💧</span>
            <span class="rf-reward__label">Water check-in</span>
            <span class="rf-reward__val">+12 ART</span>
          </div>
          <div class="rf-reward">
            <span class="rf-reward__icon">🌱</span>
            <span class="rf-reward__label">Farm map</span>
            <span class="rf-reward__val">+8 ART</span>
          </div>
          <div class="rf-reward">
            <span class="rf-reward__icon">◈</span>
            <span class="rf-reward__label">Eco-ops verified</span>
            <span class="rf-reward__val">+5 ART</span>
          </div>
        </div>
        <button class="rf-cta rf-cta--amber" @click.stop="go('/eco-ops')">Sponsor activities →</button>
      </div>

    </div><!-- /rf-grid -->
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'

withDefaults(defineProps<{
  compact?:  boolean
  hideIds?:  string[]
}>(), {
  compact:  false,
  hideIds:  () => [],
})

const router = useRouter()
function go(path: string) { void router.push(path) }
</script>

<style scoped>
/* ── Root ─────────────────────────────────────────────────────────────────── */

.rf-root {
  width: 100%;
  font-family: 'Courier New', monospace;
}

/* ── Grid ─────────────────────────────────────────────────────────────────── */

.rf-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
}

.rf-root--compact .rf-grid {
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}

@media (max-width: 900px) {
  .rf-grid { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 560px) {
  .rf-grid { grid-template-columns: 1fr; }
}

/* ── Card base ─────────────────────────────────────────────────────────────── */

.rf-card {
  position: relative;
  overflow: hidden;
  border-radius: 10px;
  border: 1px solid rgba(255,255,255,0.06);
  padding: 18px 16px 14px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: 10px;
  transition: border-color 0.16s, transform 0.14s, box-shadow 0.16s;
  background: rgba(0, 8, 20, 0.82);
}
.rf-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 30px rgba(0,0,0,0.60);
}

/* Subtle background glow per card type */
.rf-card__glow {
  position: absolute;
  inset: 0;
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.20s;
  border-radius: 10px;
}
.rf-card:hover .rf-card__glow { opacity: 1; }

.rf-card--explore { background: linear-gradient(135deg,rgba(0,10,30,0.92),rgba(0,6,20,0.88)); }
.rf-card--explore:hover { border-color: rgba(80,160,240,0.40); }
.rf-card--explore .rf-card__glow { background: radial-gradient(ellipse at 30% 20%, rgba(60,130,240,0.08), transparent 70%); }

.rf-card--claim { background: linear-gradient(135deg,rgba(0,20,14,0.92),rgba(0,10,8,0.88)); }
.rf-card--claim:hover { border-color: rgba(60,220,130,0.42); box-shadow: 0 8px 30px rgba(0,0,0,0.60), 0 0 20px rgba(60,200,120,0.10); }
.rf-card--claim .rf-card__glow { background: radial-gradient(ellipse at 40% 20%, rgba(60,200,120,0.10), transparent 70%); }

.rf-card--collect { background: linear-gradient(135deg,rgba(14,6,28,0.92),rgba(8,4,18,0.88)); }
.rf-card--collect:hover { border-color: rgba(160,100,255,0.40); }
.rf-card--collect .rf-card__glow { background: radial-gradient(ellipse at 30% 20%, rgba(150,90,240,0.08), transparent 70%); }

.rf-card--sponsor { background: linear-gradient(135deg,rgba(20,12,0,0.92),rgba(14,8,0,0.88)); }
.rf-card--sponsor:hover { border-color: rgba(220,160,40,0.42); box-shadow: 0 8px 30px rgba(0,0,0,0.60), 0 0 20px rgba(200,140,30,0.10); }
.rf-card--sponsor .rf-card__glow { background: radial-gradient(ellipse at 40% 20%, rgba(220,160,40,0.09), transparent 70%); }

/* ── Card content ──────────────────────────────────────────────────────────── */

.rf-card__top {
  display: flex;
  align-items: flex-start;
  gap: 10px;
}

.rf-icon { font-size: 24px; line-height: 1; flex-shrink: 0; }

.rf-titles { flex: 1; }

.rf-title {
  font-size: 10px;
  letter-spacing: 0.18em;
  font-weight: 600;
  color: rgba(210, 235, 255, 0.88);
  margin-bottom: 3px;
}

.rf-tag {
  display: inline-block;
  font-size: 7.5px;
  letter-spacing: 0.12em;
  color: rgba(80, 150, 200, 0.65);
  border: 1px solid rgba(80,140,200,0.20);
  border-radius: 3px;
  padding: 1px 6px;
}
.rf-tag--green { color: rgba(80,230,140,0.82); border-color: rgba(60,200,110,0.32); }
.rf-tag--amber { color: rgba(220,170,50,0.82); border-color: rgba(200,150,30,0.32); }

.rf-desc {
  font-size: 9px;
  color: rgba(130, 175, 215, 0.65);
  line-height: 1.60;
  flex: 1;
}
.rf-desc strong { color: rgba(200,230,255,0.80); }

/* ── Sub-links ─────────────────────────────────────────────────────────────── */

.rf-links {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px;
  font-size: 8.5px;
}

.rf-link {
  color: rgba(100, 165, 210, 0.68);
  cursor: pointer;
  padding: 1px 0;
  transition: color 0.12s;
}
.rf-link:hover { color: #00e5ff; }

.rf-sep { color: rgba(60, 100, 140, 0.38); font-size: 8px; }

/* ── Sponsor reward strip ──────────────────────────────────────────────────── */

.rf-reward-strip {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 8px 10px;
  background: rgba(0, 15, 8, 0.55);
  border: 1px solid rgba(200, 150, 30, 0.16);
  border-radius: 5px;
}

.rf-reward {
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 8px;
}
.rf-reward__icon  { font-size: 10px; flex-shrink: 0; }
.rf-reward__label { flex: 1; color: rgba(160, 200, 180, 0.65); }
.rf-reward__val   { font-size: 8px; color: rgba(220, 170, 50, 0.80); font-weight: 600; }

/* ── CTA buttons ───────────────────────────────────────────────────────────── */

.rf-cta {
  align-self: flex-start;
  padding: 6px 14px;
  font-family: 'Courier New', monospace;
  font-size: 9.5px;
  letter-spacing: 0.08em;
  border-radius: 5px;
  border: 1px solid rgba(80, 160, 220, 0.35);
  color: rgba(80, 190, 240, 0.90);
  background: rgba(0, 50, 100, 0.30);
  cursor: pointer;
  transition: background 0.14s, border-color 0.14s;
}
.rf-cta:hover { background: rgba(0, 80, 140, 0.50); border-color: rgba(0, 220, 255, 0.55); }

.rf-cta--green {
  border-color: rgba(60, 200, 110, 0.45);
  color: rgba(80, 230, 140, 0.90);
  background: rgba(0, 70, 35, 0.35);
}
.rf-cta--green:hover { background: rgba(0, 100, 50, 0.50); border-color: rgba(80, 240, 150, 0.60); }

.rf-cta--amber {
  border-color: rgba(200, 150, 30, 0.45);
  color: rgba(230, 185, 60, 0.90);
  background: rgba(60, 35, 0, 0.35);
}
.rf-cta--amber:hover { background: rgba(90, 55, 0, 0.50); border-color: rgba(240, 190, 60, 0.60); }
</style>
