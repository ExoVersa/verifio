CREATE TABLE rapports (
  id                uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid          REFERENCES auth.users(id) ON DELETE SET NULL,
  siret             text          NOT NULL,
  nom_entreprise    text,
  stripe_session_id text          UNIQUE NOT NULL,
  montant           integer       NOT NULL DEFAULT 490,
  statut            text          NOT NULL DEFAULT 'genere',
  created_at        timestamptz   DEFAULT now()
);

ALTER TABLE rapports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own rapports"
  ON rapports FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role full access"
  ON rapports FOR ALL
  USING (true)
  WITH CHECK (true);
