-- ============================================================
-- Policies Supabase Storage — Carnet de chantier
-- À exécuter dans Supabase → SQL Editor
-- ============================================================
-- Structure des chemins : {user_id}/{chantier_id}/{filename}
-- La policy vérifie (storage.foldername(name))[1] = auth.uid()
-- ============================================================

-- ── bucket : chantier-photos ─────────────────────────────────

CREATE POLICY "photos: upload (authenticated)"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'chantier-photos'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "photos: read own"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'chantier-photos'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "photos: delete own"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'chantier-photos'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- ── bucket : chantier-documents ──────────────────────────────

CREATE POLICY "documents: upload (authenticated)"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'chantier-documents'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "documents: read own"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'chantier-documents'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "documents: delete own"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'chantier-documents'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
