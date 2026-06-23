CREATE POLICY "auth sign proprietarios" ON public.proprietarios
FOR INSERT TO authenticated
WITH CHECK (
  nome IS NOT NULL AND length(trim(nome)) > 0
  AND telefone IS NOT NULL AND length(trim(telefone)) > 0
  AND apoia_asfalto = true
  AND assinatura_status = 'confirmou'::assinatura_status
);