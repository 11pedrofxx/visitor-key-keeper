INSERT INTO public.rooms (code, nome, andar, ordem)
SELECT 'ENTRADA', 'Entrada', 'Entrada do evento', -1
WHERE NOT EXISTS (SELECT 1 FROM public.rooms WHERE code = 'ENTRADA');