/**
 * Terminated Sessions Service - Stub (no Supabase)
 */

export const terminatedSessionsService = {
  async saveTerminatedSession() {
    return { success: true };
  },

  async getTerminatedSession() {
    return { success: true, data: null };
  },

  async getTerminatedSessionsForGroup() {
    return { success: true, sessions: [] };
  },
};
