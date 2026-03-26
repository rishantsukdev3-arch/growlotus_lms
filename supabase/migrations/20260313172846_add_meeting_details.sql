-- Add new detail columns to the meetings table for TC scheduling
ALTER TABLE public.meetings
  ADD COLUMN IF NOT EXISTS client_name text,
  ADD COLUMN IF NOT EXISTS location text,
  ADD COLUMN IF NOT EXISTS state text,
  ADD COLUMN IF NOT EXISTS product_type text,
  ADD COLUMN IF NOT EXISTS final_requirement numeric,
  ADD COLUMN IF NOT EXISTS collateral_value numeric;
