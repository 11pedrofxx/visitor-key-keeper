CREATE TABLE public.scanner_devices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  room_id uuid NOT NULL REFERENCES public.rooms(id) ON DELETE RESTRICT,
  token text NOT NULL UNIQUE,
  active boolean NOT NULL DEFAULT true,
  last_used_at timestamptz,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.scanner_devices TO authenticated;
GRANT ALL ON public.scanner_devices TO service_role;

ALTER TABLE public.scanner_devices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins read scanner devices" ON public.scanner_devices
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "admins insert scanner devices" ON public.scanner_devices
  FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "admins update scanner devices" ON public.scanner_devices
  FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_scanner_devices_updated_at
  BEFORE UPDATE ON public.scanner_devices
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();