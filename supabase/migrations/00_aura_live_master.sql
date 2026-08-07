-- AURA LIVE Database Schema & Security Master Migration
-- Combines base schema, direct messages, structural updates, and FAMILIES MODULE.
-- Security checks addressed: Added SET search_path = public to all SECURITY DEFINER functions.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. AGENCIES TABLE
CREATE TABLE IF NOT EXISTS public.agencies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    invite_code VARCHAR(50) UNIQUE NOT NULL,
    commission_rate NUMERIC(4,2) DEFAULT 10.00,
    status VARCHAR(50) DEFAULT 'pending', -- pending, approved, rejected
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
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
    -- NUEVOS CAMPOS (UPDATES)
    svip_level INT DEFAULT 0,
    svip_experience BIGINT DEFAULT 0,
    wealth_level INT DEFAULT 0,
    wealth_experience BIGINT DEFAULT 0,
    is_agency_account BOOLEAN DEFAULT FALSE,
    is_banned BOOLEAN DEFAULT FALSE,
    svip_maintenance_deadline TIMESTAMPTZ,
    svip_maintenance_points BIGINT DEFAULT 0,
    -- FECHAS
    last_seen TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.5 SUPPORT TICKETS TABLE
CREATE TABLE IF NOT EXISTS public.support_tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    subject VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'open', -- open, resolved, closed
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.agencies ADD CONSTRAINT fk_agency_owner FOREIGN KEY (owner_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- 3. WALLETS TABLE
CREATE TABLE IF NOT EXISTS public.wallets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    coin_balance BIGINT DEFAULT 0 CHECK (coin_balance >= 0),
    -- NUEVOS CAMPOS (UPDATES)
    aura_balance BIGINT DEFAULT 0 CHECK (aura_balance >= 0),
    clover_balance INT DEFAULT 3 CHECK (clover_balance >= 0),
    has_recharged BOOLEAN DEFAULT FALSE,
    -- FECHAS
    last_daily_checkin TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. WALLET TRANSACTIONS TABLE
CREATE TABLE IF NOT EXISTS public.wallet_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    amount BIGINT NOT NULL,
    type VARCHAR(50) NOT NULL,
    reference_id UUID,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. STREAM ROOMS TABLE
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

-- 6. STREAMER DAILY MISSIONS TABLE
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

-- 7. GIFTS TABLE
CREATE TABLE IF NOT EXISTS public.gifts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    coin_price INT NOT NULL CHECK (coin_price > 0),
    icon_url TEXT NOT NULL,
    lottie_animation_url TEXT,
    is_exclusive BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. CHAT MESSAGES TABLE
CREATE TABLE IF NOT EXISTS public.chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id UUID REFERENCES public.stream_rooms(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    recipient_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    is_censored BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. WITHDRAWAL REQUESTS TABLE
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

-- 10. DIRECT MESSAGES TABLE (De 04_direct_messages)
CREATE TABLE IF NOT EXISTS public.direct_messages (
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

-- ============================================================================
-- 11. FAMILIES MODULE (Gremios/Clubes)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.families (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    avatar_url TEXT DEFAULT 'https://images.unsplash.com/photo-1529156069898-49953eb1b5b6?w=400',
    status VARCHAR(50) DEFAULT 'pending', -- pending, approved, rejected
    member_count INT DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.family_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role VARCHAR(20) DEFAULT 'member', -- owner, admin, member
    status VARCHAR(20) DEFAULT 'pending', -- pending, accepted
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_family_member UNIQUE (family_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.family_chat (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);


-- ============================================================================
-- TRIGGERS & RPC FUNCTIONS (Añadido SET search_path = public)
-- ============================================================================

-- A) Initialize Wallet and Grant 50 Welcome Coins on Verification
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
        VALUES (NEW.id, 50, 'welcome_bonus', '{"description": "Bono de bienvenida por verificación humana real 3D"}'::jsonb);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER trigger_on_human_verified
AFTER INSERT OR UPDATE OF status ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.handle_human_verified_reward();


-- B) 50% Platform / 40% Streamer / 10% Agency Atomic Gift Split
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
        RAISE EXCEPTION 'Error: Los usuarios hombres no pueden monetizar a menos que sean una Agencia oficial.';
    END IF;

    IF v_gift.is_exclusive THEN
        IF LOWER(v_receptor.gender) != 'female' OR NOT v_receptor.is_streamer THEN
            RAISE EXCEPTION 'Error: Este regalo es exclusivo para presentadoras mujeres verificadas (female & is_streamer = true).';
        END IF;
    END IF;

    SELECT * INTO v_sender_wallet FROM public.wallets WHERE user_id = p_sender_id FOR UPDATE;
    IF NOT FOUND OR v_sender_wallet.coin_balance < v_gift.coin_price THEN
        RAISE EXCEPTION 'Saldo insuficiente de monedas para realizar el envío.';
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

    UPDATE public.wallets SET coin_balance = coin_balance - v_gift.coin_price WHERE user_id = p_sender_id;
    
    INSERT INTO public.wallets (user_id, coin_balance) VALUES (p_receptor_id, v_streamer_coins)
    ON CONFLICT (user_id) DO UPDATE SET coin_balance = public.wallets.coin_balance + v_streamer_coins;

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

    SELECT received_gift_coins INTO v_daily_coins FROM public.streamer_daily_missions WHERE streamer_id = p_receptor_id AND mission_date = CURRENT_DATE;

    v_new_clover_count := LEAST(5, (v_daily_coins / 5000)::INT);

    UPDATE public.streamer_daily_missions 
    SET clover_leaves_unlocked = v_new_clover_count, is_completed = (v_new_clover_count >= 5 AND accumulated_minutes >= 240)
    WHERE streamer_id = p_receptor_id AND mission_date = CURRENT_DATE;

    RETURN jsonb_build_object(
        'success', true,
        'message', 'Regalo enviado exitosamente.',
        'sender_balance', (v_sender_wallet.coin_balance - v_gift.coin_price),
        'clover_leaves_unlocked', v_new_clover_count
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- C) 24h Reset Daily Check-in Rewards
CREATE OR REPLACE FUNCTION public.claim_daily_checkin(p_user_id UUID)
RETURNS JSONB 
SET search_path = public
AS $$
DECLARE
    v_wallet RECORD;
    v_last_checkin TIMESTAMPTZ;
    v_reward_coins INT := 25;
BEGIN
    SELECT * INTO v_wallet FROM public.wallets WHERE user_id = p_user_id FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Billetera no encontrada.'; END IF;

    v_last_checkin := v_wallet.last_daily_checkin;
    IF v_last_checkin IS NOT NULL AND v_last_checkin >= (NOW() AT TIME ZONE 'UTC')::DATE THEN
        RAISE EXCEPTION 'Ya has reclamado tu cofre de recompensas diario hoy.';
    END IF;

    UPDATE public.wallets 
    SET coin_balance = coin_balance + v_reward_coins, last_daily_checkin = NOW() AT TIME ZONE 'UTC'
    WHERE user_id = p_user_id;

    INSERT INTO public.wallet_transactions (user_id, amount, type, metadata)
    VALUES (p_user_id, v_reward_coins, 'daily_reward', '{"description": "Cofre de fidelidad diario"}'::jsonb);

    RETURN jsonb_build_object('success', true, 'coins_awarded', v_reward_coins, 'new_balance', (v_wallet.coin_balance + v_reward_coins));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- D) Process Coin Package Refill
CREATE OR REPLACE FUNCTION public.process_refill(
    p_user_id UUID, p_coin_amount BIGINT, p_gateway VARCHAR(50), p_transaction_token TEXT
)
RETURNS JSONB 
SET search_path = public
AS $$
BEGIN
    IF p_transaction_token IS NULL OR LENGTH(p_transaction_token) < 5 THEN
        RAISE EXCEPTION 'Firma o token de transacción inválido desde la pasarela.';
    END IF;

    UPDATE public.wallets SET coin_balance = coin_balance + p_coin_amount WHERE user_id = p_user_id;

    INSERT INTO public.wallet_transactions (user_id, amount, type, metadata)
    VALUES (p_user_id, p_coin_amount, 'refill', jsonb_build_object('gateway', p_gateway, 'token', p_transaction_token));

    RETURN jsonb_build_object('success', true, 'coins_added', p_coin_amount);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- E) Complete 3D Face Biometric Liveness Verification
CREATE OR REPLACE FUNCTION public.liveness_verify(
    p_user_id UUID, p_face_signature_hash VARCHAR(255)
)
RETURNS JSONB 
SET search_path = public
AS $$
BEGIN
    IF EXISTS (SELECT 1 FROM public.profiles WHERE face_signature_hash = p_face_signature_hash AND id != p_user_id) THEN
        RAISE EXCEPTION 'Error biométrico: Esta firma facial 3D ya se encuentra registrada en otra cuenta activa.';
    END IF;

    UPDATE public.profiles SET status = 'verified', face_signature_hash = p_face_signature_hash, updated_at = NOW() WHERE id = p_user_id;
    RETURN jsonb_build_object('success', true, 'message', 'Verificación completada.');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- F) Eliminar beneficio de usuario nuevo al recargar
CREATE OR REPLACE FUNCTION public.handle_first_recharge()
RETURNS TRIGGER 
SET search_path = public
AS $$
BEGIN
    IF NEW.coin_balance > OLD.coin_balance AND OLD.has_recharged = FALSE THEN
        NEW.has_recharged := TRUE;
        NEW.clover_balance := 0; 
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER trigger_first_recharge
BEFORE UPDATE ON public.wallets
FOR EACH ROW EXECUTE FUNCTION public.handle_first_recharge();


-- G) Experiencia de Riqueza al enviar regalos
CREATE OR REPLACE FUNCTION public.add_wealth_experience(
    p_user_id UUID, p_coins_spent BIGINT
)
RETURNS JSONB 
SET search_path = public
AS $$
DECLARE
    v_current_exp BIGINT;
    v_new_level INT;
BEGIN
    UPDATE public.profiles SET wealth_experience = wealth_experience + p_coins_spent WHERE id = p_user_id
    RETURNING wealth_experience INTO v_current_exp;

    v_new_level := FLOOR(v_current_exp / 10000);

    UPDATE public.profiles SET wealth_level = v_new_level WHERE id = p_user_id;

    RETURN jsonb_build_object('success', true, 'new_wealth_level', v_new_level, 'total_experience', v_current_exp);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- H) Regla de Degradación SVIP
CREATE OR REPLACE FUNCTION public.check_svip_demotions()
RETURNS JSONB 
SET search_path = public
AS $$
DECLARE
    v_demoted_count INT := 0;
    v_threshold BIGINT := 50000;
BEGIN
    UPDATE public.profiles
    SET svip_level = GREATEST(0, svip_level - 1),
        svip_maintenance_points = 0,
        svip_maintenance_deadline = NOW() + INTERVAL '45 days'
    WHERE svip_level > 0 AND svip_maintenance_deadline < NOW() AND svip_maintenance_points < v_threshold;
    GET DIAGNOSTICS v_demoted_count = ROW_COUNT;

    UPDATE public.profiles
    SET svip_maintenance_points = 0,
        svip_maintenance_deadline = NOW() + INTERVAL '45 days'
    WHERE svip_level > 0 AND svip_maintenance_deadline < NOW() AND svip_maintenance_points >= v_threshold;

    RETURN jsonb_build_object('success', true, 'demoted_users_count', v_demoted_count, 'message', 'Revisión SVIP completada.');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- I) Trigger: User Creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, username, full_name, gender, phone_number, status)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Usuario Aura'),
    COALESCE(NEW.raw_user_meta_data->>'gender', 'female'),
    NEW.raw_user_meta_data->>'phone_number',
    'esperando_biometria'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ============================================================================
-- FAMILIES MODULE TRIGGERS (Límites 100 miembros y 3 admins)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.check_family_member_limit()
RETURNS TRIGGER 
SET search_path = public
AS $$
DECLARE
    v_member_count INT;
BEGIN
    IF NEW.status = 'accepted' THEN
        SELECT COUNT(*) INTO v_member_count 
        FROM public.family_members 
        WHERE family_id = NEW.family_id AND status = 'accepted';
        
        IF v_member_count >= 100 THEN
            RAISE EXCEPTION 'La familia ha alcanzado el límite máximo de 100 miembros.';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER trigger_check_family_limit
BEFORE INSERT OR UPDATE ON public.family_members
FOR EACH ROW EXECUTE FUNCTION public.check_family_member_limit();

CREATE OR REPLACE FUNCTION public.check_family_admin_limit()
RETURNS TRIGGER 
SET search_path = public
AS $$
DECLARE
    v_admin_count INT;
BEGIN
    IF NEW.role = 'admin' AND (TG_OP = 'INSERT' OR OLD.role != 'admin') THEN
        SELECT COUNT(*) INTO v_admin_count 
        FROM public.family_members 
        WHERE family_id = NEW.family_id AND role = 'admin' AND status = 'accepted';
        
        IF v_admin_count >= 3 THEN
            RAISE EXCEPTION 'La familia ha alcanzado el límite máximo de 3 administradores.';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER trigger_check_admin_limit
BEFORE INSERT OR UPDATE ON public.family_members
FOR EACH ROW EXECUTE FUNCTION public.check_family_admin_limit();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
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

CREATE POLICY "Public profiles viewable" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users view own wallet" ON public.wallets FOR SELECT USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_superadmin = TRUE));
CREATE POLICY "Users view own transactions" ON public.wallet_transactions FOR SELECT USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_superadmin = TRUE));

CREATE POLICY "Rooms viewable" ON public.stream_rooms FOR SELECT USING (true);
CREATE POLICY "Host manage room" ON public.stream_rooms FOR ALL USING (auth.uid() = host_id);

CREATE POLICY "Gifts viewable" ON public.gifts FOR SELECT USING (true);

CREATE POLICY "Chat viewable" ON public.chat_messages FOR SELECT USING (recipient_id IS NULL OR sender_id = auth.uid() OR recipient_id = auth.uid());
CREATE POLICY "Chat insert by sender" ON public.chat_messages FOR INSERT WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Withdrawal requests access" ON public.withdrawal_requests FOR ALL USING (auth.uid() = applicant_id OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_superadmin = TRUE));
CREATE POLICY "Agencies public viewable" ON public.agencies FOR SELECT USING (true);
CREATE POLICY "Users can create agencies" ON public.agencies FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "SuperAdmins and Owners manage agencies" ON public.agencies FOR UPDATE USING (auth.uid() = owner_id OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_superadmin = TRUE));

CREATE POLICY "Users insert own messages" ON public.direct_messages FOR INSERT WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "Users read own messages" ON public.direct_messages FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
CREATE POLICY "Users update own messages" ON public.direct_messages FOR UPDATE USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- Families RLS
CREATE POLICY "Families are viewable by everyone" ON public.families FOR SELECT USING (true);
CREATE POLICY "SuperAdmins can update family status" ON public.families FOR UPDATE USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_superadmin = TRUE) OR auth.uid() = owner_id);

CREATE POLICY "Family members viewable" ON public.family_members FOR SELECT USING (true);
CREATE POLICY "Admins manage members" ON public.family_members FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.family_members fm 
        WHERE fm.family_id = family_id AND fm.user_id = auth.uid() AND fm.role IN ('owner', 'admin') AND fm.status = 'accepted'
    )
    OR auth.uid() = user_id
);

CREATE POLICY "Family chat viewable by accepted members" ON public.family_chat FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.family_members fm 
        WHERE fm.family_id = family_id AND fm.user_id = auth.uid() AND fm.status = 'accepted'
    )
);
CREATE POLICY "Family chat insert by accepted members" ON public.family_chat FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.family_members fm 
        WHERE fm.family_id = family_id AND fm.user_id = auth.uid() AND fm.status = 'accepted'
    )
);

-- ============================================================================
-- SEED DEFAULT GIFTS
-- ============================================================================
INSERT INTO public.gifts (name, coin_price, icon_url, is_exclusive) VALUES
('Rosa Neón 🌹', 10, 'https://cdn-icons-png.flaticon.com/512/744/744546.png', false),
('Anillo Cuántico 💍', 100, 'https://cdn-icons-png.flaticon.com/512/3081/3081840.png', false),
('Auto Cyberpunk 🏎️', 1000, 'https://cdn-icons-png.flaticon.com/512/3202/3202003.png', false),
('Clover Dorado 🍀', 5000, 'https://cdn-icons-png.flaticon.com/512/2917/2917991.png', true),
('Castillo VIP 🏰', 25000, 'https://cdn-icons-png.flaticon.com/512/2859/2859706.png', true)
ON CONFLICT DO NOTHING;
