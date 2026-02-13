/**
 * Supabase client - uses real connection when env vars are set, else mock.
 * Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY to connect.
 */

import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';
export const USE_REAL_SUPABASE = !!(supabaseUrl && supabaseKey);

let supabase;

if (USE_REAL_SUPABASE) {
  supabase = createClient(supabaseUrl, supabaseKey,
    {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    }
  );
} else {
  // Mock - no external connection
  const MOCK_USER_ID = 'mock-user-00000000-0000-0000-0000-000000000001';
  const MOCK_USER = {
    id: MOCK_USER_ID,
    email: 'demo@happie.app',
    user_metadata: { full_name: 'Demo User' },
  };
  const MOCK_SESSION = { user: MOCK_USER, access_token: 'mock-token' };
  const emptyResult = { data: [], error: null };
  const successResult = { error: null };

  function chainBuilder(result = emptyResult) {
    const prom = Promise.resolve(result);
    return {
      select: () => chainBuilder(result),
      eq: () => chainBuilder(result), neq: () => chainBuilder(result),
      gt: () => chainBuilder(result), gte: () => chainBuilder(result),
      lt: () => chainBuilder(result), lte: () => chainBuilder(result),
      like: () => chainBuilder(result), ilike: () => chainBuilder(result),
      in: () => chainBuilder(result), is: () => chainBuilder(result),
      order: () => chainBuilder(result), limit: () => chainBuilder(result),
      single: () => Promise.resolve({ data: result.data?.[0] ?? null, error: null }),
      then: (...a) => prom.then(...a), catch: (...a) => prom.catch(...a),
    };
  }

  const mockFrom = (table) => ({
    select: (cols, opts) =>
      opts?.head ? Promise.resolve({ count: 0, error: null }) : chainBuilder(),
    insert: () => ({ select: () => chainBuilder(), single: () => Promise.resolve({ data: null, error: null }), then: (r) => r(successResult), catch: () => {} }),
    upsert: () => ({ select: () => chainBuilder(), then: (r) => r(successResult), catch: () => {} }),
    update: () => ({ eq: () => ({ then: (r) => r(successResult), catch: () => {} }) }),
    delete: () => ({ eq: () => ({ then: (r) => r(successResult), catch: () => {} }) }),
  });

  supabase = {
    from: mockFrom,
    auth: {
      getSession: () => Promise.resolve({ data: { session: MOCK_SESSION }, error: null }),
      getUser: () => Promise.resolve({ data: { user: MOCK_USER }, error: null }),
      signInWithPassword: () => Promise.resolve({ data: { user: MOCK_USER, session: MOCK_SESSION }, error: null }),
      signUp: () => Promise.resolve({ data: { user: MOCK_USER, session: MOCK_SESSION }, error: null }),
      signOut: () => Promise.resolve({ error: null }),
      resetPasswordForEmail: () => Promise.resolve({ error: null }),
      updateUser: (d) => Promise.resolve({ data: { user: { ...MOCK_USER, user_metadata: { ...MOCK_USER.user_metadata, ...d?.data } } }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    },
    channel: () => ({ on: () => ({ subscribe: (cb) => { typeof cb === 'function' && setTimeout(() => cb('SUBSCRIBED')); return { unsubscribe: () => {} }; } }) }),
    removeChannel: () => {},
    storage: { from: () => ({ upload: () => Promise.resolve({ data: { path: 'mock' }, error: null }), getPublicUrl: () => ({ data: { publicUrl: 'https://mock/avatar.png' } }) }) },
    rpc: () => Promise.resolve({ data: null, error: null }),
  };
}

export { supabase };
