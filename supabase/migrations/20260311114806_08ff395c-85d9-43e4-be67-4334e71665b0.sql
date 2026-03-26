
-- Drop existing check constraint on role and add BDO
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check CHECK (role IN ('FM', 'TC', 'BDM', 'BO', 'BDO'));
