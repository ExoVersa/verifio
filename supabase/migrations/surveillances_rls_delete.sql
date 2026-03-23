-- RLS policy : allow authenticated users to delete their own surveillances
CREATE POLICY IF NOT EXISTS "Users can delete own surveillances"
ON surveillances
FOR DELETE
USING (auth.uid() = user_id);
