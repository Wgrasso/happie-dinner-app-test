/**
 * Midnight Reset Service - Stub (no Supabase)
 */

export const checkAndPerformMidnightReset = async () => ({ performed: false });

export const forceMidnightReset = async () => ({ success: true });

export const midnightResetService = {
  checkAndPerformMidnightReset: checkAndPerformMidnightReset,
  forceMidnightReset: forceMidnightReset,
};
