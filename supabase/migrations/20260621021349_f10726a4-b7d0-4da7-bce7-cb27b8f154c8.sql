GRANT SELECT ON public.quadras TO anon;
GRANT SELECT ON public.lotes TO anon;

CREATE POLICY "public read quadras" ON public.quadras
FOR SELECT TO anon
USING (true);

CREATE POLICY "public read lotes" ON public.lotes
FOR SELECT TO anon
USING (true);