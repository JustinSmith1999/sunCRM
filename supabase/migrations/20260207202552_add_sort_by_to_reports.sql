/*
  # Add sort_by column to reports table

  1. Changes
    - Add `sort_by` column to reports table (jsonb)
    - This column stores the sort configuration for the report
*/

ALTER TABLE reports 
ADD COLUMN IF NOT EXISTS sort_by jsonb;
