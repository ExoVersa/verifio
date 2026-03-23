-- RLS policies for surveillances table
-- La table surveillances utilise "email" (pas user_id) comme identifiant propriétaire
-- Run in Supabase SQL Editor

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view own surveillances" ON surveillances;
DROP POLICY IF EXISTS "Users can insert own surveillances" ON surveillances;
DROP POLICY IF EXISTS "Users can delete own surveillances" ON surveillances;

-- Enable RLS (idempotent)
ALTER TABLE surveillances ENABLE ROW LEVEL SECURITY;

-- SELECT : users can only see surveillances matching their email
CREATE POLICY "Users can view own surveillances"
ON surveillances FOR SELECT
USING (auth.email() = email);

-- INSERT : users can only insert surveillances with their email
CREATE POLICY "Users can insert own surveillances"
ON surveillances FOR INSERT
WITH CHECK (auth.email() = email);

-- DELETE : users can only delete surveillances matching their email
CREATE POLICY "Users can delete own surveillances"
ON surveillances FOR DELETE
USING (auth.email() = email);
