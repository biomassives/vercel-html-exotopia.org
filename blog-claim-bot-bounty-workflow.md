# The Claim Bot: A Complete Guide to Bounties on SCD Hub

## How to find work, claim it, submit it, and get paid — and how the system keeps itself honest

**SCD Hub / Exotopia.org — July 2026**

---

This is the operational guide for SCD Hub's bounty system. It is written for people who want to do the work: field data collectors, citizen scientists, subject matter experts, and community group coordinators. If you are deciding whether to participate, read the overview post first. If you have decided you want to participate and want to know exactly how it works, this is your document.

---

## What is a bounty?

A bounty is a specific environmental data task with a payment attached. It lives as an issue on the SCD Hub GitHub repository. It has:

- A description of exactly what needs to be done
- A list of what you need to deliver to get paid
- A stated amount (in USD equivalent) and available payment methods
- A deadline (for time-sensitive monitoring windows) or an open window

Bounties are not posted speculatively. Before a bounty is opened, the project team has confirmed that the protocol exists, the submission pathway to the relevant agency is functional, and the payment method is available. A bounty with a `bounty:$50` label and `status:open` means $50 is actually available and waiting.

---

## Finding bounties

### On GitHub

Go to the **Issues** tab of `github.com/biomassives/vercel-html-exotopia.org`.

Filter by the `bounty` label to see only bounty issues. You can stack filters:

```
label:bounty label:status:open
```

To narrow by region:
```
label:bounty label:status:open label:region:ke
```

To narrow by type:
```
label:bounty label:status:open label:type:water-quality
```

To find beginner-accessible bounties:
```
label:bounty label:status:open label:"good first issue"
```

Using the GitHub CLI (faster once you have it set up):
```bash
gh issue list --label bounty --label "status:open"
gh issue list --label bounty --label "status:open" --label region:ke
```

### Understanding the labels

Every bounty has labels that tell you the key facts at a glance:

| Label group | What it tells you |
|---|---|
| `bounty:$10` to `bounty:$200+` | The payment amount |
| `status:open` | Unclaimed — you can take it |
| `status:claimed` | Someone is working on it |
| `status:submitted` | A PR is under review |
| `status:verified` | Confirmed by the agency or reviewer |
| `status:paid` | Payment has been sent |
| `region:us` / `region:ke` / `region:cr` / `region:uk` / `region:ca` | Geographic target |
| `type:water-quality` / `type:pfas` / `type:tick` etc. | What kind of work |
| `agency:epa` / `agency:ea` / `agency:nema` / `agency:sinac` | Which agency (if it's an agency submission) |
| `good first issue` | Good starting point for first-time contributors |

### Choosing the right bounty

A few things to check before claiming:

**Do you have or can you get the required equipment?** Water quality bounties may require a pH/DO meter, turbidity tube, or Secchi disk. The issue body will list what is needed. If the project can supply equipment, it will say so. If you do not have access to required equipment and cannot source it locally, this bounty is not for you right now.

**Are you within reasonable distance of the target site?** The issue will name a site or geographic area. Some bounties are flexible — any creek in the target watershed — others specify a named location. You need to be able to physically reach the site within the collection window.

**Can you meet the submission deadline?** Some monitoring windows are time-sensitive — tick nymph sampling is most useful from May through July, HAB observations are summer-focused, some agency portals have quarterly submission windows. The issue will state the deadline.

**Do you match the expertise requirement?** Field record bounties are open to anyone with the listed equipment and basic protocol training. SME review bounties explicitly state the credentials or expertise needed — a curriculum review bounty that requires limnological expertise should not be claimed by someone without that background.

---

## Claiming a bounty

When you have found a bounty with `status:open` that you can do:

**Step 1.** Read the entire issue body, including the protocol link. The protocol link goes to the relevant section of `docs/eco-ops-workflow-guide.md` or to an external protocol reference (EPA Method 533 for PFAS sampling, for example). Read it before you claim. You are committing to following the protocol, and unknowingly deviating from it is the most common reason submissions are rejected.

**Step 2.** Comment `/claim` on the issue. The bot runs within a few minutes and does three things automatically:
- Assigns the issue to your GitHub account
- Removes the `status:open` label and adds `status:claimed`
- Posts a confirmation comment with a checklist of next steps

The confirmation comment looks like this:

> **👋 @your-handle — you've claimed this bounty!**
>
> Next steps:
> 1. Read the protocol guide linked in this issue before collecting data.
> 2. Use the Exotopia Eco Ops app to record your submission — it works offline.
> 3. When done, open a PR that closes this issue (`Closes #42`) and fill in the Bounty Submission section of the PR template.
> 4. A maintainer will verify and arrange payment once the PR is merged.
>
> If you can no longer complete this bounty, comment `/unclaim` to release it for others.

**Step 3.** Do the work.

---

## Doing the work

### Field record bounties

Use the SCD Hub monitoring wizard at `exotopia.org/#/eco-ops/monitor` or, if the site is specified in the issue, at `exotopia.org/#/eco-ops/sites/[site-id]`.

The wizard guides you through the data fields required for the record type. The relevant steps for a water quality record are:

1. **Site & time** — confirm the site, record the date and time of collection, add GPS coordinates if the site does not already have them stored
2. **Physical parameters** — temperature, pH, dissolved oxygen, turbidity, conductivity, Secchi depth if applicable
3. **Nutrients** — nitrate, phosphate, ammonia if your kit includes nutrient testing
4. **Biological** — macroinvertebrate BMWP score if you are doing a combined survey; cyanobacteria presence
5. **Photos & notes** — minimum two photos: one of the collection site, one of the equipment reading. Notes can include anything unusual about conditions, water appearance, smell, recent events (rain, upstream activity) that may be relevant to interpretation.

The wizard auto-saves every 500 milliseconds. If your signal drops or your battery dies mid-entry, the draft will be waiting when you return. The Submit button queues the record for sync — if you are offline when you tap it, the record queues locally and syncs automatically when you reconnect.

When the record has synced, you will see it in the Local Data panel under the **Synced** tab, with a record ID. **Save this record ID.** You will need it for your pull request.

### Agency submission bounties

Agency submission bounties require an additional step after data collection: filing the data with the agency.

The issue body will specify the agency and the submission pathway. Common ones:

**US EPA / state agencies.** Most state water quality portals accept CSV uploads or manual entry forms. The issue will link to the specific portal. You will need to create an account if you do not have one. Some state portals require a facility or site identifier — this will be provided in the issue or needs to be established as part of the bounty workflow.

**UK Environment Agency — Data Returns.** The EA accepts CSO event reports via their online portal at environment.data.gov.uk/water-quality, or via the EA Data Returns API for structured submissions. The EA also accepts direct phone reports for active CSO events. The issue will specify which pathway.

**NEMA (Kenya).** The National Environment Management Authority has an online reporting portal at nema.go.ke. For some submission types, physical filing at the Mombasa or Nairobi regional office is still required. The issue will specify.

**SINAC (Costa Rica).** Biodiversity observations go to INBio/SINAC's system. For monitoring sites on or adjacent to indigenous territory, you must have completed the FPIC process documented in `docs/eco-ops-workflow-guide.md §Tribal lands` before collecting or submitting data. This is a legal requirement, not a platform policy.

After submitting to the agency, you need the agency's confirmation — a reference number, a confirmation email, or a portal screenshot. This is your proof that the submission was accepted, not just sent.

### PFAS sample bounties

PFAS (per- and polyfluoroalkyl substances) bounties have additional chain-of-custody requirements because the samples go to an external laboratory for analysis, not just into the platform.

The issue will specify:
- Whether the laboratory is arranged by the project (you collect, ship to the named lab) or you need to arrange laboratory testing independently
- Which analytes are required (long-chain PFOS/PFOA panel, short-chain panel, or full 533-analyte list)
- Chain-of-custody form requirements (EPA Method 533 or 537.1 specify these)
- Sample container type and preservation requirements (1L polypropylene, keep at 4°C)

The bounty pays for the collection and documentation work, not the laboratory cost (unless stated in the issue). For bounties where the laboratory is project-arranged, shipping instructions will be provided after you claim.

---

## Submitting your work

When the data is collected and (if applicable) submitted to the agency, you open a pull request.

**Step 1.** Create a branch with a name that references the issue:
```bash
git checkout -b data/42-mpeketoni-water-july
```
(Replace `42` with your issue number.)

**Step 2.** If you have data files (CSV exports, chain-of-custody forms, agency confirmation PDFs), add them to the appropriate directory:
```
data/submissions/2026-Q3/kenya/mpeketoni-creek-water-2026-07-14.json
```

Use the template at `data/templates/water-quality-record.json` for water quality records. Fill in every field you have data for; leave fields null where you do not.

**Step 3.** Open a pull request. The PR template has a **Bounty Submission** section. Fill it in completely:

- **Agency / programme** — which agency this was submitted to (or "platform only" for field record bounties)
- **Site name & country** — exact site name and country
- **Record type** — water quality, tick drag, PFAS sample, etc.
- **Platform record ID** — the ID shown in the Synced tab of the Local Data panel after sync
- **Agency tracking / confirmation number** — the reference you received from the agency portal (leave blank for field-record-only bounties)

Check the boxes in the submission requirements section:
- [ ] Platform submission screenshot / record ID
- [ ] Agency confirmation email or reference number
- [ ] Data file added to `data/submissions/`
- [ ] Chain of custody form (PFAS)
- [ ] Photos (minimum 2) embedded or linked

**Step 4.** In the PR description, include `Closes #42` (your issue number). This links the PR to the bounty and tells GitHub to close the issue when the PR is merged.

**Step 5.** Request review from `@biomassives` or the maintainer named in the issue.

---

## Review and verification

A maintainer reviews your PR, typically within 48 hours. They are checking:

- That the platform record ID resolves to an actual record in the database matching the expected site, date, and record type
- That the data values are within plausible ranges (a pH of 14.2 in a freshwater creek is a data entry error, not a discovery)
- That the required photos are present and show what is claimed
- That the agency confirmation number matches the agency's portal (where this can be cross-checked)
- For PFAS samples: that the chain-of-custody form is complete and the samples shipped to the named laboratory

If something needs correction, the maintainer will leave a review comment rather than rejecting the PR outright. Address the comment and push to your branch — the PR updates automatically.

When the PR is approved and merged, two things happen:
1. The issue closes automatically (via the `Closes #` reference)
2. The issue label moves to `status:verified`

The maintainer then arranges payment via the method you specified when claiming, and marks `status:paid`.

---

## Payment

Payment is sent via the method stated in the bounty issue. Current available methods:

**M-Pesa (Kenya).** Direct B2C disbursement to a registered M-Pesa number. Payment typically arrives within one business day of verification. The Mpeketoni table banking group has an approved group payment workflow; individual claimers outside the group receive payments via the same infrastructure.

**Bank transfer.** SWIFT/SEPA for international transfers, or domestic bank transfer for US, UK, and Canadian claimers. Requires you to provide bank details via a private channel (not in the public PR — send by email or DM). Processing time: 3–5 business days.

**Algorand (ALGO).** Direct to your Algorand wallet address. Include your wallet address in the PR or comment it on the issue after the PR is merged. Settlement is typically within a few hours.

**Platform eco:certificate credit.** Rather than cash payment, you can receive the equivalent value as eco:certificate credit on the platform — contributing to your certificate tier and unlocking recognition within the SCD Hub network. This is particularly useful for academic contributors and organisations where receiving payment for volunteering creates complications.

---

## If you cannot complete a bounty

Life happens. If you have claimed a bounty but cannot complete it — equipment broke, you cannot reach the site, a personal emergency — comment `/unclaim` on the issue. The bot releases the assignment, swaps `status:claimed` back to `status:open`, and the bounty becomes available for the next person.

There is no penalty for unclaiming. What creates problems is disappearing without unclaiming — that leaves a bounty stuck in `status:claimed` indefinitely and prevents other people from picking it up. If you have been quiet on a claimed issue for more than a week without a PR, a maintainer will check in. After a further 3 days without response, the issue is released.

---

## The `/claim` bot in detail

For contributors who want to understand how the automation works:

The bot is a GitHub Actions workflow (`.github/workflows/bounty-claim.yml`) that triggers on issue comment events. It runs when:
- A comment is created on an issue (not a PR)
- The comment body contains `/claim`
- The issue has the `bounty` label

On trigger, it calls the GitHub REST API to:
1. Fetch the current labels on the issue
2. Remove `status:open` and add `status:claimed`
3. Add the commenter to the issue's assignees list
4. Post a reply comment with the next-steps template

The `/unclaim` handler runs similarly, reversing the label swap and removing the commenter from assignees.

The bot uses the `GITHUB_TOKEN` that Actions provides automatically — no additional secrets or configuration required. It has `issues: write` permission, which is the minimum required for the label and assignee operations.

A few edge cases the bot handles gracefully:
- If you comment `/claim` on an issue that is already `status:claimed`, the bot does not reassign it — but it also does not currently post a "this is already claimed" warning. A future version will do that.
- If the issue does not have `status:open` as a label (for example, a bounty that was never properly labelled), the label swap will simply add `status:claimed` without removing anything, which will be visible in the issue history.
- The bot does not verify that you have the expertise or equipment for the bounty — it just assigns and labels. The review stage is where verification happens. Do not claim bounties you cannot complete.

---

## SME bounties — a different workflow

Subject matter expert bounties for curriculum review, protocol development, or data interpretation have a somewhat different flow.

**Claiming.** Same as above — `/claim` on the issue.

**Doing the work.** The deliverable is typically a document rather than a data file — a review memo, a corrected protocol version with tracked changes, a species identification key. The issue will specify the format and expected length.

**Submitting.** Open a PR adding the deliverable to the relevant docs directory (`docs/` for protocol updates, `blog-` prefix for curriculum reviews intended for publication). In the PR description, explain your credentials and the basis for any changes or recommendations you are making.

**Review.** SME review PRs are reviewed by the project lead and, where possible, by a second SME. The standard is higher than for field record bounties — the output needs to be accurate enough to be followed by field workers who may have no independent means of checking it.

**Payment.** Same methods as field bounties. SME payments are higher and typically in the $100–300 range. The exact amount is stated in the issue.

---

## For organisations and groups

If you are coordinating a group of claimers — a school, a community cooperative, a watershed council — a few things are useful to know:

**One GitHub account per claimer.** The bot assigns the issue to the individual commenter. If multiple people from a group are doing the work together, the group coordinator should claim, and the PR should acknowledge all contributors in the description.

**Group payment.** If your group uses M-Pesa and is working in the Mpeketoni area, the table banking group payment workflow is available. For other groups, discuss with the project lead before claiming — we can arrange group payment structures for verified partners.

**Volume arrangements.** If your group wants to claim multiple bounties in a monitoring season, contact the project before posting claims on more than three issues at once. We want to confirm you have the capacity to complete what you claim — half-completed bounties in `status:claimed` that never produce a PR block other contributors.

---

## What makes a good submission

The reviewers who verify bounty PRs have seen enough submissions to know what distinguishes work that gets approved immediately from work that generates a back-and-forth:

**GPS coordinates matter.** A water quality record without GPS is much less valuable than one with it. Every submission should include coordinates to at least five decimal places. The monitoring wizard records these automatically if you allow location access.

**Photos should be informative, not decorative.** A photo of the sensor display showing a pH reading is useful. A photo of the general scenery around the site is not (though a site photo as one of your two required images is fine). A photo of the sample bottle with the site label and collection time visible is exactly what reviewers want to see.

**Timestamps should match.** The timestamp in the platform record, the timestamp on the chain-of-custody form, and the timestamp in the photo metadata should all be consistent with the same collection event. Discrepancies create questions.

**Notes should be specific.** "Normal conditions" is not useful. "Overcast, 18°C air temperature, minor recent rainfall (~5mm yesterday, site not visibly turbid), upstream cattle crossing 200m from sample point noted" is useful.

**Agency confirmation numbers should be exact.** Copy them character for character. A confirmation number that cannot be verified against the agency portal will delay payment.

---

## Questions

If something in this guide is unclear, the best place to ask is the Discord server — link in the repository's issue template config. For questions about specific bounties, comment directly on the issue. For payment-related questions, contact Greg Willson at acmeideal@gmail.com with the issue number in the subject line.

---

*The bounty issue templates are at `.github/ISSUE_TEMPLATE/` in the repository. The automation workflow is at `.github/workflows/bounty-claim.yml`. The full platform tech spec is `SPEC_ECO_OPS_API.md`. For an overview of why we built this, read the companion post: "Field-Ready and Globally Connected."*
