/*
  # Add row_limit column to reports table

  1. Changes
    - Add `row_limit` column to reports table (integer, default 1000)
    - This column controls how many rows are returned when running a report
*/

ALTER TABLE reports 
ADD COLUMN IF NOT EXISTS row_limit integer DEFAULT 1000;
