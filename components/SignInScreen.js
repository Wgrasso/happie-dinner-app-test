import React, { useState, useEffect, useMemo } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Alert, ScrollView, Image, Keyboard, Pressable, ActivityIndicator, SafeAreaView } from 'react-native';
import { supabase } from '../lib/supabase';
import { useTranslation } from 'react-i18next';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as AuthSession from 'expo-auth-session';
import * as Crypto from 'expo-crypto';
import { useTheme } from '../lib/ThemeContext';

// Safe image component that handles missing drawings gracefully
const SafeDrawing = ({ source, style, resizeMode = "contain" }) => {
  const [imageError, setImageError] = useState(false);
  
  if (imageError) return null;
  
  return (
    <Image 
      source={source}
      style={style}
      resizeMode={resizeMode}
      onError={() => setImageError(true)}
    />
  );
};

export default function SignInScreen({ navigation }) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  // Inline validation — shown as user types (after first blur).
  const [emailTouched, setEmailTouched] = useState(false);
  const emailError =
    emailTouched && email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
      ? t('auth.invalidEmail') || 'Voer een geldig e-mailadres in'
      : null;

  const handleForgotPassword = async () => {
    if (!email) {
      Alert.alert(
        t('auth.emailRequired'),
        t('auth.enterEmailForReset')
      );
      return;
    }

    setResetLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);

      if (error) {
        Alert.alert(t('common.error'), error.message);
      } else {
        Alert.alert(
          t('auth.emailSent'),
          t('auth.resetEmailSentMessage'),
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      Alert.alert(t('common.error'), t('errors.generic'));
    } finally {
      setResetLoading(false);
    }
  };

  const [appleAvailable, setAppleAvailable] = useState(false);
  const [socialLoading, setSocialLoading] = useState(false);

  useEffect(() => {
    if (Platform.OS === 'ios') {
      AppleAuthentication.isAvailableAsync().then(setAppleAvailable).catch(() => {});
    }
  }, []);

  const handleAppleSignIn = async () => {
    setSocialLoading(true);
    try {
      const rawNonce = Math.random().toString(36).slice(2) + Date.now().toString(36);
      const hashedNonce = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        rawNonce
      );

      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
        nonce: hashedNonce,
      });

      if (!credential.identityToken) {
        Alert.alert('Error', 'Apple Sign In mislukt');
        return;
      }

      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'apple',
        token: credential.identityToken,
        nonce: rawNonce,
      });

      if (error) {
        Alert.alert('Error', error.message);
      } else {
        // Update name if provided by Apple (first time only)
        if (credential.fullName?.givenName) {
          const fullName = [credential.fullName.givenName, credential.fullName.familyName].filter(Boolean).join(' ');
          await supabase.auth.updateUser({ data: { full_name: fullName } });
        }
        navigation.navigate('MainTabs', { screen: 'groups' });
      }
    } catch (e) {
      if (e.code !== 'ERR_REQUEST_CANCELED') {
        Alert.alert('Error', e.message || 'Apple Sign In mislukt');
      }
    } finally {
      setSocialLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setSocialLoading(true);
    try {
      const redirectUrl = AuthSession.makeRedirectUri({ path: 'auth/callback' });
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: true,
        },
      });

      if (error) { Alert.alert('Error', error.message); return; }
      if (!data?.url) { Alert.alert('Error', 'Kon Google login niet starten'); return; }

      const result = await AuthSession.startAsync({ authUrl: data.url, returnUrl: redirectUrl });

      if (result.type === 'success') {
        const params = new URLSearchParams(result.url.split('#')[1] || result.url.split('?')[1] || '');
        const accessToken = params.get('access_token');
        const refreshToken = params.get('refresh_token');

        if (accessToken) {
          await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
          navigation.navigate('MainTabs', { screen: 'groups' });
        }
      }
    } catch (e) {
      Alert.alert('Error', e.message || 'Google Sign In mislukt');
    } finally {
      setSocialLoading(false);
    }
  };

  const handleSignIn = async () => {
    if (!email || !password) {
      Alert.alert(t('errors.generic'), t('auth.emailRequired') + ' ' + t('auth.passwordRequired'));
      return;
    }

    setLoading(true);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        // Provide specific error messages for common issues
        let errorMessage = error.message;
        
        if (error.message.includes('Email not confirmed') || error.message.includes('email_not_confirmed')) {
          errorMessage = 'Please confirm your email address before signing in. Check your inbox for a confirmation email and click the link.';
        } else if (error.message.includes('Invalid login credentials') || error.message.includes('invalid_credentials')) {
          errorMessage = 'Invalid email or password. Please check your credentials and try again. If you just signed up, make sure to confirm your email first.';
        }
        
        Alert.alert(t('auth.signInError'), errorMessage);
      } else {
        const user = data.user;
        
        // Navigate to groups page (middle tab) after login
        navigation.navigate('MainTabs', { screen: 'groups' });
      }
    } catch (error) {
      console.error('Unexpected sign in error:', error);
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  // On web the outer Pressable swallowed scroll-start events, so the
  // user could only start scrolling by grabbing a scrollable child.
  // Skip the wrapper on web and rely on keyboardDismissMode on native
  // instead.
  const Outer = Platform.OS === 'web' ? View : Pressable;
  const outerProps = Platform.OS === 'web'
    ? { style: { flex: 1 } }
    : { style: { flex: 1 }, onPress: Keyboard.dismiss, accessible: false };

  return (
    <SafeAreaView style={styles.container}>
      <Outer {...outerProps}>
        {/* Custom Drawing Background */}
        <View style={styles.backgroundDrawing} pointerEvents="none">
          <SafeDrawing
            source={require('../assets/drawing1.png')}
            style={{ width: '100%', height: '100%' }}
          />
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardContainer}
        >
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            scrollEventThrottle={16}
          >
          {/* Header Section with Logo */}
          <View style={styles.header}>
            <Image
              source={require('../assets/splash-logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.welcomeTitle}>
              {t('auth.welcomeBack') || 'Welkom terug'}
            </Text>
            <Text style={styles.welcomeSubtitle}>
              {t('auth.welcomeSubtitle') ||
                'Log in om verder te gaan met plannen'}
            </Text>
          </View>

          {/* Form Section */}
          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>{t('auth.email')}</Text>
              <TextInput
                style={[styles.input, emailError && styles.inputError]}
                value={email}
                onChangeText={setEmail}
                onBlur={() => setEmailTouched(true)}
                placeholder={t('auth.email')}
                placeholderTextColor={theme.colors.textPlaceholder}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                textContentType="emailAddress"
                editable={!loading}
              />
              {emailError ? (
                <Text style={styles.inputErrorText}>{emailError}</Text>
              ) : null}
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>{t('auth.password')}</Text>
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder={t('auth.password')}
                placeholderTextColor="#A0A0A0"
                secureTextEntry
                autoComplete="password"
                textContentType="password"
                editable={!loading}
              />
            </View>

            <TouchableOpacity
              style={[styles.signInButton, loading && styles.buttonDisabled]}
              onPress={handleSignIn}
              disabled={loading}
            >
              <Text style={styles.signInButtonText}>
                {loading ? t('common.loading') : t('auth.signIn')}
              </Text>
            </TouchableOpacity>

            {/* Register link sits above forgot-password so the primary
                next-step for new users is the first thing they see. */}
            <View style={styles.registerRow}>
              <Text style={styles.footerText}>{t('auth.noAccount')} </Text>
              <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
                <Text style={styles.signUpText}>{t('auth.signUp')}</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.forgotPassword}
              onPress={handleForgotPassword}
              disabled={resetLoading}
            >
              <Text style={styles.forgotPasswordText}>
                {resetLoading ? 'Verzenden...' : 'Wachtwoord vergeten?'}
              </Text>
            </TouchableOpacity>

            {/* Social Sign In */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>of</Text>
              <View style={styles.dividerLine} />
            </View>

            {socialLoading ? (
              <ActivityIndicator size="small" color="#FF6B00" style={{ marginVertical: 16 }} />
            ) : (
              <>
                {appleAvailable && (
                  <TouchableOpacity style={[styles.socialButton, { backgroundColor: '#000000' }]} onPress={handleAppleSignIn}>
                    <Text style={[styles.socialIcon, { color: '#FFFFFF', fontSize: 20 }]}>{'\uF8FF'}</Text>
                    <Text style={[styles.socialButtonText, { color: '#FFFFFF' }]}>Doorgaan met Apple</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity style={[styles.socialButton, styles.googleButton]} onPress={handleGoogleSignIn}>
                  <Image source={{ uri: 'https://developers.google.com/identity/images/g-logo.png' }} style={{ width: 20, height: 20 }} />
                  <Text style={[styles.socialButtonText, styles.googleButtonText]}>Doorgaan met Google</Text>
                </TouchableOpacity>
              </>
            )}

            </View>

          </ScrollView>
        </KeyboardAvoidingView>
      </Outer>
    </SafeAreaView>
  );
}

const createStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 32,
  },
  header: {
    alignItems: 'center',
    marginBottom: 14,
    paddingTop: 0,
  },
  logo: {
    width: 240,
    height: 185,
    marginTop: 0,
    marginBottom: 0,
  },
  welcomeTitle: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 26,
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: 4,
  },
  welcomeSubtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    lineHeight: 20,
    color: theme.colors.textTertiary,
    textAlign: 'center',
    letterSpacing: 0.1,
    marginBottom: 24,
  },
  form: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
    marginBottom: 32,
  },
  inputContainer: {
    marginBottom: 18,
  },
  label: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    lineHeight: 20,
    color: theme.colors.textSecondary,
    marginBottom: 8,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  input: {
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    color: theme.colors.text,
    backgroundColor: theme.colors.surfaceAlt,
    borderWidth: 1.5,
    borderColor: 'transparent',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 16,
    letterSpacing: 0.1,
    minHeight: 56,
    textAlignVertical: 'center',
  },
  inputError: {
    borderColor: theme.colors.error,
  },
  inputErrorText: {
    marginTop: 6,
    marginLeft: 4,
    fontSize: 12,
    color: theme.colors.error,
    fontFamily: 'Inter_400Regular',
  },
  signInButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 14,
    shadowColor: theme.colors.shadowColor,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 14,
    elevation: 6,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 28,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  signInButtonText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    lineHeight: 24,
    color: theme.colors.textInverse,
    letterSpacing: 0.2,
  },
  forgotPassword: {
    alignItems: 'center',
    minHeight: 44,
    justifyContent: 'center',
  },
  forgotPasswordText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    lineHeight: 20,
    color: theme.colors.primary,
    letterSpacing: 0.1,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 20,
    flexWrap: 'wrap',
  },
  registerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 18,
    marginBottom: 4,
    flexWrap: 'wrap',
  },
  footerText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    lineHeight: 20,
    color: theme.colors.textTertiary,
    letterSpacing: 0.1,
  },
  signUpText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    lineHeight: 20,
    color: theme.colors.primary,
    letterSpacing: 0.1,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: theme.colors.border,
  },
  dividerText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    lineHeight: 20,
    color: theme.colors.textTertiary,
    letterSpacing: 0.6,
    marginHorizontal: 12,
    textTransform: 'uppercase',
  },
  googleButton: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E0DAD0',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
  },
  googleButtonText: {
    color: '#1F1F1F',
    fontFamily: 'Inter_500Medium',
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: theme.colors.surfaceAlt,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 14,
    paddingVertical: 16,
    marginBottom: 10,
    gap: 10,
  },
  socialIcon: {
    fontSize: 18,
  },
  socialButtonText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 15,
    color: theme.colors.text,
  },
  backgroundDrawing: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.08,
    transform: [{ rotate: '5deg' }],
  },
});