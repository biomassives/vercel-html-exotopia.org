/**
 * ecology-fieldwork-library.ts
 *
 * In-app operationalization of docs/eco-ops-workflow-guide.md Part 1
 * ("Securing Locations") and its Appendix A (Letter of Agreement) —
 * plus one genuinely new piece: a Letter of Inquiry (RFI) template for the
 * step that comes BEFORE a formal agreement. The doc's Appendix A assumes
 * you already know who to contact and they've basically said yes; this
 * fills the gap before that — first contact, asking.
 *
 * Backs `ecology_sites.access_status` (009_ecology_biodiversity.sql):
 *   unresearched -> map_research_done -> inquiry_sent -> access_confirmed
 *                                                      -> (or) not_required
 */

// ── Map research session ──────────────────────────────────────────────────
// The "identify a candidate site and who to ask" step — pre-outreach,
// desk-based. Mirrors pfas-methods-library.ts's guidance-item shape.

export interface GuidanceItem {
  title: string
  body:  string
}

export const MAP_RESEARCH_STEPS: GuidanceItem[] = [
  {
    title: 'Start from a real map, not a guess',
    body:  'Use aerial/satellite imagery (Google/Bing Maps satellite view, or your state GIS portal) and a parcel viewer (most US counties publish one — search "[county name] parcel viewer" or "[county name] GIS") to identify the exact parcel boundary and current owner of record before contacting anyone. For habitat/species context, cross-reference iNaturalist\'s range maps and your state natural heritage program\'s database.',
  },
  {
    title: 'Identify the site type — it determines who you contact',
    body:  'School grounds, public parks, municipal stormwater/right-of-way, private land, tribal land, and community gardens each have a different contact pathway with different requirements. See SITE_TYPE_CONTACTS below — figuring out which category a candidate site falls into is the actual output of this step, not just "found a spot on a map."',
  },
  {
    title: 'Check utilities and protected status before proposing anything',
    body:  'Call 811 (US "call before you dig") if the work could disturb the ground — this is required by law, not optional guidance. Check your state natural heritage program database for protected species/habitat on or near the site. Note any of this in the site\'s access record so it travels with the site, not just in your head.',
  },
  {
    title: 'Write down what you found before moving to outreach',
    body:  'Owner/manager name if known, parcel ID, site type, any utility/protected-species flags. This becomes the factual basis for the letter of inquiry in the next step — an inquiry that can\'t say what parcel or who it\'s addressed to reads as unresearched to the person receiving it.',
  },
]

// ── Site type -> contact pathway ────────────────────────────────────────
// Adapted from docs/eco-ops-workflow-guide.md §1.1. Kept in sync by hand —
// if that section changes, update here too.

export interface SiteTypeContact {
  siteType:    string
  contactPath: string
  whatsNeeded: string
}

export const SITE_TYPE_CONTACTS: SiteTypeContact[] = [
  {
    siteType:    'School grounds and schoolyards',
    contactPath: 'Building principal → facilities director → district sustainability or science coordinator',
    whatsNeeded: 'A brief project description (one page), a faculty sponsor, and a parent consent form template for participants under 18.',
  },
  {
    siteType:    'Public parks and greenways',
    contactPath: 'Local parks and recreation department, or county open space program',
    whatsNeeded: 'Volunteer activity permit (often free or nominal fee, 2-4 weeks lead time); a site map showing the work zone.',
  },
  {
    siteType:    'Municipal stormwater infrastructure / road rights-of-way',
    contactPath: 'City or county public works / stormwater management division — the stormwater program manager specifically, not the general public works line',
    whatsNeeded: 'An encroachment permit or right-of-way agreement. Relevant for rain gardens in the public right-of-way.',
  },
  {
    siteType:    'Private land (farms, private lots, institutional campuses)',
    contactPath: 'Property owner or estate manager; for institutions, the facilities/grounds manager',
    whatsNeeded: 'A written agreement — a letter of inquiry first (see below), then a letter of agreement once they say yes.',
  },
  {
    siteType:    'Tribal lands and territories',
    contactPath: 'Tribal environmental department or tribal council — the tribe leads, not the organizing group',
    whatsNeeded: 'A formal FPIC (Free, Prior and Informed Consent) process. Plan for 3-6 months of relationship-building before fieldwork begins — this is not a fast-tracked inquiry letter.',
  },
  {
    siteType:    'Community gardens and food forests',
    contactPath: 'Garden committee or the nonprofit/land trust managing the space',
    whatsNeeded: 'A site assessment and a brief proposal — typically the easiest sites to secure since managers are already oriented toward ecological benefit.',
  },
]

// ── Letter of Inquiry (RFI) — the new piece ─────────────────────────────
// Distinct from docs Appendix A's Letter of Agreement: this is FIRST
// contact, asking, not a formal agreement to sign. Tribal-land inquiries
// route through FPIC instead — see SITE_TYPE_CONTACTS above — this
// generator is for the other five site types.

export interface LetterOfInquiryInput {
  organizingGroup:    string
  recipientName:      string   // property owner/manager name, or role if unknown
  siteDescription:    string   // address or parcel description
  proposedActivity:   string   // one-sentence description of the work
  requestedInfo:      string   // what you're actually asking for — access? more info? a meeting?
  contactName:        string
  contactInfo:        string   // email or phone
}

export function generateLetterOfInquiry(input: LetterOfInquiryInput): string {
  return `Dear ${input.recipientName},

My name is ${input.contactName}, writing on behalf of ${input.organizingGroup}. We are researching a possible community ecology/biodiversity project and wanted to reach out before making any plans.

Site: ${input.siteDescription}
Proposed activity: ${input.proposedActivity}

At this stage we are asking: ${input.requestedInfo}

This is an initial inquiry, not a request to begin any work — we would follow up with a full written agreement covering access, duration, permitted activities, and liability before anything happens on site, and would welcome the chance to discuss it with you first.

Please reach me at ${input.contactInfo} with any questions, or to let us know this isn't a good fit — either way, thank you for considering it.

Sincerely,
${input.contactName}
${input.organizingGroup}`
}

// ── Site assessment checklist ────────────────────────────────────────────
// From docs §1.2 — the standard checklist regardless of project type,
// worth completing once access_status reaches 'access_confirmed'/'not_required'
// and before the first real (non-simulated) log entry.

export const SITE_ASSESSMENT_CHECKLIST: string[] = [
  'Property owner/manager name, contact, and written consent pathway',
  'Site map with dimensions and existing features (buildings, utilities, drainage)',
  'Soil drainage: percolation test result, if relevant to the project type',
  'Canopy coverage estimate (% of site in shade at noon in summer)',
  'Proximity to water (distance to nearest stream, stormwater inlet, or well)',
  'Utility line check — call 811 before any ground disturbance',
  'Existing vegetation: invasive species present, documented before removal',
  'Historical land use, if relevant to contamination risk',
  'Wildlife: nesting birds or protected species habitat nearby',
  'Access: mobility access for participants; shade and water available',
]
