-- CV Metadata Storage Migration
-- Run this in Supabase SQL Editor
-- This migration is idempotent and can be run multiple times safely

-- ============================================================================
-- TABLE: cv_metadata
-- ============================================================================

CREATE TABLE IF NOT EXISTS cv_metadata (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- CV identification
    cv_hash TEXT NOT NULL,

    -- Extracted metadata (JSON structure for flexibility)
    extracted_info JSONB NOT NULL,

    -- Metadata quality indicators
    extraction_status VARCHAR(50) DEFAULT 'completed', -- 'completed', 'partial', 'failed'
    confidence_score DECIMAL(3,2), -- 0.00 to 1.00

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Constraints
    CONSTRAINT valid_extraction_status CHECK (extraction_status IN ('completed', 'partial', 'failed')),
    CONSTRAINT valid_confidence_score CHECK (confidence_score >= 0 AND confidence_score <= 1)
);

-- Unique constraint: each user can have only one metadata entry per CV hash
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'cv_metadata_user_id_cv_hash_key'
  ) THEN
    ALTER TABLE cv_metadata ADD CONSTRAINT cv_metadata_user_id_cv_hash_key UNIQUE(user_id, cv_hash);
  END IF;
END $$;

-- Indexes for cv_metadata
CREATE INDEX IF NOT EXISTS idx_cv_metadata_user ON cv_metadata(user_id);
CREATE INDEX IF NOT EXISTS idx_cv_metadata_hash ON cv_metadata(cv_hash);
CREATE INDEX IF NOT EXISTS idx_cv_metadata_status ON cv_metadata(extraction_status);
CREATE INDEX IF NOT EXISTS idx_cv_metadata_created ON cv_metadata(created_at DESC);

-- GIN index for JSONB queries on extracted_info
CREATE INDEX IF NOT EXISTS idx_cv_metadata_extracted_info ON cv_metadata USING GIN (extracted_info);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on cv_metadata
ALTER TABLE cv_metadata ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (idempotent)
DROP POLICY IF EXISTS "Users can view own metadata" ON cv_metadata;
DROP POLICY IF EXISTS "Users can insert own metadata" ON cv_metadata;
DROP POLICY IF EXISTS "Users can update own metadata" ON cv_metadata;
DROP POLICY IF EXISTS "Users can delete own metadata" ON cv_metadata;

-- Create policies for cv_metadata
CREATE POLICY "Users can view own metadata"
    ON cv_metadata FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own metadata"
    ON cv_metadata FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own metadata"
    ON cv_metadata FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own metadata"
    ON cv_metadata FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Create trigger for cv_metadata updated_at
DROP TRIGGER IF EXISTS update_cv_metadata_updated_at ON cv_metadata;
CREATE TRIGGER update_cv_metadata_updated_at
    BEFORE UPDATE ON cv_metadata
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to get or create CV metadata
CREATE OR REPLACE FUNCTION get_or_create_cv_metadata(
    p_user_id UUID,
    p_cv_hash TEXT,
    p_extracted_info JSONB,
    p_extraction_status VARCHAR(50) DEFAULT 'completed',
    p_confidence_score DECIMAL(3,2) DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    metadata_id UUID;
BEGIN
    -- Try to get existing metadata
    SELECT id INTO metadata_id
    FROM cv_metadata
    WHERE user_id = p_user_id AND cv_hash = p_cv_hash;

    -- If not found, create new metadata
    IF metadata_id IS NULL THEN
        INSERT INTO cv_metadata (
            user_id,
            cv_hash,
            extracted_info,
            extraction_status,
            confidence_score
        )
        VALUES (
            p_user_id,
            p_cv_hash,
            p_extracted_info,
            p_extraction_status,
            p_confidence_score
        )
        RETURNING id INTO metadata_id;
    ELSE
        -- Update existing metadata
        UPDATE cv_metadata
        SET
            extracted_info = p_extracted_info,
            extraction_status = p_extraction_status,
            confidence_score = p_confidence_score,
            updated_at = NOW()
        WHERE id = metadata_id;
    END IF;

    RETURN metadata_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- VERIFICATION QUERIES (Optional - run these to verify setup)
-- ============================================================================

-- Check table exists
-- SELECT table_name FROM information_schema.tables
-- WHERE table_schema = 'public'
-- AND table_name = 'cv_metadata';

-- Check RLS is enabled
-- SELECT tablename, rowsecurity FROM pg_tables
-- WHERE schemaname = 'public'
-- AND tablename = 'cv_metadata';

-- Check policies exist
-- SELECT tablename, policyname FROM pg_policies
-- WHERE schemaname = 'public'
-- AND tablename = 'cv_metadata';

-- ============================================================================
-- GRANTS (if needed)
-- ============================================================================

-- Grant usage on the function
GRANT EXECUTE ON FUNCTION get_or_create_cv_metadata(UUID, TEXT, JSONB, VARCHAR, DECIMAL) TO authenticated;
