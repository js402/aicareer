-- Add cv_content column to cv_metadata for storing markdown content
-- This allows tailored CVs to be stored directly in cv_metadata

DO $$
BEGIN
    -- Add cv_content column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'cv_metadata' AND column_name = 'cv_content'
    ) THEN
        ALTER TABLE cv_metadata ADD COLUMN cv_content TEXT;
    END IF;

    -- Add source_type column to distinguish original vs tailored CVs
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'cv_metadata' AND column_name = 'source_type'
    ) THEN
        ALTER TABLE cv_metadata ADD COLUMN source_type VARCHAR(50) DEFAULT 'uploaded';
    END IF;

    -- Add source_cv_id to track which CV a tailored version was generated from
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'cv_metadata' AND column_name = 'source_cv_id'
    ) THEN
        ALTER TABLE cv_metadata ADD COLUMN source_cv_id UUID REFERENCES cv_metadata(id) ON DELETE SET NULL;
    END IF;

    -- Add job_position_id to track which position a tailored CV was generated for
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'cv_metadata' AND column_name = 'job_position_id'
    ) THEN
        ALTER TABLE cv_metadata ADD COLUMN job_position_id UUID REFERENCES job_positions(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Add constraint for source_type
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'valid_source_type'
    ) THEN
        ALTER TABLE cv_metadata ADD CONSTRAINT valid_source_type 
        CHECK (source_type IN ('uploaded', 'tailored'));
    END IF;
END $$;

-- Create indexes for new columns
CREATE INDEX IF NOT EXISTS idx_cv_metadata_source_type ON cv_metadata(source_type);
CREATE INDEX IF NOT EXISTS idx_cv_metadata_source_cv ON cv_metadata(source_cv_id);
CREATE INDEX IF NOT EXISTS idx_cv_metadata_job_position ON cv_metadata(job_position_id);

-- Add comments
COMMENT ON COLUMN cv_metadata.cv_content IS 'The markdown content of the CV (for tailored CVs or stored original content)';
COMMENT ON COLUMN cv_metadata.source_type IS 'Whether this is an uploaded original CV or a tailored version';
COMMENT ON COLUMN cv_metadata.source_cv_id IS 'For tailored CVs, the original CV this was generated from';
COMMENT ON COLUMN cv_metadata.job_position_id IS 'For tailored CVs, the job position this was tailored for';
