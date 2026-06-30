-- 1) Audit log table
CREATE TABLE IF NOT EXISTS public.cadastro_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lote_id UUID,
  evento TEXT NOT NULL,
  detalhes JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.cadastro_audit_log TO authenticated;
GRANT INSERT ON public.cadastro_audit_log TO anon;
GRANT ALL ON public.cadastro_audit_log TO service_role;

ALTER TABLE public.cadastro_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "staff lê audit log"
  ON public.cadastro_audit_log FOR SELECT
  TO authenticated
  USING (public.is_staff(auth.uid()));

CREATE POLICY "todos podem registrar log"
  ON public.cadastro_audit_log FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- 2) Allow clients to invoke the (already SECURITY DEFINER) recalc as a safety net.
GRANT EXECUTE ON FUNCTION public.recalcular_status_lote(uuid) TO anon, authenticated;

-- 3) Auditor: detect & auto-fix any lote whose persisted status/fracao
--    diverges from the actual proprietarios rows. Returns the fix log.
CREATE OR REPLACE FUNCTION public.auditar_e_corrigir_lotes()
RETURNS TABLE(lote_id uuid, antes jsonb, depois jsonb)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  r record;
  v_status_esperado public.lote_status;
  v_fracao_esperada numeric;
  v_antes jsonb;
  v_depois jsonb;
BEGIN
  FOR r IN
    SELECT l.id, l.status, l.fracao_ocupada
    FROM public.lotes l
  LOOP
    SELECT
      CASE
        WHEN COUNT(*) = 0 THEN 'sem_cadastro'
        WHEN BOOL_OR(p.apoia_asfalto = false) THEN 'pendencia'
        WHEN BOOL_OR(p.assinatura_status IN ('confirmou','assinou')) THEN 'confirmado'
        WHEN SUM(COALESCE(p.fracao,0)) < 99.5 THEN 'incompleto'
        WHEN BOOL_OR(p.nome IS NULL OR p.telefone IS NULL) THEN 'incompleto'
        ELSE 'cadastrado'
      END,
      COALESCE(SUM(COALESCE(p.fracao,0)),0)
    INTO v_status_esperado, v_fracao_esperada
    FROM public.proprietarios p
    WHERE p.lote_id = r.id;

    IF v_status_esperado IS DISTINCT FROM r.status
       OR LEAST(v_fracao_esperada,100) IS DISTINCT FROM r.fracao_ocupada THEN
      v_antes := jsonb_build_object('status', r.status, 'fracao_ocupada', r.fracao_ocupada);
      UPDATE public.lotes
      SET status = COALESCE(v_status_esperado,'sem_cadastro'),
          fracao_ocupada = LEAST(COALESCE(v_fracao_esperada,0),100)
      WHERE id = r.id;
      v_depois := jsonb_build_object('status', v_status_esperado, 'fracao_ocupada', LEAST(v_fracao_esperada,100));
      INSERT INTO public.cadastro_audit_log(lote_id, evento, detalhes)
      VALUES (r.id, 'auto_corrigido', jsonb_build_object('antes', v_antes, 'depois', v_depois));
      lote_id := r.id; antes := v_antes; depois := v_depois;
      RETURN NEXT;
    END IF;
  END LOOP;
  RETURN;
END;
$$;

GRANT EXECUTE ON FUNCTION public.auditar_e_corrigir_lotes() TO authenticated, service_role;

-- 4) Schedule the auditor every 15 minutes
DO $$
BEGIN
  PERFORM cron.unschedule('auditar-lotes-15min');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

SELECT cron.schedule(
  'auditar-lotes-15min',
  '*/15 * * * *',
  $$ SELECT public.auditar_e_corrigir_lotes(); $$
);