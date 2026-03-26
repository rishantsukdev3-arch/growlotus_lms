-- Add all BDO-related columns that are referenced in code but were never created in any migration.
-- Using IF NOT EXISTS to be safe on any existing Supabase instances.

ALTER TABLE public.meetings
  ADD COLUMN IF NOT EXISTS bdo_id       text,
  ADD COLUMN IF NOT EXISTS bdo_status   text,
  ADD COLUMN IF NOT EXISTS mini_login   boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS full_login   boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS walking_status text;
