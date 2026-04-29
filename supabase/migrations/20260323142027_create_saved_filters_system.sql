/*
  # Create Saved Filters System

  1. New Tables
    - `saved_filters`
      - Stores user-defined filter configurations
      - Supports multiple object types (leads, opportunities, etc.)
      - Allows favoriting frequently used filters
    
  2. Security
    - Enable RLS on saved_filters table
    - Users can only access their own filters
    - Proper indexes for performance
  
  3. Features
    - Save complex filter combinations
    - Favorite filters for quick access
    - Share filters with team members (future enhancement)
*/

-- Create saved filters table
CREATE TABLE IF NOT EXISTS saved_filters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  object_type text NOT NULL,
  conditions jsonb DEFAULT '[]'::jsonb,
  is_favorite boolean DEFAULT false,
  is_shared boolean DEFAULT false,
  created_by_name text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_saved_filters_user_id ON saved_filters(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_filters_object_type ON saved_filters(object_type);
CREATE INDEX IF NOT EXISTS idx_saved_filters_is_favorite ON saved_filters(is_favorite) WHERE is_favorite = true;
CREATE INDEX IF NOT EXISTS idx_saved_filters_created_at ON saved_filters(created_at DESC);

-- Enable RLS
ALTER TABLE saved_filters ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own saved filters"
  ON saved_filters FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR is_shared = true);

CREATE POLICY "Users can insert own saved filters"
  ON saved_filters FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own saved filters"
  ON saved_filters FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own saved filters"
  ON saved_filters FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
