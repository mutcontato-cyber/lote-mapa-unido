
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS aceite_termo_at timestamptz,
  ADD COLUMN IF NOT EXISTS aceite_termo_texto text;

CREATE TABLE IF NOT EXISTS public.password_resets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  phone text NOT NULL,
  full_name text,
  status text NOT NULL DEFAULT 'pendente',
  nova_senha text,
  requested_at timestamptz NOT NULL DEFAULT now(),
  fulfilled_at timestamptz,
  fulfilled_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

GRANT INSERT ON public.password_resets TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.password_resets TO authenticated;
GRANT ALL ON public.password_resets TO service_role;

ALTER TABLE public.password_resets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can create reset request"
  ON public.password_resets
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Staff can read resets"
  ON public.password_resets
  FOR SELECT
  TO authenticated
  USING (public.is_staff(auth.uid()));

CREATE POLICY "Staff can update resets"
  ON public.password_resets
  FOR UPDATE
  TO authenticated
  USING (public.is_staff(auth.uid()))
  WITH CHECK (public.is_staff(auth.uid()));

CREATE POLICY "Staff can delete resets"
  ON public.password_resets
  FOR DELETE
  TO authenticated
  USING (public.is_staff(auth.uid()));
