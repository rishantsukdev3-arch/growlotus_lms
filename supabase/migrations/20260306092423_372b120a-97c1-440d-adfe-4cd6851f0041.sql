
-- Fix all RLS policies to be PERMISSIVE instead of RESTRICTIVE

-- profiles
DROP POLICY IF EXISTS "Allow all access " ON public.profiles;
DROP POLICY IF EXISTS "Allow full access " ON public.profiles;
DROP POLICY IF EXISTS "Allow full access" ON public.profiles;
CREATE POLICY "allow_all_profiles" ON public.profiles FOR ALL USING (true) WITH CHECK (true);

-- leads
DROP POLICY IF EXISTS "Allow all access " ON public.leads;
DROP POLICY IF EXISTS "Allow full access " ON public.leads;
DROP POLICY IF EXISTS "Allow full access" ON public.leads;
CREATE POLICY "allow_all_leads" ON public.leads FOR ALL USING (true) WITH CHECK (true);

-- teams
DROP POLICY IF EXISTS "Allow all access " ON public.teams;
DROP POLICY IF EXISTS "Allow full access " ON public.teams;
DROP POLICY IF EXISTS "Allow full access" ON public.teams;
CREATE POLICY "allow_all_teams" ON public.teams FOR ALL USING (true) WITH CHECK (true);

-- team_members
DROP POLICY IF EXISTS "Allow all access " ON public.team_members;
DROP POLICY IF EXISTS "Allow full access " ON public.team_members;
DROP POLICY IF EXISTS "Allow full access" ON public.team_members;
CREATE POLICY "allow_all_team_members" ON public.team_members FOR ALL USING (true) WITH CHECK (true);

-- meetings
DROP POLICY IF EXISTS "Allow all access " ON public.meetings;
DROP POLICY IF EXISTS "Allow full access " ON public.meetings;
DROP POLICY IF EXISTS "Allow full access" ON public.meetings;
CREATE POLICY "allow_all_meetings" ON public.meetings FOR ALL USING (true) WITH CHECK (true);

-- meeting_requests
DROP POLICY IF EXISTS "Allow all access " ON public.meeting_requests;
DROP POLICY IF EXISTS "Allow full access " ON public.meeting_requests;
DROP POLICY IF EXISTS "Allow full access" ON public.meeting_requests;
CREATE POLICY "allow_all_meeting_requests" ON public.meeting_requests FOR ALL USING (true) WITH CHECK (true);

-- lead_remarks
DROP POLICY IF EXISTS "Allow all access " ON public.lead_remarks;
DROP POLICY IF EXISTS "Allow full access " ON public.lead_remarks;
DROP POLICY IF EXISTS "Allow full access" ON public.lead_remarks;
CREATE POLICY "allow_all_lead_remarks" ON public.lead_remarks FOR ALL USING (true) WITH CHECK (true);
