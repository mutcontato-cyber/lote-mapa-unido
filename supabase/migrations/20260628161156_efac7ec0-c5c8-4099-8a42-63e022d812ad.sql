CREATE OR REPLACE FUNCTION public.recalcular_status_lote(p_lote_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_status public.lote_status;
BEGIN
  SELECT
    CASE
      WHEN COUNT(*) = 0 THEN 'sem_cadastro'
      WHEN BOOL_OR(p.apoia_asfalto = false) THEN 'pendencia'
      WHEN BOOL_OR(p.assinatura_status IN ('confirmou', 'assinou')) THEN 'confirmado'
      WHEN SUM(COALESCE(p.fracao, 0)) < 99.5 THEN 'incompleto'
      WHEN BOOL_OR(p.nome IS NULL OR p.telefone IS NULL) THEN 'incompleto'
      ELSE 'cadastrado'
    END
  INTO v_status
  FROM public.proprietarios p
  WHERE p.lote_id = p_lote_id;

  UPDATE public.lotes
  SET status = COALESCE(v_status, 'sem_cadastro')
  WHERE id = p_lote_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.trigger_recalcular_status_lote()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_lote_id UUID;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_lote_id := OLD.lote_id;
  ELSE
    v_lote_id := NEW.lote_id;
  END IF;

  PERFORM public.recalcular_status_lote(v_lote_id);

  IF TG_OP = 'UPDATE' AND OLD.lote_id IS DISTINCT FROM NEW.lote_id THEN
    PERFORM public.recalcular_status_lote(OLD.lote_id);
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS recalcular_status_lote_on_proprietario_change ON public.proprietarios;
CREATE TRIGGER recalcular_status_lote_on_proprietario_change
AFTER INSERT OR UPDATE OR DELETE ON public.proprietarios
FOR EACH ROW EXECUTE FUNCTION public.trigger_recalcular_status_lote();

-- Atualiza imediatamente todos os lotes existentes
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN SELECT id FROM public.lotes LOOP
    PERFORM public.recalcular_status_lote(r.id);
  END LOOP;
END;
$$;

GRANT EXECUTE ON FUNCTION public.recalcular_status_lote(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.recalcular_status_lote(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION public.trigger_recalcular_status_lote() TO authenticated;
GRANT EXECUTE ON FUNCTION public.trigger_recalcular_status_lote() TO service_role;
