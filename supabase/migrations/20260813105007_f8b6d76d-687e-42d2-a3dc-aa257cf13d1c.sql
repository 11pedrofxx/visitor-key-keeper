INSERT INTO public.rooms (code, nome, andar, ordem)
SELECT 'sala-17', 'Sala 17', '1º Andar', 0
WHERE NOT EXISTS (SELECT 1 FROM public.rooms WHERE code = 'sala-17');

DELETE FROM public.room_entries
WHERE room_id IN (SELECT id FROM public.rooms WHERE code = 'sala-33');

DELETE FROM public.rooms WHERE code = 'sala-33';