
ALTER TABLE public.lotes REPLICA IDENTITY FULL;
ALTER TABLE public.proprietarios REPLICA IDENTITY FULL;
ALTER TABLE public.quadras REPLICA IDENTITY FULL;
ALTER TABLE public.moradores REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname='supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
END$$;

ALTER PUBLICATION supabase_realtime ADD TABLE public.lotes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.proprietarios;
ALTER PUBLICATION supabase_realtime ADD TABLE public.quadras;
ALTER PUBLICATION supabase_realtime ADD TABLE public.moradores;
