-- ============================================================================
-- AURA LIVE — BASE DE DATOS MAESTRA PRODUCCIÓN (DEFINITIVA, SEGURA Y SIN DUPLICADOS)
-- Versión: 5.0 Final Producción (Esquema Limpio + Ledger + Catálogos + RPCs + RLS Estricta)
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 0. LIMPIEZA TOTAL (DROP + CREATE SIN TABLAS DUPLICADAS)
-- ============================================================================
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_Namespace n JOIN pg_class c ON c.relnamespace = n.oid WHERE n.nspname = 'auth' AND c.relname = 'users') THEN
        DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
    END IF;
    IF to_regclass('public.profiles') IS NOT NULL THEN
        DROP TRIGGER IF EXISTS trg_protect_profile_columns ON public.profiles;
    END IF;
END $$;

DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.protect_profile_sensitive_columns() CASCADE;
DROP FUNCTION IF EXISTS public.cleanup_expired_reels_24h() CASCADE;
DROP FUNCTION IF EXISTS public.delete_user_account(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.send_gift(UUID, UUID, UUID, UUID) CASCADE;
DROP FUNCTION IF EXISTS public.send_gift(UUID, UUID, TEXT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.liveness_verify(UUID, VARCHAR) CASCADE;
DROP FUNCTION IF EXISTS public.claim_daily_checkin(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.play_game(TEXT, BIGINT, TEXT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.exchange_auras_for_coins(BIGINT) CASCADE;
DROP FUNCTION IF EXISTS public.claim_streamer_daily_mission() CASCADE;
DROP FUNCTION IF EXISTS public.create_stream_room(TEXT, TEXT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.join_stream_room(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.leave_stream_room(UUID, INT) CASCADE;
DROP FUNCTION IF EXISTS public.toggle_reel_like(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.add_reel_comment(UUID, TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.toggle_post_like(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.credit_coin_purchase(UUID, TEXT, TEXT, TEXT, NUMERIC) CASCADE;
DROP FUNCTION IF EXISTS public.request_withdrawal(BIGINT, TEXT, JSONB, TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.review_withdrawal(UUID, TEXT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.is_superadmin(UUID) CASCADE;

-- Eliminar tablas obsoletas o duplicadas en orden inverso de dependencias
DROP TABLE IF EXISTS public.room_messages CASCADE;
DROP TABLE IF EXISTS public.live_rooms CASCADE;
DROP TABLE IF EXISTS public.profile_photos CASCADE;
DROP TABLE IF EXISTS public.post_likes CASCADE;
DROP TABLE IF EXISTS public.reel_comments CASCADE;
DROP TABLE IF EXISTS public.reel_likes CASCADE;
DROP TABLE IF EXISTS public.support_tickets CASCADE;
DROP TABLE IF EXISTS public.withdrawal_requests CASCADE;
DROP TABLE IF EXISTS public.direct_messages CASCADE;
DROP TABLE IF EXISTS public.chat_messages CASCADE;
DROP TABLE IF EXISTS public.streamer_daily_missions CASCADE;
DROP TABLE IF EXISTS public.stream_rooms CASCADE;
DROP TABLE IF EXISTS public.payment_orders CASCADE;
DROP TABLE IF EXISTS public.wallet_transactions CASCADE;
DROP TABLE IF EXISTS public.wallets CASCADE;
DROP TABLE IF EXISTS public.posts CASCADE;
DROP TABLE IF EXISTS public.reels CASCADE;
DROP TABLE IF EXISTS public.profile_visitors CASCADE;
DROP TABLE IF EXISTS public.followers CASCADE;
DROP TABLE IF EXISTS public.agencies CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.gifts CASCADE;
DROP TABLE IF EXISTS public.coin_packages CASCADE;
DROP TABLE IF EXISTS public.platform_settings CASCADE;

-- ============================================================================
-- 1. CATÁLOGO: CONFIGURACIÓN DE PLATAFORMA (platform_settings)
-- ============================================================================
CREATE TABLE public.platform_settings (
    key VARCHAR(100) PRIMARY KEY,
    value JSONB NOT NULL,
    description TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 2. CATÁLOGO: PAQUETES DE MONEDAS ($5 – $200 USD) (coin_packages)
-- ============================================================================
CREATE TABLE public.coin_packages (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    coins BIGINT NOT NULL CHECK (coins > 0),
    bonus_coins BIGINT NOT NULL DEFAULT 0 CHECK (bonus_coins >= 0),
    usd_price NUMERIC(10,2) NOT NULL CHECK (usd_price > 0),
    google_play_product_id VARCHAR(100),
    stripe_price_id VARCHAR(100),
    is_popular BOOLEAN DEFAULT FALSE,
    is_max BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 3. CATÁLOGO: REGALOS VIRTUALES (IDs TEXTO) (gifts)
-- ============================================================================
CREATE TABLE public.gifts (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL DEFAULT 'Popular',
    coin_price INT NOT NULL CHECK (coin_price >= 0),
    icon_url TEXT NOT NULL,
    lottie_animation_url TEXT,
    is_exclusive BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 4. TABLA: AGENCIAS (agencies)
-- ============================================================================
CREATE TABLE public.agencies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    invite_code VARCHAR(50) UNIQUE NOT NULL,
    commission_rate NUMERIC(4,2) DEFAULT 5.00,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 5. TABLA: PERFILES DE USUARIO (profiles)
-- ============================================================================
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    full_name VARCHAR(255),
    avatar_url TEXT DEFAULT 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400',
    bio VARCHAR(300) DEFAULT '',
    gender VARCHAR(20) DEFAULT 'female',
    phone_number VARCHAR(50),
    birth_date DATE,
    photo_gallery TEXT[] DEFAULT '{}',
    clover_gift_sent BOOLEAN DEFAULT FALSE,
    is_identity_verified BOOLEAN DEFAULT FALSE,
    is_streamer BOOLEAN DEFAULT FALSE,
    is_superadmin BOOLEAN DEFAULT FALSE,
    is_vip BOOLEAN DEFAULT FALSE,
    is_agency BOOLEAN DEFAULT FALSE,
    is_agency_account BOOLEAN DEFAULT FALSE,
    is_banned BOOLEAN DEFAULT FALSE,
    status VARCHAR(50) DEFAULT 'esperando_biometria',
    face_signature_hash VARCHAR(255) UNIQUE,
    agency_id UUID REFERENCES public.agencies(id) ON DELETE SET NULL,
    agency_request_status VARCHAR(30) DEFAULT 'none' CHECK (agency_request_status IN ('none', 'pending', 'linked', 'rejected')),
    svip_level INT DEFAULT 0,
    svip_experience BIGINT DEFAULT 0,
    svip_maintenance_deadline TIMESTAMPTZ,
    svip_maintenance_points BIGINT DEFAULT 0,
    wealth_level INT DEFAULT 0,
    wealth_experience BIGINT DEFAULT 0,
    charisma_level INT DEFAULT 0,
    charisma_experience BIGINT DEFAULT 0,
    has_recharged BOOLEAN DEFAULT FALSE,
    last_checkin_date TIMESTAMPTZ,
    last_seen TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.agencies
    ADD CONSTRAINT fk_agency_owner
    FOREIGN KEY (owner_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- ============================================================================
-- 6. TABLA: BILLETERAS (SOLO MODIFICABLES POR SERVIDOR) (wallets)
-- ============================================================================
CREATE TABLE public.wallets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    coin_balance BIGINT NOT NULL DEFAULT 1000 CHECK (coin_balance >= 0),
    aura_balance BIGINT NOT NULL DEFAULT 0 CHECK (aura_balance >= 0),
    clover_balance INT NOT NULL DEFAULT 1 CHECK (clover_balance >= 0),
    has_recharged BOOLEAN DEFAULT FALSE,
    last_daily_checkin TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 7. TABLA: LEDGER DE TRANSACCIONES DE BILLETERA (wallet_transactions)
-- ============================================================================
CREATE TABLE public.wallet_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    currency VARCHAR(20) NOT NULL DEFAULT 'coins' CHECK (currency IN ('coins', 'auras', 'clovers')),
    amount BIGINT NOT NULL,
    balance_after BIGINT NOT NULL DEFAULT 0,
    type VARCHAR(50) NOT NULL,
    reference_id TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_wallet_tx_user_created ON public.wallet_transactions(user_id, created_at DESC);

-- ============================================================================
-- 8. TABLA: ÓRDENES DE PAGO (IDEMPOTENCIA STRIPE / GOOGLE PLAY) (payment_orders)
-- ============================================================================
CREATE TABLE public.payment_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    package_id VARCHAR(50) NOT NULL REFERENCES public.coin_packages(id),
    provider VARCHAR(30) NOT NULL CHECK (provider IN ('stripe', 'google_play')),
    external_tx_id VARCHAR(255) UNIQUE NOT NULL,
    coins_credited BIGINT NOT NULL CHECK (coins_credited > 0),
    amount_usd NUMERIC(10,2) NOT NULL CHECK (amount_usd > 0),
    status VARCHAR(30) NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
    raw_payload JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 9. TABLA: SEGUIDORES (followers)
-- ============================================================================
CREATE TABLE public.followers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    follower_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    following_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_follow UNIQUE (follower_id, following_id),
    CONSTRAINT no_self_follow CHECK (follower_id != following_id)
);

-- ============================================================================
-- 10. TABLA: VISITANTES DE PERFIL (profile_visitors)
-- ============================================================================
CREATE TABLE public.profile_visitors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    visitor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    visited_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_visitor UNIQUE (profile_id, visitor_id)
);

-- ============================================================================
-- 11. TABLA: REELS + LIKES + COMENTARIOS (reels, reel_likes, reel_comments)
-- ============================================================================
CREATE TABLE public.reels (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    video_url TEXT NOT NULL,
    thumbnail_url TEXT,
    caption TEXT,
    likes_count INT NOT NULL DEFAULT 0 CHECK (likes_count >= 0),
    comments_count INT NOT NULL DEFAULT 0 CHECK (comments_count >= 0),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.reel_likes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reel_id UUID NOT NULL REFERENCES public.reels(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_reel_like UNIQUE (reel_id, user_id)
);

CREATE TABLE public.reel_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reel_id UUID NOT NULL REFERENCES public.reels(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 12. TABLA: POSTS DE COMUNIDAD + LIKES (posts, post_likes)
-- ============================================================================
CREATE TABLE public.posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    content TEXT,
    image_url TEXT,
    likes_count INT NOT NULL DEFAULT 0 CHECK (likes_count >= 0),
    comments_count INT NOT NULL DEFAULT 0 CHECK (comments_count >= 0),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.post_likes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_post_like UNIQUE (post_id, user_id)
);

-- ============================================================================
-- 13. TABLA: SALAS DE TRANSMISIÓN EN VIVO (stream_rooms)
-- ============================================================================
CREATE TABLE public.stream_rooms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    host_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    category VARCHAR(100) DEFAULT 'Variedad',
    layout_mode VARCHAR(20) DEFAULT '8_cam',
    is_active BOOLEAN DEFAULT TRUE,
    viewer_count INT NOT NULL DEFAULT 0 CHECK (viewer_count >= 0),
    voice_slots JSONB DEFAULT '["slot_1", "slot_2", "slot_3", "slot_4"]'::jsonb,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    ended_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_stream_rooms_active ON public.stream_rooms(is_active, viewer_count DESC);

-- ============================================================================
-- 14. TABLA: MISIONES DIARIAS DE PRESENTADORAS (streamer_daily_missions)
-- ============================================================================
CREATE TABLE public.streamer_daily_missions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    streamer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    mission_date DATE NOT NULL DEFAULT CURRENT_DATE,
    accumulated_minutes INT NOT NULL DEFAULT 0 CHECK (accumulated_minutes >= 0),
    received_gift_coins BIGINT NOT NULL DEFAULT 0 CHECK (received_gift_coins >= 0),
    clover_leaves_unlocked INT NOT NULL DEFAULT 0 CHECK (clover_leaves_unlocked BETWEEN 0 AND 5),
    is_completed BOOLEAN DEFAULT FALSE,
    reward_claimed BOOLEAN DEFAULT FALSE,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_streamer_daily_mission UNIQUE (streamer_id, mission_date)
);

-- ============================================================================
-- 15. TABLA ÚNICA: MENSAJES DE CHAT EN SALAS EN VIVO (chat_messages)
-- ============================================================================
CREATE TABLE public.chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id VARCHAR(255) NOT NULL,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    recipient_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    sender_name VARCHAR(255),
    sender_avatar TEXT,
    message TEXT NOT NULL,
    is_censored BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_chat_messages_room ON public.chat_messages(room_id, created_at DESC);

-- ============================================================================
-- 16. TABLA: MENSAJES DIRECTOS PRIVADOS (direct_messages)
-- ============================================================================
CREATE TABLE public.direct_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    content TEXT,
    image_url TEXT,
    gift_id VARCHAR(100) REFERENCES public.gifts(id) ON DELETE SET NULL,
    timer_seconds INTEGER DEFAULT NULL,
    is_deleted BOOLEAN DEFAULT FALSE,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_direct_messages_users ON public.direct_messages(sender_id, receiver_id, created_at DESC);

-- ============================================================================
-- 17. TABLA: SOLICITUDES DE RETIRO (withdrawal_requests)
-- ============================================================================
CREATE TABLE public.withdrawal_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    applicant_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    applicant_type VARCHAR(20) NOT NULL CHECK (applicant_type IN ('streamer', 'agency')),
    coin_amount BIGINT NOT NULL CHECK (coin_amount > 0),
    usd_equivalent NUMERIC(10,2) NOT NULL CHECK (usd_equivalent > 0),
    payment_method VARCHAR(100) NOT NULL,
    account_details JSONB NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'rejected')),
    admin_notes TEXT,
    reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    processed_at TIMESTAMPTZ
);

-- ============================================================================
-- 18. TABLA: TICKETS DE SOPORTE TÉCNICO (support_tickets)
-- ============================================================================
CREATE TABLE public.support_tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    subject VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'resolved', 'closed')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- BUCKET DE ALMACENAMIENTO DE REELS Y AVATARES (SUPABASE STORAGE)
-- ============================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('reels', 'reels', true)
ON CONFLICT (id) DO UPDATE SET public = true;

INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE policyname = 'Permitir subir reels a usuarios autenticados'
    ) THEN
        CREATE POLICY "Permitir subir reels a usuarios autenticados"
        ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id IN ('reels', 'avatars'));
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE policyname = 'Permitir lectura publica de reels'
    ) THEN
        CREATE POLICY "Permitir lectura publica de reels"
        ON storage.objects FOR SELECT TO public USING (bucket_id IN ('reels', 'avatars'));
    END IF;
END $$;

-- ============================================================================
-- FUNCIONES AUXILIARES Y TRIGGERS DE SEGURIDAD
-- ============================================================================

-- Helper: Verificar si un usuario es SuperAdmin
CREATE OR REPLACE FUNCTION public.is_superadmin(p_uid UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
    SELECT COALESCE(
        (SELECT is_superadmin FROM public.profiles WHERE id = p_uid),
        FALSE
    );
$$;

-- Trigger: Proteger columnas sensibles en profiles contra escalación de privilegios desde el cliente
CREATE OR REPLACE FUNCTION public.protect_profile_sensitive_columns()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Si la llamada viene de service_role o de una función SECURITY DEFINER (session_user = postgres) o SuperAdmin, permitir todo
    IF current_setting('request.jwt.claim.role', true) = 'service_role'
       OR current_user IN ('postgres', 'supabase_admin')
       OR public.is_superadmin(auth.uid()) THEN
        NEW.updated_at := NOW();
        RETURN NEW;
    END IF;

    -- Impedir que un usuario común modifique sus propios flags privilegiados o niveles calculados por servidor
    NEW.is_superadmin := OLD.is_superadmin;
    NEW.is_banned := OLD.is_banned;
    NEW.is_identity_verified := OLD.is_identity_verified;
    NEW.face_signature_hash := OLD.face_signature_hash;
    NEW.wealth_level := OLD.wealth_level;
    NEW.wealth_experience := OLD.wealth_experience;
    NEW.charisma_level := OLD.charisma_level;
    NEW.charisma_experience := OLD.charisma_experience;
    NEW.svip_level := OLD.svip_level;
    NEW.svip_experience := OLD.svip_experience;
    NEW.has_recharged := OLD.has_recharged;
    NEW.last_checkin_date := OLD.last_checkin_date;
    NEW.updated_at := NOW();

    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_protect_profile_columns
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.protect_profile_sensitive_columns();

-- A) Trigger para auto-creación de perfil, billetera y transacción inicial al registrarse
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_birth_date DATE := NULL;
    v_raw_dob TEXT;
BEGIN
    v_raw_dob := NEW.raw_user_meta_data->>'birth_date';
    IF v_raw_dob IS NOT NULL AND v_raw_dob ~ '^\d{4}-\d{2}-\d{2}$' THEN
        v_birth_date := v_raw_dob::DATE;
    ELSIF v_raw_dob IS NOT NULL AND v_raw_dob ~ '^\d{2}/\d{2}/\d{4}$' THEN
        v_birth_date := to_date(v_raw_dob, 'DD/MM/YYYY');
    END IF;

    INSERT INTO public.profiles (
        id, email, username, full_name, avatar_url, gender, birth_date, status, is_identity_verified
    )
    VALUES (
        NEW.id,
        COALESCE(NEW.email, NEW.raw_user_meta_data->>'email', 'user_' || LEFT(NEW.id::text, 8) || '@auralive.app'),
        COALESCE(
            NEW.raw_user_meta_data->>'username',
            split_part(COALESCE(NEW.email, 'usuario'), '@', 1) || '_' || LEFT(NEW.id::text, 4)
        ),
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', 'Usuario Aura'),
        COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400'),
        COALESCE(NEW.raw_user_meta_data->>'gender', 'female'),
        v_birth_date,
        'esperando_biometria',
        FALSE
    )
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.wallets (user_id, coin_balance, aura_balance, clover_balance)
    VALUES (NEW.id, 1000, 0, 1)
    ON CONFLICT (user_id) DO NOTHING;

    INSERT INTO public.wallet_transactions (user_id, currency, amount, balance_after, type, metadata)
    VALUES (NEW.id, 'coins', 1000, 1000, 'welcome_bonus', '{"reason": "Bono inicial de registro"}'::jsonb);

    RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- B) Limpieza de Reels caducados mayores a 24 horas
CREATE OR REPLACE FUNCTION public.cleanup_expired_reels_24h()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    DELETE FROM public.reels
    WHERE created_at < NOW() - INTERVAL '24 hours';
END;
$$;

-- C) Eliminación irrevocable de cuenta de usuario en cascada
CREATE OR REPLACE FUNCTION public.delete_user_account(p_user_id UUID DEFAULT auth.uid())
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_target_id UUID := COALESCE(p_user_id, auth.uid());
BEGIN
    IF v_target_id IS NULL THEN
        RAISE EXCEPTION 'Usuario no autenticado.';
    END IF;

    IF auth.uid() IS NOT NULL AND auth.uid() != v_target_id AND NOT public.is_superadmin(auth.uid()) THEN
        RAISE EXCEPTION 'No tienes permiso para eliminar otra cuenta.';
    END IF;

    DELETE FROM public.profiles WHERE id = v_target_id;
    DELETE FROM auth.users WHERE id = v_target_id;

    RETURN jsonb_build_object('success', true, 'deleted_user_id', v_target_id);
END;
$$;

-- ============================================================================
-- D) RPC: ENVÍO DE REGALO VIRTUAL (send_gift)
-- Reparto: 50% Dueño App / 45% Presentadora Neto / 5% Agencia
-- ============================================================================
CREATE OR REPLACE FUNCTION public.send_gift(
    p_sender_id UUID,
    p_receptor_id UUID,
    p_gift_id TEXT,
    p_room_id TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_caller UUID := auth.uid();
    v_gift RECORD;
    v_sender_profile RECORD;
    v_receptor RECORD;
    v_sender_wallet RECORD;
    v_receptor_wallet RECORD;
    v_superadmin_id UUID;
    v_agency_owner_id UUID;
    v_effective_price BIGINT;
    v_gift_value BIGINT;
    v_platform_coins BIGINT;
    v_streamer_coins BIGINT;
    v_agency_coins BIGINT;
    v_new_sender_balance BIGINT;
    v_new_receptor_auras BIGINT;
    v_is_clover BOOLEAN := FALSE;
    v_hours_since_signup NUMERIC;
BEGIN
    IF v_caller IS NOT NULL AND v_caller != p_sender_id AND NOT public.is_superadmin(v_caller) THEN
        RAISE EXCEPTION 'No autorizado para enviar regalos en nombre de otro usuario.';
    END IF;

    IF p_sender_id = p_receptor_id THEN
        RAISE EXCEPTION 'No puedes enviarte regalos a ti mismo.';
    END IF;

    SELECT * INTO v_gift FROM public.gifts WHERE id = p_gift_id AND is_active = TRUE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'El regalo seleccionado (%) no existe en el catálogo.', p_gift_id;
    END IF;

    SELECT * INTO v_sender_profile FROM public.profiles WHERE id = p_sender_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Perfil de remitente no encontrado.';
    END IF;

    SELECT * INTO v_receptor FROM public.profiles WHERE id = p_receptor_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'El destinatario del regalo no existe.';
    END IF;

    SELECT * INTO v_sender_wallet FROM public.wallets WHERE user_id = p_sender_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Billetera del remitente no encontrada.';
    END IF;

    v_is_clover := (p_gift_id LIKE '%clover%' OR v_gift.name ILIKE '%Trébol%');
    v_effective_price := v_gift.coin_price;
    v_gift_value := GREATEST(v_gift.coin_price, 300);

    -- Regla de Trébol de Bienvenida gratuito luego de 24h (1 única vez)
    IF p_gift_id = 'clover-welcome-1' AND NOT COALESCE(v_sender_profile.clover_gift_sent, FALSE) THEN
        v_hours_since_signup := EXTRACT(EPOCH FROM (NOW() - COALESCE(v_sender_profile.created_at, NOW()))) / 3600.0;
        IF v_hours_since_signup >= 24 AND v_sender_wallet.clover_balance > 0 THEN
            v_effective_price := 0;
        END IF;
    END IF;

    IF v_sender_wallet.coin_balance < v_effective_price THEN
        RAISE EXCEPTION 'Saldo insuficiente de monedas. Necesitas % monedas.', v_effective_price;
    END IF;

    -- Descontar monedas (y trébol si aplica)
    v_new_sender_balance := v_sender_wallet.coin_balance - v_effective_price;
    UPDATE public.wallets
    SET coin_balance = v_new_sender_balance,
        clover_balance = CASE
            WHEN v_effective_price = 0 AND v_is_clover AND clover_balance > 0 THEN clover_balance - 1
            ELSE clover_balance
        END,
        updated_at = NOW()
    WHERE user_id = p_sender_id;

    IF v_is_clover THEN
        UPDATE public.profiles SET clover_gift_sent = TRUE WHERE id = p_sender_id;
    END IF;

    -- Registrar débito en el ledger del remitente
    INSERT INTO public.wallet_transactions (user_id, currency, amount, balance_after, type, reference_id, metadata)
    VALUES (
        p_sender_id,
        'coins',
        -v_effective_price,
        v_new_sender_balance,
        'gift_sent',
        p_gift_id,
        jsonb_build_object('receptor_id', p_receptor_id, 'room_id', p_room_id, 'gift_name', v_gift.name)
    );

    -- Cálculo de reparto: 50% Plataforma / 45% Presentadora / 5% Agencia
    v_platform_coins := (v_gift_value * 50) / 100;
    v_agency_coins   := (v_gift_value * 5) / 100;
    v_streamer_coins := (v_gift_value * 45) / 100;

    -- Acreditar Auras al receptor
    INSERT INTO public.wallets (user_id, coin_balance, aura_balance, clover_balance)
    VALUES (p_receptor_id, 0, v_streamer_coins, 0)
    ON CONFLICT (user_id) DO UPDATE
    SET aura_balance = public.wallets.aura_balance + EXCLUDED.aura_balance,
        updated_at = NOW()
    RETURNING aura_balance INTO v_new_receptor_auras;

    INSERT INTO public.wallet_transactions (user_id, currency, amount, balance_after, type, reference_id, metadata)
    VALUES (
        p_receptor_id,
        'auras',
        v_streamer_coins,
        v_new_receptor_auras,
        'gift_received',
        p_gift_id,
        jsonb_build_object('sender_id', p_sender_id, 'room_id', p_room_id, 'gift_name', v_gift.name, 'gross_coins', v_gift_value)
    );

    -- Actualizar experiencia de Riqueza (remitente) y Carisma (receptor)
    UPDATE public.profiles
    SET wealth_experience = COALESCE(wealth_experience, 0) + v_gift_value,
        wealth_level = LEAST(50, FLOOR((COALESCE(wealth_experience, 0) + v_gift_value) / 1000)::INT)
    WHERE id = p_sender_id;

    UPDATE public.profiles
    SET charisma_experience = COALESCE(charisma_experience, 0) + v_gift_value,
        charisma_level = LEAST(50, FLOOR((COALESCE(charisma_experience, 0) + v_gift_value) / 1000)::INT)
    WHERE id = p_receptor_id;

    -- Actualizar misiones diarias de la presentadora receptora
    INSERT INTO public.streamer_daily_missions (
        streamer_id, mission_date, accumulated_minutes, received_gift_coins, clover_leaves_unlocked
    )
    VALUES (
        p_receptor_id,
        CURRENT_DATE,
        0,
        v_streamer_coins,
        CASE WHEN v_is_clover THEN 1 ELSE 0 END
    )
    ON CONFLICT (streamer_id, mission_date) DO UPDATE
    SET received_gift_coins = public.streamer_daily_missions.received_gift_coins + v_streamer_coins,
        clover_leaves_unlocked = LEAST(5, public.streamer_daily_missions.clover_leaves_unlocked + CASE WHEN v_is_clover THEN 1 ELSE 0 END),
        is_completed = (
            public.streamer_daily_missions.accumulated_minutes >= 180
            AND LEAST(5, public.streamer_daily_missions.clover_leaves_unlocked + CASE WHEN v_is_clover THEN 1 ELSE 0 END) >= 5
            AND (public.streamer_daily_missions.received_gift_coins + v_streamer_coins) >= 10000
        ),
        updated_at = NOW();

    -- Comisión del 5% para Agencia (si el receptor pertenece a una agencia aprobada)
    IF v_receptor.agency_id IS NOT NULL THEN
        SELECT owner_id INTO v_agency_owner_id
        FROM public.agencies
        WHERE id = v_receptor.agency_id AND status = 'approved';
    END IF;

    IF v_agency_owner_id IS NOT NULL AND v_agency_coins > 0 THEN
        UPDATE public.wallets
        SET aura_balance = aura_balance + v_agency_coins,
            updated_at = NOW()
        WHERE user_id = v_agency_owner_id;

        INSERT INTO public.wallet_transactions (user_id, currency, amount, balance_after, type, reference_id, metadata)
        VALUES (
            v_agency_owner_id,
            'auras',
            v_agency_coins,
            COALESCE((SELECT aura_balance FROM public.wallets WHERE user_id = v_agency_owner_id), v_agency_coins),
            'agency_commission',
            p_gift_id,
            jsonb_build_object('streamer_id', p_receptor_id, 'sender_id', p_sender_id)
        );
    ELSE
        v_platform_coins := v_platform_coins + v_agency_coins;
    END IF;

    -- Comisión del 50% (o 55% sin agencia) para SuperAdmin
    SELECT id INTO v_superadmin_id FROM public.profiles WHERE is_superadmin = TRUE ORDER BY created_at ASC LIMIT 1;
    IF v_superadmin_id IS NOT NULL AND v_platform_coins > 0 THEN
        UPDATE public.wallets
        SET aura_balance = aura_balance + v_platform_coins,
            updated_at = NOW()
        WHERE user_id = v_superadmin_id;

        INSERT INTO public.wallet_transactions (user_id, currency, amount, balance_after, type, reference_id, metadata)
        VALUES (
            v_superadmin_id,
            'auras',
            v_platform_coins,
            COALESCE((SELECT aura_balance FROM public.wallets WHERE user_id = v_superadmin_id), v_platform_coins),
            'platform_fee',
            p_gift_id,
            jsonb_build_object('sender_id', p_sender_id, 'receptor_id', p_receptor_id)
        );
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'message', 'Regalo enviado exitosamente.',
        'sender_balance', v_new_sender_balance,
        'effective_price', v_effective_price,
        'receptor_auras_added', v_streamer_coins,
        'gift_id', v_gift.id,
        'gift_name', v_gift.name
    );
END;
$$;

-- ============================================================================
-- E) RPC: RECLAMO DE COFRE DIARIO (+25 MONEDAS CADA 24H) (claim_daily_checkin)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.claim_daily_checkin(p_user_id UUID DEFAULT NULL)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_uid UUID := COALESCE(p_user_id, auth.uid());
    v_wallet RECORD;
    v_reward BIGINT := 25;
    v_new_balance BIGINT;
    v_hours_diff NUMERIC;
BEGIN
    IF v_uid IS NULL THEN
        RAISE EXCEPTION 'Debes iniciar sesión para reclamar el cofre diario.';
    END IF;

    IF auth.uid() IS NOT NULL AND auth.uid() != v_uid AND NOT public.is_superadmin(auth.uid()) THEN
        RAISE EXCEPTION 'No autorizado.';
    END IF;

    SELECT * INTO v_wallet FROM public.wallets WHERE user_id = v_uid FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Billetera no encontrada.';
    END IF;

    IF v_wallet.last_daily_checkin IS NOT NULL THEN
        v_hours_diff := EXTRACT(EPOCH FROM (NOW() - v_wallet.last_daily_checkin)) / 3600.0;
        IF v_hours_diff < 24 THEN
            RAISE EXCEPTION 'Ya reclamaste tu cofre hoy. Vuelve en % horas.', CEIL(24 - v_hours_diff);
        END IF;
    END IF;

    v_new_balance := v_wallet.coin_balance + v_reward;

    UPDATE public.wallets
    SET coin_balance = v_new_balance,
        last_daily_checkin = NOW(),
        updated_at = NOW()
    WHERE user_id = v_uid;

    UPDATE public.profiles
    SET last_checkin_date = NOW()
    WHERE id = v_uid;

    INSERT INTO public.wallet_transactions (user_id, currency, amount, balance_after, type, metadata)
    VALUES (v_uid, 'coins', v_reward, v_new_balance, 'daily_checkin', '{"reward": 25}'::jsonb);

    RETURN jsonb_build_object(
        'success', true,
        'coins_awarded', v_reward,
        'new_balance', v_new_balance,
        'claimed_at', NOW()
    );
END;
$$;

-- ============================================================================
-- F) RPC: JUEGOS INTERACTIVOS DEL SERVIDOR (play_game)
-- Soporta: 'roulette', 'dice', 'slots', 'wheel'
-- ============================================================================
CREATE OR REPLACE FUNCTION public.play_game(
    p_game_type TEXT,
    p_bet_amount BIGINT,
    p_choice TEXT DEFAULT NULL,
    p_room_id TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_uid UUID := auth.uid();
    v_wallet RECORD;
    v_prize BIGINT := 0;
    v_new_balance BIGINT;
    v_outcome JSONB;
    -- Variables de Ruleta
    v_roulette_num INT;
    v_roulette_color TEXT;
    -- Variables de Dados
    v_die1 INT;
    v_die2 INT;
    v_dice_total INT;
    -- Variables de Slots
    v_symbols TEXT[] := ARRAY['7️⃣', '💎', '⭐', '🔔', '🍒', '🍋'];
    v_s1 TEXT;
    v_s2 TEXT;
    v_s3 TEXT;
    v_mult NUMERIC := 0;
    -- Variables de Wheel (Aura Casino)
    v_wheel_mults NUMERIC[] := ARRAY[0, 0.5, 1, 2, 0, 5, 0.5, 1.5];
    v_wheel_idx INT;
BEGIN
    IF v_uid IS NULL THEN
        RAISE EXCEPTION 'Debes iniciar sesión para jugar.';
    END IF;

    IF p_bet_amount IS NULL OR p_bet_amount < 10 OR p_bet_amount > 50000 THEN
        RAISE EXCEPTION 'La apuesta debe estar entre 10 y 50,000 monedas.';
    END IF;

    SELECT * INTO v_wallet FROM public.wallets WHERE user_id = v_uid FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Billetera no encontrada.';
    END IF;

    IF v_wallet.coin_balance < p_bet_amount THEN
        RAISE EXCEPTION 'Saldo insuficiente para realizar esta apuesta.';
    END IF;

    IF p_game_type = 'roulette' THEN
        v_roulette_num := floor(random() * 37)::INT;
        IF v_roulette_num = 0 THEN
            v_roulette_color := 'Verde';
        ELSIF v_roulette_num IN (1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36) THEN
            v_roulette_color := 'Rojo';
        ELSE
            v_roulette_color := 'Negro';
        END IF;

        IF p_choice = v_roulette_color THEN
            v_mult := CASE WHEN v_roulette_color = 'Verde' THEN 14 ELSE 2 END;
            v_prize := (p_bet_amount * v_mult)::BIGINT;
        END IF;

        v_outcome := jsonb_build_object(
            'number', v_roulette_num,
            'color', v_roulette_color,
            'choice', p_choice,
            'multiplier', v_mult,
            'won', (v_prize > 0)
        );

    ELSIF p_game_type = 'dice' THEN
        v_die1 := floor(random() * 6)::INT + 1;
        v_die2 := floor(random() * 6)::INT + 1;
        v_dice_total := v_die1 + v_die2;

        IF (p_choice = 'alto' AND v_dice_total > 7) OR (p_choice = 'bajo' AND v_dice_total <= 7) THEN
            v_mult := 2;
            v_prize := p_bet_amount * 2;
        END IF;

        v_outcome := jsonb_build_object(
            'dice', jsonb_build_array(v_die1, v_die2),
            'total', v_dice_total,
            'choice', p_choice,
            'multiplier', v_mult,
            'won', (v_prize > 0)
        );

    ELSIF p_game_type = 'slots' THEN
        v_s1 := v_symbols[floor(random() * 6)::INT + 1];
        v_s2 := v_symbols[floor(random() * 6)::INT + 1];
        v_s3 := v_symbols[floor(random() * 6)::INT + 1];

        IF v_s1 = v_s2 AND v_s2 = v_s3 THEN
            v_mult := CASE v_s1
                WHEN '7️⃣' THEN 100
                WHEN '💎' THEN 50
                WHEN '⭐' THEN 25
                WHEN '🔔' THEN 10
                WHEN '🍒' THEN 5
                ELSE 3
            END;
        ELSIF v_s1 = v_s2 OR v_s2 = v_s3 OR v_s1 = v_s3 THEN
            v_mult := 3;
        ELSE
            v_mult := 0;
        END IF;

        v_prize := floor(p_bet_amount * v_mult)::BIGINT;
        v_outcome := jsonb_build_object(
            'reels', jsonb_build_array(v_s1, v_s2, v_s3),
            'multiplier', v_mult,
            'won', (v_prize > 0)
        );

    ELSIF p_game_type = 'wheel' THEN
        v_wheel_idx := floor(random() * 8)::INT; -- 0..7
        v_mult := v_wheel_mults[v_wheel_idx + 1];
        v_prize := floor(p_bet_amount * v_mult)::BIGINT;

        v_outcome := jsonb_build_object(
            'segment_index', v_wheel_idx,
            'multiplier', v_mult,
            'won', (v_prize > 0)
        );

    ELSE
        RAISE EXCEPTION 'Tipo de juego no soportado: %', p_game_type;
    END IF;

    v_new_balance := v_wallet.coin_balance - p_bet_amount + v_prize;

    UPDATE public.wallets
    SET coin_balance = v_new_balance,
        updated_at = NOW()
    WHERE user_id = v_uid;

    INSERT INTO public.wallet_transactions (user_id, currency, amount, balance_after, type, reference_id, metadata)
    VALUES (
        v_uid,
        'coins',
        (v_prize - p_bet_amount),
        v_new_balance,
        'game_' || p_game_type,
        p_room_id,
        jsonb_build_object('bet', p_bet_amount, 'prize', v_prize, 'outcome', v_outcome)
    );

    RETURN jsonb_build_object(
        'success', true,
        'game_type', p_game_type,
        'bet_amount', p_bet_amount,
        'prize', v_prize,
        'net_change', (v_prize - p_bet_amount),
        'new_balance', v_new_balance,
        'outcome', v_outcome
    );
END;
$$;

-- ============================================================================
-- G) RPC: VERIFICACIÓN FACIAL BIOMÉTRICA ÚNICA (liveness_verify)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.liveness_verify(
    p_user_id UUID,
    p_face_signature_hash VARCHAR(255)
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_existing_profile RECORD;
    v_current_profile RECORD;
    v_new_balance BIGINT;
    v_coins_awarded BIGINT := 0;
BEGIN
    IF auth.uid() IS NOT NULL AND auth.uid() != p_user_id AND NOT public.is_superadmin(auth.uid()) THEN
        RAISE EXCEPTION 'No autorizado para verificar otro perfil.';
    END IF;

    SELECT * INTO v_current_profile FROM public.profiles WHERE id = p_user_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Perfil de usuario no encontrado.';
    END IF;

    -- 1. Verificar si la firma biométrica facial ya pertenece a OTRA cuenta
    SELECT id, email INTO v_existing_profile
    FROM public.profiles
    WHERE face_signature_hash = p_face_signature_hash
      AND id != p_user_id
    LIMIT 1;

    IF v_existing_profile.id IS NOT NULL THEN
        RAISE EXCEPTION 'Este rostro ya fue registrado previamente en otra cuenta (%). La política de la plataforma prohíbe múltiples cuentas con la misma identidad facial.', v_existing_profile.email;
    END IF;

    -- 2. Registrar la firma biométrica y activar la cuenta
    UPDATE public.profiles
    SET face_signature_hash = p_face_signature_hash,
        is_identity_verified = TRUE,
        status = 'verified',
        updated_at = NOW()
    WHERE id = p_user_id;

    -- 3. Otorgar recompensa de +50 monedas solo la primera vez que se verifica
    IF NOT COALESCE(v_current_profile.is_identity_verified, FALSE) THEN
        v_coins_awarded := 50;
        UPDATE public.wallets
        SET coin_balance = coin_balance + v_coins_awarded,
            updated_at = NOW()
        WHERE user_id = p_user_id
        RETURNING coin_balance INTO v_new_balance;

        INSERT INTO public.wallet_transactions (user_id, currency, amount, balance_after, type, metadata)
        VALUES (p_user_id, 'coins', v_coins_awarded, v_new_balance, 'liveness_bonus', '{"bonus": 50}'::jsonb);
    ELSE
        SELECT coin_balance INTO v_new_balance FROM public.wallets WHERE user_id = p_user_id;
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'coins_awarded', v_coins_awarded,
        'new_balance', COALESCE(v_new_balance, 0),
        'message', 'Identidad humana real verificada. Firma biométrica vinculada de forma única a tu cuenta.'
    );
END;
$$;

-- ============================================================================
-- H) RPC: CANJE DE AURAS POR MONEDAS (1 Aura = 100 Monedas) (exchange_auras_for_coins)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.exchange_auras_for_coins(p_auras_amount BIGINT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_uid UUID := auth.uid();
    v_wallet RECORD;
    v_coins_gained BIGINT;
    v_new_coins BIGINT;
    v_new_auras BIGINT;
BEGIN
    IF v_uid IS NULL THEN
        RAISE EXCEPTION 'Usuario no autenticado.';
    END IF;

    IF p_auras_amount IS NULL OR p_auras_amount <= 0 THEN
        RAISE EXCEPTION 'Ingresa una cantidad válida de Auras mayor a 0.';
    END IF;

    SELECT * INTO v_wallet FROM public.wallets WHERE user_id = v_uid FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Billetera no encontrada.';
    END IF;

    IF v_wallet.aura_balance < p_auras_amount THEN
        RAISE EXCEPTION 'Saldo insuficiente de Auras. Tienes % Auras.', v_wallet.aura_balance;
    END IF;

    v_coins_gained := p_auras_amount * 100;
    v_new_auras := v_wallet.aura_balance - p_auras_amount;
    v_new_coins := v_wallet.coin_balance + v_coins_gained;

    UPDATE public.wallets
    SET aura_balance = v_new_auras,
        coin_balance = v_new_coins,
        updated_at = NOW()
    WHERE user_id = v_uid;

    INSERT INTO public.wallet_transactions (user_id, currency, amount, balance_after, type, metadata)
    VALUES
        (v_uid, 'auras', -p_auras_amount, v_new_auras, 'aura_exchange_debit', jsonb_build_object('coins_gained', v_coins_gained)),
        (v_uid, 'coins', v_coins_gained, v_new_coins, 'aura_exchange_credit', jsonb_build_object('auras_spent', p_auras_amount));

    RETURN jsonb_build_object(
        'success', true,
        'auras_spent', p_auras_amount,
        'coins_gained', v_coins_gained,
        'new_coin_balance', v_new_coins,
        'new_aura_balance', v_new_auras
    );
END;
$$;

-- ============================================================================
-- I) RPC: RECLAMO DE META DIARIA DE PRESENTADORA ($2 USD = 2000 Auras)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.claim_streamer_daily_mission()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_uid UUID := auth.uid();
    v_mission RECORD;
    v_profile RECORD;
    v_reward_auras BIGINT := 2000;
    v_new_auras BIGINT;
BEGIN
    IF v_uid IS NULL THEN
        RAISE EXCEPTION 'Usuario no autenticado.';
    END IF;

    SELECT * INTO v_profile FROM public.profiles WHERE id = v_uid;
    IF v_profile.agency_id IS NULL AND NOT COALESCE(v_profile.is_agency, FALSE) THEN
        RAISE EXCEPTION 'Debes estar vinculada a una Agencia Oficial para reclamar el bono diario.';
    END IF;

    SELECT * INTO v_mission
    FROM public.streamer_daily_missions
    WHERE streamer_id = v_uid AND mission_date = CURRENT_DATE
    FOR UPDATE;

    IF NOT FOUND OR NOT v_mission.is_completed THEN
        RAISE EXCEPTION 'Aún no has completado las metas diarias (3h transmisión, 5 tréboles y 10k monedas).';
    END IF;

    IF v_mission.reward_claimed THEN
        RAISE EXCEPTION 'Ya has reclamado la recompensa diaria de hoy.';
    END IF;

    UPDATE public.streamer_daily_missions
    SET reward_claimed = TRUE,
        updated_at = NOW()
    WHERE id = v_mission.id;

    UPDATE public.wallets
    SET aura_balance = aura_balance + v_reward_auras,
        updated_at = NOW()
    WHERE user_id = v_uid
    RETURNING aura_balance INTO v_new_auras;

    INSERT INTO public.wallet_transactions (user_id, currency, amount, balance_after, type, reference_id, metadata)
    VALUES (
        v_uid,
        'auras',
        v_reward_auras,
        v_new_auras,
        'streamer_daily_mission_bonus',
        v_mission.id::text,
        '{"usd_equivalent": 2.00}'::jsonb
    );

    RETURN jsonb_build_object(
        'success', true,
        'reward_auras', v_reward_auras,
        'new_aura_balance', v_new_auras
    );
END;
$$;

-- ============================================================================
-- J) RPCs DE SALAS EN VIVO (create_stream_room, join_stream_room, leave_stream_room)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.create_stream_room(
    p_title TEXT,
    p_category TEXT DEFAULT 'Variedad',
    p_layout_mode TEXT DEFAULT '8_cam'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_uid UUID := auth.uid();
    v_room RECORD;
BEGIN
    IF v_uid IS NULL THEN
        RAISE EXCEPTION 'Debes iniciar sesión para abrir una sala en vivo.';
    END IF;

    -- Cerrar salas previas que hayan quedado abiertas del mismo host
    UPDATE public.stream_rooms
    SET is_active = FALSE,
        ended_at = NOW()
    WHERE host_id = v_uid AND is_active = TRUE;

    INSERT INTO public.stream_rooms (host_id, title, category, layout_mode, is_active, viewer_count)
    VALUES (
        v_uid,
        COALESCE(NULLIF(TRIM(p_title), ''), 'En Vivo en AuraLive ✨'),
        COALESCE(NULLIF(TRIM(p_category), ''), 'Variedad'),
        COALESCE(NULLIF(TRIM(p_layout_mode), ''), '8_cam'),
        TRUE,
        1
    )
    RETURNING * INTO v_room;

    RETURN jsonb_build_object(
        'success', true,
        'room', row_to_json(v_room)
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.join_stream_room(p_room_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_room RECORD;
    v_host RECORD;
BEGIN
    UPDATE public.stream_rooms
    SET viewer_count = viewer_count + 1
    WHERE id = p_room_id AND is_active = TRUE
    RETURNING * INTO v_room;

    IF NOT FOUND THEN
        SELECT * INTO v_room FROM public.stream_rooms WHERE id = p_room_id;
        IF NOT FOUND THEN
            RAISE EXCEPTION 'La sala de transmisión no existe.';
        END IF;
    END IF;

    SELECT id, full_name, username, avatar_url, gender, is_agency, is_streamer, svip_level, wealth_level, charisma_level
    INTO v_host
    FROM public.profiles
    WHERE id = v_room.host_id;

    RETURN jsonb_build_object(
        'success', true,
        'room', row_to_json(v_room),
        'host', row_to_json(v_host)
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.leave_stream_room(
    p_room_id UUID,
    p_stream_seconds INT DEFAULT 0
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_uid UUID := auth.uid();
    v_room RECORD;
    v_added_mins INT;
BEGIN
    SELECT * INTO v_room FROM public.stream_rooms WHERE id = p_room_id;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', true, 'status', 'not_found');
    END IF;

    IF v_uid IS NOT NULL AND v_room.host_id = v_uid THEN
        UPDATE public.stream_rooms
        SET is_active = FALSE,
            viewer_count = 0,
            ended_at = NOW()
        WHERE id = p_room_id;

        v_added_mins := GREATEST(0, FLOOR(COALESCE(p_stream_seconds, 0) / 60.0)::INT);
        IF v_added_mins > 0 THEN
            INSERT INTO public.streamer_daily_missions (streamer_id, mission_date, accumulated_minutes)
            VALUES (v_uid, CURRENT_DATE, v_added_mins)
            ON CONFLICT (streamer_id, mission_date) DO UPDATE
            SET accumulated_minutes = public.streamer_daily_missions.accumulated_minutes + v_added_mins,
                is_completed = (
                    (public.streamer_daily_missions.accumulated_minutes + v_added_mins) >= 180
                    AND public.streamer_daily_missions.clover_leaves_unlocked >= 5
                    AND public.streamer_daily_missions.received_gift_coins >= 10000
                ),
                updated_at = NOW();
        END IF;

        RETURN jsonb_build_object('success', true, 'status', 'closed', 'minutes_recorded', v_added_mins);
    ELSE
        UPDATE public.stream_rooms
        SET viewer_count = GREATEST(0, viewer_count - 1)
        WHERE id = p_room_id;

        RETURN jsonb_build_object('success', true, 'status', 'left');
    END IF;
END;
$$;

-- ============================================================================
-- K) RPCs DE LIKES Y COMENTARIOS (toggle_reel_like, add_reel_comment, toggle_post_like)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.toggle_reel_like(p_reel_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_uid UUID := auth.uid();
    v_liked BOOLEAN;
    v_new_count INT;
BEGIN
    IF v_uid IS NULL THEN
        RAISE EXCEPTION 'Debes iniciar sesión para dar Me Gusta.';
    END IF;

    IF EXISTS (SELECT 1 FROM public.reel_likes WHERE reel_id = p_reel_id AND user_id = v_uid) THEN
        DELETE FROM public.reel_likes WHERE reel_id = p_reel_id AND user_id = v_uid;
        UPDATE public.reels SET likes_count = GREATEST(0, likes_count - 1) WHERE id = p_reel_id RETURNING likes_count INTO v_new_count;
        v_liked := FALSE;
    ELSE
        INSERT INTO public.reel_likes (reel_id, user_id) VALUES (p_reel_id, v_uid) ON CONFLICT DO NOTHING;
        UPDATE public.reels SET likes_count = likes_count + 1 WHERE id = p_reel_id RETURNING likes_count INTO v_new_count;
        v_liked := TRUE;
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'liked', v_liked,
        'likes_count', COALESCE(v_new_count, 0)
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.add_reel_comment(p_reel_id UUID, p_content TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_uid UUID := auth.uid();
    v_comment RECORD;
    v_new_count INT;
BEGIN
    IF v_uid IS NULL THEN
        RAISE EXCEPTION 'Debes iniciar sesión para comentar.';
    END IF;

    IF p_content IS NULL OR TRIM(p_content) = '' THEN
        RAISE EXCEPTION 'El comentario no puede estar vacío.';
    END IF;

    INSERT INTO public.reel_comments (reel_id, user_id, content)
    VALUES (p_reel_id, v_uid, TRIM(p_content))
    RETURNING * INTO v_comment;

    UPDATE public.reels
    SET comments_count = comments_count + 1
    WHERE id = p_reel_id
    RETURNING comments_count INTO v_new_count;

    RETURN jsonb_build_object(
        'success', true,
        'comment', row_to_json(v_comment),
        'comments_count', COALESCE(v_new_count, 1)
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.toggle_post_like(p_post_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_uid UUID := auth.uid();
    v_liked BOOLEAN;
    v_new_count INT;
BEGIN
    IF v_uid IS NULL THEN
        RAISE EXCEPTION 'Debes iniciar sesión para dar Me Gusta.';
    END IF;

    IF EXISTS (SELECT 1 FROM public.post_likes WHERE post_id = p_post_id AND user_id = v_uid) THEN
        DELETE FROM public.post_likes WHERE post_id = p_post_id AND user_id = v_uid;
        UPDATE public.posts SET likes_count = GREATEST(0, likes_count - 1) WHERE id = p_post_id RETURNING likes_count INTO v_new_count;
        v_liked := FALSE;
    ELSE
        INSERT INTO public.post_likes (post_id, user_id) VALUES (p_post_id, v_uid) ON CONFLICT DO NOTHING;
        UPDATE public.posts SET likes_count = likes_count + 1 WHERE id = p_post_id RETURNING likes_count INTO v_new_count;
        v_liked := TRUE;
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'liked', v_liked,
        'likes_count', COALESCE(v_new_count, 0)
    );
END;
$$;

-- ============================================================================
-- L) RPC: ACREDITACIÓN ATÓMICA DE COMPRA DE MONEDAS (SOLO SERVICE_ROLE / ADMIN)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.credit_coin_purchase(
    p_user_id UUID,
    p_package_id TEXT,
    p_provider TEXT,
    p_external_tx_id TEXT,
    p_amount_usd NUMERIC DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_pkg RECORD;
    v_total_coins BIGINT;
    v_new_balance BIGINT;
    v_existing_order RECORD;
BEGIN
    -- Solo ejecutable desde service_role (Edge Functions) o SuperAdmin
    IF current_setting('request.jwt.claim.role', true) != 'service_role'
       AND NOT public.is_superadmin(auth.uid()) THEN
        RAISE EXCEPTION 'No autorizado: la acreditación de pagos requiere firma del servidor.';
    END IF;

    -- Idempotencia: si la orden ya fue procesada, devolver éxito sin duplicar monedas
    SELECT * INTO v_existing_order FROM public.payment_orders WHERE external_tx_id = p_external_tx_id;
    IF FOUND THEN
        SELECT coin_balance INTO v_new_balance FROM public.wallets WHERE user_id = p_user_id;
        RETURN jsonb_build_object(
            'success', true,
            'already_processed', true,
            'coins_credited', v_existing_order.coins_credited,
            'new_balance', COALESCE(v_new_balance, 0)
        );
    END IF;

    SELECT * INTO v_pkg FROM public.coin_packages WHERE id = p_package_id AND is_active = TRUE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Paquete de monedas inválido: %', p_package_id;
    END IF;

    v_total_coins := v_pkg.coins + v_pkg.bonus_coins;

    INSERT INTO public.payment_orders (
        user_id, package_id, provider, external_tx_id, coins_credited, amount_usd, status
    )
    VALUES (
        p_user_id, p_package_id, p_provider, p_external_tx_id, v_total_coins, COALESCE(p_amount_usd, v_pkg.usd_price), 'completed'
    );

    UPDATE public.wallets
    SET coin_balance = coin_balance + v_total_coins,
        has_recharged = TRUE,
        updated_at = NOW()
    WHERE user_id = p_user_id
    RETURNING coin_balance INTO v_new_balance;

    UPDATE public.profiles
    SET has_recharged = TRUE,
        updated_at = NOW()
    WHERE id = p_user_id;

    INSERT INTO public.wallet_transactions (user_id, currency, amount, balance_after, type, reference_id, metadata)
    VALUES (
        p_user_id,
        'coins',
        v_total_coins,
        v_new_balance,
        'coin_purchase_' || p_provider,
        p_external_tx_id,
        jsonb_build_object('package_id', p_package_id, 'usd_price', COALESCE(p_amount_usd, v_pkg.usd_price))
    );

    RETURN jsonb_build_object(
        'success', true,
        'already_processed', false,
        'coins_credited', v_total_coins,
        'new_balance', v_new_balance
    );
END;
$$;

-- ============================================================================
-- M) RPCs DE RETIROS (request_withdrawal, review_withdrawal)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.request_withdrawal(
    p_coin_amount BIGINT,
    p_payment_method TEXT,
    p_account_details JSONB,
    p_applicant_type TEXT DEFAULT 'streamer'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_uid UUID := auth.uid();
    v_wallet RECORD;
    v_usd NUMERIC(10,2);
    v_new_auras BIGINT;
    v_req RECORD;
BEGIN
    IF v_uid IS NULL THEN
        RAISE EXCEPTION 'Debes iniciar sesión para solicitar un retiro.';
    END IF;

    IF p_coin_amount IS NULL OR p_coin_amount < 10000 THEN
        RAISE EXCEPTION 'El monto mínimo de retiro es de 10,000 Auras ($10.00 USD).';
    END IF;

    SELECT * INTO v_wallet FROM public.wallets WHERE user_id = v_uid FOR UPDATE;
    IF NOT FOUND OR v_wallet.aura_balance < p_coin_amount THEN
        RAISE EXCEPTION 'Saldo insuficiente de Auras para retirar.';
    END IF;

    -- 1000 Auras = $1.00 USD
    v_usd := ROUND((p_coin_amount::NUMERIC / 1000.0), 2);
    v_new_auras := v_wallet.aura_balance - p_coin_amount;

    UPDATE public.wallets
    SET aura_balance = v_new_auras,
        updated_at = NOW()
    WHERE user_id = v_uid;

    INSERT INTO public.withdrawal_requests (
        applicant_id, applicant_type, coin_amount, usd_equivalent, payment_method, account_details, status
    )
    VALUES (
        v_uid,
        CASE WHEN p_applicant_type = 'agency' THEN 'agency' ELSE 'streamer' END,
        p_coin_amount,
        v_usd,
        p_payment_method,
        COALESCE(p_account_details, '{}'::jsonb),
        'pending'
    )
    RETURNING * INTO v_req;

    INSERT INTO public.wallet_transactions (user_id, currency, amount, balance_after, type, reference_id, metadata)
    VALUES (
        v_uid,
        'auras',
        -p_coin_amount,
        v_new_auras,
        'withdrawal_hold',
        v_req.id::text,
        jsonb_build_object('usd_equivalent', v_usd, 'payment_method', p_payment_method)
    );

    RETURN jsonb_build_object(
        'success', true,
        'withdrawal', row_to_json(v_req),
        'new_aura_balance', v_new_auras
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.review_withdrawal(
    p_withdrawal_id UUID,
    p_action TEXT,
    p_admin_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_caller UUID := auth.uid();
    v_req RECORD;
    v_new_auras BIGINT;
BEGIN
    IF current_setting('request.jwt.claim.role', true) != 'service_role'
       AND NOT public.is_superadmin(v_caller) THEN
        RAISE EXCEPTION 'Acceso denegado: se requieren privilegios de SuperAdmin.';
    END IF;

    SELECT * INTO v_req FROM public.withdrawal_requests WHERE id = p_withdrawal_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Solicitud de retiro no encontrada.';
    END IF;

    IF v_req.status != 'pending' THEN
        RAISE EXCEPTION 'Esta solicitud ya fue procesada (%).', v_req.status;
    END IF;

    IF p_action = 'approve' OR p_action = 'completed' THEN
        UPDATE public.withdrawal_requests
        SET status = 'completed',
            admin_notes = p_admin_notes,
            reviewed_by = v_caller,
            processed_at = NOW()
        WHERE id = p_withdrawal_id
        RETURNING * INTO v_req;

    ELSIF p_action = 'reject' OR p_action = 'rejected' THEN
        UPDATE public.withdrawal_requests
        SET status = 'rejected',
            admin_notes = p_admin_notes,
            reviewed_by = v_caller,
            processed_at = NOW()
        WHERE id = p_withdrawal_id
        RETURNING * INTO v_req;

        -- Reembolsar Auras retenidas al usuario
        UPDATE public.wallets
        SET aura_balance = aura_balance + v_req.coin_amount,
            updated_at = NOW()
        WHERE user_id = v_req.applicant_id
        RETURNING aura_balance INTO v_new_auras;

        INSERT INTO public.wallet_transactions (user_id, currency, amount, balance_after, type, reference_id, metadata)
        VALUES (
            v_req.applicant_id,
            'auras',
            v_req.coin_amount,
            v_new_auras,
            'withdrawal_refund',
            v_req.id::text,
            jsonb_build_object('reason', COALESCE(p_admin_notes, 'Solicitud rechazada por administración'))
        );
    ELSE
        RAISE EXCEPTION 'Acción inválida (%). Usa approve o reject.', p_action;
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'withdrawal', row_to_json(v_req)
    );
END;
$$;

-- ============================================================================
-- POLÍTICAS ROW LEVEL SECURITY (RLS ESTRICTA)
-- ============================================================================
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coin_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.followers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_visitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reel_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reel_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stream_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.streamer_daily_missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.direct_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.withdrawal_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

-- Bloquear modificaciones directas de cliente en billeteras, transacciones y órdenes de pago
REVOKE INSERT, UPDATE, DELETE ON public.wallets FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.wallet_transactions FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.payment_orders FROM anon, authenticated;

-- 1. Catálogos (Lectura pública, escritura solo SuperAdmin)
CREATE POLICY "settings_select" ON public.platform_settings FOR SELECT USING (true);
CREATE POLICY "settings_admin" ON public.platform_settings FOR ALL USING (public.is_superadmin(auth.uid()));

CREATE POLICY "packages_select" ON public.coin_packages FOR SELECT USING (true);
CREATE POLICY "packages_admin" ON public.coin_packages FOR ALL USING (public.is_superadmin(auth.uid()));

CREATE POLICY "gifts_select" ON public.gifts FOR SELECT USING (true);
CREATE POLICY "gifts_admin" ON public.gifts FOR ALL USING (public.is_superadmin(auth.uid()));

-- 2. Perfiles
CREATE POLICY "profiles_select" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "profiles_insert" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update" ON public.profiles FOR UPDATE USING (auth.uid() = id OR public.is_superadmin(auth.uid()));
CREATE POLICY "profiles_delete" ON public.profiles FOR DELETE USING (auth.uid() = id OR public.is_superadmin(auth.uid()));

-- 3. Billeteras y Ledger (SOLO LECTURA PARA EL DUEÑO O SUPERADMIN; escritura bloqueada a clientes)
CREATE POLICY "wallets_select_own" ON public.wallets
    FOR SELECT USING (auth.uid() = user_id OR public.is_superadmin(auth.uid()));

CREATE POLICY "wallet_tx_select_own" ON public.wallet_transactions
    FOR SELECT USING (auth.uid() = user_id OR public.is_superadmin(auth.uid()));

CREATE POLICY "payment_orders_select_own" ON public.payment_orders
    FOR SELECT USING (auth.uid() = user_id OR public.is_superadmin(auth.uid()));

-- 4. Agencias
CREATE POLICY "agencies_select" ON public.agencies FOR SELECT USING (true);
CREATE POLICY "agencies_insert" ON public.agencies FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "agencies_update" ON public.agencies FOR UPDATE USING (auth.uid() = owner_id OR public.is_superadmin(auth.uid()));
CREATE POLICY "agencies_delete" ON public.agencies FOR DELETE USING (auth.uid() = owner_id OR public.is_superadmin(auth.uid()));

-- 5. Seguidores y Visitantes
CREATE POLICY "followers_select" ON public.followers FOR SELECT USING (true);
CREATE POLICY "followers_insert" ON public.followers FOR INSERT WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "followers_delete" ON public.followers FOR DELETE USING (auth.uid() = follower_id);

CREATE POLICY "visitors_select" ON public.profile_visitors FOR SELECT USING (auth.uid() = profile_id OR auth.uid() = visitor_id);
CREATE POLICY "visitors_insert" ON public.profile_visitors FOR INSERT WITH CHECK (auth.uid() = visitor_id);

-- 6. Reels, Likes y Comentarios
CREATE POLICY "reels_select" ON public.reels FOR SELECT USING (true);
CREATE POLICY "reels_insert" ON public.reels FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "reels_update" ON public.reels FOR UPDATE USING (auth.uid() = user_id OR public.is_superadmin(auth.uid()));
CREATE POLICY "reels_delete" ON public.reels FOR DELETE USING (auth.uid() = user_id OR public.is_superadmin(auth.uid()));

CREATE POLICY "reel_likes_select" ON public.reel_likes FOR SELECT USING (true);
CREATE POLICY "reel_likes_insert" ON public.reel_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "reel_likes_delete" ON public.reel_likes FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "reel_comments_select" ON public.reel_comments FOR SELECT USING (true);
CREATE POLICY "reel_comments_insert" ON public.reel_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "reel_comments_delete" ON public.reel_comments FOR DELETE USING (auth.uid() = user_id OR public.is_superadmin(auth.uid()));

-- 7. Posts y Likes
CREATE POLICY "posts_select" ON public.posts FOR SELECT USING (true);
CREATE POLICY "posts_insert" ON public.posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "posts_update" ON public.posts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "posts_delete" ON public.posts FOR DELETE USING (auth.uid() = user_id OR public.is_superadmin(auth.uid()));

CREATE POLICY "post_likes_select" ON public.post_likes FOR SELECT USING (true);
CREATE POLICY "post_likes_insert" ON public.post_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "post_likes_delete" ON public.post_likes FOR DELETE USING (auth.uid() = user_id);

-- 8. Salas de Transmisión y Misiones Diarias
CREATE POLICY "rooms_select" ON public.stream_rooms FOR SELECT USING (true);
CREATE POLICY "rooms_insert" ON public.stream_rooms FOR INSERT WITH CHECK (auth.uid() = host_id);
CREATE POLICY "rooms_update" ON public.stream_rooms FOR UPDATE USING (auth.uid() = host_id OR public.is_superadmin(auth.uid()));
CREATE POLICY "rooms_delete" ON public.stream_rooms FOR DELETE USING (auth.uid() = host_id OR public.is_superadmin(auth.uid()));

CREATE POLICY "missions_select" ON public.streamer_daily_missions
    FOR SELECT USING (auth.uid() = streamer_id OR public.is_superadmin(auth.uid()));

-- 9. Mensajes de Sala y Mensajes Directos
CREATE POLICY "chat_select" ON public.chat_messages FOR SELECT USING (true);
CREATE POLICY "chat_insert" ON public.chat_messages
    FOR INSERT WITH CHECK (auth.uid() = user_id AND (sender_id IS NULL OR sender_id = auth.uid()));

CREATE POLICY "dm_select" ON public.direct_messages
    FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
CREATE POLICY "dm_insert" ON public.direct_messages
    FOR INSERT WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "dm_update" ON public.direct_messages
    FOR UPDATE USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- 10. Retiros y Soporte
CREATE POLICY "withdrawals_select" ON public.withdrawal_requests
    FOR SELECT USING (auth.uid() = applicant_id OR public.is_superadmin(auth.uid()));

CREATE POLICY "tickets_select" ON public.support_tickets
    FOR SELECT USING (auth.uid() = user_id OR public.is_superadmin(auth.uid()));
CREATE POLICY "tickets_insert" ON public.support_tickets
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "tickets_update" ON public.support_tickets
    FOR UPDATE USING (public.is_superadmin(auth.uid()));

-- ============================================================================
-- SEMILLAS DE CATÁLOGOS OFICIALES
-- ============================================================================

-- 1. Configuración global de plataforma
INSERT INTO public.platform_settings (key, value, description) VALUES
('revenue_split', '{"platform_pct": 50, "streamer_pct": 45, "agency_pct": 5}'::jsonb, 'Porcentajes de reparto de regalos'),
('daily_checkin', '{"reward_coins": 25, "cooldown_hours": 24}'::jsonb, 'Recompensa del cofre diario'),
('liveness_verification', '{"reward_coins": 50, "require_unique_face": true}'::jsonb, 'Bono por verificación facial 3D única'),
('aura_exchange', '{"coins_per_aura": 100}'::jsonb, 'Tasa de conversión de Auras a Monedas'),
('withdrawal_rules', '{"auras_per_usd": 1000, "min_auras": 10000}'::jsonb, 'Reglas de retiro a dinero real'),
('streamer_daily_mission', '{"min_minutes": 180, "min_clovers": 5, "min_gift_coins": 10000, "reward_auras": 2000}'::jsonb, 'Metas diarias de presentadoras')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- 2. Catálogo de Paquetes de Monedas ($5 – $200 USD)
INSERT INTO public.coin_packages (id, name, coins, bonus_coins, usd_price, google_play_product_id, is_popular, is_max, sort_order) VALUES
('pkg-5usd',   'Paquete Inicial',   5000,   250,   5.00,   'com.auralive.coins.5usd',   FALSE, FALSE, 1),
('pkg-10usd',  'Paquete Bronce',    10000,  1000,  10.00,  'com.auralive.coins.10usd',  FALSE, FALSE, 2),
('pkg-20usd',  'Paquete Plata',     20000,  3000,  20.00,  'com.auralive.coins.20usd',  TRUE,  FALSE, 3),
('pkg-50usd',  'Paquete Oro',       50000,  10000, 50.00,  'com.auralive.coins.50usd',  FALSE, FALSE, 4),
('pkg-100usd', 'Paquete Diamante',  100000, 25000, 100.00, 'com.auralive.coins.100usd', TRUE,  FALSE, 5),
('pkg-200usd', 'Paquete Universo',  200000, 60000, 200.00, 'com.auralive.coins.200usd', FALSE, TRUE,  6)
ON CONFLICT (id) DO UPDATE SET
    coins = EXCLUDED.coins,
    bonus_coins = EXCLUDED.bonus_coins,
    usd_price = EXCLUDED.usd_price,
    is_popular = EXCLUDED.is_popular,
    is_max = EXCLUDED.is_max,
    sort_order = EXCLUDED.sort_order;

-- 3. Catálogo de Regalos Virtuales (IDs Texto)
INSERT INTO public.gifts (id, name, category, coin_price, icon_url, lottie_animation_url, is_exclusive, sort_order) VALUES
('clover-welcome-1', 'Trébol Dorado 🍀 (1 Gratis 24h)', 'Popular', 300,    'https://cdn-icons-png.flaticon.com/512/346/346195.png',   'https://lottie.host/8c1303ed-7cfa-4ebf-801a-8ff6cc6eb2c2/2O0p2c34kK.json', FALSE, 1),
('1',                'Rosa Neón 🌹',                    'Popular', 100,    'https://cdn-icons-png.flaticon.com/512/3004/3004071.png', 'https://lottie.host/8c1303ed-7cfa-4ebf-801a-8ff6cc6eb2c2/2O0p2c34kK.json', FALSE, 2),
('2',                'Beso Cyber 💋',                   'Popular', 300,    'https://cdn-icons-png.flaticon.com/512/2850/2850550.png', 'https://lottie.host/80769d49-411a-42cd-bb43-7f72295240c5/Z5f5u9bN0S.json', FALSE, 3),
('3',                'Corona Diamante 👑',              'Lujo',    1000,   'https://cdn-icons-png.flaticon.com/512/714/714407.png',   'https://lottie.host/17e5a7b6-cc7d-417d-bebb-42df6495d4d3/7oG9Y8N4uH.json', FALSE, 4),
('4',                'Nave Espacial 🚀',                'Lujo',    5000,   'https://cdn-icons-png.flaticon.com/512/3255/3255057.png', 'https://lottie.host/98c5d14e-d98c-447b-83de-ec5c0d5926be/lI1f4Ww7N4.json', FALSE, 5),
('5',                'Dragón Legendario 🐉',            'VIP',     20000,  'https://cdn-icons-png.flaticon.com/512/5725/5725514.png', 'https://lottie.host/95d82998-1cd5-46eb-81c8-db28b9c647b0/Xz4x2hO4YI.json', TRUE,  6),
('6',                'Auto Lujo 3D 🏎️',                 'VIP',     50000,  'https://cdn-icons-png.flaticon.com/512/3204/3204918.png', 'https://lottie.host/e2d08a50-6eb6-4556-9130-1c667a4214f5/H8S3p4Z7P2.json', TRUE,  7),
('7',                'Universo Aura 🌌 ($200 USD)',     'VIP',     200000, 'https://cdn-icons-png.flaticon.com/512/3204/3204918.png', 'https://lottie.host/e2d08a50-6eb6-4556-9130-1c667a4214f5/H8S3p4Z7P2.json', TRUE,  8)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    coin_price = EXCLUDED.coin_price,
    icon_url = EXCLUDED.icon_url,
    lottie_animation_url = EXCLUDED.lottie_animation_url,
    is_exclusive = EXCLUDED.is_exclusive,
    sort_order = EXCLUDED.sort_order;

-- 4. Sincronización automática de usuarios ya existentes en auth.users (si los hubiera)
INSERT INTO public.profiles (id, email, username, full_name, avatar_url, gender, status, is_identity_verified)
SELECT
    u.id,
    COALESCE(u.email, u.raw_user_meta_data->>'email', 'user_' || LEFT(u.id::text, 8) || '@auralive.app'),
    COALESCE(
        u.raw_user_meta_data->>'username',
        split_part(COALESCE(u.email, 'usuario'), '@', 1) || '_' || LEFT(u.id::text, 4)
    ),
    COALESCE(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name', 'Usuario Aura'),
    COALESCE(u.raw_user_meta_data->>'avatar_url', u.raw_user_meta_data->>'picture', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400'),
    COALESCE(u.raw_user_meta_data->>'gender', 'female'),
    'esperando_biometria',
    FALSE
FROM auth.users u
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.wallets (user_id, coin_balance, aura_balance, clover_balance)
SELECT u.id, 1000, 0, 1
FROM auth.users u
ON CONFLICT (user_id) DO NOTHING;

-- ============================================================================
-- FIN DEL SCRIPT AURA LIVE MASTER PRODUCCIÓN v5.0
-- ============================================================================
