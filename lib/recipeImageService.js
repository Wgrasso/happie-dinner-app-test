/**
 * Recipe Image Service
 * Upload recipe photos to Supabase Storage (recipe-images bucket).
 * Returns a public URL that is stored in user_recipes.image (TEXT).
 */

import { supabase, USE_REAL_SUPABASE } from './supabase';

/**
 * Upload a local image URI to Supabase Storage.
 * Files are stored under {userId}/{timestamp}.{ext} so each user's images
 * are isolated and RLS policies can enforce ownership.
 *
 * @param {string} uri  – local file URI from expo-image-picker
 * @returns {Promise<{ success: boolean, url?: string, error?: string }>}
 */
export const uploadRecipeImage = async (uri) => {
  if (!USE_REAL_SUPABASE) {
    return { success: false, error: 'Demo mode – uploads disabled' };
  }

  try {
    // 1. Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Not authenticated' };

    // 2. Derive file name
    const fileExt = uri.split('.').pop()?.toLowerCase() || 'jpg';
    const fileName = `${user.id}/${Date.now()}.${fileExt}`;

    // 3. Read file into ArrayBuffer (same proven pattern as avatar upload)
    const response = await fetch(uri);
    const blob = await response.blob();
    const arrayBuffer = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsArrayBuffer(blob);
    });

    // 4. Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('recipe-images')
      .upload(fileName, arrayBuffer, {
        contentType: `image/${fileExt === 'jpg' ? 'jpeg' : fileExt}`,
        upsert: false,
        cacheControl: '31536000', // 1 year – recipe images rarely change
      });

    if (uploadError) {
      console.error('Recipe image upload error:', uploadError);
      return { success: false, error: uploadError.message };
    }

    // 5. Get the public URL
    const { data: urlData } = supabase.storage
      .from('recipe-images')
      .getPublicUrl(fileName);

    const publicUrl = urlData?.publicUrl;
    if (!publicUrl) {
      return { success: false, error: 'Could not retrieve public URL' };
    }

    return { success: true, url: publicUrl };
  } catch (e) {
    console.error('Recipe image upload exception:', e);
    return { success: false, error: e?.message || 'Upload failed' };
  }
};
