-- CV Blueprint System Migration
-- Run this in Supabase SQL Editor
-- This migration creates a system that learns and accumulates user profiles over time

-- ============================================================================
-- TABLE: cv_blueprints
-- ============================================================================

CREATE TABLE IF NOT EXISTS cv_blueprints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Core Profile Data (accumulated from multiple CVs)
    profile_data JSONB NOT NULL,

    -- Metadata
    total_cvs_processed INTEGER DEFAULT 0,
    last_cv_processed_at TIMESTAMP WITH TIME ZONE,
    blueprint_version INTEGER DEFAULT 1,

    -- Learning Statistics
    confidence_score DECIMAL(3,2) DEFAULT 0.0, -- Overall confidence in the blueprint
    data_completeness DECIMAL(3,2) DEFAULT 0.0, -- How complete the profile is (0-1)

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Constraints
    CONSTRAINT valid_confidence_score CHECK (confidence_score >= 0 AND confidence_score <= 1),
    CONSTRAINT valid_data_completeness CHECK (data_completeness >= 0 AND data_completeness <= 1),
    CONSTRAINT valid_blueprint_version CHECK (blueprint_version > 0)
);

-- Unique constraint: one blueprint per user
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'cv_blueprints_user_id_key'
  ) THEN
    ALTER TABLE cv_blueprints ADD CONSTRAINT cv_blueprints_user_id_key UNIQUE(user_id);
  END IF;
END $$;

-- Indexes for cv_blueprints
CREATE INDEX IF NOT EXISTS idx_cv_blueprints_user ON cv_blueprints(user_id);
CREATE INDEX IF NOT EXISTS idx_cv_blueprints_updated ON cv_blueprints(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_cv_blueprints_confidence ON cv_blueprints(confidence_score DESC);

-- GIN index for JSONB queries on profile_data
CREATE INDEX IF NOT EXISTS idx_cv_blueprints_profile_data ON cv_blueprints USING GIN (profile_data);

-- ============================================================================
-- TABLE: cv_blueprint_changes
-- ============================================================================

CREATE TABLE IF NOT EXISTS cv_blueprint_changes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    blueprint_id UUID NOT NULL REFERENCES cv_blueprints(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Change Details
    change_type VARCHAR(50) NOT NULL, -- 'cv_processed', 'manual_edit', 'merge_conflict_resolved'
    cv_hash TEXT, -- Which CV triggered this change (if applicable)

    -- Before/After Data
    previous_data JSONB,
    new_data JSONB,

    -- Change Metadata
    changes_summary TEXT, -- Human-readable summary of what changed
    confidence_impact DECIMAL(3,2), -- How this change affected confidence score

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for cv_blueprint_changes
CREATE INDEX IF NOT EXISTS idx_cv_blueprint_changes_blueprint ON cv_blueprint_changes(blueprint_id);
CREATE INDEX IF NOT EXISTS idx_cv_blueprint_changes_user ON cv_blueprint_changes(user_id);
CREATE INDEX IF NOT EXISTS idx_cv_blueprint_changes_type ON cv_blueprint_changes(change_type);
CREATE INDEX IF NOT EXISTS idx_cv_blueprint_changes_created ON cv_blueprint_changes(created_at DESC);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on cv_blueprints
ALTER TABLE cv_blueprints ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own blueprint" ON cv_blueprints;
DROP POLICY IF EXISTS "Users can insert own blueprint" ON cv_blueprints;
DROP POLICY IF EXISTS "Users can update own blueprint" ON cv_blueprints;

-- Create policies for cv_blueprints
CREATE POLICY "Users can view own blueprint"
    ON cv_blueprints FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own blueprint"
    ON cv_blueprints FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own blueprint"
    ON cv_blueprints FOR UPDATE
    USING (auth.uid() = user_id);

-- Enable RLS on cv_blueprint_changes
ALTER TABLE cv_blueprint_changes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own blueprint changes" ON cv_blueprint_changes;

-- Create policies for cv_blueprint_changes
CREATE POLICY "Users can view own blueprint changes"
    ON cv_blueprint_changes FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own blueprint changes"
    ON cv_blueprint_changes FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Create trigger for cv_blueprints updated_at
DROP TRIGGER IF EXISTS update_cv_blueprints_updated_at ON cv_blueprints;
CREATE TRIGGER update_cv_blueprints_updated_at
    BEFORE UPDATE ON cv_blueprints
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to get or create a user blueprint
CREATE OR REPLACE FUNCTION get_or_create_cv_blueprint(
    p_user_id UUID
)
RETURNS UUID AS $$
DECLARE
    blueprint_id UUID;
BEGIN
    -- Try to get existing blueprint
    SELECT id INTO blueprint_id
    FROM cv_blueprints
    WHERE user_id = p_user_id;

    -- If not found, create new blueprint
    IF blueprint_id IS NULL THEN
        INSERT INTO cv_blueprints (
            user_id,
            profile_data,
            total_cvs_processed,
            blueprint_version,
            confidence_score,
            data_completeness
        )
        VALUES (
            p_user_id,
            '{
                "personal": {},
                "experience": [],
                "education": [],
                "skills": [],
                "contact": {},
                "summary": ""
            }'::jsonb,
            0,
            1,
            0.0,
            0.0
        )
        RETURNING id INTO blueprint_id;
    END IF;

    RETURN blueprint_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to record blueprint changes
CREATE OR REPLACE FUNCTION record_blueprint_change(
    p_blueprint_id UUID,
    p_user_id UUID,
    p_change_type VARCHAR(50),
    p_cv_hash TEXT DEFAULT NULL,
    p_previous_data JSONB DEFAULT NULL,
    p_new_data JSONB DEFAULT NULL,
    p_changes_summary TEXT DEFAULT NULL,
    p_confidence_impact DECIMAL(3,2) DEFAULT 0.0
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO cv_blueprint_changes (
        blueprint_id,
        user_id,
        change_type,
        cv_hash,
        previous_data,
        new_data,
        changes_summary,
        confidence_impact
    )
    VALUES (
        p_blueprint_id,
        p_user_id,
        p_change_type,
        p_cv_hash,
        p_previous_data,
        p_new_data,
        p_changes_summary,
        p_confidence_impact
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate data completeness
CREATE OR REPLACE FUNCTION calculate_data_completeness(
    p_profile_data JSONB
)
RETURNS DECIMAL(3,2) AS $$
DECLARE
    completeness DECIMAL(3,2) := 0.0;
    total_fields INTEGER := 0;
    filled_fields INTEGER := 0;
BEGIN
    -- Personal info (25% weight)
    total_fields := total_fields + 4; -- name, email, phone, location
    IF p_profile_data->'personal'->>'name' IS NOT NULL AND length(trim(p_profile_data->'personal'->>'name')) > 0 THEN
        filled_fields := filled_fields + 1;
    END IF;
    IF p_profile_data->'contact'->>'email' IS NOT NULL AND length(trim(p_profile_data->'contact'->>'email')) > 0 THEN
        filled_fields := filled_fields + 1;
    END IF;
    IF p_profile_data->'contact'->>'phone' IS NOT NULL AND length(trim(p_profile_data->'contact'->>'phone')) > 0 THEN
        filled_fields := filled_fields + 1;
    END IF;
    IF p_profile_data->'contact'->>'location' IS NOT NULL AND length(trim(p_profile_data->'contact'->>'location')) > 0 THEN
        filled_fields := filled_fields + 1;
    END IF;

    -- Skills (20% weight)
    total_fields := total_fields + 1;
    IF jsonb_array_length(p_profile_data->'skills') > 0 THEN
        filled_fields := filled_fields + 1;
    END IF;

    -- Experience (30% weight)
    total_fields := total_fields + 1;
    IF jsonb_array_length(p_profile_data->'experience') > 0 THEN
        filled_fields := filled_fields + 1;
    END IF;

    -- Education (15% weight)
    total_fields := total_fields + 1;
    IF jsonb_array_length(p_profile_data->'education') > 0 THEN
        filled_fields := filled_fields + 1;
    END IF;

    -- Summary (10% weight)
    total_fields := total_fields + 1;
    IF p_profile_data->>'summary' IS NOT NULL AND length(trim(p_profile_data->>'summary')) > 10 THEN
        filled_fields := filled_fields + 1;
    END IF;

    IF total_fields > 0 THEN
        completeness := filled_fields::DECIMAL / total_fields::DECIMAL;
    END IF;

    RETURN completeness;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================================================
-- VERIFICATION QUERIES (Optional - run these to verify setup)
-- ============================================================================

-- Check tables exist
-- SELECT table_name FROM information_schema.tables
-- WHERE table_schema = 'public'
-- AND table_name IN ('cv_blueprints', 'cv_blueprint_changes');

-- Check RLS is enabled
-- SELECT tablename, rowsecurity FROM pg_tables
-- WHERE schemaname = 'public'
-- AND tablename IN ('cv_blueprints', 'cv_blueprint_changes');

-- Check functions exist
-- SELECT routine_name FROM information_schema.routines
-- WHERE routine_schema = 'public'
-- AND routine_name LIKE 'cv_blueprint%';

-- ============================================================================
-- GRANTS (if needed)
-- ============================================================================

-- Grant usage on the functions
GRANT EXECUTE ON FUNCTION get_or_create_cv_blueprint(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION record_blueprint_change(UUID, UUID, VARCHAR, TEXT, JSONB, JSONB, TEXT, DECIMAL) TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_data_completeness(JSONB) TO authenticated;
