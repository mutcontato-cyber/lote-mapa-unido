
DROP POLICY IF EXISTS "Anyone can create reset request" ON public.password_resets;

CREATE POLICY "Anyone can create reset request"
  ON public.password_resets
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (length(regexp_replace(phone, '\D', '', 'g')) >= 8);
