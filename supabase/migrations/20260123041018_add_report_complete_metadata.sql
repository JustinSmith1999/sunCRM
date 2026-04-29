/*
  # Add Complete Report Metadata for Salesforce Independence

  1. New Columns
    - `report_type` (text) - Type of report (tabular, summary, matrix)
    - `source_object` (text) - Source Salesforce object (Lead, Opportunity, Account, etc.)
    - `columns` (jsonb) - Array of column definitions with field names, labels, and formatting
    - `filters` (jsonb) - Array of filter criteria for querying data
    - `groupings` (jsonb) - Grouping configuration for summary/matrix reports
    - `aggregates` (jsonb) - Aggregation settings (SUM, AVG, COUNT, etc.)
    - `chart_config` (jsonb) - Chart visualization configuration
    - `report_format` (jsonb) - Display format settings (colors, conditional formatting, etc.)
    - `scope` (text) - Report scope (My, Team, All, etc.)

  2. Purpose
    - Store complete report metadata to execute reports without Salesforce
    - Enable independent report execution using synced Supabase data
    - Preserve all Salesforce report functionality after cutover

  3. Notes
    - All JSONB columns allow flexible storage of complex Salesforce metadata
    - Enables building a report query engine that works with local data
    - Critical for Salesforce independence
*/

-- Add complete metadata columns to reports table
ALTER TABLE reports ADD COLUMN IF NOT EXISTS report_type text;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS source_object text;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS columns jsonb DEFAULT '[]'::jsonb;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS filters jsonb DEFAULT '[]'::jsonb;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS groupings jsonb DEFAULT '{}'::jsonb;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS aggregates jsonb DEFAULT '[]'::jsonb;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS chart_config jsonb;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS report_format jsonb DEFAULT '{}'::jsonb;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS scope text DEFAULT 'My';

-- Add indexes for common queries
CREATE INDEX IF NOT EXISTS idx_reports_source_object ON reports(source_object) WHERE source_object IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_reports_type ON reports(report_type) WHERE report_type IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_reports_scope ON reports(scope);

-- Add comment
COMMENT ON COLUMN reports.columns IS 'Array of column definitions: [{field, label, type, format}]';
COMMENT ON COLUMN reports.filters IS 'Array of filter criteria: [{field, operator, value}]';
COMMENT ON COLUMN reports.groupings IS 'Grouping configuration for summary/matrix reports';
COMMENT ON COLUMN reports.aggregates IS 'Aggregation settings: [{field, function, label}]';
COMMENT ON COLUMN reports.chart_config IS 'Chart visualization settings';
COMMENT ON COLUMN reports.source_object IS 'Source Salesforce object (maps to our tables)';
