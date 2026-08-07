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