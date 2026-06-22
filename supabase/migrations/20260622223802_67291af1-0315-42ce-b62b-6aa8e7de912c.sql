CREATE TABLE public.moradores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lote_id uuid NOT NULL REFERENCES public.lotes(id) ON DELETE CASCADE,
  nome text NOT NULL,
  data_nascimento date,
  telefone text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.moradores TO authenticated;
GRANT ALL ON public.moradores TO service_role;

ALTER TABLE public.moradores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view moradores"
  ON public.moradores FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated can insert moradores"
  ON public.moradores FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated can update moradores"
  ON public.moradores FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Staff can delete moradores"
  ON public.moradores FOR DELETE TO authenticated
  USING (public.is_staff(auth.uid()) OR created_by = auth.uid());

CREATE INDEX moradores_lote_id_idx ON public.moradores(lote_id);

CREATE TRIGGER moradores_touch_updated_at
  BEFORE UPDATE ON public.moradores
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();