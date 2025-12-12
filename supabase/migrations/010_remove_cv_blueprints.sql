-- Migration 010: Remove CV Blueprint Feature
-- This migration drops the cv_blueprints system which was unreliable
-- CV metadata (cv_metadata table) remains as the source of truth for stored CV data
-- Run this manually via Supabase SQL Editor after deploying code changes

-- ============================================================================
-- Drop dependent policies first
-- ============================================================================

DROP POLICY IF EXISTS "Users can view own blueprint changes" ON cv_blueprint_changes;
DROP POLICY IF EXISTS "Users can insert own blueprint changes" ON cv_blueprint_changes;

DROP POLICY IF EXISTS "Users can view own blueprint" ON cv_blueprints;
DROP POLICY IF EXISTS "Users can insert own blueprint" ON cv_blueprints;
DROP POLICY IF EXISTS "Users can update own blueprint" ON cv_blueprints;

-- ============================================================================
-- Drop triggers
-- ============================================================================

DROP TRIGGER IF EXISTS update_cv_blueprints_updated_at ON cv_blueprints;

-- ============================================================================
-- Drop functions
-- ============================================================================

DROP FUNCTION IF EXISTS get_or_create_cv_blueprint(UUID);
DROP FUNCTION IF EXISTS record_blueprint_change(UUID, UUID, UUID, TEXT, TEXT, TEXT, JSONB, JSONB);

-- ============================================================================
-- Drop tables (cv_blueprint_changes first due to foreign key)
-- ============================================================================

DROP TABLE IF EXISTS cv_blueprint_changes;
DROP TABLE IF EXISTS cv_blueprints;

-- ============================================================================
-- Clean up any indexes that might remain
-- ============================================================================

DROP INDEX IF EXISTS idx_cv_blueprints_user;
DROP INDEX IF EXISTS idx_cv_blueprints_updated;
DROP INDEX IF EXISTS idx_cv_blueprints_confidence;
DROP INDEX IF EXISTS idx_cv_blueprints_profile_data;
DROP INDEX IF EXISTS idx_cv_blueprints_skills_category;
DROP INDEX IF EXISTS idx_cv_blueprints_leadership;
DROP INDEX IF EXISTS idx_cv_blueprints_seniority;

DROP INDEX IF EXISTS idx_cv_blueprint_changes_blueprint;
DROP INDEX IF EXISTS idx_cv_blueprint_changes_user;
DROP INDEX IF EXISTS idx_cv_blueprint_changes_type;
DROP INDEX IF EXISTS idx_cv_blueprint_changes_created;

-- ============================================================================
-- Note: The job_match_analyses table remains but will now use cv_hash from 
-- cv_metadata instead of from cv_blueprints. Existing cached analyses will
-- become orphaned but this is acceptable as they'll just be regenerated.
-- ============================================================================
