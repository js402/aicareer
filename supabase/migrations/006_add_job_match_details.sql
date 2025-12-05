-- Add new columns to job_positions table for richer match analysis data
-- This migration is idempotent

DO $$
BEGIN
    -- Add experience_alignment if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'job_positions' AND column_name = 'experience_alignment'
    ) THEN
        ALTER TABLE job_positions ADD COLUMN experience_alignment JSONB;
    END IF;

    -- Add responsibility_alignment if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'job_positions' AND column_name = 'responsibility_alignment'
    ) THEN
        ALTER TABLE job_positions ADD COLUMN responsibility_alignment JSONB;
    END IF;

    -- Add employment_type if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'job_positions' AND column_name = 'employment_type'
    ) THEN
        ALTER TABLE job_positions ADD COLUMN employment_type VARCHAR(100);
    END IF;

    -- Add seniority_level if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'job_positions' AND column_name = 'seniority_level'
    ) THEN
        ALTER TABLE job_positions ADD COLUMN seniority_level VARCHAR(100);
    END IF;

END $$;
