-- Career Guidance Table Migration
-- Run this in Supabase SQL Editor
-- This migration is idempotent and can be run multiple times safely

-- Create career_guidance table
CREATE TABLE IF NOT EXISTS career_guidance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    cv_hash VARCHAR(64) NOT NULL,
    guidance JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Unique constraint to prevent duplicate guidance for same CV
    UNIQUE(user_id, cv_hash)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_career_guidance_user_id ON career_guidance(user_id);
CREATE INDEX IF NOT EXISTS idx_career_guidance_cv_hash ON career_guidance(cv_hash);
CREATE INDEX IF NOT EXISTS idx_career_guidance_created ON career_guidance(user_id, created_at DESC);

-- Enable RLS
ALTER TABLE career_guidance ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (idempotent)
DROP POLICY IF EXISTS "Users can view own career guidance" ON career_guidance;
DROP POLICY IF EXISTS "Users can insert own career guidance" ON career_guidance;
DROP POLICY IF EXISTS "Users can delete own career guidance" ON career_guidance;

-- Create policies
CREATE POLICY "Users can view own career guidance"
    ON career_guidance FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own career guidance"
    ON career_guidance FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own career guidance"
    ON career_guidance FOR DELETE
    USING (auth.uid() = user_id);
