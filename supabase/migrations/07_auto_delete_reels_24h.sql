-- Migración 07: Expiración y Limpieza Automática de Reels de 24 horas
-- Todos los usuarios pueden subir 1 reel de 30 segundos cada 24 horas, dar likes y comentar.

-- 1. Función RPC para purgar registros de reels con más de 24 horas de antigüedad
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

-- 2. Asegurar que las consultas mantengan el filtro estricto de 24h
COMMENT ON FUNCTION public.cleanup_expired_reels_24h IS 'Elimina automáticamente de la BD todos los reels publicados hace más de 24 horas';
