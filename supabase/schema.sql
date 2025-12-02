-- Database Schema for CV Analysis App
-- This schema is idempotent and can be run multiple times safely

-- Create table if it doesn't exist
CREATE TABLE IF NOT EXISTS cv_analyses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  cv_hash TEXT NOT NULL,
  cv_content TEXT NOT NULL,
  filename TEXT,
  analysis TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add unique constraint if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'cv_analyses_user_id_cv_hash_key'
  ) THEN
    ALTER TABLE cv_analyses ADD CONSTRAINT cv_analyses_user_id_cv_hash_key UNIQUE(user_id, cv_hash);
  END IF;
END $$;

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_cv_analyses_hash ON cv_analyses(cv_hash);
CREATE INDEX IF NOT EXISTS idx_cv_analyses_user ON cv_analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_cv_analyses_created ON cv_analyses(created_at DESC);

-- Enable Row Level Security (idempotent)
DO $$
BEGIN
  -- Check if RLS is not already enabled
  IF NOT EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relname = 'cv_analyses'
    AND n.nspname = 'public'
    AND c.relrowsecurity = true
  ) THEN
    ALTER TABLE cv_analyses ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Drop existing policies if they exist and recreate them
-- This ensures policies are always up to date
DROP POLICY IF EXISTS "Users can view own analyses" ON cv_analyses;
CREATE POLICY "Users can view own analyses"
  ON cv_analyses FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own analyses" ON cv_analyses;
CREATE POLICY "Users can insert own analyses"
  ON cv_analyses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own analyses" ON cv_analyses;
CREATE POLICY "Users can update own analyses"
  ON cv_analyses FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own analyses" ON cv_analyses;
CREATE POLICY "Users can delete own analyses"
  ON cv_analyses FOR DELETE
  USING (auth.uid() = user_id);

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'update_cv_analyses_updated_at'
  ) THEN
    CREATE TRIGGER update_cv_analyses_updated_at
        BEFORE UPDATE ON cv_analyses
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

