
ALTER TABLE public.lotes ADD COLUMN IF NOT EXISTS fracao_ocupada numeric NOT NULL DEFAULT 0;

CREATE OR REPLACE FUNCTION public.recalcular_status_lote(p_lote_id uuid)
 RETURNS void
 LANGUAGE plpgsql
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

-- Recalcula todos os lotes existentes
DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT id FROM public.lotes LOOP
    PERFORM public.recalcular_status_lote(r.id);
  END LOOP;
END $$;
