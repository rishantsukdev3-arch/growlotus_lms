ALTER TABLE public.leads ALTER COLUMN loan_requirement TYPE text USING loan_requirement::text;
ALTER TABLE public.meetings ALTER COLUMN final_requirement TYPE text USING final_requirement::text;
ALTER TABLE public.meetings ALTER COLUMN collateral_value TYPE text USING collateral_value::text;
