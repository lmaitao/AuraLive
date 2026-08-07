-- ============================================================================
-- AURA LIVE ULTIMATE MASTER DATABASE SCRIPT
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 0. CLEANUP (Opcional, para empezar desde cero en entorno de pruebas)
-- ============================================================================
DROP TABLE IF EXISTS public.family_chat CASCADE;
DROP TABLE IF EXISTS public.family_members CASCADE;
DROP TABLE IF EXISTS public.families CASCADE;
DROP TABLE IF EXISTS public.direct_messages CASCADE;
DROP TABLE IF EXISTS public.withdrawal_requests CASCADE;
DROP TABLE IF EXISTS public.chat_messages CASCADE;
DROP TABLE IF EXISTS public.gifts CASCADE;
DROP TABLE IF EXISTS public.streamer_daily_missions CASCADE;
DROP TABLE IF EXISTS public.stream_rooms CASCADE;
DROP TABLE IF EXISTS public.wallet_transactions CASCADE;
DROP TABLE IF EXISTS public.wallets CASCADE;
DROP TABLE IF EXISTS public.support_tickets CASCADE;
DROP TABLE IF EXISTS public.agencies CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- ============================================================================
-- 1. TABLES CREATION
-- ============================================================================

CREATE TABLE public.agencies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    invite_code VARCHAR(50) UNIQUE NOT NULL,
    commission_rate NUMERIC(4,2) DEFAULT 10.00,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    full_name VARCHAR(255),
    avatar_url TEXT DEFAULT 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400',
    gender VARCHAR(20) DEFAULT 'unspecified',
    phone_number VARCHAR(50),
    birth_date DATE,
    is_identity_verified BOOLEAN DEFAULT FALSE,
    is_streamer BOOLEAN DEFAULT FALSE,
    is_superadmin BOOLEAN DEFAULT FALSE,
    is_vip BOOLEAN DEFAULT FALSE,
    status VARCHAR(50) DEFAULT 'esperando_biometria',
    face_signature_hash VARCHAR(255) UNIQUE,
    agency_id UUID REFERENCES public.agencies(id) ON DELETE SET NULL,
    svip_level INT DEFAULT 0,
    svip_experience BIGINT DEFAULT 0,
    wealth_level INT DEFAULT 0,
    wealth_experience BIGINT DEFAULT 0,
    is_agency_account BOOLEAN DEFAULT FALSE,
    is_banned BOOLEAN DEFAULT FALSE,
    svip_maintenance_deadline TIMESTAMPTZ,
    svip_maintenance_points BIGINT DEFAULT 0,
    last_seen TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.agencies ADD CONSTRAINT fk_agency_owner FOREIGN KEY (owner_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

CREATE TABLE public.support_tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    subject VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'open',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.wallets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    coin_balance BIGINT DEFAULT 0 CHECK (coin_balance >= 0),
    aura_balance BIGINT DEFAULT 0 CHECK (aura_balance >= 0),
    clover_balance INT DEFAULT 3 CHECK (clover_balance >= 0),
    has_recharged BOOLEAN DEFAULT FALSE,
    last_daily_checkin TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.wallet_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    amount BIGINT NOT NULL,
    type VARCHAR(50) NOT NULL,
    reference_id UUID,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.stream_rooms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    host_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    category VARCHAR(100) DEFAULT 'Variedad',
    layout_mode VARCHAR(20) DEFAULT '4_cam',
    is_active BOOLEAN DEFAULT TRUE,
    viewer_count INT DEFAULT 0,
    voice_slots JSONB DEFAULT '["slot_1", "slot_2", "slot_3", "slot_4"]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.streamer_daily_missions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    streamer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    mission_date DATE DEFAULT CURRENT_DATE,
    accumulated_minutes INT DEFAULT 0,
    received_gift_coins BIGINT DEFAULT 0,
    clover_leaves_unlocked INT DEFAULT 0 CHECK (clover_leaves_unlocked BETWEEN 0 AND 5),
    is_completed BOOLEAN DEFAULT FALSE,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_streamer_daily_mission UNIQUE (streamer_id, mission_date)
);

CREATE TABLE public.gifts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    coin_price INT NOT NULL CHECK (coin_price > 0),
    icon_url TEXT NOT NULL,
    lottie_animation_url TEXT,
    is_exclusive BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id UUID REFERENCES public.stream_rooms(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    recipient_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    is_censored BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.withdrawal_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    applicant_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    applicant_type VARCHAR(20) NOT NULL,
    coin_amount BIGINT NOT NULL,
    usd_equivalent NUMERIC(10,2) NOT NULL,
    payment_method VARCHAR(100) NOT NULL,
    account_details JSONB NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    processed_at TIMESTAMPTZ
);

CREATE TABLE public.direct_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    content TEXT,
    image_url TEXT,
    timer_seconds INTEGER DEFAULT NULL,
    is_deleted BOOLEAN DEFAULT FALSE,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.families (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    avatar_url TEXT DEFAULT 'https://images.unsplash.com/photo-1529156069898-49953eb1b5b6?w=400',
    status VARCHAR(50) DEFAULT 'pending',
    member_count INT DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.family_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role VARCHAR(20) DEFAULT 'member',
    status VARCHAR(20) DEFAULT 'pending',
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_family_member UNIQUE (family_id, user_id)
);

CREATE TABLE public.family_chat (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 2. TRIGGERS & RPC FUNCTIONS
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_human_verified_reward()
RETURNS TRIGGER 
SET search_path = public
AS $$
BEGIN
    IF NEW.status = 'verified' AND (OLD.status IS NULL OR OLD.status != 'verified') THEN
        INSERT INTO public.wallets (user_id, coin_balance)
        VALUES (NEW.id, 50)
        ON CONFLICT (user_id) DO UPDATE SET coin_balance = public.wallets.coin_balance + 50;

        INSERT INTO public.wallet_transactions (user_id, amount, type, metadata)
        VALUES (NEW.id, 50, 'welcome_bonus', '{"description": "Bono de bienvenida por verificación"}'::jsonb);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER trigger_on_human_verified
AFTER INSERT OR UPDATE OF status ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.handle_human_verified_reward();

CREATE OR REPLACE FUNCTION public.send_gift(
    p_sender_id UUID,
    p_receptor_id UUID,
    p_gift_id UUID,
    p_room_id UUID DEFAULT NULL
)
RETURNS JSONB 
SET search_path = public
AS $$
DECLARE
    v_gift RECORD;
    v_receptor RECORD;
    v_sender_wallet RECORD;
    v_superadmin_id UUID;
    v_agency_owner_id UUID;
    v_platform_coins BIGINT;
    v_streamer_coins BIGINT;
    v_agency_coins BIGINT;
    v_new_clover_count INT;
    v_daily_coins BIGINT;
BEGIN
    SELECT * INTO v_gift FROM public.gifts WHERE id = p_gift_id;
    IF NOT FOUND THEN RAISE EXCEPTION 'Regalo no encontrado.'; END IF;

    SELECT * INTO v_receptor FROM public.profiles WHERE id = p_receptor_id;
    IF NOT FOUND THEN RAISE EXCEPTION 'Usuario receptor no encontrado.'; END IF;

    IF LOWER(v_receptor.gender) = 'male' AND v_receptor.is_agency_account = FALSE THEN
        RAISE EXCEPTION 'Error: Hombres no pueden monetizar a menos que sean Agencia.';
    END IF;

    SELECT * INTO v_sender_wallet FROM public.wallets WHERE user_id = p_sender_id FOR UPDATE;
    IF NOT FOUND OR v_sender_wallet.coin_balance < v_gift.coin_price THEN
        RAISE EXCEPTION 'Saldo insuficiente.';
    END IF;

    v_platform_coins := (v_gift.coin_price * 50) / 100;
    v_streamer_coins := (v_gift.coin_price * 40) / 100;
    v_agency_coins   := (v_gift.coin_price * 10) / 100;

    IF v_receptor.agency_id IS NOT NULL THEN
        SELECT owner_id INTO v_agency_owner_id FROM public.agencies WHERE id = v_receptor.agency_id;
    END IF;

    IF v_agency_owner_id IS NULL THEN
        v_platform_coins := v_platform_coins + v_agency_coins;
        v_agency_coins := 0;
    END IF;

    SELECT id INTO v_superadmin_id FROM public.profiles WHERE is_superadmin = TRUE LIMIT 1;

    -- Update sender coin balance
    UPDATE public.wallets SET coin_balance = coin_balance - v_gift.coin_price WHERE user_id = p_sender_id;
    
    -- Update streamer AURA balance (Net Earnings)
    INSERT INTO public.wallets (user_id, aura_balance) VALUES (p_receptor_id, v_streamer_coins)
    ON CONFLICT (user_id) DO UPDATE SET aura_balance = public.wallets.aura_balance + v_streamer_coins;

    IF v_superadmin_id IS NOT NULL THEN
        INSERT INTO public.wallets (user_id, coin_balance) VALUES (v_superadmin_id, v_platform_coins)
        ON CONFLICT (user_id) DO UPDATE SET coin_balance = public.wallets.coin_balance + v_platform_coins;
    END IF;

    IF v_agency_owner_id IS NOT NULL AND v_agency_coins > 0 THEN
        INSERT INTO public.wallets (user_id, coin_balance) VALUES (v_agency_owner_id, v_agency_coins)
        ON CONFLICT (user_id) DO UPDATE SET coin_balance = public.wallets.coin_balance + v_agency_coins;
    END IF;
 
    INSERT INTO public.wallet_transactions (user_id, amount, type, reference_id, metadata)
    VALUES (p_sender_id, -v_gift.coin_price, 'gift_sent', p_gift_id, jsonb_build_object('receptor_id', p_receptor_id, 'gift_name', v_gift.name));

    INSERT INTO public.wallet_transactions (user_id, amount, type, reference_id, metadata)
    VALUES (p_receptor_id, v_streamer_coins, 'gift_received', p_gift_id, jsonb_build_object('sender_id', p_sender_id, 'gift_name', v_gift.name));

    INSERT INTO public.streamer_daily_missions (streamer_id, mission_date, received_gift_coins)
    VALUES (p_receptor_id, CURRENT_DATE, v_gift.coin_price)
    ON CONFLICT (streamer_id, mission_date) DO UPDATE
    SET received_gift_coins = public.streamer_daily_missions.received_gift_coins + EXCLUDED.received_gift_coins;

    RETURN jsonb_build_object(
        'success', true,
        'message', 'Regalo enviado exitosamente.',
        'sender_balance', (v_sender_wallet.coin_balance - v_gift.coin_price),
        'streamer_auras_earned', v_streamer_coins
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, username, full_name, gender, status)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Usuario Aura'),
    COALESCE(NEW.raw_user_meta_data->>'gender', 'female'),
    'esperando_biometria'
  )
  ON CONFLICT (id) DO NOTHING;
  
  INSERT INTO public.wallets (user_id, coin_balance, aura_balance)
  VALUES (NEW.id, 0, 0)
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ============================================================================
-- 3. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stream_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.streamer_daily_missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.withdrawal_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.direct_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.families ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_chat ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all select" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Allow all update" ON public.profiles FOR UPDATE USING (true);

CREATE POLICY "Allow all select wallets" ON public.wallets FOR SELECT USING (true);
CREATE POLICY "Allow all update wallets" ON public.wallets FOR UPDATE USING (true);

CREATE POLICY "Rooms viewable" ON public.stream_rooms FOR SELECT USING (true);
CREATE POLICY "Rooms insertable" ON public.stream_rooms FOR INSERT WITH CHECK (true);
CREATE POLICY "Rooms updatable" ON public.stream_rooms FOR UPDATE USING (true);

CREATE POLICY "Gifts viewable" ON public.gifts FOR SELECT USING (true);

CREATE POLICY "Messages insertable" ON public.direct_messages FOR INSERT WITH CHECK (true);
CREATE POLICY "Messages viewable" ON public.direct_messages FOR SELECT USING (true);

-- ============================================================================
-- 4. INSERT MOCK DATA: GIFTS (ANIMACIONES 3D)
-- ============================================================================
INSERT INTO public.gifts (name, coin_price, icon_url, lottie_animation_url) VALUES
('Rosa de Neón', 10, 'https://cdn-icons-png.flaticon.com/512/3004/3004071.png', 'https://lottie.host/8c1303ed-7cfa-4ebf-801a-8ff6cc6eb2c2/2O0p2c34kK.json'),
('Beso Cyber', 50, 'https://cdn-icons-png.flaticon.com/512/2850/2850550.png', 'https://lottie.host/80769d49-411a-42cd-bb43-7f72295240c5/Z5f5u9bN0S.json'),
('Corona Diamante', 500, 'https://cdn-icons-png.flaticon.com/512/714/714407.png', 'https://lottie.host/17e5a7b6-cc7d-417d-bebb-42df6495d4d3/7oG9Y8N4uH.json'),
('Nave Espacial', 1000, 'https://cdn-icons-png.flaticon.com/512/3255/3255057.png', 'https://lottie.host/98c5d14e-d98c-447b-83de-ec5c0d5926be/lI1f4Ww7N4.json'),
('Dragón Legendario', 5000, 'https://cdn-icons-png.flaticon.com/512/5725/5725514.png', 'https://lottie.host/95d82998-1cd5-46eb-81c8-db28b9c647b0/Xz4x2hO4YI.json'),
('Auto Lujo 3D', 10000, 'https://cdn-icons-png.flaticon.com/512/3204/3204918.png', 'https://lottie.host/e2d08a50-6eb6-4556-9130-1c667a4214f5/H8S3p4Z7P2.json');

-- ============================================================================
-- 5. INSERT TEST USERS (Hombre, Presentadora, Agencia, SuperAdmin)
-- ============================================================================
DO $$
DECLARE
    uid_hombre UUID := gen_random_uuid();
    uid_streamer UUID := gen_random_uuid();
    uid_agencia UUID := gen_random_uuid();
    uid_admin UUID := gen_random_uuid();
BEGIN
    -- Limpiar usuarios de prueba anteriores para evitar error de clave duplicada
    DELETE FROM auth.users WHERE email IN ('hombre@auralive.com', 'presentadora@auralive.com', 'agencia@auralive.com', 'admin@auralive.com');

    -- Usuarios Auth
    INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, is_sso_user, created_at, updated_at)
    VALUES
    ('00000000-0000-0000-0000-000000000000', uid_hombre, 'authenticated', 'authenticated', 'hombre@auralive.com', crypt('Aura123456*', gen_salt('bf')), now(), '{"provider": "email", "providers": ["email"]}', '{}', false, false, now(), now()),
    ('00000000-0000-0000-0000-000000000000', uid_streamer, 'authenticated', 'authenticated', 'presentadora@auralive.com', crypt('Aura123456*', gen_salt('bf')), now(), '{"provider": "email", "providers": ["email"]}', '{}', false, false, now(), now()),
    ('00000000-0000-0000-0000-000000000000', uid_agencia, 'authenticated', 'authenticated', 'agencia@auralive.com', crypt('Aura123456*', gen_salt('bf')), now(), '{"provider": "email", "providers": ["email"]}', '{}', false, false, now(), now()),
    ('00000000-0000-0000-0000-000000000000', uid_admin, 'authenticated', 'authenticated', 'admin@auralive.com', crypt('Aura123456*', gen_salt('bf')), now(), '{"provider": "email", "providers": ["email"]}', '{}', false, false, now(), now());

    -- Identities
    INSERT INTO auth.identities (id, provider_id, user_id, identity_data, provider, created_at, updated_at)
    VALUES
    (gen_random_uuid(), uid_hombre, uid_hombre, format('{"sub":"%s","email":"hombre@auralive.com"}', uid_hombre)::jsonb, 'email', now(), now()),
    (gen_random_uuid(), uid_streamer, uid_streamer, format('{"sub":"%s","email":"presentadora@auralive.com"}', uid_streamer)::jsonb, 'email', now(), now()),
    (gen_random_uuid(), uid_agencia, uid_agencia, format('{"sub":"%s","email":"agencia@auralive.com"}', uid_agencia)::jsonb, 'email', now(), now()),
    (gen_random_uuid(), uid_admin, uid_admin, format('{"sub":"%s","email":"admin@auralive.com"}', uid_admin)::jsonb, 'email', now(), now());

    -- Actualizar Perfiles Creados por Trigger
    UPDATE public.profiles SET full_name = 'Usuario VIP', gender = 'male', is_streamer = false, is_agency_account = false, is_superadmin = false, status = 'verified' WHERE id = uid_hombre;
    UPDATE public.profiles SET full_name = 'Elena Streamer', gender = 'female', is_streamer = true, is_agency_account = false, is_superadmin = false, status = 'verified' WHERE id = uid_streamer;
    UPDATE public.profiles SET full_name = 'Agencia Alpha', gender = 'male', is_streamer = false, is_agency_account = true, is_superadmin = false, status = 'verified' WHERE id = uid_agencia;
    UPDATE public.profiles SET full_name = 'Súper Admin', gender = 'female', is_streamer = false, is_agency_account = false, is_superadmin = true, status = 'verified' WHERE id = uid_admin;

    -- Actualizar Billeteras
    UPDATE public.wallets SET coin_balance = 50000 WHERE user_id = uid_hombre;
    UPDATE public.wallets SET coin_balance = 500 WHERE user_id = uid_streamer;
    UPDATE public.wallets SET coin_balance = 20000 WHERE user_id = uid_agencia;
END $$;
