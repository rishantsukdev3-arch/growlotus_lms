
-- Profiles table for CRM users
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  username TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL DEFAULT 'BO' CHECK (role IN ('FM', 'TC', 'BDM', 'BO')),
  active BOOLEAN NOT NULL DEFAULT true,
  team_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Teams table
CREATE TABLE public.teams (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  tc_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Team members (BO assignments)
CREATE TABLE public.team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id TEXT NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  bo_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(bo_id)
);

-- Leads table
CREATE TABLE public.leads (
  id TEXT PRIMARY KEY,
  client_name TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  loan_requirement NUMERIC NOT NULL DEFAULT 0,
  address TEXT,
  number_status TEXT NOT NULL DEFAULT '',
  lead_status TEXT NOT NULL DEFAULT '',
  lead_type TEXT NOT NULL DEFAULT '',
  assigned_bo_id TEXT NOT NULL,
  assigned_date TEXT NOT NULL,
  meeting_requested BOOLEAN NOT NULL DEFAULT false,
  meeting_approved BOOLEAN NOT NULL DEFAULT false,
  meeting_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Lead remarks
CREATE TABLE public.lead_remarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id TEXT NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  remark TEXT NOT NULL,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Meetings table
CREATE TABLE public.meetings (
  id TEXT PRIMARY KEY,
  lead_id TEXT NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  bdm_id TEXT NOT NULL,
  tc_id TEXT NOT NULL,
  bo_id TEXT NOT NULL,
  date TEXT NOT NULL,
  time_slot TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Scheduled',
  meeting_type TEXT DEFAULT 'Virtual',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Meeting requests
CREATE TABLE public.meeting_requests (
  id TEXT PRIMARY KEY,
  lead_id TEXT NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  bo_id TEXT NOT NULL,
  tc_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_remarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meeting_requests ENABLE ROW LEVEL SECURITY;

-- Public read/write policies (CRM is internal, all authenticated users can access)
CREATE POLICY "Authenticated users can read profiles" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert profiles" ON public.profiles FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update profiles" ON public.profiles FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete profiles" ON public.profiles FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated users can read teams" ON public.teams FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert teams" ON public.teams FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update teams" ON public.teams FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete teams" ON public.teams FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated users can read team_members" ON public.team_members FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert team_members" ON public.team_members FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update team_members" ON public.team_members FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete team_members" ON public.team_members FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated users can read leads" ON public.leads FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert leads" ON public.leads FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update leads" ON public.leads FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete leads" ON public.leads FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated users can read lead_remarks" ON public.lead_remarks FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert lead_remarks" ON public.lead_remarks FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update lead_remarks" ON public.lead_remarks FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete lead_remarks" ON public.lead_remarks FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated users can read meetings" ON public.meetings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert meetings" ON public.meetings FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update meetings" ON public.meetings FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete meetings" ON public.meetings FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated users can read meeting_requests" ON public.meeting_requests FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert meeting_requests" ON public.meeting_requests FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update meeting_requests" ON public.meeting_requests FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete meeting_requests" ON public.meeting_requests FOR DELETE TO authenticated USING (true);

-- Enable realtime for key tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.leads;
ALTER PUBLICATION supabase_realtime ADD TABLE public.meetings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.meeting_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE public.lead_remarks;
