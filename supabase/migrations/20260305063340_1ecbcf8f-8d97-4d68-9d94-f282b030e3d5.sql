
-- Drop all RESTRICTIVE policies and recreate as PERMISSIVE
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN 
    SELECT schemaname, tablename, policyname 
    FROM pg_policies 
    WHERE schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
  END LOOP;
END $$;

-- Recreate as PERMISSIVE for all tables
CREATE POLICY "Allow all access" ON public.profiles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access" ON public.leads FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access" ON public.teams FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access" ON public.team_members FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access" ON public.meetings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access" ON public.meeting_requests FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access" ON public.lead_remarks FOR ALL USING (true) WITH CHECK (true);
