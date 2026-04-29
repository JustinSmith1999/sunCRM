/*
  # Fix missing organization_id column in leads table

  1. Changes
    - Add organization_id column to leads table
    - Add foreign key constraint to organizations table
    - Set NOT NULL constraint with a default organization (first one found)
    - Add index for performance

  2. Security
    - Maintains existing RLS policies
*/

-- First, let's add the organization_id column as nullable initially
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS organization_id uuid;

-- Get the first organization ID to use as default
DO $$
DECLARE
    default_org_id uuid;
BEGIN
    -- Get the first organization ID
    SELECT id INTO default_org_id 
    FROM public.organizations 
    LIMIT 1;
    
    -- Update all existing leads to have this organization_id
    IF default_org_id IS NOT NULL THEN
        UPDATE public.leads 
        SET organization_id = default_org_id 
        WHERE organization_id IS NULL;
    END IF;
END $$;

-- Now make the column NOT NULL and add foreign key constraint
ALTER TABLE public.leads 
ALTER COLUMN organization_id SET NOT NULL;

-- Add foreign key constraint
ALTER TABLE public.leads 
ADD CONSTRAINT leads_organization_id_fkey 
FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_leads_organization_id 
ON public.leads (organization_id);