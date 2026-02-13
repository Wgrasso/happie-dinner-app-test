/**
 * Dutch date and time formatting utilities
 */

/**
 * Format date in Dutch long format
 * @param {Date|string} date - Date to format
 * @returns {string} - Formatted date string
 */
export const formatDateLongNL = (date) => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('nl-NL', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(dateObj);
};

/**
 * Format date in Dutch short format
 * @param {Date|string} date - Date to format
 * @returns {string} - Formatted date string
 */
export const formatDateShortNL = (date) => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('nl-NL', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  }).format(dateObj);
};

/**
 * Format time in 24-hour format
 * @param {Date|string} date - Date with time to format
 * @returns {string} - Formatted time string (HH:mm)
 */
export const formatTime24h = (date) => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('nl-NL', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).format(dateObj);
};

/**
 * Format date and time together
 * @param {Date|string} date - Date to format
 * @returns {string} - Formatted date and time string
 */
export const formatDateTimeNL = (date) => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('nl-NL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).format(dateObj);
};

/**
 * Get Dutch ordinal suffix for a number
 * @param {number} n - Number to get ordinal for
 * @returns {string} - Number with Dutch ordinal suffix (e.g., "1e", "2e", "3e", "4e")
 */
export const getDutchOrdinal = (n) => {
  return `${n}e`;
};
