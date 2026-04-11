/**
 * Group invite share — single source of truth for the copy that lands in
 * the user's share sheet when they invite friends to a group.
 *
 * Centralised so the three entry points (card quick-share, group page
 * "Groepsleden uitnodigen" button, right after creating a new group)
 * stay in sync and we can add variants/translations here later.
 */

import { Share, Platform } from 'react-native';
import * as Clipboard from 'expo-clipboard';

/**
 * Build the invite message body for a given join code.
 * Keep the ASCII banner + link layout because it renders well in both
 * SMS/WhatsApp bubbles and email clients.
 */
export const buildInviteMessage = (code) => {
  return (
    `═══════════════════\n` +
    `  HAPPIE GROEP JOINEN\n` +
    `═══════════════════\n\n` +
    `Je bent uitgenodigd! Open deze link:\n` +
    `https://studentenhappie.nl/join/${code}\n\n` +
    `Of download de app en vul de code in:\n\n` +
    `🔑 Code: ${code}\n\n` +
    `📲 https://apps.apple.com/app/happie/id6757129676\n\n` +
    `═══════════════════`
  );
};

/**
 * Copy the full invite message to the clipboard AND (on native) open
 * the native share sheet with that same message. Callers don't need to
 * know which platform they're on.
 *
 * Web tries `navigator.share` (mobile browsers) and falls back to just
 * the clipboard copy, which is the sanest behaviour for desktop where
 * there's no share sheet anyway. Either way the user always walks away
 * with the full invite text in their clipboard, not just the 6-char
 * join code — so pasting into WhatsApp/SMS actually delivers something
 * useful.
 *
 * @param {string} code - group join code
 * @param {{ onCopied?: () => void }} [opts]
 * @returns {Promise<void>}
 */
export const openGroupShareSheet = async (code, opts = {}) => {
  if (!code) return;
  const message = buildInviteMessage(code);

  // Always copy the complete message so the user has something
  // paste-able even when the share sheet can't be shown.
  try {
    await Clipboard.setStringAsync(message);
  } catch (_) {}
  if (typeof opts.onCopied === 'function') {
    try { opts.onCopied(); } catch (_) {}
  }

  if (Platform.OS === 'web') {
    // Desktop browsers: navigator.share exists on mobile Chrome/Safari
    // and on Edge. Try it, fall through silently if unavailable.
    try {
      if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
        await navigator.share({ text: message });
      }
    } catch (_) {
      // AbortError (user cancelled) or NotAllowed on desktop — ignore.
    }
    return;
  }

  // iOS / Android — the real native share sheet.
  try {
    await Share.share({ message });
  } catch (_) {
    // Dismissed or unavailable — clipboard already has the text.
  }
};
