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
 *
 * Important: chat apps like WhatsApp render the FIRST url as a rich
 * link preview and often visually collapse the rest of the text around
 * it. So we put the App Store url FIRST — that page always works for
 * recipients who don't have the app yet — and we lead with the
 * groepscode as plain bold-ish text so it can't be swallowed by the
 * preview card. The universal link (studentenhappie.nl/join/{code})
 * goes at the end as an "open directly" shortcut for recipients who
 * already have the app installed; iOS AASA will hand it off to the app
 * before the browser even sees the 404.
 */
export const buildInviteMessage = (code) => {
  return (
    `Je bent uitgenodigd voor een groep op Happie!\n\n` +
    `Groepscode: ${code}\n\n` +
    `Download de app hier:\n` +
    `https://apps.apple.com/app/happie/id6757129676\n\n` +
    `Open de app, tik op "Groep Joinen" en vul de code in.\n\n` +
    `Heb je de app al? Open dan direct:\n` +
    `https://studentenhappie.nl/join/${code}`
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
