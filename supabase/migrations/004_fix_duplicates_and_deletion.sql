-- Fix duplicates and deletion issues
-- Run this in Supabase SQL Editor

-- 1. Add unique constraint to prevent duplicate job positions
-- First, we might need to clean up duplicates if any exist (optional, but good practice)
-- For now, we'll just try to add the constraint. If it fails, the user needs to clean up manually.
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'job_positions_user_id_company_name_position_title_key'
  ) THEN
    ALTER TABLE job_positions 
    ADD CONSTRAINT job_positions_user_id_company_name_position_title_key 
    UNIQUE(user_id, company_name, position_title);
  END IF;
END $$;

-- 2. Ensure submitted_cv_id is nullable and has correct FK constraint
ALTER TABLE job_positions ALTER COLUMN submitted_cv_id DROP NOT NULL;

-- Drop existing constraint if we can find its name, or just try to add it if missing
-- It's hard to know the exact name if it was auto-generated, but usually it follows a pattern.
-- However, we can try to drop it by the column definition.
-- A safer way is to rely on the previous migration being correct, but let's reinforce it.

-- We will try to drop the constraint if we can identify it, otherwise we assume it's correct
-- or we can use a DO block to find and drop it.
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT conname 
        FROM pg_constraint 
        WHERE conrelid = 'job_positions'::regclass 
        AND confrelid = 'tailored_cvs'::regclass
        AND contype = 'f'
    ) LOOP
        EXECUTE 'ALTER TABLE job_positions DROP CONSTRAINT ' || quote_ident(r.conname);
    END LOOP;
END $$;

-- Re-add the constraint with ON DELETE SET NULL
ALTER TABLE job_positions 
ADD CONSTRAINT job_positions_submitted_cv_id_fkey 
FOREIGN KEY (submitted_cv_id) 
REFERENCES tailored_cvs(id) 
ON DELETE SET NULL;
