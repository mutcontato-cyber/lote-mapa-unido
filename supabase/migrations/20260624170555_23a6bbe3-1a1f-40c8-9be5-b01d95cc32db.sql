-- Corrige o cron de aniversarios para nao depender do dominio customizado que ainda aponta para a Hostinger.
-- Usa as URLs estaveis do projeto Lovable (dev primeiro, pois o site ainda nao esta publicado) e mantem o dominio customizado como fallback.
DROP FUNCTION IF EXISTS public.disparar_aniversarios_com_fallback();

CREATE OR REPLACE FUNCTION public.disparar_aniversarios_com_fallback()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  urls text[] := ARRAY[
    'https://project--5fbf3872-21a3-4c73-b768-688fae20a928-dev.lovable.app/api/public/hooks/aniversarios',
    'https://project--5fbf3872-21a3-4c73-b768-688fae20a928.lovable.app/api/public/hooks/aniversarios',
    'https://asfaltoja.adecaf.com.br/api/public/hooks/aniversarios'
  ];
  url text;
  attempt int;
  request_id bigint;
  success boolean := false;
  chosen_url text;
  log jsonb := '[]'::jsonb;
BEGIN
  FOREACH url IN ARRAY urls LOOP
    FOR attempt IN 1..3 LOOP
      BEGIN
        request_id := net.http_post(
          url := url,
          headers := '{"Content-Type": "application/json"}'::jsonb,
          body := '{}'::jsonb
        );
        success := true;
        chosen_url := url;
        log := log || jsonb_build_object('url', url, 'attempt', attempt, 'status', 'dispatched', 'request_id', request_id)::jsonb;
        EXIT;
      EXCEPTION WHEN OTHERS THEN
        log := log || jsonb_build_object('url', url, 'attempt', attempt, 'error', SQLERRM)::jsonb;
        PERFORM pg_sleep(1);
      END;
    END LOOP;
    IF success THEN EXIT; END IF;
  END LOOP;

  RETURN json_build_object(
    'success', success,
    'chosen_url', chosen_url,
    'log', log
  );
END;
$$;

-- Remove o cron antigo (com a URL errada do dominio Hostinger)
SELECT cron.unschedule('disparar-aniversarios-diario');

-- Agenda o cron diario as 11:00 UTC usando a funcao de fallback
SELECT cron.schedule(
  'disparar-aniversarios-diario',
  '0 11 * * *',
  $$SELECT public.disparar_aniversarios_com_fallback();$$
);
