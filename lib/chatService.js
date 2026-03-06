import { supabase } from './supabase';

const getTodayStart = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
};

export const getGroupMessages = async (groupId) => {
  try {
    const todayStart = getTodayStart();
    const { data, error } = await supabase
      .from('group_messages')
      .select('id, user_id, message, created_at')
      .eq('group_id', groupId)
      .gte('created_at', todayStart)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return { success: true, messages: data || [] };
  } catch (e) {
    return { success: false, messages: [], error: e.message };
  }
};

export const sendGroupMessage = async (groupId, message) => {
  try {
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) return { success: false, error: 'Not authenticated' };

    const trimmed = message.trim();
    if (!trimmed || trimmed.length > 500) return { success: false, error: 'Invalid message' };

    const { data, error } = await supabase
      .from('group_messages')
      .insert({ group_id: groupId, user_id: user.id, message: trimmed })
      .select('id, user_id, message, created_at')
      .single();

    if (error) throw error;
    return { success: true, message: data };
  } catch (e) {
    return { success: false, error: e.message };
  }
};

export const cleanupOldMessages = async () => {
  try {
    await supabase.rpc('cleanup_old_group_messages');
    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
};

export const subscribeToGroupMessages = (groupId, onNewMessage) => {
  const todayStart = getTodayStart();
  const channel = supabase
    .channel(`group-chat-${groupId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'group_messages',
        filter: `group_id=eq.${groupId}`,
      },
      (payload) => {
        if (payload.new && payload.new.created_at >= todayStart) {
          onNewMessage(payload.new);
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};
