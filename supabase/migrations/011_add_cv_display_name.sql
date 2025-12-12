-- Add display_name to cv_metadata for user-friendly naming

ALTER TABLE cv_metadata ADD COLUMN IF NOT EXISTS display_name TEXT;

-- Optional: backfill display_name from extracted_info summary/primaryFunctions
UPDATE cv_metadata
SET display_name = COALESCE(
  display_name,
  (extracted_info->>'summary'),
  'CV '
) || ' - ' || to_char(created_at, 'YYYY-MM-DD')
WHERE display_name IS NULL;