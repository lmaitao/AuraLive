-- Migración 08: Bucket de Almacenamiento Público de Reels en Supabase Storage
-- Permite que los videos publicados se alojen en la nube públicamente para todos los usuarios durante 24h.

INSERT INTO storage.buckets (id, name, public)
VALUES ('reels', 'reels', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Permitir a usuarios autenticados subir videos al bucket 'reels'
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE policyname = 'Permitir subir reels a usuarios autenticados'
    ) THEN
        CREATE POLICY "Permitir subir reels a usuarios autenticados"
        ON storage.objects FOR INSERT
        TO authenticated
        WITH CHECK (bucket_id = 'reels');
    END IF;
END $$;

-- Permitir lectura pública de los videos de reels
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE policyname = 'Permitir lectura pública de reels'
    ) THEN
        CREATE POLICY "Permitir lectura pública de reels"
        ON storage.objects FOR SELECT
        TO public
        USING (bucket_id = 'reels');
    END IF;
END $$;
