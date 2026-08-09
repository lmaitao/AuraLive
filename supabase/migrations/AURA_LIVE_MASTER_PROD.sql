-- ============================================================================
-- AURA LIVE — BASE DE DATOS MAESTRA PRODUCCIÓN (DEFINITIVA Y LIMPIA)
-- Versión: 4.0 Final Producción
-- Instrucciones: Ejecutar completo en Supabase Dashboard > SQL Editor
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 1. TABLA: AGENCIAS
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.agencies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    invite_code VARCHAR(50) UNIQUE NOT NULL,
    commission_rate NUMERIC(4,2) DEFAULT 10.00,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 2. TABLA: PERFILES DE USUARIO
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    full_name VARCHAR(255),
    avatar_url TEXT DEFAULT 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400',
    bio VARCHAR(300),
    gender VARCHAR(20) DEFAULT 'female',
    phone_number VARCHAR(50),
    birth_date DATE,
    photo_gallery TEXT[] DEFAULT '{}',
    clover_gift_sent BOOLEAN DEFAULT FALSE,
    is_identity_verified BOOLEAN DEFAULT FALSE,
    is_streamer BOOLEAN DEFAULT FALSE,
    is_superadmin BOOLEAN DEFAULT FALSE,
    is_vip BOOLEAN DEFAULT FALSE,
    is_agency_account BOOLEAN DEFAULT FALSE,
    is_banned BOOLEAN DEFAULT FALSE,
    status VARCHAR(50) DEFAULT 'verified',
    face_signature_hash VARCHAR(255) UNIQUE,
    agency_id UUID REFERENCES public.agencies(id) ON DELETE SET NULL,
    svip_level INT DEFAULT 0,
    svip_experience BIGINT DEFAULT 0,
    svip_maintenance_deadline TIMESTAMPTZ,
    svip_maintenance_points BIGINT DEFAULT 0,
    wealth_level INT DEFAULT 0,
    wealth_experience BIGINT DEFAULT 0,
    last_seen TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Relación de pertenencia de agencia a perfil de propietario
ALTER TABLE public.agencies
    DROP CONSTRAINT IF EXISTS fk_agency_owner,
    ADD CONSTRAINT fk_agency_owner
    FOREIGN KEY (owner_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- ============================================================================
-- 3. TABLA: SEGUIDORES
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.followers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    follower_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    following_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_follow UNIQUE (follower_id, following_id),
    CONSTRAINT no_self_follow CHECK (follower_id != following_id)
);

-- ============================================================================
-- 4. TABLA: VISITANTES DE PERFIL
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.profile_visitors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    visitor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    visited_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_visitor UNIQUE (profile_id, visitor_id)
);

-- ============================================================================
-- 5. TABLA: REELS (VIDEOS CORTOS DE 24 HORAS)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.reels (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    video_url TEXT NOT NULL,
    thumbnail_url TEXT,
    caption TEXT,
    likes_count INT DEFAULT 0,
    comments_count INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 6. TABLA: PUBLICACIONES / POSTS DE COMUNIDAD
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    content TEXT,
    image_url TEXT,
    likes_count INT DEFAULT 0,
    comments_count INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 7. TABLA: BILLETERAS
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.wallets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    coin_balance BIGINT DEFAULT 1000 CHECK (coin_balance >= 0),
    aura_balance BIGINT DEFAULT 0 CHECK (aura_balance >= 0),
    clover_balance INT DEFAULT 3 CHECK (clover_balance >= 0),
    has_recharged BOOLEAN DEFAULT FALSE,
    last_daily_checkin TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 8. TABLA: TRANSACCIONES DE BILLETERA
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.wallet_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    amount BIGINT NOT NULL,
    type VARCHAR(50) NOT NULL,
    reference_id UUID,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 9. TABLA: SALAS DE TRANSMISIÓN EN VIVO
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.stream_rooms (
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

-- ============================================================================
-- 10. TABLA: MISIONES DIARIAS DE PRESENTADORAS
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.streamer_daily_missions (
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

-- ============================================================================
-- 11. TABLA: CATALOGO DE REGALOS VIRTUALES
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.gifts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    coin_price INT NOT NULL CHECK (coin_price >= 0),
    icon_url TEXT NOT NULL,
    lottie_animation_url TEXT,
    is_exclusive BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 12. TABLA: MENSAJES DE CHAT EN VIVO DE SALA
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id UUID REFERENCES public.stream_rooms(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    recipient_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    is_censored BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 13. TABLA: MENSAJES DIRECTOS (CHAT PRIVADO)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.direct_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    content TEXT,
    image_url TEXT,
    gift_id UUID REFERENCES public.gifts(id) ON DELETE SET NULL,
    timer_seconds INTEGER DEFAULT NULL,
    is_deleted BOOLEAN DEFAULT FALSE,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 14. TABLA: SOLICITUDES DE RETIRO DE AURAS A DINERO REAL
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.withdrawal_requests (
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

-- ============================================================================
-- 15. TABLA: TICKETS DE SOPORTE TÉCNICO
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.support_tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    subject VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'open',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);


-- ============================================================================
-- BUCKET DE ALMACENAMIENTO DE REELS (SUPABASE STORAGE)
-- ============================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('reels', 'reels', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE policyname = 'Permitir subir reels a usuarios autenticados'
    ) THEN
        CREATE POLICY "Permitir subir reels a usuarios autenticados"
        ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'reels');
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE policyname = 'Permitir lectura publica de reels'
    ) THEN
        CREATE POLICY "Permitir lectura publica de reels"
        ON storage.objects FOR SELECT TO public USING (bucket_id = 'reels');
    END IF;
END $$;


-- ============================================================================
-- FUNCIONES Y PROCEDIMIENTOS ALMACENADOS (RPC)
-- ============================================================================

-- A) Trigger para auto-creación de perfil y billetera al registrarse
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, username, full_name, avatar_url, gender, status, is_identity_verified)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, NEW.raw_user_meta_data->>'email', ''),
    COALESCE(
      NEW.raw_user_meta_data->>'username',
      split_part(COALESCE(NEW.email, 'usuario'), '@', 1) || '_' || LEFT(NEW.id::text, 4)
    ),
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', 'Usuario Aura'),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400'),
    'female',
    'verified',
    TRUE
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.wallets (user_id, coin_balance)
  VALUES (NEW.id, 1000)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- B) Limpieza de Reels caducados mayores a 24 horas
CREATE OR REPLACE FUNCTION public.cleanup_expired_reels_24h()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    DELETE FROM public.reels
    WHERE created_at < NOW() - INTERVAL '24 hours';
END;
$$;


-- C) Eliminación irrevocable de cuenta de usuario en cascada
CREATE OR REPLACE FUNCTION public.delete_user_account(p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    DELETE FROM public.withdrawal_requests WHERE applicant_id = p_user_id;
    DELETE FROM public.direct_messages WHERE sender_id = p_user_id OR receiver_id = p_user_id;
    DELETE FROM public.chat_messages WHERE sender_id = p_user_id OR recipient_id = p_user_id;
    DELETE FROM public.followers WHERE follower_id = p_user_id OR following_id = p_user_id;
    DELETE FROM public.profile_visitors WHERE profile_id = p_user_id OR visitor_id = p_user_id;
    DELETE FROM public.reels WHERE user_id = p_user_id;
    DELETE FROM public.posts WHERE user_id = p_user_id;
    DELETE FROM public.streamer_daily_missions WHERE streamer_id = p_user_id;
    DELETE FROM public.support_tickets WHERE user_id = p_user_id;
    DELETE FROM public.agencies WHERE owner_id = p_user_id;
    DELETE FROM public.wallets WHERE user_id = p_user_id;
    
    DELETE FROM public.profiles WHERE id = p_user_id;
    DELETE FROM auth.users WHERE id = p_user_id;
END;
$$;


-- D) Proceso de envío de regalo virtual (Plataforma 50% / Presentadora 40% / Agencia 10%)
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
    v_new_wealth_exp BIGINT;
BEGIN
    IF p_sender_id = p_receptor_id THEN
        RAISE EXCEPTION 'No puedes enviarte regalos a ti mismo.';
    END IF;

    SELECT * INTO v_gift FROM public.gifts WHERE id = p_gift_id;
    IF NOT FOUND THEN
        -- Fallback si el regalo es 0 monedas (Pack 3 Tréboles)
        v_gift := (SELECT ROW(p_gift_id, 'Pack 3 Tréboles 🍀', 0, 'https://cdn-icons-png.flaticon.com/512/346/346195.png', NULL, FALSE, NOW())::public.gifts);
    END IF;

    SELECT * INTO v_receptor FROM public.profiles WHERE id = p_receptor_id;
    SELECT * INTO v_sender_wallet FROM public.wallets WHERE user_id = p_sender_id FOR UPDATE;

    IF v_sender_wallet IS NOT NULL AND v_sender_wallet.coin_balance < COALESCE(v_gift.coin_price, 0) THEN
        RAISE EXCEPTION 'Saldo insuficiente de monedas.';
    END IF;

    -- Si se envía trébol, marcar clover_gift_sent para quitar etiqueta NUEVO
    IF p_gift_id::text LIKE '%clover%' OR v_gift.name LIKE '%Trébol%' THEN
        UPDATE public.profiles SET clover_gift_sent = TRUE WHERE id = p_sender_id;
    END IF;

    v_platform_coins := (COALESCE(v_gift.coin_price, 0) * 50) / 100;
    v_streamer_coins := (COALESCE(v_gift.coin_price, 0) * 40) / 100;
    v_agency_coins   := (COALESCE(v_gift.coin_price, 0) * 10) / 100;

    IF v_sender_wallet IS NOT NULL AND COALESCE(v_gift.coin_price, 0) > 0 THEN
        UPDATE public.wallets SET coin_balance = coin_balance - v_gift.coin_price WHERE user_id = p_sender_id;
        UPDATE public.wallets SET aura_balance = aura_balance + v_streamer_coins WHERE user_id = p_receptor_id;
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'message', 'Regalo enviado exitosamente.',
        'sender_balance', COALESCE(v_sender_wallet.coin_balance - COALESCE(v_gift.coin_price, 0), 0)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ============================================================================
-- POLÍTICAS ROW LEVEL SECURITY (RLS)
-- ============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.followers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_visitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stream_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.streamer_daily_missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.direct_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.withdrawal_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

-- Políticas de lectura/escritura abiertas para usuarios autenticados
CREATE POLICY "profiles_select" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "profiles_update" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_delete" ON public.profiles FOR DELETE USING (auth.uid() = id);

CREATE POLICY "reels_select" ON public.reels FOR SELECT USING (true);
CREATE POLICY "reels_insert" ON public.reels FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "reels_update" ON public.reels FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "reels_delete" ON public.reels FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "posts_select" ON public.posts FOR SELECT USING (true);
CREATE POLICY "posts_insert" ON public.posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "posts_delete" ON public.posts FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "followers_select" ON public.followers FOR SELECT USING (true);
CREATE POLICY "followers_insert" ON public.followers FOR INSERT WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "followers_delete" ON public.followers FOR DELETE USING (auth.uid() = follower_id);

CREATE POLICY "visitors_select" ON public.profile_visitors FOR SELECT USING (true);
CREATE POLICY "visitors_insert" ON public.profile_visitors FOR INSERT WITH CHECK (auth.uid() = visitor_id);

CREATE POLICY "wallets_select" ON public.wallets FOR SELECT USING (true);
CREATE POLICY "wallets_update" ON public.wallets FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "rooms_select" ON public.stream_rooms FOR SELECT USING (true);
CREATE POLICY "rooms_manage" ON public.stream_rooms FOR ALL USING (auth.uid() = host_id);

CREATE POLICY "gifts_select" ON public.gifts FOR SELECT USING (true);

CREATE POLICY "chat_select" ON public.chat_messages FOR SELECT USING (true);
CREATE POLICY "chat_insert" ON public.chat_messages FOR INSERT WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "dm_select" ON public.direct_messages FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
CREATE POLICY "dm_insert" ON public.direct_messages FOR INSERT WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "dm_update" ON public.direct_messages FOR UPDATE USING (auth.uid() = sender_id OR auth.uid() = receiver_id);


-- ============================================================================
-- DATO DE PRUEBA Y SEMILLAS DE REGALOS
-- ============================================================================
INSERT INTO public.gifts (name, coin_price, icon_url, is_exclusive) VALUES
('Pack 3 Tréboles 🍀',  0,     'https://cdn-icons-png.flaticon.com/512/346/346195.png',   false),
('Rosa Neon 🌹',        10,    'https://cdn-icons-png.flaticon.com/512/744/744546.png',   false),
('Beso Cyber 💋',       50,    'https://cdn-icons-png.flaticon.com/512/2850/2850550.png', false),
('Corona Diamante 👑',  500,   'https://cdn-icons-png.flaticon.com/512/714/714407.png',   false),
('Nave Espacial 🚀',    1000,  'https://cdn-icons-png.flaticon.com/512/3255/3255057.png', false),
('Dragón Legendario 🐉',5000,  'https://cdn-icons-png.flaticon.com/512/5725/5725514.png', true),
('Auto Lujo 3D 🏎️',     10000, 'https://cdn-icons-png.flaticon.com/512/3204/3204918.png', true)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- FIN DEL SCRIPT AURA LIVE MASTER PRODUCCIÓN
-- ============================================================================
