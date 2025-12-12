-- Add cv_metadata_id column to job_positions table
-- This tracks which CV was used to generate the job match analysis

-- Add the cv_metadata_id column (nullable for existing rows)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'job_positions' AND column_name = 'cv_metadata_id'
    ) THEN
        ALTER TABLE job_positions ADD COLUMN cv_metadata_id UUID REFERENCES cv_metadata(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Create index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_job_positions_cv_metadata ON job_positions(cv_metadata_id);

-- Add comment for documentation
COMMENT ON COLUMN job_positions.cv_metadata_id IS 'The CV metadata that was used to generate the job match analysis for this position';
