import React, { useState, useRef } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Alert, ScrollView, Image, Modal, Animated, SafeAreaView } from 'react-native';
import { supabase } from '../lib/supabase';
import { useTranslation } from 'react-i18next';
import { createOrUpdateProfile } from '../lib/profileService';
import i18n, { saveLanguage } from '../lib/i18n';

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

export default function SignUpScreen({ navigation }) {
  const { t, i18n } = useTranslation();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  // Inline validation — errors show only after the user blurs the field so
  // we don't yell at them while they're still typing.
  const [emailTouched, setEmailTouched] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [confirmTouched, setConfirmTouched] = useState(false);
  const emailError =
    emailTouched && email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
      ? t('auth.invalidEmail') || 'Voer een geldig e-mailadres in'
      : null;
  const passwordError =
    passwordTouched && password && password.length < 6
      ? t('auth.passwordTooShort') || 'Wachtwoord moet minimaal 6 tekens zijn'
      : null;
  const confirmError =
    confirmTouched && confirmPassword && password !== confirmPassword
      ? t('auth.passwordsDoNotMatch') || 'Wachtwoorden komen niet overeen'
      : null;
  const [selectedLanguage, setSelectedLanguage] = useState('nl'); // Default to Dutch
  const [loading, setLoading] = useState(false);

  // Custom Alert Modal states
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertAnimation] = useState(new Animated.Value(0));
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [alertButtonText, setAlertButtonText] = useState('OK');
  const [alertOnPress, setAlertOnPress] = useState(() => () => {});

  const showCustomAlert = (title, message, buttonText = 'OK', onPress = () => {}) => {
    setAlertTitle(title);
    setAlertMessage(message);
    setAlertButtonText(buttonText);
    setAlertOnPress(() => onPress);
    setAlertVisible(true);
    
    Animated.spring(alertAnimation, {
      toValue: 1,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start();
  };

  const closeCustomAlert = () => {
    Animated.spring(alertAnimation, {
      toValue: 0,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start(() => {
      setAlertVisible(false);
      alertOnPress();
    });
  };

  const handleSignUp = async () => {
    if (!name || !email || !password || !confirmPassword) {
      showCustomAlert(t('errors.generic'), t('auth.emailRequired') + ' ' + t('auth.passwordRequired'));
      return;
    }

    if (password !== confirmPassword) {
      showCustomAlert(t('errors.generic'), t('auth.passwordMismatch'));
      return;
    }

    if (password.length < 6) {
      showCustomAlert(t('errors.generic'), t('auth.weakPassword'));
      return;
    }

    setLoading(true);
    
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
          }
        }
      });

      if (error) {
        showCustomAlert(t('auth.signUpError'), error.message);
      } else {
        // Create profile with language preference
        if (data?.user) {
          await createOrUpdateProfile(name, null, selectedLanguage);
        }
        
        // Navigate to sign in
        navigation.navigate('SignIn');
      }
    } catch (error) {
      console.error('❌ Unexpected sign up error:', error);
      showCustomAlert(t('errors.generic'), t('errors.generic'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardContainer}
        >
          <ScrollView 
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardDismissMode="on-drag"
            keyboardShouldPersistTaps="handled"
          >
          {/* Back Button */}
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>{'←'}</Text>
          </TouchableOpacity>

          {/* Header Section with Logo */}
          <View style={styles.header}>
            <Image 
              source={require('../assets/splash-logo.png')}
              style={styles.smallLogo}
              resizeMode="contain"
            />
            <Text style={styles.title}>{t('auth.welcomeNew') || 'Maak je account aan'}</Text>
            <Text style={styles.subtitle}>
              {t('auth.welcomeNewSubtitle') || 'Begin met plannen in 30 seconden'}
            </Text>
          </View>

          {/* Form Section */}
          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>{t('auth.fullName')}</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder={t('auth.fullName')}
                placeholderTextColor="#A0A0A0"
                autoCapitalize="words"
                autoComplete="name"
                textContentType="name"
                editable={!loading}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>{t('auth.email')}</Text>
              <TextInput
                style={[styles.input, emailError && styles.inputError]}
                value={email}
                onChangeText={setEmail}
                onBlur={() => setEmailTouched(true)}
                placeholder={t('auth.email')}
                placeholderTextColor="#A0A0A0"
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                textContentType="emailAddress"
                editable={!loading}
              />
              {emailError ? <Text style={styles.inputErrorText}>{emailError}</Text> : null}
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>{t('auth.password')}</Text>
              <TextInput
                style={[styles.input, passwordError && styles.inputError]}
                value={password}
                onChangeText={setPassword}
                onBlur={() => setPasswordTouched(true)}
                placeholder={t('auth.password')}
                placeholderTextColor="#A0A0A0"
                secureTextEntry
                autoComplete="password-new"
                textContentType="newPassword"
                editable={!loading}
              />
              {passwordError ? <Text style={styles.inputErrorText}>{passwordError}</Text> : null}
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>{t('auth.confirmPassword')}</Text>
              <TextInput
                style={[styles.input, confirmError && styles.inputError]}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                onBlur={() => setConfirmTouched(true)}
                placeholder={t('auth.confirmPassword')}
                placeholderTextColor="#A0A0A0"
                secureTextEntry
                autoComplete="password-new"
                textContentType="newPassword"
                editable={!loading}
              />
              {confirmError ? <Text style={styles.inputErrorText}>{confirmError}</Text> : null}
            </View>

            {/* Language Selection */}
            <View style={styles.languageSection}>
              <Text style={styles.languageLabel}>{t('common.language')}</Text>
              <View style={styles.languageButtons}>
                <TouchableOpacity 
                  style={[
                    styles.languageButton,
                    selectedLanguage === 'nl' && styles.languageButtonActive
                  ]}
                  onPress={() => {
                    setSelectedLanguage('nl');
                    i18n.changeLanguage('nl');
                    saveLanguage('nl');
                  }}
                >
                  <Text style={[
                    styles.languageButtonText,
                    selectedLanguage === 'nl' && styles.languageButtonTextActive
                  ]}>Nederlands</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[
                    styles.languageButton,
                    selectedLanguage === 'en' && styles.languageButtonActive
                  ]}
                  onPress={() => {
                    setSelectedLanguage('en');
                    i18n.changeLanguage('en');
                    saveLanguage('en');
                  }}
                >
                  <Text style={[
                    styles.languageButtonText,
                    selectedLanguage === 'en' && styles.languageButtonTextActive
                  ]}>English</Text>
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity 
              style={[styles.signUpButton, loading && styles.buttonDisabled]} 
              onPress={handleSignUp}
              disabled={loading}
            >
              <Text style={styles.signUpButtonText}>
                {loading ? t('common.loading') : t('auth.createAccount')}
              </Text>
            </TouchableOpacity>

            <Text style={styles.termsText}>
              {t('common.terms')}
            </Text>
          </View>

          {/* Footer Section */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>{t('auth.hasAccount')} </Text>
            <TouchableOpacity onPress={() => navigation.navigate('SignIn')}>
              <Text style={styles.signInText}>{t('auth.signIn')}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Custom Alert Modal */}
      <Modal
        visible={alertVisible}
        transparent={true}
        animationType="none"
        onRequestClose={closeCustomAlert}
      >
        <View style={styles.alertOverlay}>
          <TouchableOpacity 
            style={styles.alertBackground}
            activeOpacity={1}
            onPress={closeCustomAlert}
          />
          
          <Animated.View 
            style={[
              styles.alertContainer,
              {
                transform: [
                  {
                    scale: alertAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.8, 1],
                    }),
                  },
                ],
                opacity: alertAnimation,
              },
            ]}
          >
            <View style={styles.alertContent}>
              <Text style={styles.alertTitle}>{alertTitle}</Text>
              <Text style={styles.alertMessage}>{alertMessage}</Text>
              
              <TouchableOpacity 
                style={styles.alertButton}
                onPress={closeCustomAlert}
              >
                <Text style={styles.alertButtonText}>{alertButtonText}</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>
      
      {/* Toast Component */}
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
    paddingHorizontal: 24,
    paddingTop:-15,
    paddingBottom: 20,
  },
  backButton: {
    alignSelf: 'flex-start',
    paddingVertical: 4,
    paddingRight: 16,
  },
  backButtonText: {
    fontSize: 28,
    color: '#FF6B00',
    lineHeight: 32,
  },
  header: {
    alignItems: 'center',
    marginBottom: 8,
    paddingTop: 0,
  },
  smallLogo: {
    width: 280,
    height:280,
    marginBottom: -60,
    marginTop:-70,
  },
  title: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 28,
    lineHeight: 36,
    color: '#1A1000',
    letterSpacing: 0.5,
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    lineHeight: 20,
    color: '#9A8770',
    textAlign: 'center',
    letterSpacing: 0.1,
    marginBottom: 20,
  },
  form: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
    marginBottom: 24,
  },
  inputContainer: {
    marginBottom: 14,
  },
  label: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    lineHeight: 20,
    color: '#7A6550',
    marginBottom: 8,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  input: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    color: '#1A1000',
    backgroundColor: '#F8F6F3',
    borderWidth: 1.5,
    borderColor: 'transparent',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
    letterSpacing: 0.1,
    minHeight: 56,
    textAlignVertical: 'center',
  },
  inputError: {
    borderColor: '#CC2200',
  },
  inputErrorText: {
    marginTop: 6,
    marginLeft: 4,
    fontSize: 12,
    color: '#CC2200',
    fontFamily: 'Inter_400Regular',
  },
  signUpButton: {
    backgroundColor: '#FF6B00',
    borderRadius: 14,
    paddingVertical: 18,
    shadowColor: '#FF6B00',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 10,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  signUpButtonText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 16,
    lineHeight: 24,
    color: '#FEFEFE',
    letterSpacing: 0.2,
  },
  termsText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    lineHeight: 18,
    color: '#A0A0A0',
    textAlign: 'center',
    letterSpacing: 0.1,
    marginBottom: 10,
    paddingHorizontal: 10,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 10,
    flexWrap: 'wrap',
  },
  footerText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    lineHeight: 20,
    color: '#6B6B6B',
    letterSpacing: 0.1,
  },
  signInText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    lineHeight: 20,
    color: '#FF6B00',
    letterSpacing: 0.1,
  },

  alertOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(45, 45, 45, 0.6)',
    paddingHorizontal: 24,
  },
  alertBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  alertContainer: {
    backgroundColor: '#FEFEFE',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    minWidth: 300,
    maxWidth: '90%',
    shadowColor: '#1A1000',
    shadowOffset: {
      width: 0,
      height: 12,
    },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
  },
  alertContent: {
    alignItems: 'center',
    width: '100%',
  },
  alertTitle: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 26,
    lineHeight: 34,
    color: '#1A1000',
    marginBottom: 16,
    letterSpacing: 0.3,
    textAlign: 'center',
  },
  alertMessage: {
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    lineHeight: 22,
    color: '#6B6B6B',
    textAlign: 'center',
    marginBottom: 28,
    letterSpacing: 0.1,
  },
  alertButton: {
    backgroundColor: '#FF6B00',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: 'center',
    shadowColor: '#FF6B00',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  alertButtonText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 16,
    lineHeight: 24,
    color: '#FEFEFE',
    letterSpacing: 0.2,
  },

  // Language selection styles
  languageSection: {
    marginTop: 10,
    marginBottom: 6,
  },
  languageLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    lineHeight: 20,
    color: '#1A1000',
    marginBottom: 10,
  },
  languageButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  languageButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8F6F3',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  languageButtonActive: {
    backgroundColor: '#FF6B00',
    borderColor: '#FF6B00',
  },
  languageButtonText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    lineHeight: 18,
    color: '#6B6B6B',
    letterSpacing: 0.1,
  },
  languageButtonTextActive: {
    color: '#FEFEFE',
  },
}); 