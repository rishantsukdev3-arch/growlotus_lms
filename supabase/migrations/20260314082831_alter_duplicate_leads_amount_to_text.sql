ALTER TABLE public.duplicate_leads ALTER COLUMN loan_requirement TYPE text USING loan_requirement::text;
