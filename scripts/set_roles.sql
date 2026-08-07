-- 1. Asignar saldo a los usuarios de prueba
UPDATE public.wallets SET coin_balance = 10000 WHERE user_id IN (
  SELECT id FROM public.profiles WHERE email = 'usuario@auralive.com'
);

-- 2. Elevar privilegios de Administrador
UPDATE public.profiles SET is_superadmin = true WHERE email = 'admin@auralive.com';

-- 3. Crear presentadora
UPDATE public.profiles SET is_streamer = true WHERE email = 'presentadora@auralive.com';

-- 4. Convertir a Agencia
UPDATE public.profiles SET is_agency_account = true WHERE email = 'agencia@auralive.com';

-- 5. Crear la Agencia 'Agencia Master'
INSERT INTO public.agencies (owner_id, name, invite_code, status)
SELECT id, 'Agencia Master', 'MASTER2026', 'approved'
FROM public.profiles WHERE email = 'agencia@auralive.com'
ON CONFLICT (invite_code) DO NOTHING;

-- 6. Asignar presentadora a la Agencia Master
UPDATE public.profiles SET agency_id = (
  SELECT id FROM public.agencies WHERE name = 'Agencia Master' LIMIT 1
) WHERE email = 'presentadora@auralive.com';

-- 7. Insertar historial mock para probar el Dashboard del SuperAdmin
INSERT INTO public.streamer_daily_missions (streamer_id, mission_date, accumulated_minutes, received_gift_coins, is_completed)
SELECT id, CURRENT_DATE - INTERVAL '1 day', 120, 5000, true
FROM public.profiles WHERE email = 'presentadora@auralive.com'
ON CONFLICT DO NOTHING;

INSERT INTO public.streamer_daily_missions (streamer_id, mission_date, accumulated_minutes, received_gift_coins, is_completed)
SELECT id, CURRENT_DATE, 240, 15000, true
FROM public.profiles WHERE email = 'presentadora@auralive.com'
ON CONFLICT DO NOTHING;

-- 8. Insertar retiro mock de la Presentadora Independiente
INSERT INTO public.withdrawal_requests (applicant_id, applicant_type, coin_amount, usd_equivalent, payment_method, account_details, status)
SELECT id, 'streamer', 15000, 150.00, 'Binance USDT', '{"network": "TRC20", "address": "Txxxxxx123"}', 'pending'
FROM public.profiles WHERE email = 'presentadora@auralive.com';

-- 9. Insertar retiro mock de la Agencia
INSERT INTO public.withdrawal_requests (applicant_id, applicant_type, coin_amount, usd_equivalent, payment_method, account_details, status)
SELECT id, 'agency', 50000, 500.00, 'Transferencia Bancaria', '{"bank": "Bancolombia", "account": "123456789"}', 'pending'
FROM public.profiles WHERE email = 'agencia@auralive.com';
