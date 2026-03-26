
-- Drop all existing RESTRICTIVE policies and replace with PERMISSIVE ones

-- profiles
DROP POLICY IF EXISTS "Allow all access " ON public.profiles;
CREATE POLICY "Allow full access" ON public.profiles FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- leads
DROP POLICY IF EXISTS "Allow all access " ON public.leads;
CREATE POLICY "Allow full access" ON public.leads FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- teams
DROP POLICY IF EXISTS "Allow all access " ON public.teams;
CREATE POLICY "Allow full access" ON public.teams FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- team_members
DROP POLICY IF EXISTS "Allow all access " ON public.team_members;
CREATE POLICY "Allow full access" ON public.team_members FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- meetings
DROP POLICY IF EXISTS "Allow all access " ON public.meetings;
CREATE POLICY "Allow full access" ON public.meetings FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- meeting_requests
DROP POLICY IF EXISTS "Allow all access " ON public.meeting_requests;
CREATE POLICY "Allow full access" ON public.meeting_requests FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- lead_remarks
DROP POLICY IF EXISTS "Allow all access " ON public.lead_remarks;
CREATE POLICY "Allow full access" ON public.lead_remarks FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
