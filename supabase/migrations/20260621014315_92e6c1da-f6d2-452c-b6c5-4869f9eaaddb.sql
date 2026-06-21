
-- Roles enum + table
CREATE TYPE public.app_role AS ENUM ('admin', 'coordenador', 'visitante');

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  UNIQUE(user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.is_staff(_user_id UUID)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role IN ('admin','coordenador'))
$$;

-- Profiles RLS
CREATE POLICY "Users see own profile" ON public.profiles FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid());

-- User roles RLS
CREATE POLICY "Users see own roles" ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage roles" ON public.user_roles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Auto profile + bootstrap admin: first user becomes admin
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_count INT;
  v_role app_role;
BEGIN
  INSERT INTO public.profiles (id, full_name, phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Sem nome'),
    COALESCE(NEW.raw_user_meta_data->>'phone', NEW.email)
  )
  ON CONFLICT (id) DO NOTHING;

  SELECT COUNT(*) INTO v_count FROM public.user_roles;
  v_role := CASE WHEN v_count = 0 THEN 'admin'::app_role ELSE 'visitante'::app_role END;
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, v_role)
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Quadras
CREATE TABLE public.quadras (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL UNIQUE,
  ordem INT NOT NULL DEFAULT 0,
  observacoes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.quadras TO authenticated;
GRANT ALL ON public.quadras TO service_role;
ALTER TABLE public.quadras ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth read quadras" ON public.quadras FOR SELECT TO authenticated USING (true);
CREATE POLICY "staff write quadras" ON public.quadras FOR ALL TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

-- Lotes
CREATE TYPE public.lote_status AS ENUM ('sem_cadastro','cadastrado','incompleto','confirmado','pendencia');

CREATE TABLE public.lotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quadra_id UUID NOT NULL REFERENCES public.quadras(id) ON DELETE CASCADE,
  numero TEXT NOT NULL,
  status lote_status NOT NULL DEFAULT 'sem_cadastro',
  observacoes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(quadra_id, numero)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lotes TO authenticated;
GRANT ALL ON public.lotes TO service_role;
ALTER TABLE public.lotes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth read lotes" ON public.lotes FOR SELECT TO authenticated USING (true);
CREATE POLICY "staff write lotes" ON public.lotes FOR ALL TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

-- Proprietarios (frações)
CREATE TYPE public.assinatura_status AS ENUM ('nao_contatado','contatado','confirmou','assinou');

CREATE TABLE public.proprietarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lote_id UUID NOT NULL REFERENCES public.lotes(id) ON DELETE CASCADE,
  fracao NUMERIC(5,2) NOT NULL DEFAULT 100 CHECK (fracao > 0 AND fracao <= 100),
  nome TEXT NOT NULL,
  cpf TEXT,
  telefone TEXT,
  whatsapp TEXT,
  email TEXT,
  endereco TEXT,
  situacao TEXT,
  apoia_asfalto BOOLEAN,
  assinatura_status assinatura_status NOT NULL DEFAULT 'nao_contatado',
  data_cadastro DATE NOT NULL DEFAULT CURRENT_DATE,
  responsavel_cadastro TEXT,
  observacoes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.proprietarios TO authenticated;
GRANT ALL ON public.proprietarios TO service_role;
ALTER TABLE public.proprietarios ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth read proprietarios" ON public.proprietarios FOR SELECT TO authenticated USING (true);
CREATE POLICY "staff write proprietarios" ON public.proprietarios FOR ALL TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

CREATE TRIGGER trg_lotes_touch BEFORE UPDATE ON public.lotes
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_prop_touch BEFORE UPDATE ON public.proprietarios
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
