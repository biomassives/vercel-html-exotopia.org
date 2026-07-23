-- ============================================================
-- Field-evidence photo retention — auto-purge
-- Migration 006
-- ============================================================
-- src/stores/eco-offline.ts uploads resized field-evidence photos to the
-- 'eco-ops-photos' storage bucket (created manually via the Supabase
-- dashboard — not version-controlled, since bucket creation isn't
-- expressible in a plain SQL migration the way table DDL is). Nothing
-- currently expires them; they accumulate in storage indefinitely.
--
-- This is the gap legal-safe1.txt Part 2 §4 flags: "auto-expire
-- verification logs... 60 days after an Action Certificate is approved."
-- We simplify that slightly — there's no schema link from a stored photo
-- back to a specific certificate-approval event today, so this purges by
-- upload age instead (90 days, matching the same window already used for
-- staged-entries.ts's local-draft prune, for one consistent retention
-- number across the app rather than two different ones). If a precise
-- "N days after approval" link is wanted later, that needs a join table
-- connecting storage.objects to reward_events/certificates first.
--
-- REQUIRES pg_cron to be enabled on the project (Database → Extensions →
-- pg_cron in the Supabase dashboard) — this is an operator action, not
-- something a migration file can turn on by itself.

CREATE OR REPLACE FUNCTION public.purge_stale_eco_ops_photos()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  DELETE FROM storage.objects
  WHERE bucket_id = 'eco-ops-photos'
    AND created_at < now() - interval '90 days';
END;
$$;

-- Runs daily at 03:17 UTC (off-peak, arbitrary offset to avoid every
-- scheduled job on a shared instance firing at the same minute).
-- `cron.schedule` is idempotent-by-name — re-running this migration
-- updates the existing job rather than creating a duplicate.
SELECT cron.schedule(
  'purge-stale-eco-ops-photos',
  '17 3 * * *',
  $$SELECT public.purge_stale_eco_ops_photos()$$
);
