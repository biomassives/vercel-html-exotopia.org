-- ============================================================================
-- 018_pfas_log_fingerprint.sql
--
-- Server-anchored fingerprint for project_log_entries, per
-- SPEC_E8_RECORD_FINGERPRINT.md decision 4. Unlike the settlement fingerprint
-- (017 — client-computed, a stored identity marker), this one is computed
-- server-side because this use case needs the stronger guarantee: combined
-- with this table's existing append-only design (no UPDATE policy exists —
-- see migration 003), a server-computed hash makes "this exact content
-- existed, attributed to this author, no later than this server-verified
-- time" a real, defensible claim, not a spoofable client-supplied one.
--
-- Only the SHA-256 hash is computed here. The E8 theta *rendering* of that
-- hash is a pure deterministic function with no secret involved, so it runs
-- client-side at display time (src/lib/record-fingerprint.ts's
-- renderFingerprintFromHex()), reusing the already-verified WASM module —
-- no need to reimplement theta functions in PL/pgSQL.
-- ============================================================================

BEGIN;

ALTER TABLE public.project_log_entries
  ADD COLUMN fingerprint_sha256 bytea;

CREATE OR REPLACE FUNCTION public.set_log_entry_fingerprint()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- pgcrypto's digest() lives in the extensions schema on this project, not
  -- public — fully qualified rather than widening search_path, since this
  -- is a SECURITY DEFINER function (same reasoning as every other pinned
  -- search_path in this codebase, e.g. migration 007's header note).
  NEW.fingerprint_sha256 := extensions.digest(NEW.notes || '::' || NEW.metrics::text, 'sha256');
  RETURN NEW;
END $$;

CREATE TRIGGER trg_log_entry_fingerprint
  BEFORE INSERT ON public.project_log_entries
  FOR EACH ROW EXECUTE FUNCTION public.set_log_entry_fingerprint();

COMMIT;
