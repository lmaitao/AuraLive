-- ============================================================================
-- AURA LIVE — FUNCION RPC Y POLITICA RLS PARA ELIMINACION DEFINITIVA DE CUENTA
-- Ejecutar en: Supabase Dashboard > SQL Editor
-- ============================================================================

-- 1. Habilitar políticas RLS para permitir eliminación de propios registros
DROP POLICY IF EXISTS "Users can delete own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can delete own wallet" ON public.wallets;

CREATE POLICY "Users can delete own profile" ON public.profiles FOR DELETE USING (auth.uid() = id);
CREATE POLICY "Users can delete own wallet" ON public.wallets FOR DELETE USING (auth.uid() = user_id);

-- 2. Función RPC para eliminación completa e irreversible en cascada
CREATE OR REPLACE FUNCTION public.delete_user_account(p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Limpieza total e irrevocable de todos los módulos y contenido
    DELETE FROM public.daily_checkins WHERE user_id = p_user_id;
    DELETE FROM public.withdrawal_requests WHERE user_id = p_user_id;
    DELETE FROM public.direct_messages WHERE sender_id = p_user_id OR receiver_id = p_user_id;
    DELETE FROM public.room_messages WHERE user_id = p_user_id;
    DELETE FROM public.followers WHERE follower_id = p_user_id OR following_id = p_user_id;
    DELETE FROM public.reels WHERE user_id = p_user_id;
    DELETE FROM public.posts WHERE user_id = p_user_id;
    DELETE FROM public.streamer_daily_missions WHERE user_id = p_user_id;
    DELETE FROM public.support_tickets WHERE user_id = p_user_id;
    DELETE FROM public.agencies WHERE owner_id = p_user_id;
    DELETE FROM public.wallets WHERE user_id = p_user_id;
    
    -- Eliminación de la fila principal en profiles (incluyendo photo_gallery)
    DELETE FROM public.profiles WHERE id = p_user_id;
    
    -- Eliminación del usuario en la tabla de autenticación de Supabase
    DELETE FROM auth.users WHERE id = p_user_id;
END;
$$;
