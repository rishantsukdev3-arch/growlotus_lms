
-- Drop all RESTRICTIVE policies and recreate as PERMISSIVE

-- lead_remarks
DROP POLICY IF EXISTS "Authenticated users can delete lead_remarks" ON public.lead_remarks;
DROP POLICY IF EXISTS "Authenticated users can insert lead_remarks" ON public.lead_remarks;
DROP POLICY IF EXISTS "Authenticated users can read lead_remarks" ON public.lead_remarks;
DROP POLICY IF EXISTS "Authenticated users can update lead_remarks" ON public.lead_remarks;

CREATE POLICY "Allow all for authenticated" ON public.lead_remarks FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON public.lead_remarks FOR ALL TO anon USING (true) WITH CHECK (true);

-- leads
DROP POLICY IF EXISTS "Authenticated users can delete leads" ON public.leads;
DROP POLICY IF EXISTS "Authenticated users can insert leads" ON public.leads;
DROP POLICY IF EXISTS "Authenticated users can read leads" ON public.leads;
DROP POLICY IF EXISTS "Authenticated users can update leads" ON public.leads;

CREATE POLICY "Allow all for authenticated" ON public.leads FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON public.leads FOR ALL TO anon USING (true) WITH CHECK (true);

-- meeting_requests
DROP POLICY IF EXISTS "Authenticated users can delete meeting_requests" ON public.meeting_requests;
DROP POLICY IF EXISTS "Authenticated users can insert meeting_requests" ON public.meeting_requests;
DROP POLICY IF EXISTS "Authenticated users can read meeting_requests" ON public.meeting_requests;
DROP POLICY IF EXISTS "Authenticated users can update meeting_requests" ON public.meeting_requests;

CREATE POLICY "Allow all for authenticated" ON public.meeting_requests FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON public.meeting_requests FOR ALL TO anon USING (true) WITH CHECK (true);

-- meetings
DROP POLICY IF EXISTS "Authenticated users can delete meetings" ON public.meetings;
DROP POLICY IF EXISTS "Authenticated users can insert meetings" ON public.meetings;
DROP POLICY IF EXISTS "Authenticated users can read meetings" ON public.meetings;
DROP POLICY IF EXISTS "Authenticated users can update meetings" ON public.meetings;

CREATE POLICY "Allow all for authenticated" ON public.meetings FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON public.meetings FOR ALL TO anon USING (true) WITH CHECK (true);

-- profiles
DROP POLICY IF EXISTS "Authenticated users can delete profiles" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users can insert profiles" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users can read profiles" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users can update profiles" ON public.profiles;

CREATE POLICY "Allow all for authenticated" ON public.profiles FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON public.profiles FOR ALL TO anon USING (true) WITH CHECK (true);

-- team_members
DROP POLICY IF EXISTS "Authenticated users can delete team_members" ON public.team_members;
DROP POLICY IF EXISTS "Authenticated users can insert team_members" ON public.team_members;
DROP POLICY IF EXISTS "Authenticated users can read team_members" ON public.team_members;
DROP POLICY IF EXISTS "Authenticated users can update team_members" ON public.team_members;

CREATE POLICY "Allow all for authenticated" ON public.team_members FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON public.team_members FOR ALL TO anon USING (true) WITH CHECK (true);

-- teams
DROP POLICY IF EXISTS "Authenticated users can delete teams" ON public.teams;
DROP POLICY IF EXISTS "Authenticated users can insert teams" ON public.teams;
DROP POLICY IF EXISTS "Authenticated users can read teams" ON public.teams;
DROP POLICY IF EXISTS "Authenticated users can update teams" ON public.teams;

CREATE POLICY "Allow all for authenticated" ON public.teams FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON public.teams FOR ALL TO anon USING (true) WITH CHECK (true);
