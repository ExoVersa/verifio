-- Ajout colonne nom_entreprise sur la table rapports si elle existe déjà sans cette colonne
ALTER TABLE rapports ADD COLUMN IF NOT EXISTS nom_entreprise text;
