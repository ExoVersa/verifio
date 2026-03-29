CREATE TABLE IF NOT EXISTS chantier_phases (
  id                   uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  chantier_id          uuid        NOT NULL REFERENCES chantiers(id) ON DELETE CASCADE,
  nom                  text        NOT NULL CHECK (nom IN ('preparation', 'travaux', 'finitions', 'reception')),
  statut               text        NOT NULL DEFAULT 'en_attente' CHECK (statut IN ('en_attente', 'en_cours', 'terminee')),
  date_debut_prevue    date,
  date_fin_prevue      date,
  date_debut_reelle    date,
  date_fin_reelle      date,
  budget               integer,
  created_at           timestamptz DEFAULT now(),
  UNIQUE (chantier_id, nom)
);

ALTER TABLE chantier_phases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own phases"
  ON chantier_phases FOR ALL
  USING (chantier_id IN (SELECT id FROM chantiers WHERE user_id = auth.uid()));
