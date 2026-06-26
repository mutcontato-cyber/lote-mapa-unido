
-- 1) lotes: substitui política anon UPDATE "true" por uma que exige proprietário confirmado
DROP POLICY IF EXISTS "public update lote status" ON public.lotes;
CREATE POLICY "anon update lote status when signed"
  ON public.lotes
  FOR UPDATE
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM public.proprietarios p
      WHERE p.lote_id = lotes.id
        AND p.apoia_asfalto = true
        AND p.assinatura_status = 'confirmou'
    )
  )
  WITH CHECK (
    status IN ('cadastrado'::lote_status, 'confirmado'::lote_status)
    AND EXISTS (
      SELECT 1 FROM public.proprietarios p
      WHERE p.lote_id = lotes.id
        AND p.apoia_asfalto = true
        AND p.assinatura_status = 'confirmou'
    )
  );

-- 2) moradores: restringe leitura a staff ou criador
DROP POLICY IF EXISTS "Authenticated can view moradores" ON public.moradores;
CREATE POLICY "Staff or owner can view moradores"
  ON public.moradores
  FOR SELECT
  TO authenticated
  USING (public.is_staff(auth.uid()) OR created_by = auth.uid());

-- 3) proprietarios: restringe leitura a staff
DROP POLICY IF EXISTS "auth read proprietarios" ON public.proprietarios;
CREATE POLICY "Staff can read proprietarios"
  ON public.proprietarios
  FOR SELECT
  TO authenticated
  USING (public.is_staff(auth.uid()));

-- 4) profiles: dá permissão direta para staff editar perfis
CREATE POLICY "Staff can update profiles"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (public.is_staff(auth.uid()))
  WITH CHECK (public.is_staff(auth.uid()));

-- 5) Remove funções SECURITY DEFINER acessíveis por usuários autenticados
DROP FUNCTION IF EXISTS public.admin_update_profile(uuid, text, text);
DROP FUNCTION IF EXISTS public.update_lote_status(uuid, text);
