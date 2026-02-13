-- Recipe Images Storage Bucket
-- Creates a public Supabase Storage bucket for user-uploaded recipe photos.
-- Run in Supabase SQL Editor (Dashboard > SQL Editor).
-- 
-- The user_recipes.image column (TEXT) continues to store URLs — now pointing
-- to this bucket instead of external URLs pasted by the user.

-- =============================================================================
-- 1. CREATE THE BUCKET
-- =============================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('recipe-images', 'recipe-images', true)
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- 2. STORAGE POLICIES
-- =============================================================================

-- Anyone can view recipe images (public bucket)
CREATE POLICY "Recipe images are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'recipe-images');

-- Authenticated users can upload images into their own folder ({user_id}/*)
CREATE POLICY "Users can upload own recipe images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'recipe-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Authenticated users can update (overwrite) their own images
CREATE POLICY "Users can update own recipe images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'recipe-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Authenticated users can delete their own images
CREATE POLICY "Users can delete own recipe images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'recipe-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
