-- Create a test user
INSERT INTO auth.users (id, email) VALUES ('00000000-0000-0000-0000-000000000000', 'test@example.com') ON CONFLICT DO NOTHING;

-- Insert a job position
INSERT INTO job_positions (id, user_id, company_name, position_title, job_description)
VALUES ('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000000', 'Test Co', 'Dev', 'Desc');

-- Insert a tailored CV
INSERT INTO tailored_cvs (id, user_id, job_position_id, original_cv_hash, tailored_content)
VALUES ('22222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000000', '11111111-1111-1111-1111-111111111111', 'hash', 'Content');

-- Update job position to reference the tailored CV
UPDATE job_positions 
SET submitted_cv_id = '22222222-2222-2222-2222-222222222222'
WHERE id = '11111111-1111-1111-1111-111111111111';

-- Try to delete the job position
DELETE FROM job_positions WHERE id = '11111111-1111-1111-1111-111111111111';

-- Check if it's gone
SELECT * FROM job_positions WHERE id = '11111111-1111-1111-1111-111111111111';
