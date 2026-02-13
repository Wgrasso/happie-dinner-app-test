/**
 * Conflict Resolution Service - Stub (no Supabase)
 */

class ConflictResolutionService {
  async resolveGroupConflicts() {
    return { success: true, hasConflicts: false, conflicts: [], requiresCleanup: false };
  }

  async cleanupGroupConflicts() {
    return { success: true, message: 'Cleanup complete' };
  }

  async forceCleanupGroup() {
    return { success: true, message: 'Force cleanup complete' };
  }
}

export const conflictResolution = new ConflictResolutionService();
export const resolveGroupConflicts = (groupId) => conflictResolution.resolveGroupConflicts(groupId);
export const cleanupGroupConflicts = (groupId) => conflictResolution.cleanupGroupConflicts(groupId);
export const forceCleanupGroup = (groupId) => conflictResolution.forceCleanupGroup(groupId);
