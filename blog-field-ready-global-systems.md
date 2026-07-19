# Field-Ready and Globally Connected: Offline-First Citizen Science and the SCD Hub Bounty Network

## How we built a system that works in rural Kenya, coastal Costa Rica, and a Vermont watershed — and what a GitHub bounty has to do with an EPA submission

**SCD Hub / Exotopia.org — July 2026**

---

A monitoring record submitted from a creek bed in Mpeketoni, Lamu County — where mobile data comes and goes with the weather and the distance to the nearest repeater — needs the same chance of reaching a database as one submitted from a university lab in Burlington, Vermont with a stable fibre connection. If the system only works reliably in conditions where it is least needed, it is not a system for the communities it claims to serve.

This post describes two interlocking systems we just shipped: an offline-first field data layer that stores, queues, and syncs monitoring records without requiring continuous connectivity, and a global bounty network that compensates community members, field teams, and subject matter experts for completing specific environmental data tasks — including direct submissions to regulatory agencies. Together they represent a significant shift in what SCD Hub actually is: less a platform people use when convenient, and more infrastructure that communities can depend on for work that matters.

---

## Part 1: The offline-first field layer

### What "offline-first" means in practice

Most web applications treat offline as an edge case — something that happens briefly during a tunnel or when you forget to pay your mobile bill. The application tries to do what it normally does, fails, and shows you an error message.

Offline-first inverts the assumption. The application is designed from the ground up to work without a network, and network access is treated as an enhancement rather than a prerequisite. This distinction is not philosophical — it determines whether the application is usable at a monitoring site three kilometres down a dirt road from the nearest cell tower.

For SCD Hub's field operations, the relevant failure modes are concrete:

- A field team reaches a creek sample point and has no signal. They need to complete a water quality record, attach three photos, and note GPS coordinates. If the app requires connectivity to save anything, the data is lost or never collected.
- A submission to an agency portal succeeds on the app side, but the server request times out on a 2G connection before the response arrives. The user sees an error and submits again. The agency receives a duplicate.
- A draft monitoring record is half-completed when the phone battery dies. On restart, the record is gone.

The system we've built handles all three scenarios.

### The technical foundation

The offline layer has three components that work together:

**Progressive Web App (PWA) shell.** The application is installable on Android and iOS home screens without going through an app store. The app shell — all the HTML, JavaScript, and CSS needed to display the monitoring wizard — is pre-cached by the browser's service worker on first load. After that, opening the app requires no network connection at all. Cached OpenStreetMap tiles for your monitored sites' geographic area mean the map works offline too.

**IndexedDB submission queue.** When you complete a monitoring record and tap Submit, the record goes into a local IndexedDB database on your device. It does not go directly to the server. The service worker watches for connectivity and sends the queued record when a connection is available — this happens automatically, in the background, even if the app is closed. The queue retains submissions for 24 hours before expiring retry attempts. If the network comes back at 3am while your phone is charging, the record syncs without you doing anything.

**Local draft persistence.** Every field in the monitoring wizard is saved to the device every 500 milliseconds as you fill it in. If you close the app, your battery dies, or you navigate away, the draft is waiting for you when you return. Multiple drafts can be active at once — useful when you are monitoring several sites on the same day. Each draft has a unique identifier so returning to Site A after visiting Site B retrieves the right record.

### What the field worker sees

The experience is designed to be invisible. If you have connectivity, records sync immediately. If you lose connectivity partway through a monitoring session, a thin status bar appears at the top of the screen: *"Offline — tap to manage local queue."* Tapping it opens a panel showing exactly what is queued, what has synced, and what (if anything) has failed and why.

The Local Data panel has four tabs:
- **Pending** — records waiting for connectivity
- **Failed** — records that attempted to sync but encountered an error, with the error message and a Retry button
- **Drafts** — in-progress records you can tap to resume
- **Synced** — recent records that have been confirmed delivered, removable after 7 days

Failed records show the actual error string, not a generic "something went wrong." This matters in the field: if a record failed because an authentication token expired, the fix is to re-login; if it failed because the GPS coordinates were outside the valid range for the selected country, the fix is to re-check the coordinates. Hiding error details from field users treats them as less capable than they are.

### Photos

Photos are resized on the device before storage. A standard Android camera photo is 3–8 megabytes. A field monitoring session with five photos would store 15–40 megabytes in the device's local database — against a typical IndexedDB quota of a few hundred megabytes, this fills up faster than expected. The system resizes every photo to a maximum of 1280 pixels on the long edge at 78% JPEG quality before storing it, reducing a 5MB photo to approximately 150–200KB without meaningful loss of detail for documentation purposes. Photos upload to cloud storage after the monitoring record itself syncs, as a separate non-blocking operation, so a photo upload failure does not prevent the record from reaching the database.

---

## Part 2: The global bounty network

### The problem with volunteer-only citizen science

Citizen science programmes are typically designed around the assumption that participants are motivated entirely by interest, learning, and community contribution. This is true for many participants. It is not true for everyone, and it is not a sufficient foundation for generating the volume and geographic coverage of data that environmental monitoring at scale requires.

The populations most likely to be monitoring near critical sites — subsistence farming communities adjacent to PFAS-contaminated industrial sites, fishing communities whose water quality determines their livelihood, pastoralists whose land tenure depends on documented environmental baselines — are not in a position to contribute labour for free. Asking a Mpeketoni cooperative member to spend a day sampling creek water and submitting the results to an environmental authority, without compensation, is asking them to subsidise a public good at personal cost. This is not a sustainable model and it produces the systematic gaps in environmental data that correspond exactly to the communities that most need the data collected.

The bounty network is our response to this. It is a structured system for compensating specific, verified acts of environmental data collection and agency submission.

### What a bounty is

A bounty is a GitHub Issue with a reward attached. It describes a specific environmental data task — a water quality record at a named site, a PFAS field sample with chain-of-custody documentation, a direct submission to the UK Environment Agency's Data Returns portal, a macroinvertebrate BMWP survey on a named waterbody — along with the data requirements, the verification criteria, the payment amount, and the payment method available (M-Pesa for Kenya-based claimers, bank transfer, Algorand ALGO, or platform eco:certificate credit).

Anyone with a GitHub account can claim a bounty by commenting `/claim` on the issue. A bot assigns the issue to them, swaps the label from `status:open` to `status:claimed`, and posts a confirmation with next steps including a link to the protocol guide and the platform monitoring wizard.

When the work is done, the claimer opens a pull request referencing the issue (`Closes #42`), attaches evidence — the platform record ID, agency confirmation number, photos, chain-of-custody form — and a maintainer reviews and merges. Payment follows.

### The four categories of bounty

**Field record bounties** are the most common and accessible. They pay $10–50 for completing a monitoring record at a specific site using the platform's monitoring wizard. The record goes into the database, contributes to the longitudinal dataset for that site, and may qualify the claimer for an eco:certificate after a threshold number of contributions.

**Agency submission bounties** pay $25–200 for completing the full cycle of data collection and formal submission to a regulatory agency. In the US, this means submitting water quality, PFAS, or HAB data to the relevant EPA or state environmental agency portal. In the UK, it means filing a CSO event observation via the Environment Agency's Data Returns API or the citizen reporting pathway. In Kenya, NEMA. In Costa Rica, SINAC. The higher payment reflects the additional time, documentation burden, and expertise required to successfully navigate an agency submission, and the fact that the data, once formally submitted, is now part of the public record in a way that a platform record alone is not.

**SME review bounties** pay $100–300 for subject matter expert review of protocol documentation, curriculum units, data interpretation, or species identification. A limnologist reviewing the Cyanobacteria Watch curriculum for scientific accuracy is performing a different kind of work than a community member collecting a water sample — one that requires credentials and professional judgement — and the bounty system can compensate for that distinctly.

**Protocol development bounties** are the rarest and highest-value. They pay for developing new monitoring protocols for our platform — adapting UK BMWP biotic indices for Kenyan waterbodies, translating PFAS chain-of-custody requirements for Costa Rica's regulatory context, or developing a phenology protocol that integrates with USA-NPN's observation framework. These are open to ecologists, environmental scientists, and regulatory specialists who can commit to producing documentation that passes peer review by another SME.

### Global reach

The bounty network currently covers five country contexts, each with its own regulatory pathway and payment infrastructure:

**United States — East Coast focus.** EPA water quality submissions, state agency portals, tick surveillance data (submitted to TickSpotters/URI and state health departments), HAB observations (state-specific reporting portals, linked from the US HAB network). Payment via bank transfer or Algorand.

**Kenya — Lamu Coast priority.** The Mpeketoni watershed is our primary active site, through the existing relationship with the Uni-Kibaoni-Peace-Youth-SHG group. Kenya also has a NEMA submission pathway for water quality data. Payment via M-Pesa B2C — the infrastructure for this was already in place from the table banking work, and it supports direct disbursement to registered M-Pesa numbers with quorum approval from group leadership.

**Costa Rica.** SINAC (biodiversity) and SETENA pathways. FPIC (Free, Prior and Informed Consent) requirements are built into the issue template for any site on or adjacent to indigenous lands — Costa Rica ratified ILO Convention 169 in 1993 and the requirement is not optional. Payment via bank transfer.

**United Kingdom.** The UK's ongoing combined sewer overflow (CSO) crisis — in which water companies have discharged raw sewage into rivers and coastal waters at volumes that are only now being fully understood through mandatory monitoring requirements introduced in 2023 — creates a specific, urgent monitoring need. The EA's Data Returns API accepts citizen-reported CSO observations. These are exactly the kind of platform-compatible records the bounty system supports. Payment via bank transfer.

**Canada.** Environmental monitoring support for ECCC (Environment and Climate Change Canada) pathways. Still early stage; waterbody phenology and freshwater macroinvertebrate protocols are the initial focus.

### Dual platform presence — GitHub and GitLab

Bounties live as GitHub Issues on the `biomassives/vercel-html-exotopia.org` repository. The same repository is mirrored to GitLab automatically on every merge to `main` via a GitHub Actions workflow, so both platforms stay current. GitLab's pull-mirror feature can also be used as a passive backup.

We maintain the dual presence because not all contributors have or want GitHub accounts. GitLab is preferred in some open-source communities, in some academic environments, and in some countries where GitHub's track record on content moderation or data localisation is a concern. The bounty issue system lives on GitHub because GitHub's issue templates, label automation, and GitHub Actions webhooks (which power the `/claim` bot) are more mature. GitLab serves as a read mirror and alternative contribution entry point — we can evaluate GitLab Issues for bounty management in a future phase if the community prefers it.

---

## Who this is for

This post is addressed to several distinct groups, and we want to be direct with each of them.

**Community field teams in Kenya, Costa Rica, and the UK:** The offline system was built for the conditions you actually work in. You do not need continuous data to use it. You do not need a laptop. An Android phone with the PWA installed and map tiles cached for your area is sufficient for a full monitoring session. The bounty system pays for completed, verified work — not for volunteering.

**Environmental scientists and subject matter experts:** Protocol review, curriculum accuracy checking, and species identification are paying bounties. If you have capacity to contribute expertise in short engagements — a few hours of curriculum review, a data interpretation note — there is a structured way to do that and be compensated. See the detailed bounty workflow post linked at the end of this article.

**Educators and curriculum developers:** The citizen science units published in June are active bounty candidates for SME review and field testing. If you are a secondary school science teacher or community college educator who wants to pilot one of the programmes, contact us — we can match you with a monitoring protocol, equipment guidance, and a maintainer for the site's data.

**Funders and partner organisations:** The bounty system creates a transparent, auditable record of what was paid for what. Every bounty issue, every claim, every verification, and every payment method is documented in the public GitHub repository history. There are no private payment relationships. This makes it straightforwardly compatible with grant accounting requirements and organisational transparency policies.

**Developers:** The full technical spec (`SPEC_ECO_OPS_API.md`) documents the API, database schema, edge functions, PWA manifest, and service worker caching strategies. The codebase is open and PRs are welcome on technical infrastructure as well as data submissions.

---

## What we are not claiming

This system is early. The bounties are live as a mechanism, but the first round of agency-submission bounties has not yet been fully posted. The offline system has been built and is in the codebase, but is being tested this week with two user groups — the Mpeketoni team and a second group — and field testing may reveal problems we have not anticipated. M-Pesa disbursement for bounty payments requires additional approval workflow distinct from the existing table banking infrastructure.

We are also not claiming that paying for field records solves the structural problems in environmental data collection. It addresses one barrier — the cost of participation for communities with limited discretionary time — while leaving others intact, including equipment access, transport to monitoring sites, language accessibility of protocol documentation, and the regulatory capacity of agencies to receive and act on submitted data.

The system as designed is a beginning, not a solution.

---

## What comes next

The immediate next steps are:

- Post the first wave of field record bounties for Mpeketoni creek sites and US East Coast HAB and tick monitoring, with payment confirmed for M-Pesa, bank transfer, and ALGO
- Complete field testing of the offline PWA with both user groups and address any critical bugs before the first bounties go live
- Publish the detailed bounty workflow post (see below) for potential claimers
- Update the global project spec to formally incorporate the bounty system and the updated geographic scope

If you want to participate — as a claimer, a reviewer, a protocol developer, or a partner organisation — the entry points are the GitHub repository, the Discord server, and the email address below.

---

*The technical spec for the eco ops API, PWA offline system, and bounty infrastructure is in `SPEC_ECO_OPS_API.md` in the repository. The detailed bounty workflow is published separately as "The Claim Bot: A Step-by-Step Guide." Contact: Greg Willson, acmeideal@gmail.com.*
