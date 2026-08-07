# Security Policy

Exotopia.org is run by SCD Hub (Sustainable Community Development Hub), a
Colorado nonprofit. If you've found a security vulnerability, please report
it privately rather than opening a public issue — a public report gives
anyone a head start on exploiting it before we can fix it.

## Reporting a vulnerability

**Preferred: GitHub Private Vulnerability Reporting.**
Go to the [Security tab](https://github.com/biomassives/vercel-html-exotopia.org/security/advisories/new)
and click "Report a vulnerability." This opens a private draft advisory
visible only to maintainers — nothing is public until we agree it's safe to
disclose.

**Alternative:** email `legal@exotopia.org` with a description of the issue,
steps to reproduce, and its potential impact. Please don't include working
exploit code in the initial email — we'll ask for detail as needed once
we've acknowledged the report.

## What's in scope

- The Exotopia.org web app (this repository)
- Its Supabase backend (RLS policies, RPCs, migrations under `supabase/migrations/`)
- Authentication and session handling

## What's out of scope

- Third-party services we integrate with but don't operate (Vercel, Supabase's
  own infrastructure, IPFS pinning providers)
- Findings that require physical access to a user's device
- Social engineering against SCD Hub staff or volunteers

## What to expect

We'll acknowledge a new report within a few days. This is a small nonprofit
project without a dedicated security team or a bug bounty budget — we can't
promise a payout, but we will credit reporters (with permission) once a fix
ships, and we take every report seriously regardless of size.
