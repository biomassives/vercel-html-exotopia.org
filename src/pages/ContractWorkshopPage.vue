<template>
  <q-page class="cw-page">

    <!-- ── Top bar ──────────────────────────────────────────────────────────── -->
    <div class="cw-topbar">
      <router-link to="/" class="cw-home-link">
        <span class="cw-home-exo">EXO</span><span class="cw-home-topia">TOPIA</span>
        <span class="cw-home-arrow">↗</span>
      </router-link>
      <span class="cw-breadcrumb">
        <router-link to="/docs" class="cw-bread-link">DOCS</router-link>
        <span class="cw-bread-sep">/</span>
        CONTRACTS &amp; CHEMISTRY — EDUCATIONAL WORKSHOP
      </span>
    </div>

    <!-- ── Body layout ─────────────────────────────────────────────────────── -->
    <div class="cw-layout">

      <!-- ── Left sidebar ────────────────────────────────────────────────── -->
      <nav class="cw-nav">

        <!-- Module selector -->
        <div class="cw-lesson-selector">
          <div class="cw-selector-label">SELECT MODULE</div>
          <button
            class="cw-lesson-btn"
            :class="{ 'cw-lesson-btn--active': activeModule === 1 }"
            @click="setModule(1)"
          >
            <span class="cw-lesson-grade">PART 1 · MEDIA &amp; RIGHTS LITERACY</span>
            <span class="cw-lesson-title">Writing a Plain-Language<br>Creative Reference</span>
          </button>
          <button
            class="cw-lesson-btn"
            :class="{ 'cw-lesson-btn--active': activeModule === 2 }"
            @click="setModule(2)"
          >
            <span class="cw-lesson-grade">PART 2 · GRADES 9–12 · CHEMISTRY</span>
            <span class="cw-lesson-title">How Many Molecules<br>Are in a Lighter?</span>
          </button>
        </div>

        <!-- Section nav -->
        <div class="cw-nav-sections">
          <div class="cw-nav-head">SECTIONS</div>
          <a
            v-for="s in activeSections"
            :key="s.id"
            class="cw-nav-item"
            :class="{ 'cw-nav-item--active': activeSection === s.id }"
            @click.prevent="scrollTo(s.id)"
          >{{ s.label }}</a>
        </div>

        <div class="cw-nav-foot">
          <router-link to="/docs" class="cw-foot-link">← Back to Docs</router-link>
        </div>
      </nav>

      <!-- ── Main content ─────────────────────────────────────────────────── -->
      <main class="cw-content" ref="contentEl">

        <!-- ── Persistent status disclaimer — applies to the whole page ────── -->
        <div class="cw-disclaimer">
          <strong>[TEACHING DEMO — NOT A REAL AGREEMENT, NOT A REAL ITEM]</strong>
          Everything below is a low-risk, purely illustrative worked example for two separate
          lessons: media/rights literacy and high-school chemistry. <strong>No real contract is
          formed here.</strong> The sample document in Part 1 is a hand-writable, plain-language
          teaching example — not a legal template, and not something to copy-paste and use as an
          actual agreement. <strong>No real item changes hands.</strong> The "lighter" is a
          symbolic prop for the demo narrative, not a settlement-object unlock, not a marketplace
          listing, and not tied to any payment or to the real points/certificate reward system
          described in <code class="cw-code">SPEC.md</code> §21. This page is independent of that
          system and does not touch <code class="cw-code">src/lib/settlement-items.ts</code>.
        </div>

        <!-- ════════════════════════════════════════════════════════════════ -->
        <!-- PART 1 — Creative reference agreements                          -->
        <!-- ════════════════════════════════════════════════════════════════ -->
        <template v-if="activeModule === 1">

          <div class="cw-lesson-header">
            <div class="cw-lesson-badge">MEDIA &amp; RIGHTS LITERACY</div>
            <h1 class="cw-h1">Writing a Plain-Language Creative Reference</h1>
            <p class="cw-intro">A worked example of how two people could honestly write down "I'm pointing someone toward your existing work" — without a lawyer, without transferring any rights, and without pretending it's more than it is.</p>
            <div class="cw-meta">
              <span>⏱ 25–35 min</span>
              <span>📄 Reading + short writing activity</span>
              <span>⚖️ No legal expertise required — that's the point</span>
            </div>
          </div>

          <!-- P1.1 -->
          <section :id="'m1-scenario'" class="cw-section">
            <h2 class="cw-h2">1. The scenario</h2>
            <p class="cw-p">An artist has been building an archive for years — recordings, spoken-word sessions, educational material — and keeps a record of it in their Exotopia <strong>File Cabinet</strong>, under the Creative Assets drawer. A friend wants to help other people find that archive: mentioning it at events, pointing curious listeners toward it, describing what's in it in conversation.</p>
            <p class="cw-p">The artist wants to mark that arrangement with something small and symbolic — in this example, a butane lighter, handed over the way people sometimes hand over a token to mark a promise or a understanding. It isn't payment. It isn't a licence. It's a gesture that the two of them agreed on something, and it helps to write that something down so neither person has to rely on memory later.</p>
            <div class="cw-callout cw-callout--info">
              <strong>What makes this different from a record deal or a licensing contract:</strong> nothing here reproduces, distributes, or grants rights to perform the actual music, spoken-word, or educational content. The agreement only references that the archive <em>exists</em> and describes how one person may talk about it to others.
            </div>
          </section>

          <!-- P1.2 -->
          <section :id="'m1-document'" class="cw-section">
            <h2 class="cw-h2">2. The example agreement</h2>
            <p class="cw-p">Here is what a plain-language version of that understanding could look like, written by the two people themselves — no legal boilerplate, no clauses neither of them actually understands:</p>

            <div class="cw-doc">
              <div class="cw-doc-flag">EXAMPLE ONLY — NOT A REAL CONTRACT</div>
              <div class="cw-doc-title">CREATIVE REFERENCE AGREEMENT</div>
              <div class="cw-doc-sub">a plain-language note between two people, not a legal instrument</div>
              <div class="cw-doc-meta">Between: <em>[Artist name]</em> ("Artist") and <em>[Friend's name]</em> ("Friend") · Date: <em>[date]</em></div>

              <ol class="cw-doc-clauses">
                <li><strong>What this points to.</strong> This note refers to an existing body of work Artist already keeps on record — the entry titled <em>"[archive entry title]"</em> in Artist's Exotopia File Cabinet, Creative Assets drawer. This note does not include, copy, or attach any of that work.</li>
                <li><strong>What's being given.</strong> Friend receives one butane lighter as a symbolic token marking this understanding. No recording, spoken-word file, or educational content changes hands along with it, and the lighter carries no monetary value in this arrangement.</li>
                <li><strong>What Friend can do.</strong> Friend may tell other people that the archive entry above exists and describe it in general terms (for example, "ask Artist about their K2-90b spoken-word sessions"). Friend may not copy, distribute, perform, publish, or sell the referenced content itself.</li>
                <li><strong>What isn't transferred.</strong> No copyright. No licence to reproduce, perform, or distribute the work. No ownership claim over the token as a tradeable asset. No claim on any future work Artist makes.</li>
                <li><strong>How it ends.</strong> Either person can end this arrangement at any time, for any reason, just by telling the other. Ending it does not require returning the lighter — it was a gesture, not a deposit.</li>
              </ol>

              <div class="cw-doc-sign">
                <div class="cw-doc-sign-line">_____________________<br><span>Artist</span></div>
                <div class="cw-doc-sign-line">_____________________<br><span>Friend</span></div>
              </div>
            </div>

            <p class="cw-p">Notice what this document deliberately does <em>not</em> do: it never says "licence," "royalty," "exclusive," or "assign." Those words carry real legal weight, and using them without meaning them precisely is worse than not using them at all. A plain-language note that says exactly what happens, in words both people actually understand, protects everyone better than borrowed legal language neither of them can interpret.</p>
          </section>

          <!-- P1.3 -->
          <section :id="'m1-checklist'" class="cw-section">
            <h2 class="cw-h2">3. What a plain-language creative-reference agreement should cover</h2>
            <p class="cw-p">Whatever the wording, four things are worth nailing down before two people call an understanding like this "settled":</p>
            <table class="cw-table">
              <thead><tr><th>Covers</th><th>Why it matters</th></tr></thead>
              <tbody>
                <tr>
                  <td><strong>What's being referenced</strong></td>
                  <td>Point at one specific, identifiable existing work or archive entry — not a vague "your stuff." If it can't be named or located, it can't really be agreed to.</td>
                </tr>
                <tr>
                  <td><strong>Who can point to it, and how</strong></td>
                  <td>Spell out what the other person is actually allowed to say or do — mention it in conversation? Post about it publicly? Describe it in detail or just gesture at its existence? Silence on this is where misunderstandings start.</td>
                </tr>
                <tr>
                  <td><strong>What isn't being transferred</strong></td>
                  <td>Say explicitly that copyright, reproduction rights, performance rights, and ownership of the underlying work stay with the creator. This is the line that keeps a friendly gesture from being mistaken for a licence.</td>
                </tr>
                <tr>
                  <td><strong>How either party could end the arrangement</strong></td>
                  <td>A real, usable agreement — even an informal one — says how it stops, not just how it starts. No penalty clause is needed for something this low-stakes, but "it just ends when either of us says so" should still be written down, not assumed.</td>
                </tr>
              </tbody>
            </table>
            <div class="cw-callout cw-callout--activity">
              <strong>Why this matters beyond this one example:</strong> the same four questions apply to almost any informal creative arrangement — a friend promoting your work, a collaborator sharing credit, someone hosting your content on their page. Media and rights literacy is mostly about noticing when an unwritten understanding needs to become a written one, and then writing it in words you'd actually be willing to be held to.
            </div>
          </section>

          <!-- P1.4 -->
          <section :id="'m1-filecabinet'" class="cw-section">
            <h2 class="cw-h2">4. Where this fits: the File Cabinet's Creative Assets drawer</h2>
            <p class="cw-p">On this platform, an artist's existing work already has a home: the <strong>File Cabinet</strong>'s Creative Assets drawer (<code class="cw-code">creativeAssetsDrawer</code> in <code class="cw-code">src/stores/file-cabinet.ts</code>). It's a merged view of two kinds of records the artist already has — settlement items they've placed, and creative-page community nodes — each carrying a label, a kind, a creation date, and (where relevant) links back to where the actual media lives.</p>
            <div class="cw-code-block">export interface CreativeAsset {
  id:             string
  source:         'settlement_item' | 'community_node'
  label:          string
  kind:           string
  createdAt:      string
  settlementKey?: string
  ponInkUrl?:     string
  mediaLinks?:    string[]
  status?:        string
}</div>
            <p class="cw-p">A creative-reference agreement like the one above should point at <em>one of these existing entries</em> — an archive entry that already exists, with a label the other person could actually go look up — rather than inventing new content wholesale. The agreement doesn't reproduce the entry's <code class="cw-code">mediaLinks</code> or attach the work itself; it just names which entry it's talking about, the same way clause 1 in the example document does.</p>
          </section>

          <!-- P1.5 -->
          <section :id="'m1-notreal'" class="cw-section">
            <h2 class="cw-h2">5. What this is not</h2>
            <ul class="cw-ul">
              <li><strong>Not a real contract.</strong> Nothing on this page creates a binding agreement or transfers real rights. It's a teaching example of what a plain-language creative-attribution understanding could look like.</li>
              <li><strong>Not a real item.</strong> The lighter is a symbolic prop for this demo's narrative — it is not a settlement-object unlock, not a marketplace listing, and not tied to any payment.</li>
              <li><strong>Not connected to the real reward system.</strong> Exotopia's actual points-and-certificate reward system is described in <code class="cw-code">SPEC.md</code> §21 and implemented through <code class="cw-code">src/lib/settlement-items.ts</code>'s real unlock plumbing. This page is deliberately independent of that system and should not be read as implying otherwise.</li>
            </ul>
          </section>

          <!-- P1.6 — Activity -->
          <section :id="'m1-activity'" class="cw-section">
            <h2 class="cw-h2">6. Activity — spot the gaps</h2>
            <div class="cw-callout cw-callout--activity">
              <strong>✏️ Classroom exercise</strong> — Read the note below, written by two people who skipped this lesson. Using the four-part checklist from section 3, list what's missing. Answers follow.
            </div>
            <div class="cw-code-block">"Hey, thanks for the lighter! Yeah, tell people about my music whenever
you want, it's all good. — [Artist]"</div>
            <p class="cw-p"><strong>Discussion questions</strong> — What could go wrong if this were the entire understanding between them? If Friend later posted full recordings publicly, could Artist point to anything in this note that said that wasn't allowed? If Artist later wanted to end the arrangement, is there anything here describing how?</p>
            <div class="cw-code-block">ANSWERS

What's referenced: Too vague. "My music" doesn't name a specific
  archive entry — there's no way to know which recordings, or how many,
  are actually covered.

Who can point to it, and how: Unclear. "Tell people about my music
  whenever you want" doesn't distinguish between mentioning its existence
  and actually sharing or distributing the recordings themselves.

What isn't transferred: Missing entirely. Nothing here says copyright,
  reproduction, or distribution rights stay with Artist — which is
  exactly the gap that would let Friend argue posting full recordings
  was "good" under this note.

How it ends: Not addressed at all. Neither person has any agreed way
  to end the arrangement if it stops working for them.

→ This is why all four checklist items matter even for something this
  informal: each one closes a specific way an honest, well-meaning
  arrangement can still go wrong.</div>
          </section>

        </template>

        <!-- ════════════════════════════════════════════════════════════════ -->
        <!-- PART 2 — Butane molecule count: chemistry + number theory       -->
        <!-- ════════════════════════════════════════════════════════════════ -->
        <template v-if="activeModule === 2">

          <div class="cw-lesson-header">
            <div class="cw-lesson-badge cw-lesson-badge--adv">GRADES 9–12</div>
            <h1 class="cw-h1">How Many Molecules Are in a Lighter?</h1>
            <p class="cw-intro">A disposable butane lighter is a small, ordinary gas canister — a common household item, chemically no different from any other sealed container of fuel gas. It turns out to be a genuinely good vehicle for teaching two separate ideas: how chemists convert a mass of gas into a count of molecules, and why scientific notation exists in the first place.</p>
            <div class="cw-meta">
              <span>⏱ 30–40 min</span>
              <span>🧪 Moles, molar mass, Avogadro's number</span>
              <span>🔢 Scientific notation, short-scale naming</span>
            </div>
          </div>

          <!-- P2.1 -->
          <section :id="'m2-question'" class="cw-section">
            <h2 class="cw-h2">1. The question</h2>
            <p class="cw-p">A disposable butane lighter holds a small amount of liquefied butane gas (C₄H₁₀) under pressure, in the same way a larger propane tank holds propane. Ask a class "how many molecules of butane are in there?" and you'll usually get either a shrug or a guess pulled out of thin air. Neither is satisfying — but the real answer isn't a single fixed number either.</p>
            <div class="cw-callout cw-callout--warning">
              <strong>Why we don't just state a number:</strong> a real lighter's butane fill varies by brand, size, and how full it currently is — commonly cited full fills run roughly 1–3 grams, and a partly-used lighter holds less. Presenting one fixed "the answer is X" figure as fact would be exactly the kind of overclaim this lesson is trying to avoid. Instead, this page builds a live calculator below, so you can compute the molecule count for whatever mass of butane you want to reason about.
            </div>
          </section>

          <!-- P2.2 -->
          <section :id="'m2-chemistry'" class="cw-section">
            <h2 class="cw-h2">2. The chemistry — moles, molar mass, and Avogadro's number</h2>
            <p class="cw-p">Butane is C₄H₁₀ — four carbon atoms and ten hydrogen atoms per molecule. Its <strong>molar mass</strong> is the mass of one mole (6.022×10²³ molecules) of it, found by adding up the atomic masses of every atom in the formula:</p>
            <div class="cw-code-block">Molar mass of C₄H₁₀:
  4 × (carbon, 12.011 g/mol)   = 48.044 g/mol
  10 × (hydrogen, 1.008 g/mol) = 10.080 g/mol
  ─────────────────────────────────────────
  Total                        = 58.124 g/mol  ≈ 58.12 g/mol</div>
            <p class="cw-p"><strong>Avogadro's number</strong> (6.022×10²³ per mole) is the fixed number of particles in one mole of anything — atoms, molecules, or otherwise. It's an experimentally measured constant, not derived from first principles, and it's what lets chemists convert between "how much something weighs" and "how many individual particles that is."</p>
            <p class="cw-p">The full conversion, mass → moles → molecule count:</p>
            <div class="cw-code-block">moles           = mass (g) ÷ molar mass (g/mol)
molecule count  = moles × Avogadro's number
              = (mass ÷ 58.12) × 6.022 × 10²³</div>
            <div class="cw-callout cw-callout--info">
              <strong>Why mass → moles → molecules, and not straight mass → molecules?</strong> This is the "distributed gas composition" idea: a fixed <em>mass</em> of a gas corresponds to a fixed <em>number of molecules</em>, regardless of what container it's in, what shape that container is, or what pressure it's under. Moles are the bridge — a fixed mass always converts to the same mole count, and a mole always contains the same molecule count, no matter the container. That's what makes the formula above work for a tiny lighter and a large propane tank alike, just with a different mass plugged in.
            </div>
          </section>

          <!-- P2.3 -->
          <section :id="'m2-numbertheory'" class="cw-section">
            <h2 class="cw-h2">3. The number theory — scientific notation and the naming ladder</h2>
            <p class="cw-p">Even a very small mass of butane converts to an enormous molecule count — trillions of trillions of molecules. Writing that out in full would mean counting off twenty-some digits by hand, which is exactly the problem <strong>scientific notation</strong> solves: any number can be written as a decimal between 1 and 10, multiplied by a power of ten.</p>
            <div class="cw-code-block">7,460,000,000,000,000,000,000   (22 digits — easy to mistype, hard to compare)

           written in scientific notation as:

7.46 × 10²¹   (a mantissa, 7.46, times ten raised to the 21st power)</div>
            <p class="cw-p">The exponent alone tells you the <em>scale</em> of a number at a glance, which is why scientists compare quantities by exponent long before comparing exact digits. English has names for some of these scales — the short-scale ladder, where each named quantity is 1,000× the one before it:</p>
            <table class="cw-table">
              <thead><tr><th>Name</th><th>Power of ten</th><th>Written out</th></tr></thead>
              <tbody>
                <tr><td>Thousand</td><td>10³</td><td>1,000</td></tr>
                <tr><td>Million</td><td>10⁶</td><td>1,000,000</td></tr>
                <tr><td>Billion</td><td>10⁹</td><td>1,000,000,000</td></tr>
                <tr><td>Trillion</td><td>10¹²</td><td>1,000,000,000,000</td></tr>
                <tr><td>Quadrillion</td><td>10¹⁵</td><td>1,000,000,000,000,000</td></tr>
                <tr><td>Quintillion</td><td>10¹⁸</td><td>1,000,000,000,000,000,000</td></tr>
                <tr><td>Sextillion</td><td>10²¹</td><td>1,000,000,000,000,000,000,000</td></tr>
              </tbody>
            </table>
            <p class="cw-p">So a molecule count around 7.5×10²¹ is "about 7.5 sextillion" — a real word for a real quantity, not hyperbole. Chemists almost never use these English names past "billion," though; scientific notation is more precise, more compact, and doesn't run out of names once you get past "septillion," "octillion," and so on.</p>
          </section>

          <!-- P2.4 — Interactive calculator -->
          <section :id="'m2-calculator'" class="cw-section">
            <h2 class="cw-h2">4. Try it — the live calculator</h2>
            <p class="cw-p">Slide to any butane mass a real lighter might plausibly hold (0.1 g for a nearly-empty one, up to about 3 g for a full-size, freshly filled one) and watch the molecule count recompute live. Nothing here is a fixed claim about "a lighter" — it's a tool for computing the answer for whatever mass you choose.</p>

            <div class="cw-calc">
              <div class="cw-calc-row">
                <label class="cw-calc-label" for="butaneMass">Mass of butane (grams)</label>
                <input
                  id="butaneMass"
                  type="range"
                  class="cw-calc-slider"
                  min="0.1" max="3" step="0.01"
                  v-model.number="butaneGrams"
                >
                <span class="cw-calc-value">{{ butaneGrams.toFixed(2) }} g</span>
              </div>

              <div class="cw-calc-output">
                <div class="cw-calc-stat">
                  <span class="cw-calc-stat-label">Moles of C₄H₁₀</span>
                  <span class="cw-calc-stat-value">{{ moles.toFixed(5) }} mol</span>
                </div>
                <div class="cw-calc-stat">
                  <span class="cw-calc-stat-label">Molecules</span>
                  <span class="cw-calc-stat-value">{{ molecMantissa }} × 10<sup>{{ molecExponent }}</sup></span>
                </div>
                <div class="cw-calc-stat">
                  <span class="cw-calc-stat-label">In words</span>
                  <span class="cw-calc-stat-value">≈ {{ molecMantissa }} {{ molecName }}</span>
                </div>
              </div>

              <div class="cw-calc-formula">
                moles = {{ butaneGrams.toFixed(2) }} g ÷ 58.12 g/mol = {{ moles.toFixed(5) }} mol
                <br>
                molecules = {{ moles.toFixed(5) }} mol × 6.022×10²³ /mol ≈ {{ molecMantissa }} × 10<sup>{{ molecExponent }}</sup>
              </div>
            </div>
          </section>

          <!-- P2.5 -->
          <section :id="'m2-workedexample'" class="cw-section">
            <h2 class="cw-h2">5. Worked example — 0.72 g of butane, step by step</h2>
            <p class="cw-p">Set the slider above to 0.72 g — a plausible partial fill — and here is the arithmetic behind what it shows, done by hand:</p>
            <div class="cw-code-block">Step 1 — mass to moles:
  moles = 0.72 g ÷ 58.12 g/mol
        = 0.012388 mol

Step 2 — moles to molecule count:
  molecules = 0.012388 mol × 6.022 × 10²³ /mol
            = 0.012388 × 6.022 × 10²³
            = 0.074603 × 10²³
            = 7.4603 × 10²¹

  → About 7.46 × 10²¹ molecules — roughly 7.5 sextillion.
    This is one illustrative point on the 0.1–3 g range, not a claimed
    "correct" figure for every lighter.</div>
            <div class="cw-callout cw-callout--info">
              <strong>Sanity check on the exponent:</strong> one mole of anything is 6.022×10²³ particles. 0.72 g is a little more than one-hundredth of a mole of butane (0.0124 mol), so the molecule count should be a little more than one-hundredth of 6.022×10²³ — which is indeed about 7.5×10²¹. Checking that the exponent moved in the right direction is a fast way to catch an arithmetic slip before trusting the final number.
            </div>
          </section>

          <!-- P2.6 — Activity -->
          <section :id="'m2-activity'" class="cw-section">
            <h2 class="cw-h2">6. Activity &amp; answers</h2>
            <div class="cw-callout cw-callout--activity">
              <strong>🧮 Classroom exercise</strong> — Use the formula from section 2 (or the calculator above) to work through these. Answers follow.
            </div>
            <p class="cw-p"><strong>Part A</strong> — A nearly-full lighter holds 3.00 g of butane. How many molecules is that? Express your answer in scientific notation and name it using the short-scale ladder.</p>
            <p class="cw-p"><strong>Part B</strong> — A nearly-empty lighter holds only 0.10 g of butane. How many molecules is that? How does the exponent compare to Part A's, and does that match your intuition about a 30× smaller mass?</p>
            <p class="cw-p"><strong>Part C</strong> — Explain, in your own words, why the molecule count scales in direct proportion to mass — i.e. why doubling the mass of butane exactly doubles the molecule count, regardless of the lighter's size or shape.</p>
            <div class="cw-code-block">ANSWERS

Part A: moles = 3.00 / 58.12 = 0.051618 mol
        molecules = 0.051618 × 6.022×10²³ = 3.109×10²² ≈ 3.11 × 10²²
        → about 31.1 sextillion molecules.

Part B: moles = 0.10 / 58.12 = 0.0017204 mol
        molecules = 0.0017204 × 6.022×10²³ = 1.036×10²¹ ≈ 1.04 × 10²¹
        → about 1.0 sextillion molecules.
        The mass dropped by a factor of 30 (3.00 → 0.10 g), and the
        molecule count dropped by the same factor (3.11×10²² → 1.04×10²¹
        is almost exactly 30× smaller) — confirming the direct
        proportionality from Part C.

Part C: Moles are mass divided by a fixed molar mass, and molecule count
        is moles times a fixed constant (Avogadro's number). Since molar
        mass and Avogadro's number never change for a given substance,
        molecule count is mass multiplied by a fixed number throughout —
        a straight-line, proportional relationship. Container shape and
        size don't enter the formula at all, which is the "distributed
        gas composition" idea from section 2: what matters is how much
        butane is there, not what it's sitting in.</div>
          </section>

        </template>

      </main>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'

// ── Module state ────────────────────────────────────────────────────────────

const route = useRoute()
const activeModule  = ref(route.query.module ? Number(route.query.module) : 1)
const activeSection = ref('')
const contentEl     = ref<HTMLElement | null>(null)

function setModule(n: number) {
  activeModule.value = n
  activeSection.value = ''
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

// ── Section nav definitions ───────────────────────────────────────────────────

const SECTIONS_M1 = [
  { id: 'm1-scenario',   label: '1. The scenario'                 },
  { id: 'm1-document',   label: '2. The example agreement'        },
  { id: 'm1-checklist',  label: '3. What it should cover'         },
  { id: 'm1-filecabinet',label: '4. The File Cabinet connection'  },
  { id: 'm1-notreal',    label: '5. What this is not'             },
  { id: 'm1-activity',   label: '6. Activity — spot the gaps'     },
]

const SECTIONS_M2 = [
  { id: 'm2-question',      label: '1. The question'                 },
  { id: 'm2-chemistry',     label: '2. Moles & Avogadro\'s number'   },
  { id: 'm2-numbertheory',  label: '3. Scientific notation'          },
  { id: 'm2-calculator',    label: '4. Live calculator'              },
  { id: 'm2-workedexample', label: '5. Worked example — 0.72 g'      },
  { id: 'm2-activity',      label: '6. Activity & answers'           },
]

const activeSections = computed(() => activeModule.value === 1 ? SECTIONS_M1 : SECTIONS_M2)

// ── Scroll tracking ───────────────────────────────────────────────────────────

function onWindowScroll() {
  const ids = activeSections.value.map(s => s.id)
  for (const id of [...ids].reverse()) {
    const el = document.getElementById(id)
    if (el && el.getBoundingClientRect().top < 120) {
      activeSection.value = id
      break
    }
  }
}

function scrollTo(id: string) {
  const el = document.getElementById(id)
  if (!el) return
  const y = el.getBoundingClientRect().top + window.pageYOffset - 70
  window.scrollTo({ top: y, behavior: 'smooth' })
}

onMounted(() => window.addEventListener('scroll', onWindowScroll))
onUnmounted(() => window.removeEventListener('scroll', onWindowScroll))

// ── Butane molecule calculator ────────────────────────────────────────────────
// molar mass C4H10 = 4*12.011 + 10*1.008 = 58.124 g/mol (task spec rounds to 58.12)
const BUTANE_MOLAR_MASS = 58.12
const AVOGADRO = 6.022e23

const butaneGrams = ref(0.72)

const moles = computed(() => butaneGrams.value / BUTANE_MOLAR_MASS)
const molecules = computed(() => moles.value * AVOGADRO)

// Short-scale naming ladder, largest first, for a human-readable label
const SCALE_LADDER: Array<{ exp: number; name: string }> = [
  { exp: 24, name: 'septillion' },
  { exp: 21, name: 'sextillion' },
  { exp: 18, name: 'quintillion' },
  { exp: 15, name: 'quadrillion' },
  { exp: 12, name: 'trillion' },
  { exp: 9,  name: 'billion' },
  { exp: 6,  name: 'million' },
  { exp: 3,  name: 'thousand' },
]

const molecExponent = computed(() => Math.floor(Math.log10(molecules.value)))

const molecMantissa = computed(() => {
  const exp = molecExponent.value
  const mantissa = molecules.value / Math.pow(10, exp)
  return mantissa.toFixed(2)
})

const molecName = computed(() => {
  const exp = molecExponent.value
  const rung = SCALE_LADDER.find(r => exp >= r.exp)
  return rung ? rung.name : `× 10^${exp}`
})
</script>

<style scoped>
/* ── Page ─────────────────────────────────────────────────────────────────── */
.cw-page {
  background: #020408;
  min-height: 100vh;
  font-family: 'Courier New', monospace;
  display: flex;
  flex-direction: column;
}

/* ── Top bar ──────────────────────────────────────────────────────────────── */
.cw-topbar {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 0 20px;
  height: 48px;
  flex-shrink: 0;
  background: rgba(0, 4, 14, 0.95);
  border-bottom: 1px solid rgba(0, 80, 130, 0.22);
  position: fixed;
  top: 0; left: 0; right: 0;
  z-index: 100;
}

.cw-home-link {
  display: flex; align-items: baseline; gap: 2px; text-decoration: none;
  font-size: 12px; font-weight: 300; letter-spacing: 0.16em; flex-shrink: 0;
  transition: opacity 0.12s;
}
.cw-home-link:hover { opacity: 0.75; }
.cw-home-exo   { color: #4dd0e1; }
.cw-home-topia { color: #90a4ae; }
.cw-home-arrow { color: rgba(80,160,200,0.50); font-size: 10px; margin-left: 3px; }

.cw-breadcrumb {
  font-size: 9px; letter-spacing: 0.14em; color: rgba(80,140,180,0.50);
  display: flex; align-items: center; gap: 8px;
}
.cw-bread-link { color: rgba(0,200,240,0.65); text-decoration: none; }
.cw-bread-link:hover { color: #00e5ff; }
.cw-bread-sep  { color: rgba(80,120,160,0.35); }

/* ── Layout ───────────────────────────────────────────────────────────────── */
.cw-layout {
  display: flex;
  flex: 1;
  margin-top: 48px;
  min-height: calc(100vh - 48px);
}

/* ── Sidebar ──────────────────────────────────────────────────────────────── */
.cw-nav {
  width: 230px;
  flex-shrink: 0;
  background: rgba(0, 4, 14, 0.90);
  border-right: 1px solid rgba(0, 70, 120, 0.20);
  padding: 16px 0 40px;
  position: sticky;
  top: 48px;
  max-height: calc(100vh - 48px);
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: rgba(0,100,160,0.20) transparent;
  display: flex;
  flex-direction: column;
  gap: 0;
}

.cw-lesson-selector {
  padding: 0 12px 16px;
  border-bottom: 1px solid rgba(0,60,110,0.18);
}

.cw-selector-label {
  font-size: 7.5px; letter-spacing: 0.18em; color: rgba(0,180,220,0.45);
  margin-bottom: 10px; padding: 0 2px;
}

.cw-lesson-btn {
  display: flex; flex-direction: column; gap: 3px;
  width: 100%; text-align: left;
  padding: 10px 12px; margin-bottom: 6px;
  background: rgba(0,10,28,0.60);
  border: 1px solid rgba(0,70,120,0.25);
  border-radius: 5px;
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s;
}
.cw-lesson-btn:hover { border-color: rgba(0,180,220,0.45); background: rgba(0,20,50,0.70); }
.cw-lesson-btn--active {
  border-color: rgba(0,210,255,0.55);
  background: rgba(0,40,90,0.50);
}

.cw-lesson-grade {
  font-size: 7px; letter-spacing: 0.16em;
  color: rgba(0,200,240,0.60);
}
.cw-lesson-btn--active .cw-lesson-grade { color: rgba(0,220,255,0.80); }

.cw-lesson-title {
  font-size: 9.5px; color: rgba(160,210,240,0.75); line-height: 1.45;
}
.cw-lesson-btn--active .cw-lesson-title { color: rgba(200,235,255,0.92); }

.cw-nav-sections {
  padding: 16px 12px 0;
  display: flex; flex-direction: column; gap: 1px;
}

.cw-nav-head {
  font-size: 7.5px; letter-spacing: 0.16em; color: rgba(0,160,200,0.40);
  margin-bottom: 8px;
}

.cw-nav-item {
  padding: 5px 8px; font-size: 9px; color: rgba(110,165,205,0.60);
  cursor: pointer; text-decoration: none; display: block;
  border-radius: 3px; letter-spacing: 0.02em;
  transition: background 0.10s, color 0.10s;
  border-left: 2px solid transparent;
}
.cw-nav-item:hover { background: rgba(0,30,70,0.55); color: rgba(0,220,255,0.82); }
.cw-nav-item--active {
  color: rgba(0,220,255,0.88);
  background: rgba(0,40,90,0.45);
  border-left-color: rgba(0,200,255,0.50);
}

.cw-nav-foot {
  margin-top: auto;
  padding: 16px 14px 0;
  border-top: 1px solid rgba(0,60,110,0.18);
}
.cw-foot-link {
  font-size: 8.5px; color: rgba(0,180,220,0.55); text-decoration: none;
  letter-spacing: 0.06em; transition: color 0.12s;
}
.cw-foot-link:hover { color: rgba(0,220,255,0.80); }

/* ── Content ──────────────────────────────────────────────────────────────── */
.cw-content {
  flex: 1;
  padding: 28px 48px 100px;
  max-width: 820px;
}

/* ── Persistent disclaimer ────────────────────────────────────────────────── */
.cw-disclaimer {
  background: rgba(50,25,0,0.35);
  border: 1px solid rgba(220,140,0,0.40);
  border-radius: 6px;
  padding: 13px 16px;
  font-size: 9.5px; color: rgba(215,175,110,0.90); line-height: 1.75;
  margin: 0 0 30px; max-width: 720px;
}
.cw-disclaimer strong { color: rgba(255,205,140,0.95); }

/* ── Lesson header ────────────────────────────────────────────────────────── */
.cw-lesson-header {
  margin-bottom: 36px;
  padding-bottom: 24px;
  border-bottom: 1px solid rgba(0, 80, 130, 0.22);
}

.cw-lesson-badge {
  display: inline-block;
  font-size: 8px; letter-spacing: 0.18em;
  color: rgba(0,200,240,0.75);
  background: rgba(0,40,80,0.50);
  border: 1px solid rgba(0,160,220,0.30);
  border-radius: 3px; padding: 3px 10px; margin-bottom: 12px;
}
.cw-lesson-badge--adv {
  color: rgba(200,160,255,0.80);
  background: rgba(40,0,80,0.40);
  border-color: rgba(160,100,255,0.30);
}

.cw-h1 {
  font-size: 24px; font-weight: 300; color: rgba(210,240,255,0.92);
  letter-spacing: 0.04em; margin: 0 0 12px;
}

.cw-intro {
  font-size: 11px; color: rgba(140,195,230,0.72); line-height: 1.75;
  margin: 0 0 16px; max-width: 620px;
}

.cw-meta {
  display: flex; gap: 20px; flex-wrap: wrap;
  font-size: 8.5px; color: rgba(90,145,185,0.60); letter-spacing: 0.04em;
}

/* ── Section ──────────────────────────────────────────────────────────────── */
.cw-section {
  margin-bottom: 48px;
  scroll-margin-top: 70px;
}

.cw-h2 {
  font-size: 15px; font-weight: 600; color: rgba(180,220,245,0.88);
  letter-spacing: 0.04em; margin: 0 0 14px;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(0,60,110,0.20);
}

.cw-p {
  font-size: 10.5px; color: rgba(120,175,215,0.72); line-height: 1.80;
  margin: 0 0 12px; max-width: 680px;
}
.cw-p strong { color: rgba(200,230,255,0.85); }

.cw-ul {
  padding-left: 18px; margin: 6px 0 12px;
  display: flex; flex-direction: column; gap: 6px;
}
.cw-ul li { font-size: 10px; color: rgba(120,175,215,0.70); line-height: 1.70; }
.cw-ul li strong { color: rgba(200,230,255,0.85); }

/* ── Code blocks ──────────────────────────────────────────────────────────── */
.cw-code-block {
  background: rgba(0,6,18,0.90);
  border: 1px solid rgba(0,80,130,0.22);
  border-radius: 5px;
  padding: 14px 16px;
  font-size: 9.5px; color: rgba(0,220,150,0.80);
  white-space: pre; overflow-x: auto;
  margin: 10px 0 16px;
  line-height: 1.75;
  max-width: 700px;
}

.cw-code {
  background: rgba(0,25,55,0.55);
  border: 1px solid rgba(0,100,160,0.22);
  border-radius: 3px; padding: 1px 6px;
  font-size: 9.5px; color: rgba(0,210,255,0.80);
}

/* ── Callouts ─────────────────────────────────────────────────────────────── */
.cw-callout {
  background: rgba(0,30,60,0.40);
  border-left: 3px solid rgba(0,160,220,0.50);
  border-radius: 0 4px 4px 0;
  padding: 11px 15px;
  font-size: 10px; color: rgba(140,200,235,0.78); line-height: 1.65;
  margin: 12px 0; max-width: 660px;
}
.cw-callout strong { color: rgba(210,240,255,0.90); }

.cw-callout--info {
  background: rgba(0,50,40,0.35);
  border-left-color: rgba(0,200,150,0.50);
  color: rgba(130,215,190,0.80);
}

.cw-callout--activity {
  background: rgba(30,20,60,0.40);
  border-left-color: rgba(160,100,255,0.50);
  color: rgba(190,165,240,0.80);
}

.cw-callout--warning {
  background: rgba(50,25,0,0.40);
  border-left-color: rgba(220,140,0,0.55);
  color: rgba(215,175,110,0.85);
}

/* ── Tables ───────────────────────────────────────────────────────────────── */
.cw-table {
  width: 100%; border-collapse: collapse;
  margin: 10px 0 16px; font-size: 9.5px;
  max-width: 700px;
}
.cw-table th {
  text-align: left; padding: 6px 10px;
  font-size: 8px; letter-spacing: 0.12em;
  color: rgba(0,180,220,0.55);
  border-bottom: 1px solid rgba(0,80,130,0.22);
  background: rgba(0,12,30,0.60);
}
.cw-table td {
  padding: 7px 10px; color: rgba(140,195,230,0.75);
  border-bottom: 1px solid rgba(0,50,90,0.18);
  vertical-align: top;
}
.cw-table tr:last-child td { border-bottom: none; }
.cw-table td:first-child { color: rgba(180,220,245,0.85); }

/* ── Example document (Part 1) ───────────────────────────────────────────── */
.cw-doc {
  background: rgba(10,12,8,0.75);
  border: 1px solid rgba(140,130,90,0.35);
  border-radius: 5px;
  padding: 20px 24px;
  margin: 14px 0 18px;
  max-width: 680px;
}
.cw-doc-flag {
  font-size: 7.5px; letter-spacing: 0.14em;
  color: rgba(220,140,0,0.85);
  border: 1px solid rgba(220,140,0,0.40);
  border-radius: 3px;
  display: inline-block;
  padding: 2px 8px;
  margin-bottom: 14px;
}
.cw-doc-title {
  font-size: 13px; font-weight: 700; letter-spacing: 0.08em;
  color: rgba(220,210,180,0.92);
  margin-bottom: 3px;
}
.cw-doc-sub {
  font-size: 8.5px; font-style: italic; color: rgba(160,150,120,0.65);
  margin-bottom: 12px;
}
.cw-doc-meta {
  font-size: 9px; color: rgba(170,165,140,0.75);
  padding-bottom: 12px; margin-bottom: 12px;
  border-bottom: 1px dashed rgba(140,130,90,0.30);
}
.cw-doc-clauses {
  padding-left: 18px; margin: 0 0 16px;
  display: flex; flex-direction: column; gap: 10px;
}
.cw-doc-clauses li {
  font-size: 10px; color: rgba(190,185,160,0.80); line-height: 1.7;
}
.cw-doc-clauses li strong { color: rgba(225,218,190,0.95); }
.cw-doc-sign {
  display: flex; gap: 40px; flex-wrap: wrap;
  padding-top: 12px; border-top: 1px dashed rgba(140,130,90,0.30);
}
.cw-doc-sign-line {
  font-size: 10px; color: rgba(170,165,140,0.60); line-height: 2.2;
}
.cw-doc-sign-line span { font-size: 8px; letter-spacing: 0.08em; }

/* ── Calculator (Part 2) ─────────────────────────────────────────────────── */
.cw-calc {
  background: rgba(0,6,18,0.75);
  border: 1px solid rgba(0,80,130,0.30);
  border-radius: 6px;
  padding: 20px 22px;
  margin: 14px 0 18px;
  max-width: 680px;
}
.cw-calc-row {
  display: flex; align-items: center; gap: 14px;
  flex-wrap: wrap;
  margin-bottom: 18px;
}
.cw-calc-label {
  font-size: 9px; letter-spacing: 0.06em; color: rgba(140,195,230,0.75);
  flex-shrink: 0;
}
.cw-calc-slider {
  flex: 1; min-width: 160px;
  accent-color: rgba(0,210,255,0.85);
}
.cw-calc-value {
  font-size: 11px; font-weight: 700; color: rgba(0,220,255,0.92);
  min-width: 56px; text-align: right;
}
.cw-calc-output {
  display: flex; gap: 24px; flex-wrap: wrap;
  padding: 14px 0; margin-bottom: 12px;
  border-top: 1px solid rgba(0,60,110,0.25);
  border-bottom: 1px solid rgba(0,60,110,0.25);
}
.cw-calc-stat {
  display: flex; flex-direction: column; gap: 4px;
}
.cw-calc-stat-label {
  font-size: 7.5px; letter-spacing: 0.12em; color: rgba(0,160,200,0.55);
}
.cw-calc-stat-value {
  font-size: 13px; font-weight: 700; color: rgba(200,235,255,0.92);
}
.cw-calc-formula {
  font-size: 9.5px; color: rgba(0,220,150,0.75);
  line-height: 1.9; font-family: 'Courier New', monospace;
}

/* ── Responsive ───────────────────────────────────────────────────────────── */
@media (max-width: 768px) {
  .cw-nav { display: none; }
  .cw-content { padding: 20px 20px 80px; }
}
</style>
