/**
 * src/data/pfas-methods-library.ts
 *
 * Curated reference on real, citable PFAS/PFOA ("forever chemicals")
 * remediation methods — the precedent library a public method proposal's
 * economic/environmental argument draws from (see MethodProposalsPage.vue).
 * This is curated reference content, not a user-submitted proposal.
 *
 * Written honestly about what's established vs. still emerging — see
 * `maturity`. Where a method is commonly assumed to work but the evidence
 * doesn't really support it (phytoremediation), that's stated plainly
 * rather than implied.
 */

export type RemediationMedia    = 'water' | 'soil' | 'both'
export type RemediationMaturity = 'established' | 'emerging'

export interface Citation {
  title: string
  org:   string   // publishing body/author group — not a fabricated specific paper title/DOI
  note?: string
}

export interface RemediationMethod {
  key:                 string
  name:                string
  media:               RemediationMedia
  maturity:             RemediationMaturity
  mechanism:            string
  chainLengthNote:      string   // long-chain (e.g. PFOA/PFOS) vs short-chain (e.g. PFBA/PFBS) effectiveness
  costNote:             string
  limitations:          string
  citations:            Citation[]
}

export const REMEDIATION_METHODS: RemediationMethod[] = [
  {
    key: 'gac', name: 'Granular Activated Carbon (GAC) filtration',
    media: 'water', maturity: 'established',
    mechanism: 'PFAS molecules adsorb onto the porous carbon surface as water passes through a filter bed. The most widely deployed PFAS treatment technology in operating drinking-water systems today.',
    chainLengthNote: 'Effective for long-chain PFAS (PFOA, PFOS and similar 7-8+ carbon compounds). Markedly less effective for short-chain PFAS (PFBA, PFBS and similar 4-carbon-or-shorter compounds), which are more water-soluble and adsorb poorly.',
    costNote: 'Moderate capital cost, ongoing cost driven by how often the carbon bed needs replacement or regeneration — replacement frequency depends heavily on influent concentration and the mix of chain lengths present.',
    limitations: 'Does not destroy PFAS — it concentrates it onto spent carbon, which itself becomes a PFAS-containing waste requiring disposal (landfill) or destruction (high-temperature reactivation/incineration). Short-chain breakthrough can occur well before the bed is visually or operationally "exhausted."',
    citations: [
      { title: 'PFAS treatment and removal technical resources', org: 'US EPA' },
      { title: 'PFAS technical and regulatory guidance', org: 'Interstate Technology Regulatory Council (ITRC)' },
    ],
  },
  {
    key: 'ix', name: 'Ion Exchange (IX) resin',
    media: 'water', maturity: 'established',
    mechanism: 'Anion exchange resin beads swap PFAS anions for chloride or bicarbonate ions as water passes through. Single-use resins in particular tend to reach very high PFAS removal before breakthrough.',
    chainLengthNote: 'Often outperforms GAC on short-chain PFAS specifically, and works well across both long- and short-chain compounds — one of the reasons it is frequently paired with or chosen over GAC where short-chain PFAS is a significant fraction of the contamination.',
    costNote: 'Resin itself costs more per unit volume than GAC, but faster kinetics and higher capacity often reduce vessel size and change-out frequency, partly offsetting that.',
    limitations: 'Same disposal problem as GAC — spent resin (especially single-use, non-regenerable resin) is a PFAS-concentrated waste stream. Regenerable resins avoid this but the regenerant brine itself then needs PFAS-specific treatment or destruction.',
    citations: [
      { title: 'PFAS treatment and removal technical resources', org: 'US EPA' },
      { title: 'PFAS technical and regulatory guidance', org: 'Interstate Technology Regulatory Council (ITRC)' },
    ],
  },
  {
    key: 'membrane', name: 'High-pressure membrane filtration (Reverse Osmosis / Nanofiltration)',
    media: 'water', maturity: 'established',
    mechanism: 'Water is forced through a semi-permeable membrane under pressure; PFAS molecules (along with most other dissolved solids) are physically rejected and concentrated into a reject/concentrate stream.',
    chainLengthNote: 'High removal (typically well above 90%) across both long- and short-chain PFAS — one of the few methods that treats short-chain compounds as effectively as long-chain.',
    costNote: 'High energy cost relative to GAC/IX, and requires more involved pre-treatment to prevent membrane fouling — generally a larger-scale/higher-budget option.',
    limitations: 'Produces a concentrated reject stream (10-25% of throughput volume) with PFAS levels far above the influent — this concentrate still requires disposal or a destructive technology downstream. Not a standalone solution by itself.',
    citations: [
      { title: 'PFAS treatment and removal technical resources', org: 'US EPA' },
    ],
  },
  {
    key: 'foam-fractionation', name: 'Foam fractionation (surface-active foam separation)',
    media: 'water', maturity: 'established',
    mechanism: "Exploits PFAS's own surfactant chemistry — the same property that made it useful in firefighting foam (AFFF) — by bubbling air through contaminated water; PFAS concentrates at the air-water interface and rises out as foam, which is collected separately.",
    chainLengthNote: 'Most effective on longer-chain, more surface-active PFAS at relatively high starting concentrations — the situation typical of an AFFF-impacted site (fire-training areas, some industrial/military sites), less proven for the low-concentration PFAS levels typical of general drinking-water contamination.',
    costNote: 'Lower operating cost than membrane filtration for high-concentration source waters, since it does not require replacing a sorbent media on a schedule.',
    limitations: 'Not well suited to low-concentration, diffuse contamination. The collected foam concentrate still requires downstream disposal or destruction, same as GAC/IX/membrane concentrate.',
    citations: [
      { title: 'PFAS technical and regulatory guidance', org: 'Interstate Technology Regulatory Council (ITRC)' },
    ],
  },
  {
    key: 'in-situ-stabilization', name: 'In-situ soil stabilization / solidification',
    media: 'soil', maturity: 'established',
    mechanism: 'Sorbent amendments (activated carbon-based products, modified clays) are mixed directly into contaminated soil in place, binding PFAS and reducing how readily it leaches into groundwater — without excavating the soil.',
    chainLengthNote: 'Generally more effective at retaining long-chain PFAS than short-chain, similar to GAC\'s water-treatment limitation, for the same underlying adsorption chemistry reason.',
    costNote: 'Substantially cheaper than excavation-and-disposal for large soil volumes, since the soil never has to be moved or land-filled.',
    limitations: 'Immobilizes rather than destroys PFAS — it reduces leaching risk but the PFAS mass remains on-site, requiring long-term monitoring to confirm the stabilization is holding.',
    citations: [
      { title: 'PFAS technical and regulatory guidance', org: 'Interstate Technology Regulatory Council (ITRC)' },
    ],
  },
  {
    key: 'electrochemical-oxidation', name: 'Electrochemical oxidation',
    media: 'water', maturity: 'emerging',
    mechanism: 'Applies an electric current across specialized electrodes (often boron-doped diamond) in contact with PFAS-contaminated water, directly breaking the carbon-fluorine bond rather than just concentrating the PFAS elsewhere.',
    chainLengthNote: 'Lab and pilot studies show breakdown across chain lengths, since it attacks the C-F bond directly rather than relying on adsorption chemistry that differs by chain length — but destruction completeness and byproduct profile are still active research questions.',
    costNote: 'Energy-intensive; not yet cost-competitive with established sorbent methods at full water-treatment-plant scale.',
    limitations: 'Primarily demonstrated at pilot/bench scale, not yet widely deployed at full operating scale. Incomplete destruction can produce shorter-chain PFAS byproducts that then need their own treatment.',
    citations: [
      { title: 'Emerging PFAS destruction technologies — technical guidance', org: 'Interstate Technology Regulatory Council (ITRC)' },
    ],
  },
  {
    key: 'scwo', name: 'Supercritical Water Oxidation (SCWO)',
    media: 'both', maturity: 'emerging',
    mechanism: 'Water is brought above its critical point (high temperature and pressure) where it behaves as neither liquid nor gas — PFAS and other organics are fully oxidized into simple, non-fluorinated byproducts (mineralized) rather than just moved to a different medium.',
    chainLengthNote: 'Intended to fully destroy PFAS regardless of chain length, since it does not depend on adsorption at all — a genuinely different mechanism from every sorbent-based method above.',
    costNote: 'High capital cost; commercial-scale units have started coming online at select sites but full-scale deployment is still limited relative to established sorbent methods.',
    limitations: 'Newer technology with a shorter operating track record than GAC/IX. Best suited for concentrated waste streams (e.g. the reject concentrate from a membrane system, or spent regenerant) rather than treating large dilute-water volumes directly.',
    citations: [
      { title: 'Emerging PFAS destruction technologies — technical guidance', org: 'Interstate Technology Regulatory Council (ITRC)' },
    ],
  },
  {
    key: 'phytoremediation', name: 'Phytoremediation (plant-based uptake)',
    media: 'soil', maturity: 'emerging',
    mechanism: 'Certain plant species take up PFAS from soil or shallow groundwater through their root systems into above-ground biomass, which can then be harvested and disposed of separately from the site.',
    chainLengthNote: 'Uptake efficiency varies significantly by plant species and PFAS chain length, with no consistently reliable pattern established across field trials.',
    costNote: 'Low direct cost relative to engineered remediation, which is part of why it is often proposed for community/volunteer-led sites — but see limitations below.',
    limitations: "Stated plainly: phytoremediation is **not well-proven for PFAS specifically**, unlike its genuinely established track record for some other organic and heavy-metal contaminants. Uptake rates documented in the literature are typically slow and limited relative to the scale of most contamination, and — critically — it does not destroy PFAS, only relocates it into plant tissue that must itself be harvested and safely disposed of, or the PFAS returns to the soil when the plant dies back. Treat method proposals citing phytoremediation as a primary strategy with real skepticism unless they include a credible plan for what happens to the harvested biomass.",
    citations: [
      { title: 'Review literature on PFAS uptake by plants', org: 'Environmental science research community', note: 'Findings across studies are inconsistent — this is an active research area, not a proven remediation method, as of this writing.' },
    ],
  },
]

// ── Legal & safe sampling guidance — remediation-specific addendum ─────────
// Extends the existing eco-ops PFAS monitoring wizard content (see
// docs/eco-ops-workflow-guide.md Part 2, SPEC_ECO_OPS_API.md) with guidance
// specific to sampling a site that may be under active remediation or
// suspected of ongoing contamination — as opposed to routine monitoring.

export interface LegalGuidanceItem {
  title: string
  body:  string
}

export const LEGAL_SAMPLING_GUIDANCE: LegalGuidanceItem[] = [
  {
    title: 'Get access permission before you sample',
    body:  'Sampling on private property, an active industrial site, or a site under a regulatory order requires the owner\'s or operator\'s permission — or explicit legal authority (e.g. a public right-of-way, a permitted access agreement). Sampling without permission can be trespass regardless of good intent, and can undermine the credibility of the data you collect.',
  },
  {
    title: 'Chain of custody matters more for remediation claims',
    body:  'If a sample is meant to support a public method proposal or document a decontamination project\'s progress, keep a written chain of custody — who collected it, when, how it was stored, and who ran the analysis — the same standard used in the routine PFAS monitoring wizard, but treat it as non-negotiable here since the data is meant to support a public claim.',
  },
  {
    title: 'Lab analysis, not field test kits, for anything you\'ll publish',
    body:  'Field screening (e.g. the water-drop packaging test referenced in the upstream-producer-responsibility work) is useful for triage, but a public proposal or a logged progress claim about concentration levels should be backed by a certified laboratory using an EPA-recognized method (EPA 537.1 or 533 for drinking water) — not a field test alone. See the cost tiers below for how to keep this affordable without dropping to an unverified method.',
  },
  {
    title: 'Know when to notify, not just log',
    body:  'If sampling reveals contamination significantly above an actionable guideline, or reveals what looks like an active, undisclosed source, that may warrant notifying the relevant environmental regulator directly, separate from and in addition to logging it here. See REGULATORY_CONTEXT below for the actual current numbers — "significantly above guideline" is not useful on its own without knowing what the guideline is.',
  },
]

// ── Regulatory context — the actual numbers "actionable guideline" means ────
// US-specific, since the app's PFAS field-work concentration inputs are in
// ppt (parts per trillion / ng/L), matching how these are actually reported
// in the US regulatory context. Dated deliberately — this is a live,
// currently-shifting regulatory picture (see the status note below), not a
// settled fact to state once and forget. Update the date and re-verify
// before trusting this for anything more than orientation.

export interface RegulatoryNote {
  title:  string
  body:   string
  asOf:   string   // ISO date this was last verified — re-check, don't assume it's still current
  status: 'enforceable' | 'proposed-change' | 'rescission-proposed'
}

export const REGULATORY_CONTEXT: RegulatoryNote[] = [
  {
    title: 'PFOA / PFOS Maximum Contaminant Level (MCL) — 4.0 ppt each',
    body:  'EPA\'s final PFAS National Primary Drinking Water Regulation (April 10, 2024) set legally enforceable MCLs of 4.0 ppt (ng/L) for PFOA and 4.0 ppt for PFOS individually in drinking water — a project log or method proposal citing "significantly above guideline" for either compound means meaningfully above this number, not an arbitrary threshold. Original compliance deadline was April 2029.',
    asOf: '2026-07-22',
    status: 'enforceable',
  },
  {
    title: 'PFOA / PFOS compliance deadline — proposed extension to 2031',
    body:  'A 2026 EPA proposed rule would keep the 4.0 ppt PFOA/PFOS MCLs in place but let public water systems request two additional years (to 2031) to reach compliance. The MCL numbers themselves are not what\'s being proposed for change here — the timeline is.',
    asOf: '2026-07-22',
    status: 'proposed-change',
  },
  {
    title: 'PFHxS / PFNA / HFPO-DA (GenX) / Hazard Index mixture — rescission proposed',
    body:  'The same 2024 regulation also set enforceable limits for PFHxS, PFNA, HFPO-DA (GenX), and a Hazard Index calculation for mixtures of those three plus PFBS. A separate 2026 EPA proposed rule would rescind these specific standards, leaving the 4.0 ppt PFOA/PFOS MCLs as the only ones remaining enforceable. If you\'re logging or citing a concentration for any of these four beyond PFOA/PFOS, treat "the regulatory limit" as actively in flux, not settled.',
    asOf: '2026-07-22',
    status: 'rescission-proposed',
  },
  {
    title: "Public comment period — closes July 20, 2026",
    body:  'Both 2026 proposed rules above had public comment periods closing July 20, 2026, with a public hearing July 7, 2026. By the time you read this, that window has likely closed and a final rule may already exist — verify current status at epa.gov/sdwa before treating anything above as final rather than proposed.',
    asOf: '2026-07-22',
    status: 'proposed-change',
  },
]

// ── Sampling cost tiers ──────────────────────────────────────────────────────
// PFAS has no validated cheap field test the way chlorine, nitrate, or pH do —
// reliable detection requires LC-MS/MS, lab-only. A "not certified, ~$40"
// product is almost always one of two very different things: a narrower/
// cheaper panel still run by a real accredited lab, or an unvalidated field
// indicator. This framework exists so cost pressure doesn't quietly become
// an accuracy compromise — see POOLED_SAMPLING_NOTE for the actual lever
// that reduces cost without dropping below the accredited-lab tier.

export interface SamplingCostTier {
  tier:             string
  costRange:        string
  whatItIs:         string
  whatItCanSupport: string
  caveat:           string
}

export const SAMPLING_COST_TIERS: SamplingCostTier[] = [
  {
    tier: 'Free — proximity / desk screening',
    costRange: '$0',
    whatItIs: 'Checking a site against EWG\'s PFAS contamination map, known-source proximity (military bases, airports, landfills, industrial sites), and public regulatory records — no sample taken at all.',
    whatItCanSupport: 'Deciding whether a site is worth sampling in the first place. Not a measurement — cannot support any concentration claim.',
    caveat: 'A starting point, not evidence. Absence from a known-source list does not mean a site is clean.',
  },
  {
    tier: 'Low-cost consumer kits',
    costRange: '~$30–80',
    whatItIs: 'Mail-in kits marketed direct-to-consumer, often testing a narrower panel of PFAS compounds than the full EPA method, or bundled at scale to cut the per-sample lab cost. "Not certified" on the packaging can mean two very different things — check specifically whether the *lab* actually running the analysis is NELAP/state-accredited and which method it uses, not just whether the kit brand is a recognized name.',
    whatItCanSupport: 'Personal awareness and triage. Do not use to back a public method proposal or a logged decontamination-progress claim unless you\'ve confirmed the underlying lab and method meet the accredited-lab tier below — many of these kits do not.',
    caveat: 'If you can\'t verify the lab/method behind a cheap kit, treat its result the same as a field-screening result: useful for you, not citable evidence.',
  },
  {
    tier: 'EPA-method lab analysis (accredited lab)',
    costRange: '~$150–400 / sample',
    whatItIs: 'A NELAP/state-accredited laboratory running EPA 537.1 or 533 (drinking water) or an equivalent validated method for the matrix being tested.',
    whatItCanSupport: 'The only tier that should back a public method proposal or a project-log concentration claim.',
    caveat: 'This is the real cost floor for credible evidence — the honest way to bring total cost down is pooling (see below), not substituting an unvalidated method.',
  },
]

export const POOLED_SAMPLING_NOTE =
  'The most reliable way to cut real sampling cost without losing credibility is to pool it: split one certified test\'s cost across a group logging the same site, submit a single composite sample covering a documented set of sub-locations, or partner with a university or NGO lab that offers a community/citizen-science discount off the standard commercial rate. This keeps every result at the accredited-lab tier instead of substituting an unverified cheap test.'
