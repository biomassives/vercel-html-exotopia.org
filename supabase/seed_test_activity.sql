-- ============================================================================
-- seed_test_activity.sql
--
-- DEV/TEST ONLY. NOT a migration — same rules as seed_test_accounts.sql,
-- which this file depends on and must be run AFTER:
--
--   psql "$SUPABASE_DB_URL" -f supabase/seed_test_accounts.sql
--   psql "$SUPABASE_DB_URL" -f supabase/seed_test_activity.sql
--
-- Populates the 19-account interface-testing cohort (12 students, 4
-- teachers, 2 sysadmins, 1 coder-AI liaison) with activity that exercises
-- most of the app's real, RLS-guarded write paths, so the interface can be
-- reviewed against actual rows rather than an empty database. Every action
-- below is something a real member could have done through the app UI (or,
-- where noted, an admin console) — nothing here bypasses a CHECK constraint
-- or invents a status value the schema doesn't already define.
--
-- Where the schema derives rewards/certificates via triggers (proposal
-- endorsements, mentor-session confirmation), this file inserts only the
-- triggering row and lets the trigger produce the reward_events/certificate
-- rows itself, same as the real app would. Where an action is genuinely
-- self-reported client-side (decon progress logs, knowledge-keeper records,
-- method-proposal publishing) this file adds the matching reward_events row
-- by hand, since no DB trigger creates those — the real client calls
-- award_self_reported() for that, which isn't available outside a live
-- session. A final `refresh_certificates()` pass derives every threshold
-- certificate (field_volunteer, pfas_field_researcher, mentorship) from
-- whatever ledger state this file produced, exactly as the real RPC would.
--
-- Fixed UUIDs throughout (ON CONFLICT DO NOTHING on whatever the table's
-- natural uniqueness is) so re-running this file is a no-op, matching
-- seed_test_accounts.sql's own idempotency convention.
--
-- Persona shape used below:
--   4 "classes", each one teacher + 3 students, roughly mirroring a real
--   classroom cohort running a shared PFAS decontamination study:
--     teacher_01 + student_01/02/03   (Aurora Basin Watershed, GAC pilot)
--     teacher_02 + student_04/05/06   (Dock Runoff Site, IX trial)
--     teacher_03 + student_07/08/09   (Highland Springs, phytoremediation)
--     teacher_04 + student_10/11/12   (Lowland Marsh, SCWO feasibility)
--   admin_01/02 moderate (review a held Knowledge Keeper record, archive a
--   listing, grant a couple of admin-verified reward events) rather than
--   participate as contributors. coder_ai exercises the one area nothing
--   else here touches (branch_settlements) plus a thin comment/listing —
--   a liaison persona, not a heavy user.
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. Connections — the green-light mesh that makes comments/reactions/
--    mentor-session visibility work under RLS (public.is_connected).
--    Each class is fully meshed peer-to-peer, plus teacher<->each student.
--    Canonical form from_id < to_id (matches the fixed-UUID suffix order).
-- ============================================================================

INSERT INTO public.connections (from_id, to_id, status, accepted_at) VALUES
  -- Class A: teacher_01 (116) + student_01/02/03 (104/105/106)
  ('11111111-1111-1111-1111-111111111104', '11111111-1111-1111-1111-111111111105', 'accepted', now() - interval '20 days'),
  ('11111111-1111-1111-1111-111111111104', '11111111-1111-1111-1111-111111111106', 'accepted', now() - interval '20 days'),
  ('11111111-1111-1111-1111-111111111105', '11111111-1111-1111-1111-111111111106', 'accepted', now() - interval '20 days'),
  ('11111111-1111-1111-1111-111111111104', '11111111-1111-1111-1111-111111111116', 'accepted', now() - interval '21 days'),
  ('11111111-1111-1111-1111-111111111105', '11111111-1111-1111-1111-111111111116', 'accepted', now() - interval '21 days'),
  ('11111111-1111-1111-1111-111111111106', '11111111-1111-1111-1111-111111111116', 'accepted', now() - interval '21 days'),
  -- extra mentee for teacher_01's 4th mentor session (student_04, borrowed from class B)
  ('11111111-1111-1111-1111-111111111107', '11111111-1111-1111-1111-111111111116', 'accepted', now() - interval '15 days'),

  -- Class B: teacher_02 (117) + student_04/05/06 (107/108/109)
  ('11111111-1111-1111-1111-111111111107', '11111111-1111-1111-1111-111111111108', 'accepted', now() - interval '19 days'),
  ('11111111-1111-1111-1111-111111111107', '11111111-1111-1111-1111-111111111109', 'accepted', now() - interval '19 days'),
  ('11111111-1111-1111-1111-111111111108', '11111111-1111-1111-1111-111111111109', 'accepted', now() - interval '19 days'),
  ('11111111-1111-1111-1111-111111111107', '11111111-1111-1111-1111-111111111117', 'accepted', now() - interval '19 days'),
  ('11111111-1111-1111-1111-111111111108', '11111111-1111-1111-1111-111111111117', 'accepted', now() - interval '19 days'),
  ('11111111-1111-1111-1111-111111111109', '11111111-1111-1111-1111-111111111117', 'accepted', now() - interval '19 days'),

  -- Class C: teacher_03 (118) + student_07/08/09 (110/111/112)
  ('11111111-1111-1111-1111-111111111110', '11111111-1111-1111-1111-111111111111', 'accepted', now() - interval '16 days'),
  ('11111111-1111-1111-1111-111111111110', '11111111-1111-1111-1111-111111111112', 'accepted', now() - interval '16 days'),
  ('11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111112', 'accepted', now() - interval '16 days'),
  ('11111111-1111-1111-1111-111111111110', '11111111-1111-1111-1111-111111111118', 'accepted', now() - interval '16 days'),
  ('11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111118', 'accepted', now() - interval '16 days'),
  ('11111111-1111-1111-1111-111111111112', '11111111-1111-1111-1111-111111111118', 'accepted', now() - interval '16 days'),

  -- Class D: teacher_04 (119) + student_10/11/12 (113/114/115)
  ('11111111-1111-1111-1111-111111111113', '11111111-1111-1111-1111-111111111114', 'accepted', now() - interval '14 days'),
  ('11111111-1111-1111-1111-111111111113', '11111111-1111-1111-1111-111111111115', 'accepted', now() - interval '14 days'),
  ('11111111-1111-1111-1111-111111111114', '11111111-1111-1111-1111-111111111115', 'accepted', now() - interval '14 days'),
  ('11111111-1111-1111-1111-111111111113', '11111111-1111-1111-1111-111111111119', 'accepted', now() - interval '14 days'),
  ('11111111-1111-1111-1111-111111111114', '11111111-1111-1111-1111-111111111119', 'accepted', now() - interval '14 days'),
  ('11111111-1111-1111-1111-111111111115', '11111111-1111-1111-1111-111111111119', 'accepted', now() - interval '14 days'),

  -- Staff-side: admin oversight + coder-AI liaison relationship
  ('11111111-1111-1111-1111-111111111116', '11111111-1111-1111-1111-111111111120', 'accepted', now() - interval '18 days'),
  ('11111111-1111-1111-1111-111111111121', '11111111-1111-1111-1111-111111111122', 'accepted', now() - interval '10 days')
ON CONFLICT (from_id, to_id) DO NOTHING;

-- ============================================================================
-- 2. PFAS citizen science — 4 focus areas, one decon project each, led by a
--    teacher, logged by their students. Two of the four projects cite a
--    method proposal (inserted in section 3, so those two projects are
--    inserted after it).
-- ============================================================================

INSERT INTO public.focus_areas (id, created_by, name, description, contamination_type, base_address, is_simulated, created_at) VALUES
  ('33333333-3333-3333-3333-000000000001', '11111111-1111-1111-1111-111111111116',
   'Aurora Basin Watershed', 'Shared surface-water intake feeding the Aurora Basin cooperative — same site as the existing Kepler-442 community listing.',
   'PFAS', 'Kepler-442', true, now() - interval '22 days'),
  ('33333333-3333-3333-3333-000000000002', '11111111-1111-1111-1111-111111111117',
   'Dock Runoff Site', 'Stormwater runoff collection point near the TRAPPIST-1 e repair dock.',
   'PFAS', 'TRAPPIST-1', true, now() - interval '19 days'),
  ('33333333-3333-3333-3333-000000000003', '11111111-1111-1111-1111-111111111118',
   'Highland Springs', 'Shallow groundwater spring complex, candidate site for a plant-based pilot.',
   'PFAS', 'K2-18', true, now() - interval '16 days'),
  ('33333333-3333-3333-3333-000000000004', '11111111-1111-1111-1111-111111111119',
   'Lowland Marsh', 'Marsh/wetland catchment downstream of a legacy industrial parcel.',
   'PFAS', 'TOI-700', true, now() - interval '14 days')
ON CONFLICT (id) DO NOTHING;

-- ── Method proposals (published by a teacher / one independent student) ────
-- precedent_citations cite the same real EPA/ITRC technical resources
-- src/data/pfas-methods-library.ts already references for these methods.

INSERT INTO public.method_proposals
  (id, author_id, title, summary, method_key, precedent_citations, economic_argument, environmental_argument, status, created_at)
VALUES
  ('66666666-6666-6666-6666-000000000001', '11111111-1111-1111-1111-111111111116',
   'GAC pilot for the Aurora Basin intake',
   'Propose a granular activated carbon filter bed ahead of the shared basin intake, sized for the long-chain PFAS profile our first samples showed.',
   'gac',
   '[{"title": "PFAS treatment and removal technical resources", "url": "https://www.epa.gov/pfas", "note": "US EPA"}, {"title": "PFAS technical and regulatory guidance", "url": "https://pfas-1.itrcweb.org/", "note": "ITRC"}]'::jsonb,
   'Moderate capital cost; carbon bed replacement cadence to be set from breakthrough monitoring, not a fixed schedule.',
   'Concentrates rather than destroys PFAS — spent carbon will need destructive disposal, flagged in the project plan from day one.',
   'proposed', now() - interval '22 days'),
  ('66666666-6666-6666-6666-000000000002', '11111111-1111-1111-1111-111111111117',
   'Ion exchange trial for dock runoff',
   'The dock runoff profile includes a significant short-chain fraction GAC alone would miss — proposing an IX resin trial instead.',
   'ix',
   '[{"title": "PFAS treatment and removal technical resources", "url": "https://www.epa.gov/pfas", "note": "US EPA"}, {"title": "PFAS technical and regulatory guidance", "url": "https://pfas-1.itrcweb.org/", "note": "ITRC"}]'::jsonb,
   'Higher per-volume resin cost than GAC, partly offset by fewer change-outs given faster kinetics.',
   'Spent resin is still a PFAS-concentrated waste stream requiring destructive disposal, same limitation as GAC.',
   'proposed', now() - interval '19 days'),
  ('66666666-6666-6666-6666-000000000003', '11111111-1111-1111-1111-111111111112',
   'Foam fractionation for legacy AFFF residue',
   'Independent proposal: our site history includes fire-training use, which fits foam fractionation''s high-concentration surface-active profile better than a sorbent method.',
   'foam-fractionation',
   '[{"title": "PFAS technical and regulatory guidance", "url": "https://pfas-1.itrcweb.org/", "note": "ITRC"}]'::jsonb,
   'Lower operating cost than membrane filtration for a high-concentration source, no sorbent media to replace on schedule.',
   'Not well suited to diffuse low-concentration contamination — scoped here specifically because this site is neither.',
   'proposed', now() - interval '10 days')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.decon_projects (id, focus_area_id, owner_id, title, method_proposal_id, status, created_at) VALUES
  ('44444444-4444-4444-4444-000000000001', '33333333-3333-3333-3333-000000000001', '11111111-1111-1111-1111-111111111116',
   'Aurora Basin GAC Pilot', '66666666-6666-6666-6666-000000000001', 'active', now() - interval '21 days'),
  ('44444444-4444-4444-4444-000000000002', '33333333-3333-3333-3333-000000000002', '11111111-1111-1111-1111-111111111117',
   'Dock Runoff IX Trial', '66666666-6666-6666-6666-000000000002', 'monitoring', now() - interval '18 days'),
  ('44444444-4444-4444-4444-000000000003', '33333333-3333-3333-3333-000000000003', '11111111-1111-1111-1111-111111111118',
   'Highland Springs Phytoremediation Study', NULL, 'planning', now() - interval '15 days'),
  ('44444444-4444-4444-4444-000000000004', '33333333-3333-3333-3333-000000000004', '11111111-1111-1111-1111-111111111119',
   'Lowland Marsh SCWO Feasibility', NULL, 'planning', now() - interval '13 days')
ON CONFLICT (id) DO NOTHING;

-- ── Progress log entries — two per student, per their class's project.
--    Second reading trends down from the first (illustrates progress).

INSERT INTO public.project_log_entries (id, project_id, author_id, notes, metrics, logged_at) VALUES
  -- DP1 / Aurora Basin GAC Pilot — student_01/02/03
  ('55555555-5555-5555-5555-000000000001', '44444444-4444-4444-4444-000000000001', '11111111-1111-1111-1111-111111111104', 'Baseline sample above the filter bed inlet.',       '{"pfoa_ppt": 14.2, "pfos_ppt": 9.6, "flow_lpm": 3.1}'::jsonb, now() - interval '21 days'),
  ('55555555-5555-5555-5555-000000000002', '44444444-4444-4444-4444-000000000001', '11111111-1111-1111-1111-111111111104', 'Follow-up after two weeks of bed operation.',        '{"pfoa_ppt": 9.8,  "pfos_ppt": 6.1, "flow_lpm": 3.0}'::jsonb, now() - interval '14 days'),
  ('55555555-5555-5555-5555-000000000003', '44444444-4444-4444-4444-000000000001', '11111111-1111-1111-1111-111111111105', 'Outlet-side sample, same day as inlet baseline.',     '{"pfoa_ppt": 5.4,  "pfos_ppt": 3.2, "flow_lpm": 3.1}'::jsonb, now() - interval '20 days'),
  ('55555555-5555-5555-5555-000000000004', '44444444-4444-4444-4444-000000000001', '11111111-1111-1111-1111-111111111105', 'Outlet-side follow-up.',                              '{"pfoa_ppt": 3.1,  "pfos_ppt": 1.9, "flow_lpm": 3.0}'::jsonb, now() - interval '13 days'),
  ('55555555-5555-5555-5555-000000000005', '44444444-4444-4444-4444-000000000001', '11111111-1111-1111-1111-111111111106', 'Flow-rate and turbidity check.',                      '{"turbidity_ntu": 1.4, "flow_lpm": 3.1}'::jsonb,               now() - interval '19 days'),
  ('55555555-5555-5555-5555-000000000006', '44444444-4444-4444-4444-000000000001', '11111111-1111-1111-1111-111111111106', 'Second turbidity check, bed holding steady.',         '{"turbidity_ntu": 1.1, "flow_lpm": 3.0}'::jsonb,               now() - interval '12 days'),

  -- DP2 / Dock Runoff IX Trial — student_04/05/06
  ('55555555-5555-5555-5555-000000000007', '44444444-4444-4444-4444-000000000002', '11111111-1111-1111-1111-111111111107', 'Pre-resin sample at the dock catch basin.',           '{"pfba_ppt": 22.0, "pfbs_ppt": 17.5}'::jsonb, now() - interval '18 days'),
  ('55555555-5555-5555-5555-000000000008', '44444444-4444-4444-4444-000000000002', '11111111-1111-1111-1111-111111111107', 'Post-resin sample, short-chain fraction dropping.',   '{"pfba_ppt": 8.4,  "pfbs_ppt": 6.0}'::jsonb,  now() - interval '11 days'),
  ('55555555-5555-5555-5555-000000000009', '44444444-4444-4444-4444-000000000002', '11111111-1111-1111-1111-111111111108', 'Resin vessel pressure-drop log.',                     '{"pressure_psi": 12.1}'::jsonb,               now() - interval '17 days'),
  ('55555555-5555-5555-5555-000000000010', '44444444-4444-4444-4444-000000000002', '11111111-1111-1111-1111-111111111108', 'Pressure-drop follow-up, within expected range.',     '{"pressure_psi": 13.4}'::jsonb,               now() - interval '10 days'),
  ('55555555-5555-5555-5555-000000000011', '44444444-4444-4444-4444-000000000002', '11111111-1111-1111-1111-111111111109', 'Chain-of-custody photo log, sample A.',               '{"samples_logged": 1}'::jsonb,                now() - interval '16 days'),
  ('55555555-5555-5555-5555-000000000012', '44444444-4444-4444-4444-000000000002', '11111111-1111-1111-1111-111111111109', 'Chain-of-custody photo log, sample B.',               '{"samples_logged": 1}'::jsonb,                now() - interval '9 days'),

  -- DP3 / Highland Springs Phytoremediation Study — student_07/08
  ('55555555-5555-5555-5555-000000000013', '44444444-4444-4444-4444-000000000003', '11111111-1111-1111-1111-111111111110', 'Species-selection candidate survey, spring margin.',  '{"candidate_species": 4}'::jsonb,             now() - interval '15 days'),
  ('55555555-5555-5555-5555-000000000014', '44444444-4444-4444-4444-000000000003', '11111111-1111-1111-1111-111111111110', 'Narrowed to two candidate species for the pilot bed.', '{"candidate_species": 2}'::jsonb,            now() - interval '8 days'),
  ('55555555-5555-5555-5555-000000000015', '44444444-4444-4444-4444-000000000003', '11111111-1111-1111-1111-111111111111', 'Baseline soil PFAS sample near the spring margin.',    '{"pfoa_ppb_soil": 3.8}'::jsonb,               now() - interval '14 days'),
  ('55555555-5555-5555-5555-000000000016', '44444444-4444-4444-4444-000000000003', '11111111-1111-1111-1111-111111111111', 'Second soil sample, adjacent plot for comparison.',    '{"pfoa_ppb_soil": 4.1}'::jsonb,               now() - interval '7 days'),

  -- DP4 / Lowland Marsh SCWO Feasibility — student_10/11/12
  ('55555555-5555-5555-5555-000000000017', '44444444-4444-4444-4444-000000000004', '11111111-1111-1111-1111-111111111113', 'Concentrate-stream volume estimate for feasibility.', '{"concentrate_l_per_day": 210}'::jsonb,       now() - interval '13 days'),
  ('55555555-5555-5555-5555-000000000018', '44444444-4444-4444-4444-000000000004', '11111111-1111-1111-1111-111111111113', 'Revised estimate after a second flow survey.',        '{"concentrate_l_per_day": 185}'::jsonb,       now() - interval '6 days'),
  ('55555555-5555-5555-5555-000000000019', '44444444-4444-4444-4444-000000000004', '11111111-1111-1111-1111-111111111114', 'Marsh hydrograph reading, high-water mark.',          '{"stage_m": 1.2}'::jsonb,                     now() - interval '12 days'),
  ('55555555-5555-5555-5555-000000000020', '44444444-4444-4444-4444-000000000004', '11111111-1111-1111-1111-111111111114', 'Hydrograph follow-up, receding.',                     '{"stage_m": 0.9}'::jsonb,                     now() - interval '5 days'),
  ('55555555-5555-5555-5555-000000000021', '44444444-4444-4444-4444-000000000004', '11111111-1111-1111-1111-111111111115', 'Downstream industrial-parcel boundary walk.',         '{"boundary_notes": "fence line surveyed"}'::jsonb, now() - interval '11 days'),
  ('55555555-5555-5555-5555-000000000022', '44444444-4444-4444-4444-000000000004', '11111111-1111-1111-1111-111111111115', 'Boundary walk follow-up, photo-documented markers.',  '{"markers_placed": 3}'::jsonb,                now() - interval '4 days')
ON CONFLICT (id) DO NOTHING;

-- ── Endorsements on MP1 — class A students backing their teacher's proposal.
--    Trigger (proposal_endorsement_reward, migration 003) does the rest:
--    4 points to each endorser, 'method_contributor' certificate to teacher_01
--    on the first endorsement, and flips MP1's status to 'endorsed'.

INSERT INTO public.proposal_endorsements (proposal_id, member_id, created_at) VALUES
  ('66666666-6666-6666-6666-000000000001', '11111111-1111-1111-1111-111111111104', now() - interval '20 days'),
  ('66666666-6666-6666-6666-000000000001', '11111111-1111-1111-1111-111111111105', now() - interval '18 days'),
  ('66666666-6666-6666-6666-000000000001', '11111111-1111-1111-1111-111111111106', now() - interval '16 days'),
  ('66666666-6666-6666-6666-000000000001', '11111111-1111-1111-1111-111111111107', now() - interval '14 days')
ON CONFLICT (proposal_id, member_id) DO NOTHING;

-- ============================================================================
-- 3. Knowledge Keeper records — one per tier of submitter_relationship, so
--    the moderation queue has something real to review.
-- ============================================================================

INSERT INTO public.knowledge_keeper_records
  (id, submitter_id, keeper_name, site_ref, domain_tags, summary, submitter_relationship, consent_note, created_at)
VALUES
  ('77777777-7777-7777-7777-000000000001', '11111111-1111-1111-1111-111111111104',
   'Grandmother — coastal foraging knowledge', 'Kepler-442',
   ARRAY['plant','season','practice'],
   'Seasonal timing for basin-edge foraging, passed down through three generations of the family — which plants to leave alone until after first frost.',
   'family', NULL, now() - interval '17 days'),
  ('77777777-7777-7777-7777-000000000002', '11111111-1111-1111-1111-111111111110',
   'Self-documented', 'K2-18',
   ARRAY['place','memory'],
   'My own decade of seasonal observation at the spring margin, kept as informal field notes before this project existed.',
   'self', NULL, now() - interval '12 days'),
  ('77777777-7777-7777-7777-000000000003', '11111111-1111-1111-1111-111111111114',
   'Community elder (name withheld at their request)', 'TOI-700',
   ARRAY['story','practice'],
   'An oral account of how the marsh boundary was used historically, recorded with the elder''s permission for this specific research use.',
   'student_researcher', 'Verbal consent given for research use only, not for public attribution of the elder''s name; recording reviewed with them before submission.',
   now() - interval '6 days')
ON CONFLICT (id) DO NOTHING;

-- admin_01 reviews the held student_researcher submission — the only path
-- that can move it out of pending_review (kkr_review_admin policy).
UPDATE public.knowledge_keeper_records
SET status = 'published', reviewed_at = now() - interval '2 days', reviewed_by = '11111111-1111-1111-1111-111111111120'
WHERE id = '77777777-7777-7777-7777-000000000003' AND status = 'pending_review';

-- ============================================================================
-- 4. Mentor sessions — teacher_01 reaches the 4-session mentorship
--    certificate; teacher_02/03/04 each have partial progress; one session
--    (teacher_04 / student_11) is left unconfirmed to show that pending state.
-- ============================================================================

INSERT INTO public.mentor_sessions (id, mentor_id, mentee_id, topic, created_at) VALUES
  ('99999999-9999-9999-9999-000000000001', '11111111-1111-1111-1111-111111111116', '11111111-1111-1111-1111-111111111104', 'Water sampling QA/QC', now() - interval '20 days'),
  ('99999999-9999-9999-9999-000000000002', '11111111-1111-1111-1111-111111111116', '11111111-1111-1111-1111-111111111105', 'Chain-of-custody basics', now() - interval '17 days'),
  ('99999999-9999-9999-9999-000000000003', '11111111-1111-1111-1111-111111111116', '11111111-1111-1111-1111-111111111106', 'PFAS field test kits', now() - interval '15 days'),
  ('99999999-9999-9999-9999-000000000004', '11111111-1111-1111-1111-111111111116', '11111111-1111-1111-1111-111111111107', 'Community outreach for citizen science', now() - interval '10 days'),
  ('99999999-9999-9999-9999-000000000005', '11111111-1111-1111-1111-111111111117', '11111111-1111-1111-1111-111111111108', 'Ion exchange resin basics', now() - interval '16 days'),
  ('99999999-9999-9999-9999-000000000006', '11111111-1111-1111-1111-111111111117', '11111111-1111-1111-1111-111111111109', 'Sample chain-of-custody', now() - interval '9 days'),
  ('99999999-9999-9999-9999-000000000007', '11111111-1111-1111-1111-111111111118', '11111111-1111-1111-1111-111111111110', 'Phytoremediation species selection', now() - interval '13 days'),
  ('99999999-9999-9999-9999-000000000008', '11111111-1111-1111-1111-111111111119', '11111111-1111-1111-1111-111111111113', 'SCWO safety basics', now() - interval '8 days'),
  ('99999999-9999-9999-9999-000000000009', '11111111-1111-1111-1111-111111111119', '11111111-1111-1111-1111-111111111114', 'Field literacy: reading a hydrograph', now() - interval '3 days')
ON CONFLICT (id) DO NOTHING;

-- Confirm both sides for all but the last session (left pending on purpose).
-- Run as a superuser/service connection, so mentor_session_guard()'s
-- auth.uid()-based own-flag restriction doesn't apply here — the same as
-- how the real app would do it via two separate authenticated confirmations,
-- collapsed into one statement since this is offline seed data, not a live
-- session per party.
UPDATE public.mentor_sessions
SET confirmed_mentor = true, confirmed_mentee = true
WHERE id IN (
  '99999999-9999-9999-9999-000000000001', '99999999-9999-9999-9999-000000000002',
  '99999999-9999-9999-9999-000000000003', '99999999-9999-9999-9999-000000000004',
  '99999999-9999-9999-9999-000000000005', '99999999-9999-9999-9999-000000000006',
  '99999999-9999-9999-9999-000000000007', '99999999-9999-9999-9999-000000000008'
) AND confirmed_at IS NULL;

-- Session 9: mentee has confirmed, mentor hasn't yet — realistic "awaiting
-- mentor confirmation" state for testing that UI, no reward emitted.
UPDATE public.mentor_sessions
SET confirmed_mentee = true
WHERE id = '99999999-9999-9999-9999-000000000009' AND confirmed_at IS NULL;

-- ============================================================================
-- 5. Community nodes — a few more than the Maria/Oskar/Lena starter set,
--    spanning draft/published/archived and including one real admin takedown
--    (as opposed to seed_test_accounts.sql's pre-archived example, which has
--    no reviewed_by trail).
-- ============================================================================

INSERT INTO public.community_nodes
  (id, owner_id, node_type, title, description, hostname, metadata, ownership_model, access_level, status, created_at, reviewed_at, reviewed_by)
VALUES
  ('22222222-2222-2222-2222-222222222205', '11111111-1111-1111-1111-111111111105',
   'creative_page', 'Field Sketches — student_02',
   'Watercolor field sketches from the Aurora Basin sampling runs.',
   'K2-18', '{"ponInkUrl": "https://pon.ink/test-student-02", "mediaLinks": []}'::jsonb,
   'solo', 'public', 'published', now() - interval '12 days', NULL, NULL),

  ('22222222-2222-2222-2222-222222222206', '11111111-1111-1111-1111-111111111112',
   'business_listing', 'Highland Trailhead Snack Co-op',
   'Still drafting — trailhead snack stand near the Highland Springs sampling site.',
   'TOI-700', '{"items": ["trail mix", "water refills"], "contact": "test-student09@seed.exotopia.invalid"}'::jsonb,
   'cooperative', 'public', 'draft', now() - interval '8 days', NULL, NULL),

  ('22222222-2222-2222-2222-222222222207', '11111111-1111-1111-1111-111111111122',
   'creative_page', 'Exotopia QA Field Notes',
   'Running notes from interface-testing passes across the citizen-science tooling — not a real creative page, kept published so it is reachable the same way a real one would be.',
   'TRAPPIST-1', '{"ponInkUrl": null, "mediaLinks": []}'::jsonb,
   'solo', 'public', 'published', now() - interval '5 days', NULL, NULL),

  ('22222222-2222-2222-2222-222222222208', '11111111-1111-1111-1111-111111111108',
   'business_listing', 'Riverside Filter Supply (archived)',
   'Kept archived on purpose — admin takedown example with a real reviewed_by/reviewed_at trail, distinct from the pre-archived listing in seed_test_accounts.sql.',
   'HD 40307', '{"items": ["filter cartridges"], "contact": "n/a"}'::jsonb,
   'solo', 'public', 'archived', now() - interval '15 days', now() - interval '2 days', '11111111-1111-1111-1111-111111111121')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 6. Branch settlement — coder-AI liaison exercises the one exo-branch-v1
--    table nothing else in this seed touches. leech_vector is 3 stacked
--    8-vectors (current / aspirational / relational) per
--    blog-settlements-as-possible-worlds.md — plain structured data, not a
--    real Leech-lattice computation.
-- ============================================================================

INSERT INTO public.branch_settlements
  (id, branch_id, branch_type, owner_id, base_address, divergence_note, access, leech_vector, leech_axis, created_at)
VALUES
  ('88888888-8888-8888-8888-000000000001', 'coderai-qa-harness-v1', 'research',
   '11111111-1111-1111-1111-111111111122', 'TRAPPIST-1',
   'Sandbox branch for exercising branch_settlements from the interface-testing cohort — not a real divergent settlement.',
   'open',
   ARRAY[0.10,0.05,0.00,-0.05,0.10,0.00,0.05,-0.10,
         0.20,0.15,0.10,0.05,0.00,-0.05,-0.10,0.10,
         0.05,0.05,0.00,0.00,-0.05,0.10,0.05,0.00]::float8[],
   'current', now() - interval '5 days')
ON CONFLICT (branch_id) DO NOTHING;

-- ============================================================================
-- 7. Blog comments + reactions — scattered across citizen-science/education
--    posts, kept within each class's connection mesh so RLS (is_connected)
--    lets them actually see each other's threads when signed in as one of
--    these accounts. Top-level comments inserted first, then replies, so no
--    reply's parent_id can ever reference a not-yet-committed row.
-- ============================================================================

INSERT INTO public.comments (id, post_slug, author_id, body, created_at) VALUES
  ('cccccccc-cccc-cccc-cccc-000000000001', 'upstream-pfas-producer-responsibility', '11111111-1111-1111-1111-111111111116',
   'Sharing this with the Aurora Basin group — good context for why we''re piloting GAC there before pushing for the upstream fix this piece argues for.', now() - interval '10 days'),
  ('cccccccc-cccc-cccc-cccc-000000000004', 'east-coast-citizen-science-units', '11111111-1111-1111-1111-111111111117',
   'The dock runoff trial is basically a mini version of this — small group, same rigor.', now() - interval '9 days'),
  ('cccccccc-cccc-cccc-cccc-000000000007', 'costa-rica-biodiversity-platform', '11111111-1111-1111-1111-111111111118',
   'Different contamination story but the same species-selection process we''re using for the Highland Springs pilot.', now() - interval '8 days'),
  ('cccccccc-cccc-cccc-cccc-000000000009', 'financial-literacy-parallel-universe-powerup', '11111111-1111-1111-1111-111111111119',
   'Worth pairing with the SCWO feasibility budget conversation — the marsh group keeps asking about long-term cost, not just cleanup cost.', now() - interval '7 days'),
  ('cccccccc-cccc-cccc-cccc-000000000012', 'e8-library-ecology-area-proposal', '11111111-1111-1111-1111-111111111122',
   'Ran the interface-testing cohort through the library search feature this week — flagging a couple of edge cases separately, but the core flow held up.', now() - interval '5 days'),
  ('cccccccc-cccc-cccc-cccc-000000000014', 'networks-of-trust', '11111111-1111-1111-1111-111111111121',
   'The mentor/connection model held up well under a full simulated cohort — four classes, no cross-class leakage in what each group could see of the others.', now() - interval '3 days')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.comments (id, post_slug, author_id, parent_id, body, created_at) VALUES
  ('cccccccc-cccc-cccc-cccc-000000000002', 'upstream-pfas-producer-responsibility', '11111111-1111-1111-1111-111111111104', 'cccccccc-cccc-cccc-cccc-000000000001',
   'Matches what we logged this week — still detectable after the first filter pass, which is exactly the "concentrates, doesn''t destroy" limitation this piece is about.', now() - interval '9 days'),
  ('cccccccc-cccc-cccc-cccc-000000000003', 'upstream-pfas-producer-responsibility', '11111111-1111-1111-1111-111111111105', 'cccccccc-cccc-cccc-cccc-000000000001',
   'Curious whether the dock group''s IX numbers are coming down faster than our GAC ones — different chain-length mix probably explains it either way.', now() - interval '8 days'),
  ('cccccccc-cccc-cccc-cccc-000000000005', 'east-coast-citizen-science-units', '11111111-1111-1111-1111-111111111107', 'cccccccc-cccc-cccc-cccc-000000000004',
   'Chain-of-custody photo logging turned out to be the part that actually took discipline, not the sampling itself.', now() - interval '8 days'),
  ('cccccccc-cccc-cccc-cccc-000000000006', 'east-coast-citizen-science-units', '11111111-1111-1111-1111-111111111108', 'cccccccc-cccc-cccc-cccc-000000000004',
   'Agreed — the pressure-drop log alone told us more about resin life than I expected going in.', now() - interval '7 days'),
  ('cccccccc-cccc-cccc-cccc-000000000008', 'costa-rica-biodiversity-platform', '11111111-1111-1111-1111-111111111110', 'cccccccc-cccc-cccc-cccc-000000000007',
   'We''re down to two candidate species after the margin survey — will post the soil-sample follow-up once it''s back.', now() - interval '7 days'),
  ('cccccccc-cccc-cccc-cccc-000000000010', 'financial-literacy-parallel-universe-powerup', '11111111-1111-1111-1111-111111111113', 'cccccccc-cccc-cccc-cccc-000000000009',
   'Concentrate-volume estimate came down between our two surveys, which changes the feasibility math more than I expected.', now() - interval '6 days'),
  ('cccccccc-cccc-cccc-cccc-000000000011', 'financial-literacy-parallel-universe-powerup', '11111111-1111-1111-1111-111111111114', 'cccccccc-cccc-cccc-cccc-000000000009',
   'The hydrograph readings are useful context for that too — stage was still receding on our last check.', now() - interval '5 days'),
  ('cccccccc-cccc-cccc-cccc-000000000013', 'e8-library-ecology-area-proposal', '11111111-1111-1111-1111-111111111120', 'cccccccc-cccc-cccc-cccc-000000000012',
   'Appreciate the pass — send the edge cases over and we''ll triage before the next cohort run.', now() - interval '4 days')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.reactions (comment_id, member_id, emoji) VALUES
  ('cccccccc-cccc-cccc-cccc-000000000001', '11111111-1111-1111-1111-111111111106', '🔬'),
  ('cccccccc-cccc-cccc-cccc-000000000002', '11111111-1111-1111-1111-111111111105', '❤️'),
  ('cccccccc-cccc-cccc-cccc-000000000002', '11111111-1111-1111-1111-111111111116', '🌱'),
  ('cccccccc-cccc-cccc-cccc-000000000005', '11111111-1111-1111-1111-111111111109', '👍'),
  ('cccccccc-cccc-cccc-cccc-000000000007', '11111111-1111-1111-1111-111111111112', '✨'),
  ('cccccccc-cccc-cccc-cccc-000000000008', '11111111-1111-1111-1111-111111111111', '🌱'),
  ('cccccccc-cccc-cccc-cccc-000000000010', '11111111-1111-1111-1111-111111111115', '👍')
ON CONFLICT (comment_id, member_id, emoji) DO NOTHING;

-- ============================================================================
-- 8. Reward events not already covered by a trigger — self-reported actions
--    (decon progress logs, knowledge-keeper records, method-proposal
--    publishing) and admin-granted verifications. All within the daily caps
--    points_catalog defines (checked by inspection here, not enforced by
--    this file, since this runs as a superuser connection outside RLS —
--    same reason award_self_reported()/award_quiz_completion() aren't
--    called directly: there's no live auth.uid() session to run them under).
-- ============================================================================

INSERT INTO public.reward_events (id, member_id, track, action_key, points, metadata, self_reported, created_at) VALUES
  -- decon_progress_log — one per project_log_entries row above (6 pts, cap 2/day, all 1/day here)
  ('aaaaaaaa-aaaa-aaaa-aaaa-000000000001', '11111111-1111-1111-1111-111111111104', 'volunteering', 'decon_progress_log', 6, '{"log_id": "55555555-5555-5555-5555-000000000001"}'::jsonb, true, now() - interval '21 days'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-000000000002', '11111111-1111-1111-1111-111111111104', 'volunteering', 'decon_progress_log', 6, '{"log_id": "55555555-5555-5555-5555-000000000002"}'::jsonb, true, now() - interval '14 days'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-000000000003', '11111111-1111-1111-1111-111111111105', 'volunteering', 'decon_progress_log', 6, '{"log_id": "55555555-5555-5555-5555-000000000003"}'::jsonb, true, now() - interval '20 days'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-000000000004', '11111111-1111-1111-1111-111111111105', 'volunteering', 'decon_progress_log', 6, '{"log_id": "55555555-5555-5555-5555-000000000004"}'::jsonb, true, now() - interval '13 days'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-000000000005', '11111111-1111-1111-1111-111111111106', 'volunteering', 'decon_progress_log', 6, '{"log_id": "55555555-5555-5555-5555-000000000005"}'::jsonb, true, now() - interval '19 days'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-000000000006', '11111111-1111-1111-1111-111111111106', 'volunteering', 'decon_progress_log', 6, '{"log_id": "55555555-5555-5555-5555-000000000006"}'::jsonb, true, now() - interval '12 days'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-000000000007', '11111111-1111-1111-1111-111111111107', 'volunteering', 'decon_progress_log', 6, '{"log_id": "55555555-5555-5555-5555-000000000007"}'::jsonb, true, now() - interval '18 days'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-000000000008', '11111111-1111-1111-1111-111111111107', 'volunteering', 'decon_progress_log', 6, '{"log_id": "55555555-5555-5555-5555-000000000008"}'::jsonb, true, now() - interval '11 days'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-000000000009', '11111111-1111-1111-1111-111111111108', 'volunteering', 'decon_progress_log', 6, '{"log_id": "55555555-5555-5555-5555-000000000009"}'::jsonb, true, now() - interval '17 days'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-000000000010', '11111111-1111-1111-1111-111111111108', 'volunteering', 'decon_progress_log', 6, '{"log_id": "55555555-5555-5555-5555-000000000010"}'::jsonb, true, now() - interval '10 days'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-000000000011', '11111111-1111-1111-1111-111111111109', 'volunteering', 'decon_progress_log', 6, '{"log_id": "55555555-5555-5555-5555-000000000011"}'::jsonb, true, now() - interval '16 days'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-000000000012', '11111111-1111-1111-1111-111111111109', 'volunteering', 'decon_progress_log', 6, '{"log_id": "55555555-5555-5555-5555-000000000012"}'::jsonb, true, now() - interval '9 days'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-000000000013', '11111111-1111-1111-1111-111111111110', 'volunteering', 'decon_progress_log', 6, '{"log_id": "55555555-5555-5555-5555-000000000013"}'::jsonb, true, now() - interval '15 days'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-000000000014', '11111111-1111-1111-1111-111111111110', 'volunteering', 'decon_progress_log', 6, '{"log_id": "55555555-5555-5555-5555-000000000014"}'::jsonb, true, now() - interval '8 days'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-000000000015', '11111111-1111-1111-1111-111111111111', 'volunteering', 'decon_progress_log', 6, '{"log_id": "55555555-5555-5555-5555-000000000015"}'::jsonb, true, now() - interval '14 days'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-000000000016', '11111111-1111-1111-1111-111111111111', 'volunteering', 'decon_progress_log', 6, '{"log_id": "55555555-5555-5555-5555-000000000016"}'::jsonb, true, now() - interval '7 days'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-000000000017', '11111111-1111-1111-1111-111111111113', 'volunteering', 'decon_progress_log', 6, '{"log_id": "55555555-5555-5555-5555-000000000017"}'::jsonb, true, now() - interval '13 days'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-000000000018', '11111111-1111-1111-1111-111111111113', 'volunteering', 'decon_progress_log', 6, '{"log_id": "55555555-5555-5555-5555-000000000018"}'::jsonb, true, now() - interval '6 days'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-000000000019', '11111111-1111-1111-1111-111111111114', 'volunteering', 'decon_progress_log', 6, '{"log_id": "55555555-5555-5555-5555-000000000019"}'::jsonb, true, now() - interval '12 days'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-000000000020', '11111111-1111-1111-1111-111111111114', 'volunteering', 'decon_progress_log', 6, '{"log_id": "55555555-5555-5555-5555-000000000020"}'::jsonb, true, now() - interval '5 days'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-000000000021', '11111111-1111-1111-1111-111111111115', 'volunteering', 'decon_progress_log', 6, '{"log_id": "55555555-5555-5555-5555-000000000021"}'::jsonb, true, now() - interval '11 days'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-000000000022', '11111111-1111-1111-1111-111111111115', 'volunteering', 'decon_progress_log', 6, '{"log_id": "55555555-5555-5555-5555-000000000022"}'::jsonb, true, now() - interval '4 days'),

  -- knowledge_keeper_record (15 pts, cap 1/day) — awarded at submission for the
  -- two immediate-publish tiers, at review time for the held one
  ('aaaaaaaa-aaaa-aaaa-aaaa-000000000023', '11111111-1111-1111-1111-111111111104', 'educating_others', 'knowledge_keeper_record', 15, '{"record_id": "77777777-7777-7777-7777-000000000001"}'::jsonb, true, now() - interval '17 days'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-000000000024', '11111111-1111-1111-1111-111111111110', 'educating_others', 'knowledge_keeper_record', 15, '{"record_id": "77777777-7777-7777-7777-000000000002"}'::jsonb, true, now() - interval '12 days'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-000000000025', '11111111-1111-1111-1111-111111111114', 'educating_others', 'knowledge_keeper_record', 15, '{"record_id": "77777777-7777-7777-7777-000000000003"}'::jsonb, true, now() - interval '2 days'),

  -- method_proposal_published (25 pts, cap 1/day)
  ('aaaaaaaa-aaaa-aaaa-aaaa-000000000026', '11111111-1111-1111-1111-111111111116', 'educating_others', 'method_proposal_published', 25, '{"proposal_id": "66666666-6666-6666-6666-000000000001"}'::jsonb, true, now() - interval '22 days'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-000000000027', '11111111-1111-1111-1111-111111111117', 'educating_others', 'method_proposal_published', 25, '{"proposal_id": "66666666-6666-6666-6666-000000000002"}'::jsonb, true, now() - interval '19 days'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-000000000028', '11111111-1111-1111-1111-111111111112', 'educating_others', 'method_proposal_published', 25, '{"proposal_id": "66666666-6666-6666-6666-000000000003"}'::jsonb, true, now() - interval '10 days'),

  -- Showcase volunteer — student_06 crosses the 50-pt field_volunteer threshold
  -- via a mix of self-reported (cap 3/day) and verified eco_submission entries.
  ('aaaaaaaa-aaaa-aaaa-aaaa-000000000029', '11111111-1111-1111-1111-111111111109', 'volunteering', 'volunteer_self_report', 8,  '{"note": "trail cleanup near the dock site"}'::jsonb, true,  now() - interval '16 days'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-000000000030', '11111111-1111-1111-1111-111111111109', 'volunteering', 'volunteer_self_report', 8,  '{"note": "sample kit restocking"}'::jsonb,             true,  now() - interval '9 days'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-000000000031', '11111111-1111-1111-1111-111111111109', 'volunteering', 'volunteer_self_report', 8,  '{"note": "helped onboard student_04/05"}'::jsonb,     true,  now() - interval '3 days'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-000000000032', '11111111-1111-1111-1111-111111111109', 'volunteering', 'eco_submission',        10, '{"note": "verified offline eco-ops sync"}'::jsonb,     false, now() - interval '14 days'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-000000000033', '11111111-1111-1111-1111-111111111109', 'volunteering', 'eco_submission',        10, '{"note": "verified offline eco-ops sync"}'::jsonb,     false, now() - interval '7 days'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-000000000034', '11111111-1111-1111-1111-111111111109', 'volunteering', 'eco_submission',        10, '{"note": "verified offline eco-ops sync"}'::jsonb,     false, now() - interval '1 days'),

  -- Admin-granted verifications
  ('aaaaaaaa-aaaa-aaaa-aaaa-000000000035', '11111111-1111-1111-1111-111111111106', 'educating_others', 'contribution_verified', 20, '{"granted_by": "test_admin_01", "note": "quality decon-log analysis"}'::jsonb, false, now() - interval '11 days'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-000000000036', '11111111-1111-1111-1111-111111111111', 'educating_others', 'contribution_verified', 20, '{"granted_by": "test_admin_01", "note": "species-selection writeup"}'::jsonb,   false, now() - interval '6 days'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-000000000037', '11111111-1111-1111-1111-111111111109', 'volunteering',      'bounty_verified',       30, '{"granted_by": "test_admin_02", "note": "cohort onboarding help"}'::jsonb,      false, now() - interval '4 days'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-000000000038', '11111111-1111-1111-1111-111111111115', 'volunteering',      'bounty_verified',       30, '{"granted_by": "test_admin_02", "note": "boundary-marker documentation"}'::jsonb, false, now() - interval '3 days')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 9. Derive threshold certificates (field_volunteer, pfas_field_researcher,
--    mentorship) from the ledger state this file just produced — the same
--    function award_self_reported()/award_quiz_completion() call in the real
--    app, run here directly since there's no live session to call it through.
-- ============================================================================

SELECT public.refresh_certificates(m.id)
FROM public.members m
WHERE m.handle LIKE 'test\_%' ESCAPE '\';

COMMIT;
