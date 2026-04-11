import { supabase, USE_REAL_SUPABASE } from './supabase';

/**
 * Upload a local image URI as a group photo.
 *
 * Writes to the `recipe-images` bucket because the storage RLS policy on
 * that bucket only allows inserts when the FIRST path segment equals
 * auth.uid()::text. So the layout is:
 *     {userId}/groups/{timestamp}.{ext}
 * Previous versions used `groups/{userId}/...` which silently failed the
 * RLS check and left users with no group photo.
 *
 * The upload path falls back to two strategies because React Native's
 * Blob → ArrayBuffer path is flaky on some Hermes / new-architecture
 * combinations:
 *   1. Primary: fetch().arrayBuffer() — modern and simple.
 *   2. Fallback: FileReader().readAsArrayBuffer(blob) — classic path.
 */
export const uploadGroupPhoto = async (uri) => {
  if (!USE_REAL_SUPABASE) {
    return { success: false, error: 'Demo mode – uploads disabled' };
  }

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Not authenticated' };

    const fileExt = (uri.split('.').pop() || 'jpg').toLowerCase().split('?')[0];
    const safeExt = /^(jpg|jpeg|png|webp|heic|heif)$/.test(fileExt) ? fileExt : 'jpg';
    // First segment MUST be the user id — the recipe-images bucket RLS
    // policy checks `foldername(name)[1] = auth.uid()::text`.
    const fileName = `${user.id}/groups/${Date.now()}.${safeExt}`;

    // Read the local file into an ArrayBuffer.
    const response = await fetch(uri);
    let arrayBuffer;
    try {
      arrayBuffer = await response.arrayBuffer();
    } catch {
      // Older RN / Hermes variants: fall back to FileReader on the Blob.
      const blob = await response.blob();
      arrayBuffer = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsArrayBuffer(blob);
      });
    }

    if (!arrayBuffer || arrayBuffer.byteLength === 0) {
      return { success: false, error: 'Image file is empty' };
    }

    const { error: uploadError } = await supabase.storage
      .from('recipe-images')
      .upload(fileName, arrayBuffer, {
        contentType: `image/${safeExt === 'jpg' ? 'jpeg' : safeExt}`,
        upsert: false,
        cacheControl: '31536000',
      });

    if (uploadError) {
      console.error('Group photo upload error:', uploadError);
      return { success: false, error: uploadError.message };
    }

    const { data: urlData } = supabase.storage
      .from('recipe-images')
      .getPublicUrl(fileName);

    const publicUrl = urlData?.publicUrl;
    if (!publicUrl) {
      return { success: false, error: 'Could not retrieve public URL' };
    }
    return { success: true, url: publicUrl };
  } catch (e) {
    console.error('Group photo upload exception:', e);
    return { success: false, error: e?.message || 'Upload failed' };
  }
};

export const updateGroupPhoto = async (groupId, photoUrl) => {
  try {
    const { error } = await supabase
      .from('groups')
      .update({ photo_url: photoUrl })
      .eq('id', groupId);

    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (e) {
    return { success: false, error: e?.message || 'Update failed' };
  }
};
