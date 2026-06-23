
-- === loteamentos: restrict writes to staff ===
DROP POLICY IF EXISTS "Permitir atualização autenticada de loteamentos" ON public.loteamentos;
DROP POLICY IF EXISTS "Permitir delete autenticado de loteamentos" ON public.loteamentos;
DROP POLICY IF EXISTS "Permitir inserção autenticada de loteamentos" ON public.loteamentos;

CREATE POLICY "Staff can insert loteamentos" ON public.loteamentos
  FOR INSERT TO authenticated WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "Staff can update loteamentos" ON public.loteamentos
  FOR UPDATE TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "Staff can delete loteamentos" ON public.loteamentos
  FOR DELETE TO authenticated USING (public.is_staff(auth.uid()));

-- === moradores: restrict insert/update to staff or owner ===
DROP POLICY IF EXISTS "Authenticated can insert moradores" ON public.moradores;
DROP POLICY IF EXISTS "Authenticated can update moradores" ON public.moradores;

CREATE POLICY "Staff or owner can insert moradores" ON public.moradores
  FOR INSERT TO authenticated
  WITH CHECK (public.is_staff(auth.uid()) OR created_by = auth.uid());
CREATE POLICY "Staff or owner can update moradores" ON public.moradores
  FOR UPDATE TO authenticated
  USING (public.is_staff(auth.uid()) OR created_by = auth.uid())
  WITH CHECK (public.is_staff(auth.uid()) OR created_by = auth.uid());

-- === proprietarios: remove public read; restrict authenticated insert to staff ===
DROP POLICY IF EXISTS "public read proprietarios" ON public.proprietarios;
DROP POLICY IF EXISTS "Permitir inserção por usuários autenticados" ON public.proprietarios;

CREATE POLICY "Staff can insert proprietarios" ON public.proprietarios
  FOR INSERT TO authenticated WITH CHECK (public.is_staff(auth.uid()));

-- === Pin search_path on SECURITY DEFINER functions missing it ===
ALTER FUNCTION public.update_lote_status(uuid, text) SET search_path = public;
ALTER FUNCTION public.admin_update_profile(uuid, text, text) SET search_path = public;
ALTER FUNCTION public.apagar_msg_customizada(text, text) SET search_path = public;
ALTER FUNCTION public.get_dados_aniversario(text) SET search_path = public;

-- === Revoke EXECUTE on SECURITY DEFINER functions not meant for end users ===
-- Bot-only helpers (token-gated): only service_role should call.
REVOKE ALL ON FUNCTION public.apagar_msg_customizada(text, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.get_dados_aniversario(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.apagar_msg_customizada(text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_dados_aniversario(text) TO service_role;

-- Admin/internal helpers: signed-in users only (no anon).
REVOKE ALL ON FUNCTION public.update_lote_status(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.update_lote_status(uuid, text) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.admin_update_profile(uuid, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_update_profile(uuid, text, text) TO authenticated, service_role;

-- Trigger-only functions: no direct callers needed.
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.touch_updated_at() FROM PUBLIC, anon, authenticated;
