# Git Collaboration Guide — Exotopia / Eco Ops

For a solo git expert leading a group for the first time.
This covers everything that changes when other people are in the repo.

---

## The core mental shift

Solo git: you can do anything to any branch at any time.
Group git: `main` is protected. Everything else is negotiated via pull requests.

You are no longer *making changes* — you are *approving changes*. Your job as project lead shifts from committing to reviewing, labeling, and merging.

---

## Branch protection (set this up first)

Go to **Settings → Branches → Add branch ruleset** on GitHub:

| Setting | Value |
|---|---|
| Branch name pattern | `main` |
| Require a pull request before merging | ✓ |
| Required approvals | 1 |
| Dismiss stale reviews when new commits pushed | ✓ |
| Require status checks to pass | ✓ (Vercel preview deploy) |
| Do not allow bypassing above settings | ✓ for everyone except you |
| Allow force pushes | ✗ |

**Why this matters:** Without branch protection, a contributor can `git push origin main` directly and deploy broken code to production. The rule above means even you need to go through a PR — which is good discipline and gives you an audit trail.

---

## Label taxonomy

Create these labels in **Issues → Labels** (GitHub doesn't read a file for this — you have to click):

### Bounty labels
| Label | Color | Meaning |
|---|---|---|
| `bounty` | `#e4a700` gold | This issue has a reward |
| `bounty:$10` through `bounty:$200+` | `#e4a700` | Bounty tier |
| `status:open` | `#0075ca` blue | Unclaimed, anyone can pick it up |
| `status:claimed` | `#7057ff` purple | Assigned, in progress |
| `status:submitted` | `#008672` green | PR opened, awaiting review |
| `status:verified` | `#0e8a16` dark green | Data confirmed by agency |
| `status:paid` | `#cfd3d7` grey | Payment sent |

### Region labels
`region:us` `region:ke` `region:cr` `region:uk` `region:ca`

### Type labels
`type:water-quality` `type:pfas` `type:tick` `type:hab` `type:macroinvert` `type:phenology` `type:cso`

### Agency labels
`agency:epa` `agency:ea` `agency:nema` `agency:sinac` `agency:state`

### Standard labels
`good first issue` `help wanted` `documentation` `bug` `feature` `blocked` `wontfix`

**Tip:** You can import a label set from another repo using the [GitHub CLI](https://cli.github.com/):
```bash
gh label clone biomassives/some-other-repo
```

---

## Branch naming convention

Everyone on the team uses these prefixes:

| Prefix | Use for |
|---|---|
| `feat/` | New features: `feat/eco-ops-pfas-wizard` |
| `fix/` | Bug fixes: `fix/offline-queue-shared-state` |
| `data/` | Data submissions, bounty PRs: `data/site-mpeketoni-water-2026-07` |
| `docs/` | Protocol guides, blog posts: `docs/east-coast-tick-protocol` |
| `bounty/` | Work-in-progress bounty code changes: `bounty/42-epa-submission-form` |
| `infra/` | CI, Actions, Vercel config: `infra/mirror-to-gitlab` |

The number in `bounty/42-...` is the issue number — makes it easy to find the PR from the issue.

---

## The bounty workflow — step by step

### As project lead: opening a bounty

1. Click **Issues → New Issue → Bounty — Agency Submission** (or Field Record)
2. Fill in the form — every field matters; vague bounties attract vague submissions
3. Add labels: `bounty`, `bounty:$XX`, `status:open`, `region:XX`, `type:XX`, `agency:XX`
4. Add to the relevant **Milestone** (see below)
5. Post the issue link in Discord / community channels

### As a contributor: claiming a bounty

1. Read the entire issue, including the protocol link
2. Comment `/claim` — the bot assigns you and swaps the label to `status:claimed`
3. Create a branch: `git checkout -b data/42-mpeketoni-water-july`
4. Do the field work using the platform (offline mode works)
5. Open a PR with `Closes #42` in the body
6. Fill in the Bounty Submission section of the PR template
7. Request review from `@biomassives`

### As project lead: reviewing a bounty submission

1. Verify the data against the requirements listed in the issue
2. Check the agency confirmation number or platform record ID
3. If good: approve + merge. The bot should auto-label `status:submitted`
4. Mark `status:verified` when confirmed by the agency
5. Arrange payment via the method the contributor listed; add `status:paid`

---

## Milestones — how to organize work in time

Milestones in GitHub act like sprints or seasons. Create one per monitoring window:

| Milestone | Due date | What it covers |
|---|---|---|
| `Q3-2026 US East` | 2026-09-30 | Tick, HAB, water quality — East Coast summer window |
| `Q3-2026 Kenya` | 2026-09-30 | Mpeketoni water + macroinvertebrate baseline |
| `Q3-2026 Costa Rica` | 2026-09-30 | SINAC biodiversity submissions |
| `Q4-2026 PFAS` | 2026-12-15 | PFAS sampling push before winter |

Assign every bounty issue to the correct milestone when you open it. This gives you a progress bar you can share with funders and partners — e.g. "7 of 12 Q3 bounties claimed, 3 verified."

---

## GitHub ↔ GitLab mirror

### Option A — GitLab pull mirror (recommended, zero GitHub setup)

1. In GitLab, create a new project (or use existing)
2. Go to **Settings → Repository → Mirroring repositories**
3. Click **Add new**:
   - URL: `https://github.com/biomassives/vercel-html-exotopia.org.git`
   - Direction: **Pull**
   - Mirror branches: all
   - Authentication: GitHub Personal Access Token (public repos work without one)
4. Click **Mirror now** to do a first sync, then it runs every ~5 minutes

GitLab becomes a read mirror. PRs, Issues, and primary workflow stay on GitHub.

### Option B — GitHub Actions push mirror (instant sync, requires setup)

The workflow `.github/workflows/mirror-to-gitlab.yml` is already in this repo.
To activate it:

1. In GitLab, create a **Project Access Token**: Settings → Access Tokens
   - Token name: `github-mirror`
   - Scopes: `write_repository`
   - Copy the token value
2. In GitHub, add two secrets (Settings → Secrets → Actions → New):
   - `GITLAB_TOKEN` = the token from step 1
   - `GITLAB_REPO`  = `biomassives/exotopia-org` (your GitLab path)
3. The workflow fires on every push to `main` — sync is instant

Both options can coexist. Option A is the safety net if the Actions workflow fails.

---

## Practical tips for new group managers

### The trap: too many open PRs with no feedback

When contributors open PRs and get no response for days, they disengage.
**Rule:** review every PR within 48 hours, even if just to say "looks good, needs one thing."

### The trap: approving PRs you haven't actually read

If you merge a data PR without checking the actual GPS coordinates or protocol compliance, bad data enters the record. Bounty reviews are different from code reviews — treat them like peer review, not rubber-stamping.

### The trap: labels falling out of date

The `/claim` bot handles `status:open` → `status:claimed`, but you must manually move to `status:verified` and `status:paid`. Do this immediately when it happens or you'll lose track.

### The trap: force-pushing to fix a mistake

When you make a mistake on `main`, the instinct is `git push --force`. Don't. Open a fix PR instead — even if it's one line. This keeps the history readable for future contributors trying to understand why something changed.

### Giving contributors write access

Only give `Write` access (not `Maintain` or `Admin`) to contributors you trust. `Write` lets them push branches and merge approved PRs — which is all they need. The CODEOWNERS file ensures your approval is still required for sensitive paths even if they have `Write` access.

### When a contributor disappears mid-bounty

Wait 7 days after the claim date with no activity. Then comment tagging them: `@username — still working on this? If not, I'll release it.` If no response in 3 days, unassign them, swap to `status:open`, and post in Discord.

---

## Useful GitHub CLI commands for day-to-day management

```bash
# Install: https://cli.github.com/
gh auth login

# List all open bounty issues
gh issue list --label bounty --label status:open

# List all claimed bounties (check who needs a check-in)
gh issue list --label status:claimed

# Close a verified bounty and add status:paid
gh issue edit 42 --add-label "status:paid" --remove-label "status:verified"
gh issue close 42 --comment "Payment sent via M-Pesa. Thank you!"

# See what's in a milestone
gh issue list --milestone "Q3-2026 Kenya"

# Create a bounty issue from the CLI (opens the form in browser)
gh issue create --template bounty-agency-submission.yml

# Review a PR
gh pr review 57 --approve --body "Data verified against EPA portal. Merging."
gh pr merge 57 --squash
```

---

## File layout for data submissions

Data submitted via bounty PRs goes here:

```
data/
  submissions/
    2026-Q3/
      us-east/
        tick-watch-ne-vt-001.json
        water-quality-lake-champlain-001.csv
      kenya/
        mpeketoni-creek-water-2026-07-15.json
      costa-rica/
        sinac-biodiversity-submission-2026-07.pdf
    2026-Q4/
      ...
  templates/
    water-quality-record.json
    chain-of-custody-pfas.pdf
```

Each file name: `<site-slug>-<record-type>-<YYYY-MM-DD>.<ext>`

---

*This guide lives at `docs/git-collaboration-guide.md`. Update it as your workflow evolves.*
