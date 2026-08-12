-- ============================================================================
-- 017_settlement_fingerprint.sql
--
-- Adds the settlement identity fingerprint from SPEC_E8_RECORD_FINGERPRINT.md.
-- Computed client-side once, at creation (src/lib/settlements.ts's
-- addSettlement()), and synced here like every other field — this is a
-- stored identity marker, not a server-verified integrity check, so no
-- trigger or server-side computation is needed (contrast with
-- project_log_entries' fingerprint_sha256 in the next migration, which IS
-- server-computed because that use case needs the stronger guarantee).
-- ============================================================================

BEGIN;

ALTER TABLE public.settlements
  ADD COLUMN fingerprint text;

COMMIT;
