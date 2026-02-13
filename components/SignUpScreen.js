import React, { useState, useRef } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, SafeAreaView, KeyboardAvoidingView, Platform, Alert, ScrollView, Image, Modal, Animated, Keyboard, Pressable } from 'react-native';
import { supabase } from '../lib/supabase';
import { useTranslation } from 'react-i18next';
import { createOrUpdateProfile } from '../lib/profileService';
import i18n, { saveLanguage } from '../lib/i18n';
import Toast from './Toast';

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
  const toastRef = useRef(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
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
    console.log('📝 User attempting to sign up...');
    
    if (!name || !email || !password || !confirmPassword) {
      console.log('❌ Sign up failed: Missing required fields');
      showCustomAlert(t('errors.generic'), t('auth.emailRequired') + ' ' + t('auth.passwordRequired'));
      return;
    }

    if (password !== confirmPassword) {
      console.log('❌ Sign up failed: Passwords do not match');
      showCustomAlert(t('errors.generic'), t('auth.passwordMismatch'));
      return;
    }

    if (password.length < 6) {
      console.log('❌ Sign up failed: Password too short');
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
        console.log('❌ Sign up failed:', error.message);
        showCustomAlert(t('auth.signUpError'), error.message);
      } else {
        console.log('🎉 Account created successfully for:', email);
        
        // Create profile with language preference
        if (data?.user) {
          console.log('📝 Creating profile with language preference:', selectedLanguage);
          await createOrUpdateProfile(name, null, selectedLanguage);
        }
        
        // Show toast instead of alert
        if (toastRef.current) {
          toastRef.current.show(
            i18n.language === 'nl' 
              ? 'Check je e-mail om je account te bevestigen' 
              : 'Check your email to confirm your account', 
            'success'
          );
        }
        
        // Navigate to sign in after short delay
        setTimeout(() => {
          navigation.navigate('SignIn');
        }, 1500);
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
      <Pressable style={{ flex: 1 }} onPress={Keyboard.dismiss} accessible={false}>
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
          {/* Header Section with Logo */}
          <View style={styles.header}>
            <Image 
              source={require('../assets/happie-logo.png')}
              style={styles.smallLogo}
              resizeMode="contain"
            />
            <Text style={styles.title}>{t('auth.createAccount')}</Text>
            <Text style={styles.subtitle}>{t('auth.joinCommunity')}</Text>
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
                editable={!loading}
              />
            </View>

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

            <View style={styles.inputContainer}>
              <Text style={styles.label}>{t('auth.confirmPassword')}</Text>
              <TextInput
                style={styles.input}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder={t('auth.confirmPassword')}
                placeholderTextColor="#A0A0A0"
                secureTextEntry
                editable={!loading}
              />
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
                  <Text style={styles.flagEmoji}>🇳🇱</Text>
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
                  <Text style={styles.flagEmoji}>🇬🇧</Text>
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
      <Toast ref={toastRef} />
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
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
    paddingTop: 20,
  },
  smallLogo: {
    width: 120,
    height: 120,
    marginBottom: 16,
  },
  title: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 28,
    lineHeight: 36,
    color: '#2D2D2D',
    letterSpacing: 0.5,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    lineHeight: 24,
    color: '#6B6B6B',
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  form: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
    marginBottom: 40,
  },
  inputContainer: {
    marginBottom: 20, // Slightly tighter spacing for more fields
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
    minHeight: 56, // Ensure consistent height
  },
  signUpButton: {
    backgroundColor: '#8B7355',
    borderRadius: 14,
    paddingVertical: 18,
    shadowColor: '#8B7355',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 16,
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
    marginBottom: 20,
    paddingHorizontal: 10, // Add padding to prevent text cutoff
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
  signInText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    lineHeight: 20,
    color: '#8B7355',
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
    shadowColor: '#2D2D2D',
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
    color: '#2D2D2D',
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
    backgroundColor: '#8B7355',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: 'center',
    shadowColor: '#8B7355',
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
    marginTop: 20,
    marginBottom: 10,
  },
  languageLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    lineHeight: 20,
    color: '#2D2D2D',
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
    backgroundColor: '#8B7355',
    borderColor: '#8B7355',
  },
  flagEmoji: {
    fontSize: 20,
    marginRight: 6,
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