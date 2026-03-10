import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, SafeAreaView, KeyboardAvoidingView, Platform, Alert, ScrollView, Image, Keyboard, Pressable } from 'react-native';
import { supabase } from '../lib/supabase';
import { useTranslation } from 'react-i18next';

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
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

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
      // Use Supabase default recovery redirect to avoid broken deep-link routes.
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
      console.error('❌ Unexpected sign in error:', error);
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Pressable style={{ flex: 1 }} onPress={Platform.OS !== 'web' ? Keyboard.dismiss : undefined} accessible={false}>
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
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
          >
          {/* Header Section with Logo */}
          <View style={styles.header}>
            <Image 
              source={require('../assets/nieuw_logo_studentenhappie.webp')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>

          {/* Form Section */}
          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>{t('auth.email')}</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder={t('auth.email')}
                placeholderTextColor="#A0A0A0"
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!loading}
              />
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

            <TouchableOpacity 
              style={styles.forgotPassword}
              onPress={handleForgotPassword}
              disabled={resetLoading}
            >
              <Text style={styles.forgotPasswordText}>
                {resetLoading ? 'Verzenden...' : 'Wachtwoord vergeten?'}
              </Text>
            </TouchableOpacity>

            </View>

          {/* Footer Section */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>{t('auth.noAccount')} </Text>
            <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
              <Text style={styles.signUpText}>{t('auth.signUp')}</Text>
            </TouchableOpacity>
          </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FEFEFE', // Off-white background
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24, // 24px outer margins as per style guide
    paddingTop: 12,
    paddingBottom: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 16,
    paddingTop: 8,
  },
  logo: {
    width: 360,
    height: 360,
    marginBottom: -80,
    marginTop: 0,
  },
  subtitle: {
    fontFamily: 'PlayfairDisplay_400Regular', // Changed to serif for elegance
    fontSize: 18,
    lineHeight: 26,
    color: '#6B6B6B', // Soft brown/gray
    textAlign: 'center',
    letterSpacing: 0.3,
    marginBottom: 24,
  },
  form: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
    marginBottom: 40,
  },
  inputContainer: {
    marginBottom: 24, // Consistent spacing
  },
  label: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    lineHeight: 20,
    color: '#2D2D2D',
    marginBottom: 8,
    letterSpacing: 0.1,
  },
  input: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    lineHeight: 24,
    color: '#2D2D2D',
    backgroundColor: '#F8F6F3', // Light beige
    borderWidth: 1,
    borderColor: '#E8E2DA',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 16,
    letterSpacing: 0.1,
    minHeight: 56,
  },
  signInButton: {
    backgroundColor: '#8B7355',
    borderRadius: 14,
    shadowColor: '#8B7355',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  signInButtonText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 16,
    lineHeight: 24,
    color: '#FEFEFE',
    letterSpacing: 0.2,
  },
  forgotPassword: {
    alignItems: 'center',
    minHeight: 44,
    justifyContent: 'center',
  },
  forgotPasswordText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    lineHeight: 20,
    color: '#8B7355',
    letterSpacing: 0.1,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 20,
    flexWrap: 'wrap', // Allow text to wrap if needed
  },
  footerText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    lineHeight: 20,
    color: '#6B6B6B',
    letterSpacing: 0.1,
  },
  signUpText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    lineHeight: 20,
    color: '#8B7355',
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
    backgroundColor: '#E8E2DA',
  },
  dividerText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    lineHeight: 20,
    color: '#6B6B6B',
    letterSpacing: 0.1,
    marginHorizontal: 12,
  },
  continueButton: {
    backgroundColor: '#F8F6F3',
    borderWidth: 2,
    borderColor: '#8B7355',
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  continueButtonText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 16,
    lineHeight: 24,
    color: '#8B7355',
    letterSpacing: 0.2,
  },
  backgroundDrawing: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.1,
    transform: [{ rotate: '5deg' }],
  },
}); 