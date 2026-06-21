-- Remover a "Quadra 9" (na verdade é a Rua 9 do mapa, não uma quadra)
DELETE FROM public.lotes WHERE quadra_id IN (SELECT id FROM public.quadras WHERE nome = '9');
DELETE FROM public.quadras WHERE nome = '9';

-- Permitir leitura pública dos proprietários (mostrar quem já apoiou)
GRANT SELECT, INSERT ON public.proprietarios TO anon;
GRANT UPDATE ON public.lotes TO anon;

CREATE POLICY "public read proprietarios"
  ON public.proprietarios FOR SELECT TO anon USING (true);

-- Cadastro público: qualquer visitante pode se cadastrar como apoiador
CREATE POLICY "public sign proprietarios"
  ON public.proprietarios FOR INSERT TO anon
  WITH CHECK (
    nome IS NOT NULL AND length(trim(nome)) > 0
    AND telefone IS NOT NULL AND length(trim(telefone)) > 0
    AND apoia_asfalto = true
    AND assinatura_status = 'confirmou'
  );

-- Visitante pode marcar o lote como cadastrado/confirmado após assinar
CREATE POLICY "public update lote status"
  ON public.lotes FOR UPDATE TO anon
  USING (true)
  WITH CHECK (status IN ('cadastrado','confirmado'));