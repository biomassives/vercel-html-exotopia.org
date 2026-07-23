# Lawful Request Response Policy (internal)

**Status**: Draft — internal working policy, not yet reviewed by counsel.
**Scope**: Governs how the team responds to government, law-enforcement, or
civil legal requests for user data — most relevantly, requests touching the
private member-comment feature described in `legal-privacy.md` and
`blog-online-safety-and-private-comms.md`.

This exists because "we don't build surveillance infrastructure" and "we
have no process for handling a subpoena" are two different claims, and only
the first one is a design commitment we intend to keep. The second needs an
actual answer — this document is that answer, kept current as the process
matures.

---

## 1. What we don't do, regardless of a request

- We do not build or enable bulk, ongoing, or automated monitoring of private
  comments, DMs, or other member-to-member content, for any requester,
  including ourselves. If a request asks for that, the answer is no —
  narrow it to specific, identified content/accounts and a defined time
  range, or we contest it.
- We do not proactively scan message content looking for problems. Anything
  we can see about a specific report came from the recipient reporting it,
  not from us reading ahead of time.

## 2. What we do when a request arrives

1. **Verify it's real and facially valid** — a legitimate court order,
   subpoena, or equivalent from a body with actual jurisdiction over us or
   our data. Informal requests (an email claiming to be from an agency, no
   attached legal process) are not honored without independent verification.
2. **Scope check** — does the request ask for exactly what it's legally
   entitled to, or is it broader? Overbroad requests get pushed back on
   before any data is produced, not complied with "to be safe."
3. **Minimum necessary** — we produce what's specifically requested and
   nothing beyond it. We do not proactively volunteer additional data "while
   we're at it."
4. **Notice, where legally permitted** — unless under a gag order or
   equivalent legal restriction, we attempt to notify the affected user
   before producing their data, so they have a chance to challenge it
   themselves if they choose to.
5. **Log it** — every request (granted, contested, or declined) is logged
   internally with date, requester, scope, and outcome, so we can answer "how
   many requests did you get and what did you do" honestly if ever asked.

## 3. What we push back on

- Requests without valid legal process attached.
- Requests broader than what the underlying legal authority actually
  supports.
- Requests that would require us to build new monitoring capability we don't
  already have (we will explain that the capability doesn't exist rather
  than build it to comply).
- Requests from a jurisdiction with no legal authority over us or the data
  in question.

## 4. Escalation

Any request should go to **[LEGAL/PRIVACY CONTACT — same address as
`legal-privacy.md` § 12]** before anything is produced. No single team member
acts on a legal request unilaterally.

## 5. Relationship to the public-facing Privacy Policy

`legal-privacy.md`'s private-comments section currently just points here.
Once this policy has had an actual legal review, the intent is to publish a
plain-language summary of it directly in the Privacy Policy — this document
is the working draft that summary will be built from.
