-- Revoga privilegios de execucao da funcao de cron de aniversarios para usuarios publicos/autenticados.
-- Apenas o cron/service_role deve poder executa-la.
REVOKE EXECUTE ON FUNCTION public.disparar_aniversarios_com_fallback() FROM public, authenticated, anon;
GRANT EXECUTE ON FUNCTION public.disparar_aniversarios_com_fallback() TO service_role;