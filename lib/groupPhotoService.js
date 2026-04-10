import { supabase, USE_REAL_SUPABASE } from './supabase';

/**
 * Upload a local image URI as a group photo.
 *
 * Historically this uploaded to a dedicated `group-photos` bucket but that
 * bucket is not always provisioned in the Supabase project, which silently
 * broke uploads. We now write to the confirmed-working `recipe-images`
 * bucket with a `groups/{userId}/...` prefix so uploads always succeed
 * without requiring a schema migration.
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
    const fileName = `groups/${user.id}/${Date.now()}.${safeExt}`;

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
