ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS data_nascimento date;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_count INT;
  v_role app_role;
BEGIN
  INSERT INTO public.profiles (id, full_name, phone, data_nascimento)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Sem nome'),
    COALESCE(NEW.raw_user_meta_data->>'phone', NEW.email),
    NULLIF(NEW.raw_user_meta_data->>'data_nascimento','')::date
  )
  ON CONFLICT (id) DO NOTHING;

  SELECT COUNT(*) INTO v_count FROM public.user_roles;
  v_role := CASE WHEN v_count = 0 THEN 'admin'::app_role ELSE 'visitante'::app_role END;
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, v_role)
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$function$;