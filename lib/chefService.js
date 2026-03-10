/**
 * Chef Service
 * Fetch chef profiles from Supabase
 */

import { supabase, USE_REAL_SUPABASE } from './supabase';

export const getAllChefs = async () => {
  if (!USE_REAL_SUPABASE) return { success: true, chefs: [] };
  try {
    const { data, error } = await supabase
      .from('chef_profiles')
      .select('*')
      .order('name', { ascending: true });
    if (error) return { success: false, error: error.message, chefs: [] };
    return { success: true, chefs: data || [] };
  } catch (e) {
    return { success: false, chefs: [], error: e?.message };
  }
};

export const getChefById = async (chefId) => {
  if (!USE_REAL_SUPABASE) return { success: false, chef: null };
  try {
    const { data, error } = await supabase
      .from('chef_profiles')
      .select('*')
      .eq('id', chefId)
      .maybeSingle();
    if (error) return { success: false, error: error.message, chef: null };
    return { success: true, chef: data };
  } catch (e) {
    return { success: false, chef: null, error: e?.message };
  }
};

export const getChefByTag = async (tag) => {
  if (!USE_REAL_SUPABASE) return { success: false, chef: null };
  try {
    const { data, error } = await supabase
      .from('chef_profiles')
      .select('*')
      .eq('tag', tag)
      .maybeSingle();
    if (error) return { success: false, error: error.message, chef: null };
    return { success: true, chef: data };
  } catch (e) {
    return { success: false, chef: null, error: e?.message };
  }
};
