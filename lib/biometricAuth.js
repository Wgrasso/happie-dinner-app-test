/**
 * Biometric login helper.
 *
 * Stores the user's refresh token in the OS Keychain (via
 * expo-secure-store) after any successful sign-in, then on a later
 * app launch prompts Face ID / Touch ID and restores the Supabase
 * session without the user having to type anything.
 *
 * The token lives in the secure enclave — it's not accessible to the
 * JS runtime until the biometric prompt succeeds, so a stolen device
 * without Face ID enrollment can't extract it.
 */

import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { supabase } from './supabase';

const REFRESH_KEY = 'happie_biometric_refresh_token';
const EMAIL_KEY = 'happie_biometric_email';

/**
 * True when the device has Face ID / Touch ID / enrolled fingerprint.
 */
export const isBiometricAvailable = async () => {
  try {
    const [hardware, enrolled] = await Promise.all([
      LocalAuthentication.hasHardwareAsync(),
      LocalAuthentication.isEnrolledAsync(),
    ]);
    return Boolean(hardware && enrolled);
  } catch {
    return false;
  }
};

/**
 * True when we have a refresh token in the Keychain waiting to be
 * restored via biometric unlock.
 */
export const hasSavedBiometricSession = async () => {
  try {
    const token = await SecureStore.getItemAsync(REFRESH_KEY);
    return Boolean(token);
  } catch {
    return false;
  }
};

/**
 * Optionally read the email that was saved alongside the refresh
 * token. Used to show "Log in as willem@..." on the Face ID button.
 */
export const getSavedBiometricEmail = async () => {
  try {
    return await SecureStore.getItemAsync(EMAIL_KEY);
  } catch {
    return null;
  }
};

/**
 * Persist the session credentials so the next launch can skip the
 * sign-in form entirely. Call this after EVERY successful sign-in
 * path (email/password, Google, Apple).
 */
export const saveBiometricSession = async (session) => {
  if (!session?.refresh_token) return { success: false };
  try {
    await SecureStore.setItemAsync(REFRESH_KEY, session.refresh_token, {
      // Require biometric unlock to read the token back. Without this
      // any local JS could yank the refresh token out.
      requireAuthentication: true,
      authenticationPrompt: 'Log in bij Happie',
    });
    if (session.user?.email) {
      // Email is stored without the biometric gate so we can show it
      // on the "Log in with Face ID" button preview.
      await SecureStore.setItemAsync(EMAIL_KEY, session.user.email);
    }
    return { success: true };
  } catch (e) {
    return { success: false, error: e?.message };
  }
};

/**
 * Wipe the saved session. Call on sign-out.
 */
export const clearBiometricSession = async () => {
  try {
    await SecureStore.deleteItemAsync(REFRESH_KEY);
    await SecureStore.deleteItemAsync(EMAIL_KEY);
    return { success: true };
  } catch (e) {
    return { success: false, error: e?.message };
  }
};

/**
 * Prompt Face ID / Touch ID, then use the stored refresh token to
 * restore a Supabase session. Returns { success, user, error }.
 *
 * The biometric prompt is baked into the SecureStore.getItemAsync call
 * (requireAuthentication: true) so we don't need a separate
 * LocalAuthentication.authenticateAsync round-trip.
 */
export const authenticateAndRestoreSession = async () => {
  try {
    const available = await isBiometricAvailable();
    if (!available) return { success: false, reason: 'no_biometric' };

    const refreshToken = await SecureStore.getItemAsync(REFRESH_KEY, {
      requireAuthentication: true,
      authenticationPrompt: 'Log in bij Happie',
    });
    if (!refreshToken) return { success: false, reason: 'no_saved_session' };

    const { data, error } = await supabase.auth.refreshSession({
      refresh_token: refreshToken,
    });

    if (error || !data?.session) {
      // Token probably expired or was revoked — drop it so we don't
      // keep prompting for something that can't work.
      await clearBiometricSession();
      return { success: false, reason: 'refresh_failed', error: error?.message };
    }

    // Store the new refresh token for the next go-round.
    await saveBiometricSession(data.session);

    return { success: true, user: data.user, session: data.session };
  } catch (e) {
    if (e?.message?.includes('cancel')) {
      return { success: false, reason: 'cancelled' };
    }
    return { success: false, reason: 'exception', error: e?.message };
  }
};
