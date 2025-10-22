-- Migration: add favorites table and policies
-- Run this in Supabase SQL editor or apply via Supabase CLI migrations

BEGIN;

-- Create favorites table
CREATE TABLE IF NOT EXISTS public.favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  brand_id integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Unique constraint to avoid duplicate favorites
ALTER TABLE IF EXISTS public.favorites
  ADD CONSTRAINT IF NOT EXISTS favorites_user_brand_key UNIQUE (user_id, brand_id);

-- Foreign keys
ALTER TABLE IF EXISTS public.favorites
  ADD CONSTRAINT IF NOT EXISTS favorites_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE IF EXISTS public.favorites
  ADD CONSTRAINT IF NOT EXISTS favorites_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES public.brands(id) ON DELETE CASCADE;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON public.favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_brand_id ON public.favorites(brand_id);

-- Realtime publication (optional) so realtime will include favorites
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE schemaname = 'public' AND tablename = 'favorites' AND pubname = 'supabase_realtime'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE ONLY public.favorites;
  END IF;
EXCEPTION WHEN undefined_table THEN
  -- ignore if publication or table doesn't exist
  RAISE NOTICE 'Publication or table not present, skipping publication add';
END$$;

-- RLS: enable and policies
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS favorites_insert_owner_only ON public.favorites
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS favorites_delete_owner_only ON public.favorites
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS favorites_select_public ON public.favorites
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Grants similar to other tables
GRANT ALL ON TABLE public.favorites TO anon;
GRANT ALL ON TABLE public.favorites TO authenticated;
GRANT ALL ON TABLE public.favorites TO service_role;

COMMIT;
