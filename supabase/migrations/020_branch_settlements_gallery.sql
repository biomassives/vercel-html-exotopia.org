-- ============================================================================
-- 020_branch_settlements_gallery.sql
--
-- Widens public.settlements (015) to accept 'branch' as a real settlement
-- type — a parallel-dimension fork of an existing settlement, per
-- SPEC_EXOLOC_ADDRESS.md §3.7. This is deliberately separate from the
-- existing public.branch_settlements table (003_pfas_citizen_science.sql):
-- that table is append-only, research-type-only, and has no key/objects/
-- focus fields — it drives no Gallery/Dome rendering. A branch created here
-- IS a real SettlementRecord (src/lib/settlements.ts), so it renders its own
-- Gallery/Dome the same way any other settlement does, at the same
-- planet_name/hostname as its base, distinguished only by `key`/`exolocation`.
--
-- Same vocabulary as 003's branch_settlements on purpose (branch_id,
-- branch_type, base_key/base_address, divergence_note) so both systems stay
-- conceptually aligned even though they're separate tables serving different
-- purposes (see SPEC_MULE_HOLOGRAPHIC_PROFILES.md-adjacent reasoning: reuse
-- real vocabulary, don't invent a parallel one).
-- ============================================================================

BEGIN;

ALTER TABLE public.settlements
  DROP CONSTRAINT settlements_type_check;

ALTER TABLE public.settlements
  ADD CONSTRAINT settlements_type_check
  CHECK (type IN ('surface','cluster','moon','orbital','bh-orbital','stellar-orbital','lunar-orbital','branch'));

ALTER TABLE public.settlements
  ADD COLUMN branch_id       text,
  ADD COLUMN branch_type     text CHECK (branch_type IS NULL OR branch_type IN
                             ('public','private','branded','research','educational')),
  ADD COLUMN base_key        text,
  ADD COLUMN divergence_note text CHECK (divergence_note IS NULL OR char_length(divergence_note) <= 500);

-- A branch row should always carry its base_key (and vice versa — a non-
-- branch row shouldn't have one). Mirrors the type discipline the rest of
-- this table already uses (e.g. focus's CHECK enum) rather than trusting the
-- client to keep the two fields in sync.
ALTER TABLE public.settlements
  ADD CONSTRAINT settlements_branch_fields_check
  CHECK (
    (type = 'branch' AND branch_id IS NOT NULL AND base_key IS NOT NULL)
    OR
    (type != 'branch' AND branch_id IS NULL AND base_key IS NULL)
  );

CREATE INDEX ON public.settlements (base_key) WHERE base_key IS NOT NULL;

COMMIT;
