
ALTER TABLE public.proprietarios
  ADD COLUMN IF NOT EXISTS data_nascimento date,
  ADD COLUMN IF NOT EXISTS chefe_casa boolean,
  ADD COLUMN IF NOT EXISTS qtd_moradores integer,
  ADD COLUMN IF NOT EXISTS melhorias jsonb DEFAULT '{}'::jsonb;
