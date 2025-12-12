-- CV Metadata Schema Enhancement Migration
-- Adds structured columns for better querying while preserving JSONB flexibility
-- Run this in Supabase SQL Editor

-- ============================================================================
-- ADD STRUCTURED COLUMNS TO cv_metadata
-- ============================================================================

-- Add name column for direct querying
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'cv_metadata' AND column_name = 'name'
    ) THEN
        ALTER TABLE cv_metadata ADD COLUMN name TEXT;
    END IF;
END $$;

-- Add email column (commonly searched)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'cv_metadata' AND column_name = 'email'
    ) THEN
        ALTER TABLE cv_metadata ADD COLUMN email TEXT;
    END IF;
END $$;

-- Add seniority level for filtering
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'cv_metadata' AND column_name = 'seniority_level'
    ) THEN
        ALTER TABLE cv_metadata ADD COLUMN seniority_level VARCHAR(50);
    END IF;
END $$;

-- Add years of experience for range queries
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'cv_metadata' AND column_name = 'years_of_experience'
    ) THEN
        ALTER TABLE cv_metadata ADD COLUMN years_of_experience INTEGER;
    END IF;
END $$;

-- Add skills array for querying (denormalized from JSONB)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'cv_metadata' AND column_name = 'skills'
    ) THEN
        ALTER TABLE cv_metadata ADD COLUMN skills TEXT[];
    END IF;
END $$;

-- Add industries array
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'cv_metadata' AND column_name = 'industries'
    ) THEN
        ALTER TABLE cv_metadata ADD COLUMN industries TEXT[];
    END IF;
END $$;

-- Add completion status (calculated field)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'cv_metadata' AND column_name = 'is_complete'
    ) THEN
        ALTER TABLE cv_metadata ADD COLUMN is_complete BOOLEAN DEFAULT false;
    END IF;
END $$;

-- Add completion score (0-100)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'cv_metadata' AND column_name = 'completion_score'
    ) THEN
        ALTER TABLE cv_metadata ADD COLUMN completion_score INTEGER DEFAULT 0;
    END IF;
END $$;

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Index for name search
CREATE INDEX IF NOT EXISTS idx_cv_metadata_name ON cv_metadata(name);

-- Index for email lookup
CREATE INDEX IF NOT EXISTS idx_cv_metadata_email ON cv_metadata(email);

-- Index for seniority filtering
CREATE INDEX IF NOT EXISTS idx_cv_metadata_seniority ON cv_metadata(seniority_level);

-- Index for experience range queries
CREATE INDEX IF NOT EXISTS idx_cv_metadata_experience ON cv_metadata(years_of_experience);

-- GIN index for skills array (allows @> contains queries)
CREATE INDEX IF NOT EXISTS idx_cv_metadata_skills ON cv_metadata USING GIN (skills);

-- GIN index for industries array
CREATE INDEX IF NOT EXISTS idx_cv_metadata_industries ON cv_metadata USING GIN (industries);

-- Index for completion status
CREATE INDEX IF NOT EXISTS idx_cv_metadata_complete ON cv_metadata(is_complete);

-- ============================================================================
-- FUNCTION: Extract and sync structured fields from JSONB
-- ============================================================================

CREATE OR REPLACE FUNCTION sync_cv_metadata_fields()
RETURNS TRIGGER AS $$
BEGIN
    -- Extract name
    NEW.name := NEW.extracted_info->>'name';
    
    -- Extract email from contactInfo
    IF NEW.extracted_info->'contactInfo' IS NOT NULL THEN
        IF jsonb_typeof(NEW.extracted_info->'contactInfo') = 'object' THEN
            NEW.email := NEW.extracted_info->'contactInfo'->>'email';
        ELSE
            -- If contactInfo is a string, try to extract email with regex
            NEW.email := NULL;
        END IF;
    END IF;
    
    -- Extract seniority level
    NEW.seniority_level := NEW.extracted_info->>'seniorityLevel';
    
    -- Extract years of experience
    IF NEW.extracted_info->>'yearsOfExperience' IS NOT NULL THEN
        NEW.years_of_experience := (NEW.extracted_info->>'yearsOfExperience')::INTEGER;
    END IF;
    
    -- Extract skills array
    IF NEW.extracted_info->'skills' IS NOT NULL AND jsonb_typeof(NEW.extracted_info->'skills') = 'array' THEN
        SELECT array_agg(skill)
        INTO NEW.skills
        FROM jsonb_array_elements_text(NEW.extracted_info->'skills') AS skill;
    END IF;
    
    -- Extract industries array
    IF NEW.extracted_info->'industries' IS NOT NULL AND jsonb_typeof(NEW.extracted_info->'industries') = 'array' THEN
        SELECT array_agg(industry)
        INTO NEW.industries
        FROM jsonb_array_elements_text(NEW.extracted_info->'industries') AS industry;
    END IF;
    
    -- Calculate completion status
    -- Required: name, email, at least one experience, at least one skill
    NEW.is_complete := (
        NEW.name IS NOT NULL AND NEW.name != '' AND
        NEW.email IS NOT NULL AND NEW.email != '' AND
        NEW.extracted_info->'experience' IS NOT NULL AND 
        jsonb_array_length(COALESCE(NEW.extracted_info->'experience', '[]'::jsonb)) > 0 AND
        NEW.extracted_info->'skills' IS NOT NULL AND 
        jsonb_array_length(COALESCE(NEW.extracted_info->'skills', '[]'::jsonb)) > 0
    );
    
    -- Calculate completion score (rough approximation)
    NEW.completion_score := 0;
    
    -- Name: 15 points
    IF NEW.name IS NOT NULL AND NEW.name != '' THEN
        NEW.completion_score := NEW.completion_score + 15;
    END IF;
    
    -- Email: 15 points
    IF NEW.email IS NOT NULL AND NEW.email != '' THEN
        NEW.completion_score := NEW.completion_score + 15;
    END IF;
    
    -- Experience: 20 points
    IF NEW.extracted_info->'experience' IS NOT NULL AND 
       jsonb_array_length(COALESCE(NEW.extracted_info->'experience', '[]'::jsonb)) > 0 THEN
        NEW.completion_score := NEW.completion_score + 20;
    END IF;
    
    -- Skills: 15 points
    IF NEW.extracted_info->'skills' IS NOT NULL AND 
       jsonb_array_length(COALESCE(NEW.extracted_info->'skills', '[]'::jsonb)) > 0 THEN
        NEW.completion_score := NEW.completion_score + 15;
    END IF;
    
    -- Education: 10 points
    IF NEW.extracted_info->'education' IS NOT NULL AND 
       jsonb_array_length(COALESCE(NEW.extracted_info->'education', '[]'::jsonb)) > 0 THEN
        NEW.completion_score := NEW.completion_score + 10;
    END IF;
    
    -- Summary: 10 points
    IF NEW.extracted_info->>'summary' IS NOT NULL AND NEW.extracted_info->>'summary' != '' THEN
        NEW.completion_score := NEW.completion_score + 10;
    END IF;
    
    -- Projects: 5 points
    IF NEW.extracted_info->'projects' IS NOT NULL AND 
       jsonb_array_length(COALESCE(NEW.extracted_info->'projects', '[]'::jsonb)) > 0 THEN
        NEW.completion_score := NEW.completion_score + 5;
    END IF;
    
    -- Certifications: 5 points
    IF NEW.extracted_info->'certifications' IS NOT NULL AND 
       jsonb_array_length(COALESCE(NEW.extracted_info->'certifications', '[]'::jsonb)) > 0 THEN
        NEW.completion_score := NEW.completion_score + 5;
    END IF;
    
    -- Languages: 5 points
    IF NEW.extracted_info->'languages' IS NOT NULL AND 
       jsonb_array_length(COALESCE(NEW.extracted_info->'languages', '[]'::jsonb)) > 0 THEN
        NEW.completion_score := NEW.completion_score + 5;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGER: Auto-sync on insert/update
-- ============================================================================

DROP TRIGGER IF EXISTS sync_cv_metadata_fields_trigger ON cv_metadata;
CREATE TRIGGER sync_cv_metadata_fields_trigger
    BEFORE INSERT OR UPDATE OF extracted_info ON cv_metadata
    FOR EACH ROW
    EXECUTE FUNCTION sync_cv_metadata_fields();

-- ============================================================================
-- MIGRATE EXISTING DATA
-- ============================================================================

-- Run the sync function on all existing rows
UPDATE cv_metadata SET extracted_info = extracted_info WHERE TRUE;

-- ============================================================================
-- HELPFUL VIEWS
-- ============================================================================

-- View for searching CVs with common fields
CREATE OR REPLACE VIEW cv_metadata_summary AS
SELECT 
    id,
    user_id,
    cv_hash,
    name,
    email,
    seniority_level,
    years_of_experience,
    skills,
    industries,
    is_complete,
    completion_score,
    confidence_score,
    display_name,
    created_at,
    updated_at
FROM cv_metadata;

-- Grant access to the view
GRANT SELECT ON cv_metadata_summary TO authenticated;
