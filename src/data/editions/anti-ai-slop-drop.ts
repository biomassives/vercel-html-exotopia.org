/**
 * src/data/editions/anti-ai-slop-drop.ts
 *
 * EDITION 2 — Anti-AI Slop Drop
 * IDs 12–22 · Human craft, field truth, community signal
 *
 * A direct counter to AI-generated generic content.
 * Every concept here represents something a real person does with their hands,
 * their voice, their body, their community — things that cannot be hallucinated.
 */

import type { CollectorCard } from 'src/data/collector-cards'

export const ANTI_AI_CARDS: CollectorCard[] = [

  // ── LEGENDARY ────────────────────────────────────────────────────────────────

  {
    id: 12, name: 'The Field Reading', series: 'Anti-AI Slop Drop',
    edition: 1, maxEdition: 11, mintedCount: 0,
    description: 'GPS-tagged, timestamp-signed, sensor-verified water quality data from a real field worker in Lamu, Kenya. pH 7.1. Turbidity 0.3 NTU. No model generated this. A person walked to the water and measured it.',
    bgFrom: '#030a04', bgTo: '#050e06',
    borderColor: '#ffd700', glowColor: 'rgba(60,200,100,0.55)',
    artColors: ['#22dd88', '#00aa44', '#aaffcc', '#005522', '#ffffff'],
    attributes: [
      { trait_type: 'Series',      value: 'Anti-AI Slop Drop' },
      { trait_type: 'Edition',     value: '1 of 11' },
      { trait_type: 'Data Type',   value: 'Water Quality Measurement' },
      { trait_type: 'Source',      value: 'Human field worker · Lamu, Kenya' },
      { trait_type: 'Verified',    value: 'GPS + timestamp + chain' },
      { trait_type: 'pH',          value: 7.1 },
      { trait_type: 'Turbidity',   value: '0.3 NTU' },
      { trait_type: 'Potable',     value: 'YES' },
    ],
  },

  {
    id: 13, name: 'The Living Verse', series: 'Anti-AI Slop Drop',
    edition: 2, maxEdition: 11, mintedCount: 0,
    description: 'Poetry — recorded or written — that honours the intent of the rhyme and the breath of the verse. Every line break is a decision. Every pause carries weight. The meaning lives in the gap between the words, not the words themselves.',
    bgFrom: '#080510', bgTo: '#10080c',
    borderColor: '#ffd700', glowColor: 'rgba(220,180,255,0.50)',
    artColors: ['#ddc8ff', '#9966cc', '#ffe8ff', '#220033', '#ffffff'],
    attributes: [
      { trait_type: 'Series',      value: 'Anti-AI Slop Drop' },
      { trait_type: 'Edition',     value: '2 of 11' },
      { trait_type: 'Form',        value: 'Poetry — written and recorded' },
      { trait_type: 'Community',   value: 'OT Kulcha / Fana Ka' },
      { trait_type: 'Intent',      value: 'Honour the rhyme · honour the verse' },
      { trait_type: 'Voice',       value: 'Human breath, pause, and line break' },
      { trait_type: 'Origin',      value: 'Community poet — ink or microphone' },
    ],
  },

  {
    id: 14, name: 'The Raw Take', series: 'Anti-AI Slop Drop',
    edition: 3, maxEdition: 11, mintedCount: 0,
    description: 'An unedited field recording captured in one take. The room noise is in there. The chair creak. The cough at measure 8. The waveform is the truth — irregular, alive, impossible to synthesise convincingly.',
    bgFrom: '#080400', bgTo: '#100800',
    borderColor: '#ffd700', glowColor: 'rgba(255,120,40,0.50)',
    artColors: ['#ff6633', '#cc3300', '#ff9966', '#441100', '#ffbb88'],
    attributes: [
      { trait_type: 'Series',    value: 'Anti-AI Slop Drop' },
      { trait_type: 'Edition',   value: '3 of 11' },
      { trait_type: 'Format',    value: 'Field recording · WAV 48kHz' },
      { trait_type: 'Takes',     value: '1 — no punch-ins' },
      { trait_type: 'Room',      value: 'Ambient noise preserved' },
      { trait_type: 'Duration',  value: '3m 41s' },
      { trait_type: 'Artefact',  value: 'Chair creak at 2m 08s (real)' },
    ],
  },

  // ── RARE ─────────────────────────────────────────────────────────────────────

  {
    id: 15, name: 'Cipher Tongue', series: 'Anti-AI Slop Drop',
    edition: 4, maxEdition: 11, mintedCount: 0,
    description: 'Patois, Swahili, Sheng, street argot — code-switching languages that compress community knowledge into forms outsiders cannot flatten. The meaning lives in the context. The context lives in the body.',
    bgFrom: '#040810', bgTo: '#060c18',
    borderColor: '#4488ff', glowColor: 'rgba(80,140,255,0.45)',
    artColors: ['#aaddff', '#4488ff', '#88ccee', '#001840', '#ffffff'],
    attributes: [
      { trait_type: 'Series',    value: 'Anti-AI Slop Drop' },
      { trait_type: 'Edition',   value: '4 of 11' },
      { trait_type: 'Languages', value: 'Swahili · Patois · Sheng' },
      { trait_type: 'Property',  value: 'Context-dependent meaning' },
      { trait_type: 'Resistant', value: 'To decontextualisation' },
    ],
  },

  {
    id: 16, name: 'Callus Print', series: 'Anti-AI Slop Drop',
    edition: 5, maxEdition: 11, mintedCount: 0,
    description: 'Adaptive dermoglyphics. The body logs every repetition in hardened skin. A callus permanently alters the ridge detail at exactly the point of contact — the guitar string, the pump handle, the shovel grip. A forensics lab can read what you held. No model adapts.',
    bgFrom: '#050208', bgTo: '#0c0510',
    borderColor: '#cc7744', glowColor: 'rgba(190, 85, 35, 0.48)',
    artColors: ['#b85c28', '#7a3010', '#d4906a', '#2a6a7a', '#e8c0a0'],
    attributes: [
      { trait_type: 'Series',        value: 'Anti-AI Slop Drop' },
      { trait_type: 'Edition',       value: '5 of 11' },
      { trait_type: 'Pattern',       value: 'Ulnar loop · right index' },
      { trait_type: 'Callus zone',   value: 'MCP3 · lateral distal phalange' },
      { trait_type: 'Ridge count',   value: '14 (core to delta)' },
      { trait_type: 'Magnification', value: '17×' },
      { trait_type: 'Evidence',      value: 'Repeated tool contact — body-recorded' },
    ],
  },

  {
    id: 17, name: 'The Circle', series: 'Anti-AI Slop Drop',
    edition: 6, maxEdition: 11, mintedCount: 0,
    description: 'People sitting in a circle. The oldest technology for collective decision-making. Every person faces every other person. No one holds the floor longer than their breath allows. The form itself is the protocol.',
    bgFrom: '#050a06', bgTo: '#080f0a',
    borderColor: '#4488ff', glowColor: 'rgba(80,200,120,0.40)',
    artColors: ['#44cc88', '#228844', '#aaffcc', '#002210', '#ffffff'],
    attributes: [
      { trait_type: 'Series',     value: 'Anti-AI Slop Drop' },
      { trait_type: 'Edition',    value: '6 of 11' },
      { trait_type: 'Form',       value: 'Circular assembly' },
      { trait_type: 'Protocol',   value: 'Equal visibility, equal floor' },
      { trait_type: 'Technology', value: 'Oldest known governance form' },
    ],
  },

  {
    id: 18, name: 'Compost Logic', series: 'Anti-AI Slop Drop',
    edition: 7, maxEdition: 11, mintedCount: 0,
    description: 'Decomposition is a process, not a state. Kitchen scraps become garden beds become food become scraps. The loop has no waste, only phase transitions. You cannot prompt your way into understanding this cycle.',
    bgFrom: '#060a00', bgTo: '#0a0e02',
    borderColor: '#4488ff', glowColor: 'rgba(100,180,40,0.42)',
    artColors: ['#88cc22', '#446600', '#ccee88', '#223300', '#ffeeaa'],
    attributes: [
      { trait_type: 'Series',   value: 'Anti-AI Slop Drop' },
      { trait_type: 'Edition',  value: '7 of 11' },
      { trait_type: 'Cycle',    value: 'Input → decompose → soil → growth' },
      { trait_type: 'Waste',    value: '0%' },
      { trait_type: 'Timeline', value: '8–16 weeks' },
    ],
  },

  // ── UNCOMMON ─────────────────────────────────────────────────────────────────

  {
    id: 19, name: 'Street Frequency', series: 'Anti-AI Slop Drop',
    edition: 8, maxEdition: 11, mintedCount: 0,
    description: 'Community radio — the local voice that knows which road flooded, which market opened early, which meeting was moved. Hyper-local information that serves its community and no one else. Signal over noise.',
    bgFrom: '#030608', bgTo: '#050a0e',
    borderColor: '#22cc66', glowColor: 'rgba(0,200,220,0.38)',
    artColors: ['#00ddee', '#0088aa', '#88eeff', '#002233', '#aaffff'],
    attributes: [
      { trait_type: 'Series',     value: 'Anti-AI Slop Drop' },
      { trait_type: 'Edition',    value: '8 of 11' },
      { trait_type: 'Form',       value: 'Community radio / local broadcast' },
      { trait_type: 'Audience',   value: 'Hyper-local · self-defined' },
      { trait_type: 'Signal/SNR', value: 'High — narrow cast, low noise' },
    ],
  },

  {
    id: 20, name: 'Mending Season', series: 'Anti-AI Slop Drop',
    edition: 9, maxEdition: 11, mintedCount: 0,
    description: 'The period when things are repaired rather than replaced. The stitched garment carries the history of its failures in its seams. Repair is an argument against throwaway culture — and against content generated at scale.',
    bgFrom: '#0a0408', bgTo: '#160810',
    borderColor: '#22cc66', glowColor: 'rgba(200,80,180,0.38)',
    artColors: ['#dd44aa', '#aa2288', '#ffaaee', '#330022', '#ffddff'],
    attributes: [
      { trait_type: 'Series',   value: 'Anti-AI Slop Drop' },
      { trait_type: 'Edition',  value: '9 of 11' },
      { trait_type: 'Form',     value: 'Visible mending / sashiko' },
      { trait_type: 'Practice', value: 'Repair over replacement' },
      { trait_type: 'Lifespan', value: 'Indefinitely extended' },
    ],
  },

  {
    id: 21, name: 'The Count', series: 'Anti-AI Slop Drop',
    edition: 10, maxEdition: 11, mintedCount: 0,
    description: 'Tally marks on a wall — the oldest digital system (base 5). Each mark records a real event: a day survived, a fish caught, a person counted in a census. No hallucination. Only what happened.',
    bgFrom: '#050508', bgTo: '#08080e',
    borderColor: '#22cc66', glowColor: 'rgba(200,200,100,0.38)',
    artColors: ['#ddcc88', '#aa9944', '#ffeebb', '#222200', '#ffffff'],
    attributes: [
      { trait_type: 'Series',  value: 'Anti-AI Slop Drop' },
      { trait_type: 'Edition', value: '10 of 11' },
      { trait_type: 'System',  value: 'Unary / tally (base 5 grouping)' },
      { trait_type: 'Oldest',  value: 'Ishango bone ~20,000 BCE' },
      { trait_type: 'Records', value: 'Verified events only' },
    ],
  },

  // ── COMMON ───────────────────────────────────────────────────────────────────

  {
    id: 22, name: 'Margin Notes', series: 'Anti-AI Slop Drop',
    edition: 11, maxEdition: 11, mintedCount: 0,
    description: 'The handwritten annotation in the margin of a page — question, correction, moment of recognition. The most human form of edit. A conversation with an author across time. AI generates the page. It cannot generate the margin.',
    bgFrom: '#040408', bgTo: '#060610',
    borderColor: '#667788', glowColor: 'rgba(160,160,200,0.30)',
    artColors: ['#aabbcc', '#667788', '#ddeeff', '#222234', '#ffffff'],
    attributes: [
      { trait_type: 'Series',   value: 'Anti-AI Slop Drop' },
      { trait_type: 'Edition',  value: '11 of 11' },
      { trait_type: 'Form',     value: 'Handwritten marginalia' },
      { trait_type: 'Dialogue', value: 'Reader ↔ author across time' },
      { trait_type: 'Medium',   value: 'Ink on paper margin' },
    ],
  },
]
