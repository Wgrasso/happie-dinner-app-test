/**
 * Database Setup - Stub (no Supabase)
 */

export const setupMealRequestTables = async () => ({
  success: true,
  message: 'Database tables are set up and ready',
  needsSetup: false,
});

export const testDatabaseConnection = async () => ({
  success: true,
  user: { id: 'mock-user', email: 'demo@happie.app' },
  message: 'Database connection is working',
});
