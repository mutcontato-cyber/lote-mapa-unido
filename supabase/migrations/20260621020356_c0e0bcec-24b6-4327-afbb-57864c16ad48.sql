
INSERT INTO public.quadras (nome, ordem) VALUES
  ('1', 1), ('2', 2), ('3', 3), ('4', 4),
  ('5', 5), ('6', 6), ('7', 7), ('8', 8),
  ('9', 9)
ON CONFLICT DO NOTHING;

DO $$
DECLARE
  q RECORD;
  cnt INT;
  i INT;
  counts JSONB := '{"1":35,"2":46,"3":49,"4":36,"5":34,"6":38,"7":24,"8":35,"9":14}'::jsonb;
BEGIN
  FOR q IN SELECT id, nome FROM public.quadras LOOP
    cnt := (counts ->> q.nome)::int;
    IF cnt IS NULL THEN CONTINUE; END IF;
    FOR i IN 1..cnt LOOP
      INSERT INTO public.lotes (quadra_id, numero, status)
      VALUES (q.id, i::text, 'sem_cadastro')
      ON CONFLICT DO NOTHING;
    END LOOP;
  END LOOP;
END $$;
