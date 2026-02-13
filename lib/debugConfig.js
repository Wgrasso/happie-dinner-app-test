/**
 * Debug Configuration
 * Controls logging throughout the app
 * Only logs in development mode by default
 */

// Check if we're in development mode
// __DEV__ is provided by React Native
const isDev = typeof __DEV__ !== 'undefined' ? __DEV__ : process.env.NODE_ENV === 'development';

// Configuration object
export const DEBUG_CONFIG = {
  // Master switch - set to false to disable all debug logging
  ENABLED: false,  // Disabled by default to reduce console noise
  
  // Category-specific logging (all respect ENABLED flag)
  SERVICES: false,     // Service layer logs (groupsService, mealRequestService, etc.)
  COMPONENTS: false,   // Component logs (screens, UI elements)
  CACHE: false,        // Cache operations
  AUTH: false,         // Authentication logs
  DATABASE: false,     // Database query logs
  NAVIGATION: false,   // Navigation logs
  VOTING: false,       // Voting-specific logs
  PRELOAD: false,      // Preloading logs
  
  // Performance logging
  PERFORMANCE: false,  // Performance timing logs
  
  // Error logging (always enabled regardless of ENABLED flag)
  ERRORS: true,
};

/**
 * Debug log wrapper - only logs in development mode
 * @param {string} category - Log category (e.g., 'SERVICE', 'COMPONENT')
 * @param {string} message - Log message
 * @param  {...any} args - Additional arguments to log
 */
export const debugLog = (category, message, ...args) => {
  if (!DEBUG_CONFIG.ENABLED) return;
  
  // Check category-specific flag
  const categoryKey = category.toUpperCase();
  if (DEBUG_CONFIG[categoryKey] === false) return;
  
  // Format: [CATEGORY] message
  console.log(`[${categoryKey}] ${message}`, ...args);
};

/**
 * Debug warning wrapper
 * @param {string} category - Log category
 * @param {string} message - Warning message
 * @param  {...any} args - Additional arguments
 */
export const debugWarn = (category, message, ...args) => {
  if (!DEBUG_CONFIG.ENABLED) return;
  
  const categoryKey = category.toUpperCase();
  if (DEBUG_CONFIG[categoryKey] === false) return;
  
  console.warn(`[${categoryKey}] ${message}`, ...args);
};

/**
 * Error log wrapper - always logs errors
 * @param {string} category - Log category
 * @param {string} message - Error message
 * @param  {...any} args - Additional arguments
 */
export const debugError = (category, message, ...args) => {
  // Errors always log regardless of ENABLED flag
  const categoryKey = category.toUpperCase();
  console.error(`[${categoryKey}] ${message}`, ...args);
};

/**
 * Performance timing utility
 * @param {string} label - Timer label
 * @returns {function} - Function to call when operation is complete
 */
export const startTimer = (label) => {
  if (!DEBUG_CONFIG.ENABLED || !DEBUG_CONFIG.PERFORMANCE) {
    return () => {}; // No-op if disabled
  }
  
  const start = Date.now();
  return () => {
    const duration = Date.now() - start;
    console.log(`[PERF] ${label}: ${duration}ms`);
  };
};

/**
 * Shorthand logging functions for common categories
 */
export const log = {
  service: (msg, ...args) => debugLog('SERVICES', msg, ...args),
  component: (msg, ...args) => debugLog('COMPONENTS', msg, ...args),
  cache: (msg, ...args) => debugLog('CACHE', msg, ...args),
  auth: (msg, ...args) => debugLog('AUTH', msg, ...args),
  db: (msg, ...args) => debugLog('DATABASE', msg, ...args),
  nav: (msg, ...args) => debugLog('NAVIGATION', msg, ...args),
  voting: (msg, ...args) => debugLog('VOTING', msg, ...args),
  preload: (msg, ...args) => debugLog('PRELOAD', msg, ...args),
  occasions: (msg, ...args) => debugLog('COMPONENTS', msg, ...args),
  groups: (msg, ...args) => debugLog('SERVICES', msg, ...args),
  meals: (msg, ...args) => debugLog('SERVICES', msg, ...args),
  dinner: (msg, ...args) => debugLog('SERVICES', msg, ...args),
  ui: (msg, ...args) => debugLog('COMPONENTS', msg, ...args),
  error: (msg, ...args) => debugError('ERRORS', msg, ...args),
  warn: (category, msg, ...args) => debugWarn(category, msg, ...args),
  perf: startTimer,
};

export default {
  DEBUG_CONFIG,
  debugLog,
  debugWarn,
  debugError,
  startTimer,
  log,
};
