-- RLS policies for surveillances table
-- Run in Supabase SQL Editor if not already applied

-- Drop existing policies to avoid conflicts (safe to run multiple times)
DROP POLICY IF EXISTS "Users can view own surveillances" ON surveillances;
DROP POLICY IF EXISTS "Users can insert own surveillances" ON surveillances;
DROP POLICY IF EXISTS "Users can delete own surveillances" ON surveillances;

-- Enable RLS (idempotent)
ALTER TABLE surveillances ENABLE ROW LEVEL SECURITY;

-- SELECT : users can only see their own surveillances
CREATE POLICY "Users can view own surveillances"
ON surveillances FOR SELECT
USING (auth.uid() = user_id);

-- INSERT : users can only insert their own surveillances
CREATE POLICY "Users can insert own surveillances"
ON surveillances FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- DELETE : users can only delete their own surveillances
CREATE POLICY "Users can delete own surveillances"
ON surveillances FOR DELETE
USING (auth.uid() = user_id);
