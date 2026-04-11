/**
 * Group invite share — single source of truth for the copy that lands in
 * the user's share sheet when they invite friends to a group.
 *
 * Centralised so the three entry points (card quick-share, group page
 * "Groepsleden uitnodigen" button, right after creating a new group)
 * stay in sync and we can add variants/translations here later.
 */

import { Share } from 'react-native';
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
 * Copy the join code to the clipboard and open the native share sheet.
 * Safe to call anywhere; all errors are swallowed because the share
 * sheet can be dismissed without failure.
 *
 * @param {string} code - group join code
 * @param {{ onCopied?: () => void }} [opts]
 * @returns {Promise<void>}
 */
export const openGroupShareSheet = async (code, opts = {}) => {
  if (!code) return;
  try {
    await Clipboard.setStringAsync(code);
  } catch (_) {}
  if (typeof opts.onCopied === 'function') {
    try { opts.onCopied(); } catch (_) {}
  }
  try {
    await Share.share({ message: buildInviteMessage(code) });
  } catch (_) {
    // User dismissed or platform doesn't support Share.share — clipboard
    // already has the code so nothing is lost.
  }
};
