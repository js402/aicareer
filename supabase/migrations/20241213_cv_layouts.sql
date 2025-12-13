-- CV Layouts table for storing custom layout configurations
CREATE TABLE IF NOT EXISTS cv_layouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cv_id UUID NOT NULL REFERENCES cv_metadata(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  template_id TEXT NOT NULL DEFAULT 'modern',
  settings JSONB,
  html TEXT,
  css TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Ensure one layout per CV per user
  UNIQUE(cv_id, user_id)
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS cv_layouts_cv_id_idx ON cv_layouts(cv_id);
CREATE INDEX IF NOT EXISTS cv_layouts_user_id_idx ON cv_layouts(user_id);

-- RLS policies
ALTER TABLE cv_layouts ENABLE ROW LEVEL SECURITY;

-- Users can only see their own layouts
CREATE POLICY "Users can view own layouts"
  ON cv_layouts FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own layouts
CREATE POLICY "Users can create own layouts"
  ON cv_layouts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own layouts
CREATE POLICY "Users can update own layouts"
  ON cv_layouts FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own layouts
CREATE POLICY "Users can delete own layouts"
  ON cv_layouts FOR DELETE
  USING (auth.uid() = user_id);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_cv_layouts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER cv_layouts_updated_at
  BEFORE UPDATE ON cv_layouts
  FOR EACH ROW
  EXECUTE FUNCTION update_cv_layouts_updated_at();
