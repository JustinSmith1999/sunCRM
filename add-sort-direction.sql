-- Add sort_direction column to reports table
ALTER TABLE reports
ADD COLUMN IF NOT EXISTS sort_direction text DEFAULT 'asc';

-- Find columns with _c in name
SELECT table_name, column_name
FROM information_schema.columns
WHERE column_name LIKE '%_c%'
AND table_schema = 'public'
ORDER BY table_name, column_name;
