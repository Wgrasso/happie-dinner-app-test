import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, Text, View, TextInput, TouchableOpacity, 
  ScrollView, Alert, Image, ActivityIndicator, Modal, Dimensions, Share, Switch, SafeAreaView } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../lib/supabase';
import { createOrUpdateProfile, getCurrentUserProfile, updateUserLanguage } from '../lib/profileService';
import { useTranslation } from 'react-i18next';
import i18n, { saveLanguage } from '../lib/i18n';
import { mediumHaptic, successHaptic, lightHaptic } from '../lib/haptics';
import { useToast } from './ui/Toast';
import { useAppState } from '../lib/AppStateContext';

const { width } = Dimensions.get('window');

export default function ProfileScreen({ route, navigation }) {
  const { isGuest } = route.params || { isGuest: false };
  const { t } = useTranslation();
  const toast = useToast();
  const appState = useAppState();
  
  // Profile state
  const [name, setName] = useState('');
  const [originalName, setOriginalName] = useState('');
  const [email, setEmail] = useState('');
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [accountActionLoading, setAccountActionLoading] = useState(false);
  
  // Edit name modal
  const [showEditName, setShowEditName] = useState(false);
  const [editingName, setEditingName] = useState('');
  
  // Password change states
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Chat notification preference
  const [chatNotifications, setChatNotifications] = useState(true);

  useEffect(() => {
    if (!isGuest) {
      loadProfile();
    }
  }, [isGuest]);

  const loadProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) {
        setEmail(user.email);
      }
      
      const result = await getCurrentUserProfile();
      
      if (result.success) {
        // Use profile name, or fall back to registration name from user metadata
        const profileName = result.profile.full_name || 
                           result.profile.display_name || 
                           user?.user_metadata?.full_name || 
                           '';
        setName(profileName);
        setOriginalName(profileName);
        if (result.profile.avatar_url) {
          setAvatarUrl(result.profile.avatar_url);
        }
        if (result.profile.chat_notifications !== undefined) {
          setChatNotifications(result.profile.chat_notifications !== false);
        }
      } else if (user) {
          // Fallback: use registration name from user metadata
          const userName = user.user_metadata?.full_name || '';
          setName(userName);
          setOriginalName(userName);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const handlePickAvatar = async () => {
    lightHaptic();
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (!permissionResult.granted) {
        Alert.alert(t('profile.permissionRequired'), t('profile.photoPermissionMessage'));
      return;
    }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
      });
      
      if (!result.canceled && result.assets[0]) {
        await uploadAvatar(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert(t('common.error'), t('profile.selectImageError'));
    }
  };

  const uploadAvatar = async (uri) => {
    setAvatarLoading(true);
    mediumHaptic();
    
    try {
              const { data: { user } } = await supabase.auth.getUser();
              if (!user) {
        Alert.alert(t('common.error'), t('common.signInRequired'));
                return;
              }

      // Get file extension
      const fileExt = uri.split('.').pop()?.toLowerCase() || 'jpg';
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = fileName; // Upload directly to bucket root
      
      // Read the file as base64 for React Native compatibility
      const response = await fetch(uri);
      const blob = await response.blob();
      
      // Convert blob to ArrayBuffer for more reliable upload
      const arrayBuffer = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsArrayBuffer(blob);
      });
      
      // Upload to Supabase storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, arrayBuffer, { 
          contentType: `image/${fileExt}`,
          upsert: true,
          cacheControl: '3600'
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        Alert.alert(t('common.error'), `${t('profile.uploadError')}: ${uploadError.message}`);
        return;
      }
      
      // Get the public URL
      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(filePath);
      const publicUrl = urlData?.publicUrl;

      if (!publicUrl) {
        Alert.alert(t('common.error'), t('profile.urlError'));
        return;
      }
      
      // Update profile in database
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);

      if (updateError) {
        console.error('Profile update error:', updateError);
        Alert.alert(t('common.error'), t('profile.updateProfileError'));
        return;
              }

      // Update local state
      setAvatarUrl(publicUrl);
      successHaptic();
      toast.show(t('profile.photoUpdated'), 'success');
      
      // Refresh the profile in the app context so other screens see the new avatar
      if (appState?.loadUserProfile) {
        appState.loadUserProfile(true); // Force refresh
      }
      
    } catch (error) {
      console.error('Avatar upload error:', error);
      Alert.alert(t('common.error'), `${t('errors.generic')}: ${error.message}`);
    } finally {
      setAvatarLoading(false);
    }
  };

  const handleSaveName = async () => {
    if (!editingName.trim()) {
      Alert.alert(t('common.error'), t('profile.enterName'));
      return;
    }
    
    setLoading(true);
    mediumHaptic();
    try {
      const result = await createOrUpdateProfile(editingName.trim());
      if (result.success) {
        await supabase.auth.updateUser({ data: { full_name: editingName.trim() } });
        setName(editingName.trim());
        setOriginalName(editingName.trim());
        setShowEditName(false);
        successHaptic();
      } else {
        Alert.alert(t('common.error'), t('profile.updateError'));
      }
    } catch (error) {
      Alert.alert(t('common.error'), t('errors.generic'));
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!newPassword || !confirmPassword) {
      Alert.alert(t('common.error'), t('profile.fillBothFields'));
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert(t('common.error'), t('profile.passwordMinLength'));
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert(t('common.error'), t('profile.passwordMismatch'));
      return;
              }

    setPasswordLoading(true);
    mediumHaptic();
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
        Alert.alert(t('common.error'), error.message);
      } else {
        Alert.alert(t('common.success'), t('profile.passwordChanged'));
        setNewPassword('');
        setConfirmPassword('');
        setShowPasswordModal(false);
        successHaptic();
      }
    } catch (error) {
      Alert.alert(t('common.error'), t('profile.passwordChangeError'));
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleLogout = () => {
    lightHaptic();
    Alert.alert(
      t('profile.logout'),
      t('profile.confirmLogout'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('profile.logout'),
          style: 'destructive',
          onPress: async () => {
            try {
              // Clear push token from server so next account doesn't get this user's notifications
              const { data: { user } } = await supabase.auth.getUser();
              if (user) {
                await supabase.from('profiles').update({ push_token: null }).eq('id', user.id);
              }
              
              // Clear all local cached data
              await appState.clearAllCachedData();

              // Forget the biometric-unlocked refresh token so the
              // next launch doesn't auto-log the user back in.
              try {
                const bio = await import('../lib/biometricAuth');
                await bio.clearBiometricSession();
              } catch (_) {}

              await supabase.auth.signOut();
              navigation.navigate('SignIn');
            } catch (error) {
              console.error('Error signing out:', error);
            }
          }
        }
      ]
    );
  };

  const handleDeleteAccount = () => {
    lightHaptic();
    Alert.alert(
      t('profile.deleteAccount'),
      t('profile.deleteAccountWarning'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('profile.deleteAccountConfirm'),
          style: 'destructive',
          onPress: async () => {
            setAccountActionLoading(true);
            try {
              const { data: { user }, error: userErr } = await supabase.auth.getUser();
              if (userErr || !user) {
                Alert.alert(t('common.error'), t('common.signInRequiredMessage'));
                return;
              }

              const { error: rpcError } = await supabase.rpc('delete_user_account_data', {
                p_user_id: user.id,
              });
              if (rpcError) {
                throw rpcError;
              }

              await appState.clearAllCachedData();
              try {
                const bio = await import('../lib/biometricAuth');
                await bio.clearBiometricSession();
              } catch (_) {}
              await supabase.auth.signOut();

              Alert.alert(t('profile.accountDeleted'), t('profile.accountDeletedSuccess'), [
                { text: 'OK', onPress: () => navigation.navigate('SignIn') }
              ]);
            } catch (error) {
              console.error('Delete account failed:', error?.message || error);
              Alert.alert(t('common.error'), t('profile.deleteAccountError'));
            } finally {
              setAccountActionLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleToggleChatNotifications = async (value) => {
    setChatNotifications(value);
    lightHaptic();
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('profiles').update({ chat_notifications: value }).eq('id', user.id);
      }
    } catch (_) {}
  };

  const handleLanguageChange = async (lang) => {
    lightHaptic();
    await i18n.changeLanguage(lang);
    await saveLanguage(lang);
    if (!isGuest) {
      await updateUserLanguage(lang);
    }
  };

  const handleInviteFriends = async () => {
    lightHaptic();
    try {
      const message = t('profile.inviteMessage');
      const result = await Share.share({
        message,
        title: t('profile.inviteTitle'),
      });
      
      if (result.action === Share.sharedAction) {
        successHaptic();
      }
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  // Settings Row Component
  const SettingsRow = ({ icon, label, value, onPress, isLast = false }) => (
    <TouchableOpacity 
      style={[styles.settingsRow, !isLast && styles.settingsRowBorder]} 
      onPress={onPress}
      activeOpacity={0.6}
    >
      <View style={styles.settingsRowLeft}>
        <Text style={styles.rowLabel}>{label}</Text>
      </View>
      <View style={styles.settingsRowRight}>
        {value && <Text style={styles.rowValue}>{value}</Text>}
        <Text style={styles.chevron}>›</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => {
              if (navigation?.canGoBack && navigation.canGoBack()) {
                navigation.goBack();
              } else {
                navigation.navigate('MainTabs', { screen: 'groups' });
              }
            }}
            activeOpacity={0.7}
          >
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>{t('common.settings')}</Text>
            <Text style={styles.headerSubtitle}>{email || ''}</Text>
          </View>
        </View>

        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarLetter}>
              {name ? name.charAt(0).toUpperCase() : '?'}
            </Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{name || t('profile.noNameSet')}</Text>
            <Text style={styles.profileEmail}>{email || t('profile.noEmail')}</Text>
          </View>
        </View>

        {/* Account Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('profile.account').toUpperCase()}</Text>
          <View style={styles.settingsCard}>
            <SettingsRow 
              label={t('profile.name')} 
              value={name || t('profile.setName')}
              onPress={() => {
                lightHaptic();
                setEditingName(name);
                setShowEditName(true);
              }}
            />
            <SettingsRow 
              label={t('profile.changePassword')} 
              onPress={() => {
                lightHaptic();
                setShowPasswordModal(true);
              }}
              isLast
            />
          </View>
        </View>

        {/* Preferences */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('common.preferences').toUpperCase()}</Text>
          <View style={styles.settingsCard}>
            <View style={styles.languageRow}>
              <View style={styles.settingsRowLeft}>
                <Text style={styles.rowLabel}>{t('profile.language')}</Text>
              </View>
              <View style={styles.languageToggle}>
                <TouchableOpacity 
                  style={[styles.langOption, i18n.language === 'nl' && styles.langOptionActive]} 
                  onPress={() => handleLanguageChange('nl')}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.langText, i18n.language === 'nl' && styles.langTextActive]}>NL</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.langOption, i18n.language === 'en' && styles.langOptionActive]}
                  onPress={() => handleLanguageChange('en')}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.langText, i18n.language === 'en' && styles.langTextActive]}>EN</Text>
                </TouchableOpacity>
              </View>
            </View>
            <View style={styles.settingsRowBorder} />
            <View style={styles.notificationRow}>
              <View style={styles.settingsRowLeft}>
                <Text style={styles.rowLabel}>{t('profile.chatNotifications')}</Text>
              </View>
              <Switch
                value={chatNotifications}
                onValueChange={handleToggleChatNotifications}
                trackColor={{ false: '#D0CCC7', true: '#FF6B00' }}
                thumbColor="#FEFEFE"
              />
            </View>
          </View>
        </View>
              
        {/* Invite Friends */}
        <View style={styles.section}>
          <View style={styles.settingsCard}>
            <TouchableOpacity 
              style={styles.inviteRow}
              onPress={handleInviteFriends}
              activeOpacity={0.7}
            >
              <View style={styles.inviteLeft}>
                <View style={styles.inviteIconContainer}>
                  <Text style={styles.inviteIcon}>↗</Text>
                </View>
                <View>
                  <Text style={styles.inviteLabel}>{t('profile.inviteFriends')}</Text>
                  <Text style={styles.inviteHint}>{t('profile.inviteFriendsHint')}</Text>
                </View>
              </View>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Logout */}
        <View style={styles.section}>
          <TouchableOpacity 
            style={styles.logoutButton}
            onPress={handleLogout}
            activeOpacity={0.8}
          >
            <Text style={styles.logoutText}>{t('profile.logout')}</Text>
          </TouchableOpacity>
        </View>

        {/* Delete Account */}
        <View style={styles.dangerZone}>
          <TouchableOpacity 
            style={[styles.deleteButton, accountActionLoading && styles.buttonDisabled]} 
            onPress={handleDeleteAccount}
            disabled={accountActionLoading}
            activeOpacity={0.6}
          >
            <Text style={styles.deleteText}>
              {accountActionLoading ? t('common.loading') : t('profile.deleteAccount')}
            </Text>
          </TouchableOpacity>
          <Text style={styles.dangerHint}>{t('common.cannotBeUndone')}</Text>
        </View>

        {/* App Version */}
        <View style={styles.footer}>
          <Text style={styles.versionText}>Happie v1.1.1</Text>
        </View>
      </ScrollView>

      {/* Edit Name Modal */}
      <Modal
        visible={showEditName}
        transparent
        animationType="fade"
        onRequestClose={() => setShowEditName(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t('profile.editName')}</Text>
            <Text style={styles.modalSubtitle}>{t('profile.editNameSubtitle')}</Text>
            <TextInput
              style={styles.modalInput}
              value={editingName}
              onChangeText={setEditingName}
              placeholder={t('profile.yourName')}
              placeholderTextColor="#A0A0A0"
              autoFocus
              autoCapitalize="words"
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.modalCancelButton}
                onPress={() => {
                  lightHaptic();
                  setShowEditName(false);
                }}
              >
                <Text style={styles.modalCancelText}>{t('common.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalSaveButton, loading && styles.buttonDisabled]}
                onPress={handleSaveName}
                disabled={loading}
              >
                <Text style={styles.modalSaveText}>
                  {loading ? t('profile.saving') : t('profile.save')}
                </Text>
              </TouchableOpacity>
            </View>
        </View>
        </View>
      </Modal>

      {/* Change Password Modal */}
      <Modal
        visible={showPasswordModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPasswordModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t('profile.changePassword')}</Text>
            <Text style={styles.modalSubtitle}>{t('profile.changePasswordSubtitle')}</Text>
            <TextInput
              style={styles.modalInput}
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder={t('profile.newPassword')}
              placeholderTextColor="#A0A0A0"
              secureTextEntry
            />
            <TextInput
              style={styles.modalInput}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder={t('profile.confirmPassword')}
              placeholderTextColor="#A0A0A0"
              secureTextEntry
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.modalCancelButton}
                onPress={() => {
                  lightHaptic();
                  setNewPassword('');
                  setConfirmPassword('');
                  setShowPasswordModal(false);
                }}
              >
                <Text style={styles.modalCancelText}>{t('common.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalSaveButton, passwordLoading && styles.buttonDisabled]}
                onPress={handleChangePassword}
                disabled={passwordLoading}
              >
                <Text style={styles.modalSaveText}>
                  {passwordLoading ? t('profile.changing') : t('profile.change')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FEFEFE',
  },
  scrollContent: {
    paddingBottom: 40,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 8,
  },
  backButton: {
    paddingRight: 16,
    paddingVertical: 4,
  },
  backIcon: {
    fontSize: 28,
    color: '#FF6B00',
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 34,
    fontFamily: 'PlayfairDisplay_700Bold',
    color: '#1A1000',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: '#FF6B00',
    letterSpacing: 0.3,
  },

  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 24,
    marginTop: 16,
    marginBottom: 28,
    backgroundColor: '#F8F6F3',
    padding: 18,
    borderRadius: 16,
  },
  avatarPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FF6B00',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarLetter: {
    fontSize: 22,
    fontFamily: 'Inter_700Bold',
    color: '#FFFFFF',
  },
  profileInfo: {
    flex: 1,
    marginLeft: 14,
  },
  profileName: {
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
    color: '#1A1000',
    marginBottom: 2,
  },
  profileEmail: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: '#8B8B8B',
  },

  section: {
    marginBottom: 20,
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 12,
    fontFamily: 'PlayfairDisplay_700Bold',
    color: '#FF6B00',
    letterSpacing: 1,
    marginBottom: 10,
    marginLeft: 4,
  },
  settingsCard: {
    backgroundColor: '#F8F6F3',
    borderRadius: 14,
    overflow: 'hidden',
  },

  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    paddingHorizontal: 16,
  },
  settingsRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#EBE7E1',
  },
  settingsRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingsRowRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowLabel: {
    fontSize: 15,
    fontFamily: 'Inter_500Medium',
    color: '#1A1000',
  },
  rowValue: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: '#8B8B8B',
    marginRight: 8,
  },
  chevron: {
    fontSize: 20,
    color: '#C0B9AE',
  },

  languageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  notificationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  languageToggle: {
    flexDirection: 'row',
    backgroundColor: '#FEFEFE',
    borderRadius: 10,
    padding: 3,
  },
  langOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  langOptionActive: {
    backgroundColor: '#FF6B00',
  },
  langFlag: {
    fontSize: 16,
    marginRight: 5,
  },
  langText: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    color: '#8B8B8B',
  },
  langTextActive: {
    color: '#FEFEFE',
  },

  inviteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  inviteLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  inviteIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(139, 115, 85, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  inviteIcon: {
    fontSize: 16,
    color: '#FF6B00',
  },
  inviteLabel: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    color: '#1A1000',
    marginBottom: 1,
  },
  inviteHint: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: '#8B8B8B',
  },

  logoutButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8F6F3',
    paddingVertical: 15,
    borderRadius: 14,
  },
  logoutText: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    color: '#C0534F',
  },

  dangerZone: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 8,
    paddingHorizontal: 24,
  },
  deleteButton: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E0D5D5',
    backgroundColor: 'transparent',
  },
  deleteText: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: '#C0534F',
  },
  dangerHint: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    color: '#C0A0A0',
    marginTop: 8,
  },

  footer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  versionText: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    color: '#D0D0D0',
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 28,
    width: '100%',
    maxWidth: 360,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 22,
    fontFamily: 'PlayfairDisplay_700Bold',
    color: '#1A1000',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: '#8B8B8B',
    marginBottom: 24,
    textAlign: 'center',
  },
  modalInput: {
    backgroundColor: '#F8F6F3',
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 18,
    fontSize: 16,
    lineHeight: 22,
    fontFamily: 'Inter_400Regular',
    color: '#1A1000',
    marginBottom: 16,
    minHeight: 56,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderRadius: 14,
    backgroundColor: '#F8F6F3',
  },
  modalCancelText: {
    fontSize: 15,
    fontFamily: 'Inter_500Medium',
    color: '#6B6B6B',
  },
  modalSaveButton: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderRadius: 14,
    backgroundColor: '#FF6B00',
  },
  modalSaveText: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    color: '#FFFFFF',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
}); 
