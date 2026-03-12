-- ─── Supabase Storage Setup ───────────────────────────────────────────────────
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor → New query).
--
-- IMPORTANT: Supabase Storage RLS applies even to the service role key.
-- The simplest correct approach is to disable RLS on storage.objects for
-- these buckets, then control access via bucket visibility (public/private)
-- and server-side auth in your Next.js API routes.

-- ─── 1. Create buckets ────────────────────────────────────────────────────────

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('data',    'data',    false, 10485760, ARRAY['application/json']),
  ('uploads', 'uploads', true,  10485760, ARRAY[
    'image/jpeg','image/png','image/webp','image/gif','image/svg+xml','image/avif'
  ])
ON CONFLICT (id) DO NOTHING;

-- ─── 2. Storage RLS policies ──────────────────────────────────────────────────
-- Storage RLS is on storage.objects, NOT storage.buckets.
-- The service role key does NOT automatically bypass storage RLS
-- (unlike database table RLS). Policies are required.

-- "data" bucket: full access (server-side only — not reachable by browser
-- because bucket is private and SUPABASE_SERVICE_ROLE_KEY is never exposed)
CREATE POLICY "data bucket: full access"
  ON storage.objects FOR ALL
  USING (bucket_id = 'data')
  WITH CHECK (bucket_id = 'data');

-- "uploads" bucket: public read, unrestricted write
-- (write access is gated by your Next.js auth layer, not Supabase RLS)
CREATE POLICY "uploads bucket: public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'uploads');

CREATE POLICY "uploads bucket: full write"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'uploads');

CREATE POLICY "uploads bucket: full update"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'uploads')
  WITH CHECK (bucket_id = 'uploads');

CREATE POLICY "uploads bucket: full delete"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'uploads');

-- ─── 3. Verify ────────────────────────────────────────────────────────────────
SELECT id, name, public FROM storage.buckets WHERE id IN ('data', 'uploads');
