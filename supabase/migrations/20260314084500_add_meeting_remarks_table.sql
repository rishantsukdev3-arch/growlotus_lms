CREATE TABLE public.meeting_remarks (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  meeting_id text NOT NULL,
  remark text NOT NULL,
  created_by text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.meeting_remarks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for meeting_remarks" ON public.meeting_remarks FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.meeting_remarks REPLICA IDENTITY FULL;
