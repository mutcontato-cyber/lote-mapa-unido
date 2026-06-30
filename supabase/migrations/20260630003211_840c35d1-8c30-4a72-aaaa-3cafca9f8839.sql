-- Fix: trigger that recalculates lot status was blocked by RLS for anonymous inserts.
-- Make the recalculation function SECURITY DEFINER so it can update lotes regardless of caller RLS.
CREATE OR REPLACE FUNCTION public.recalcular_status_lote(p_lote_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_status public.lote_status;
  v_fracao numeric;
BEGIN
  SELECT
    CASE
      WHEN COUNT(*) = 0 THEN 'sem_cadastro'
      WHEN BOOL_OR(p.apoia_asfalto = false) THEN 'pendencia'
      WHEN BOOL_OR(p.assinatura_status IN ('confirmou', 'assinou')) THEN 'confirmado'
      WHEN SUM(COALESCE(p.fracao, 0)) < 99.5 THEN 'incompleto'
      WHEN BOOL_OR(p.nome IS NULL OR p.telefone IS NULL) THEN 'incompleto'
      ELSE 'cadastrado'
    END,
    COALESCE(SUM(COALESCE(p.fracao, 0)), 0)
  INTO v_status, v_fracao
  FROM public.proprietarios p
  WHERE p.lote_id = p_lote_id;

  UPDATE public.lotes
  SET status = COALESCE(v_status, 'sem_cadastro'),
      fracao_ocupada = LEAST(COALESCE(v_fracao, 0), 100)
  WHERE id = p_lote_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.trigger_recalcular_status_lote()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
$function$;

-- Reprocess every lot now to fix stale records (notably the 4 cadastros recentes).
DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT DISTINCT lote_id FROM public.proprietarios LOOP
    PERFORM public.recalcular_status_lote(r.lote_id);
  END LOOP;
END $$;