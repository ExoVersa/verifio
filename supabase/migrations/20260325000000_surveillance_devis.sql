-- ── Surveillance : ajout user_id + expires_at ─────────────────────────────────
ALTER TABLE surveillances ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id);
ALTER TABLE surveillances ADD COLUMN IF NOT EXISTS expires_at timestamptz;

-- ── Table devis_uploads ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS devis_uploads (
  id           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      uuid REFERENCES auth.users(id) NOT NULL,
  rapport_id   uuid REFERENCES rapports(id),
  siret        text NOT NULL,
  version      int  DEFAULT 1,
  nom_fichier  text,
  analyse_json jsonb,
  created_at   timestamptz DEFAULT now()
);

ALTER TABLE devis_uploads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own devis"
  ON devis_uploads FOR ALL
  USING (auth.uid() = user_id);
