/**
 * Profile Service - User profile (profiles table)
 */

import { supabase } from './supabase';
import { USE_REAL_SUPABASE } from './supabase';

const MOCK_PROFILE = {
  id: 'mock-user',
  email: 'demo@happie.app',
  full_name: 'Demo User',
  display_name: 'Demo User',
  language: 'nl',
};

export const createOrUpdateProfile = async (fullName, displayName = null, language = 'nl') => {
  if (!USE_REAL_SUPABASE) return { success: true, profile: MOCK_PROFILE, message: 'Profile updated' };

  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) return { success: false, error: 'You must be signed in to update your profile' };

    const profileData = {
      id: user.id,
      email: user.email,
      full_name: fullName,
      display_name: displayName || fullName,
      language: language || 'nl',
    };

    const { data, error } = await supabase.from('profiles').upsert(profileData).select();
    if (error) throw error;
    return { success: true, profile: data?.[0], message: 'Profile updated successfully!' };
  } catch (error) {
    return { success: false, error: error.message || 'Failed to save profile' };
  }
};

export const getCurrentUserProfile = async () => {
  if (!USE_REAL_SUPABASE) return { success: true, profile: MOCK_PROFILE };

  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) return { success: false, error: 'You must be signed in to view your profile' };

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (error) throw error;
    if (!profile) {
      const createResult = await createOrUpdateProfile(
        user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
        null,
        'nl'
      );
      return createResult.success ? { success: true, profile: createResult.profile } : createResult;
    }
    if (!profile.full_name && user.user_metadata?.full_name) {
      const updateResult = await createOrUpdateProfile(
        user.user_metadata.full_name,
        user.user_metadata.full_name,
        profile.language || 'nl'
      );
      if (updateResult.success) return { success: true, profile: updateResult.profile };
    }
    return { success: true, profile };
  } catch (error) {
    return { success: false, error: error.message || 'Failed to load profile' };
  }
};

export const getUserProfile = async (userId) => {
  if (!USE_REAL_SUPABASE) return { success: true, profile: MOCK_PROFILE };

  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('id, full_name, display_name, created_at')
      .eq('id', userId)
      .maybeSingle();
    if (error) throw error;
    return { success: true, profile: profile || MOCK_PROFILE };
  } catch (error) {
    return { success: false, error: error.message || 'Failed to load profile' };
  }
};

export const updateUserLanguage = async (language) => {
  if (!USE_REAL_SUPABASE) return { success: true, language };

  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) return { success: false, error: 'You must be signed in' };

    const { error } = await supabase.from('profiles').update({ language }).eq('id', user.id);
    if (error) throw error;
    return { success: true, language };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const ensureUserProfile = async () => {
  const result = await getCurrentUserProfile();
  return result;
};
