
-- Fix ALL RLS policies: drop RESTRICTIVE ones and create PERMISSIVE ones

-- profiles
DROP POLICY IF EXISTS "Allow all access" ON public.profiles;
DROP POLICY IF EXISTS "Allow all access " ON public.profiles;
DROP POLICY IF EXISTS "Allow full access" ON public.profiles;
DROP POLICY IF EXISTS "Allow full access " ON public.profiles;
DROP POLICY IF EXISTS "allow_all_profiles" ON public.profiles;
CREATE POLICY "profiles_full_access" ON public.profiles AS PERMISSIVE FOR ALL TO public USING (true) WITH CHECK (true);

-- leads
DROP POLICY IF EXISTS "Allow all access" ON public.leads;
DROP POLICY IF EXISTS "Allow all access " ON public.leads;
DROP POLICY IF EXISTS "Allow full access" ON public.leads;
DROP POLICY IF EXISTS "Allow full access " ON public.leads;
DROP POLICY IF EXISTS "allow_all_leads" ON public.leads;
CREATE POLICY "leads_full_access" ON public.leads AS PERMISSIVE FOR ALL TO public USING (true) WITH CHECK (true);

-- teams
DROP POLICY IF EXISTS "Allow all access" ON public.teams;
DROP POLICY IF EXISTS "Allow all access " ON public.teams;
DROP POLICY IF EXISTS "Allow full access" ON public.teams;
DROP POLICY IF EXISTS "Allow full access " ON public.teams;
DROP POLICY IF EXISTS "allow_all_teams" ON public.teams;
CREATE POLICY "teams_full_access" ON public.teams AS PERMISSIVE FOR ALL TO public USING (true) WITH CHECK (true);

-- team_members
DROP POLICY IF EXISTS "Allow all access" ON public.team_members;
DROP POLICY IF EXISTS "Allow all access " ON public.team_members;
DROP POLICY IF EXISTS "Allow full access" ON public.team_members;
DROP POLICY IF EXISTS "Allow full access " ON public.team_members;
DROP POLICY IF EXISTS "allow_all_team_members" ON public.team_members;
CREATE POLICY "team_members_full_access" ON public.team_members AS PERMISSIVE FOR ALL TO public USING (true) WITH CHECK (true);

-- meetings: add walkin_date column + fix RLS
ALTER TABLE public.meetings ADD COLUMN IF NOT EXISTS walkin_date text;

DROP POLICY IF EXISTS "Allow all access" ON public.meetings;
DROP POLICY IF EXISTS "Allow all access " ON public.meetings;
DROP POLICY IF EXISTS "Allow full access" ON public.meetings;
DROP POLICY IF EXISTS "Allow full access " ON public.meetings;
DROP POLICY IF EXISTS "allow_all_meetings" ON public.meetings;
CREATE POLICY "meetings_full_access" ON public.meetings AS PERMISSIVE FOR ALL TO public USING (true) WITH CHECK (true);

-- meeting_requests
DROP POLICY IF EXISTS "Allow all access" ON public.meeting_requests;
DROP POLICY IF EXISTS "Allow all access " ON public.meeting_requests;
DROP POLICY IF EXISTS "Allow full access" ON public.meeting_requests;
DROP POLICY IF EXISTS "Allow full access " ON public.meeting_requests;
DROP POLICY IF EXISTS "allow_all_meeting_requests" ON public.meeting_requests;
CREATE POLICY "meeting_requests_full_access" ON public.meeting_requests AS PERMISSIVE FOR ALL TO public USING (true) WITH CHECK (true);

-- lead_remarks
DROP POLICY IF EXISTS "Allow all access" ON public.lead_remarks;
DROP POLICY IF EXISTS "Allow all access " ON public.lead_remarks;
DROP POLICY IF EXISTS "Allow full access" ON public.lead_remarks;
DROP POLICY IF EXISTS "Allow full access " ON public.lead_remarks;
DROP POLICY IF EXISTS "allow_all_lead_remarks" ON public.lead_remarks;
CREATE POLICY "lead_remarks_full_access" ON public.lead_remarks AS PERMISSIVE FOR ALL TO public USING (true) WITH CHECK (true);

-- Create duplicate_leads table to store duplicates
CREATE TABLE IF NOT EXISTS public.duplicate_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_name text NOT NULL,
  phone_number text NOT NULL,
  loan_requirement numeric NOT NULL DEFAULT 0,
  address text,
  original_lead_id text,
  original_bo_name text,
  uploaded_by text,
  uploaded_at timestamp with time zone NOT NULL DEFAULT now()
);
ALTER TABLE public.duplicate_leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "duplicate_leads_full_access" ON public.duplicate_leads AS PERMISSIVE FOR ALL TO public USING (true) WITH CHECK (true);

-- Enable realtime for duplicate_leads
ALTER PUBLICATION supabase_realtime ADD TABLE public.duplicate_leads;
