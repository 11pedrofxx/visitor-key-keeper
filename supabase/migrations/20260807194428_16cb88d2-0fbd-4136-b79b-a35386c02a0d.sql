CREATE TYPE public.app_role AS ENUM ('admin');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users read own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;

CREATE TABLE public.admin_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome text NOT NULL,
  email text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.admin_profiles TO authenticated;
GRANT ALL ON public.admin_profiles TO service_role;
ALTER TABLE public.admin_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins read admin profiles" ON public.admin_profiles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  telefone text NOT NULL,
  email text NOT NULL,
  como_soube text,
  horario_previsto text,
  curso_interesse text,
  aluno_frei text,
  qr_token text NOT NULL UNIQUE,
  checked_in boolean NOT NULL DEFAULT false,
  checked_in_at timestamptz,
  checked_in_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX participants_email_unique ON public.participants (lower(email));
CREATE INDEX participants_nome_idx ON public.participants (lower(nome));

GRANT SELECT, UPDATE ON public.participants TO authenticated;
GRANT ALL ON public.participants TO service_role;
ALTER TABLE public.participants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins read participants" ON public.participants FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admins update participants" ON public.participants FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.rooms (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code text NOT NULL UNIQUE,
  nome text NOT NULL,
  andar text NOT NULL,
  ordem integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT ON public.rooms TO anon;
GRANT SELECT ON public.rooms TO authenticated;
GRANT ALL ON public.rooms TO service_role;

ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "rooms are publicly readable" ON public.rooms FOR SELECT TO anon, authenticated USING (true);

CREATE TABLE public.room_entries (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  participant_id uuid NOT NULL REFERENCES public.participants(id) ON DELETE CASCADE,
  room_id uuid NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  entered_at timestamp with time zone NOT NULL DEFAULT now(),
  entered_by uuid REFERENCES auth.users(id),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (participant_id, room_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.room_entries TO authenticated;
GRANT ALL ON public.room_entries TO service_role;

ALTER TABLE public.room_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins read room entries" ON public.room_entries FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "admins insert room entries" ON public.room_entries FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "admins update room entries" ON public.room_entries FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_rooms_updated_at BEFORE UPDATE ON public.rooms FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_room_entries_updated_at BEFORE UPDATE ON public.room_entries FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX room_entries_room_idx ON public.room_entries(room_id);
CREATE INDEX room_entries_participant_idx ON public.room_entries(participant_id);

INSERT INTO public.rooms (code, nome, andar, ordem) VALUES
  ('sala-18', 'Sala 18', '1º Andar', 1),
  ('sala-19', 'Sala 19', '1º Andar', 2),
  ('sala-20', 'Sala 20', '1º Andar', 3),
  ('sala-24', 'Sala 24', '2º Andar', 4),
  ('sala-25', 'Sala 25', '2º Andar', 5),
  ('sala-26', 'Sala 26', '2º Andar', 6),
  ('sala-27', 'Sala 27', '2º Andar', 7),
  ('sala-33', 'Sala 33', '3º Andar', 8),
  ('auditorio', 'Auditório da Escola', '3º Andar', 9);