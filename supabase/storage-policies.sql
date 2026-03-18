-- ============================================================
-- Policies Supabase Storage — Carnet de chantier
-- À exécuter dans Supabase → SQL Editor → Run
-- ============================================================

-- ── S'assurer que les buckets existent ───────────────────────

INSERT INTO storage.buckets (id, name, public)
VALUES ('chantier-photos', 'chantier-photos', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('chantier-documents', 'chantier-documents', false)
ON CONFLICT (id) DO NOTHING;

-- ── bucket : chantier-photos ─────────────────────────────────

CREATE POLICY "upload photos"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'chantier-photos'
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "read photos"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'chantier-photos'
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "delete photos"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'chantier-photos'
    AND auth.role() = 'authenticated'
  );

-- ── bucket : chantier-documents ──────────────────────────────

CREATE POLICY "upload documents"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'chantier-documents'
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "read documents"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'chantier-documents'
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "delete documents"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'chantier-documents'
    AND auth.role() = 'authenticated'
  );
