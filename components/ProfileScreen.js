import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, Text, View, TextInput, TouchableOpacity, SafeAreaView, 
  ScrollView, Alert, Image, ActivityIndicator, Modal, Dimensions, Share
} from 'react-native';
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
  
  // Edit name modal
  const [showEditName, setShowEditName] = useState(false);
  const [editingName, setEditingName] = useState('');
  
  // Password change states
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

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
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
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
      
      console.log('📸 Uploading avatar:', filePath, 'size:', arrayBuffer.byteLength);
      
      // Upload to Supabase storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, arrayBuffer, { 
          contentType: `image/${fileExt}`,
          upsert: true,
          cacheControl: '3600'
        });

      if (uploadError) {
        console.error('❌ Upload error:', uploadError);
        Alert.alert(t('common.error'), `${t('profile.uploadError')}: ${uploadError.message}`);
        return;
      }
      
      console.log('✅ Upload successful:', uploadData);
      
      // Get the public URL
      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(filePath);
      const publicUrl = urlData?.publicUrl;

      if (!publicUrl) {
        Alert.alert(t('common.error'), t('profile.urlError'));
        return;
      }
      
      console.log('🔗 Public URL:', publicUrl);

      // Update profile in database
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);

      if (updateError) {
        console.error('❌ Profile update error:', updateError);
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
      console.error('❌ Avatar upload error:', error);
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
            setLoading(true);
            try {
              const { data: { user } } = await supabase.auth.getUser();
              if (!user) return;

              await supabase.from('profiles').delete().eq('id', user.id);
              await supabase.from('group_members').delete().eq('user_id', user.id);
              await supabase.from('wishlist').delete().eq('user_id', user.id);
              await supabase.auth.signOut();
              
              Alert.alert(t('profile.accountDeleted'), t('profile.accountDeletedSuccess'), [
                { text: 'OK', onPress: () => navigation.navigate('SignIn') }
              ]);
            } catch (error) {
              Alert.alert(t('common.error'), t('profile.deleteAccountError'));
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
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
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
        >
            <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('common.settings')}</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Profile Card */}
        <View style={styles.profileCard}>
          <TouchableOpacity 
            style={styles.avatarWrapper}
            onPress={handlePickAvatar}
            disabled={avatarLoading || isGuest}
            activeOpacity={0.8}
          >
            {avatarLoading ? (
              <View style={styles.avatarPlaceholder}>
                <ActivityIndicator size="small" color="#FFF" />
              </View>
            ) : avatarUrl ? (
              <ExpoImage 
                source={{ uri: avatarUrl }} 
                style={styles.avatar}
                contentFit="cover"
                transition={200}
                cachePolicy="memory-disk"
              />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarLetter}>
                  {name ? name.charAt(0).toUpperCase() : '?'}
          </Text>
        </View>
            )}
            {!isGuest && (
              <View style={styles.cameraBadge}>
                <Text style={styles.cameraIcon}>📷</Text>
              </View>
            )}
          </TouchableOpacity>
          
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
              style={[
                    styles.langOption, 
                    i18n.language === 'nl' && styles.langOptionActive
              ]} 
                  onPress={() => handleLanguageChange('nl')}
                  activeOpacity={0.7}
                >
                  <Text style={styles.langFlag}>🇳🇱</Text>
                  <Text style={[
                    styles.langText,
                    i18n.language === 'nl' && styles.langTextActive
                  ]}>NL</Text>
            </TouchableOpacity>
              <TouchableOpacity 
                style={[
                    styles.langOption, 
                    i18n.language === 'en' && styles.langOptionActive
                ]}
                  onPress={() => handleLanguageChange('en')}
                  activeOpacity={0.7}
              >
                  <Text style={styles.langFlag}>🇬🇧</Text>
                <Text style={[
                    styles.langText,
                    i18n.language === 'en' && styles.langTextActive
                  ]}>EN</Text>
              </TouchableOpacity>
              </View>
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

        {/* Actions */}
        <View style={styles.section}>
            <TouchableOpacity 
              style={styles.logoutButton}
              onPress={handleLogout}
            activeOpacity={0.8}
            >
            <Text style={styles.logoutText}>{t('profile.logout')}</Text>
            </TouchableOpacity>
        </View>

        {/* Danger Zone */}
        <View style={styles.dangerZone}>
            <TouchableOpacity 
            style={styles.deleteButton} 
              onPress={handleDeleteAccount}
              disabled={loading}
            activeOpacity={0.6}
            >
            <Text style={styles.deleteText}>{t('profile.deleteAccount')}</Text>
            </TouchableOpacity>
          <Text style={styles.dangerHint}>{t('common.cannotBeUndone')}</Text>
        </View>

        {/* App Version */}
        <View style={styles.footer}>
          <Text style={styles.versionText}>Happie v1.1.0</Text>
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
  
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#FEFEFE',
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  backIcon: {
    fontSize: 22,
    color: '#2D2D2D',
    marginTop: -2,
  },
  headerTitle: {
    fontSize: 17,
    fontFamily: 'Inter_600SemiBold',
    color: '#2D2D2D',
    letterSpacing: -0.3,
  },
  headerSpacer: {
    width: 44,
  },

  // Profile Card
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginTop: 8,
    marginBottom: 24,
    padding: 20,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#E8E2DA',
  },
  avatarPlaceholder: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#8B7355',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarLetter: {
    fontSize: 28,
    fontFamily: 'Inter_700Bold',
    color: '#FFFFFF',
  },
  cameraBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 2,
    borderColor: '#FEFEFE',
  },
  cameraIcon: {
    fontSize: 14,
  },
  profileInfo: {
    flex: 1,
    marginLeft: 16,
  },
  profileName: {
    fontSize: 20,
    fontFamily: 'PlayfairDisplay_700Bold',
    color: '#2D2D2D',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: '#6B6B6B',
  },

  // Sections
  section: {
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    color: '#8B7355',
    letterSpacing: 1,
    marginBottom: 10,
    marginLeft: 4,
  },
  settingsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },

  // Settings Rows
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  settingsRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F0EDE8',
  },
  settingsRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingsRowRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#F8F6F3',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rowIcon: {
    fontSize: 18,
  },
  rowLabel: {
    fontSize: 16,
    fontFamily: 'Inter_500Medium',
    color: '#2D2D2D',
  },
  rowValue: {
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    color: '#8B8B8B',
    marginRight: 8,
  },
  chevron: {
    fontSize: 22,
    color: '#C0C0C0',
    marginTop: -2,
  },

  // Language Row
  languageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  languageToggle: {
    flexDirection: 'row',
    backgroundColor: '#F8F6F3',
    borderRadius: 12,
    padding: 4,
  },
  langOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  langOptionActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 1,
  },
  langFlag: {
    fontSize: 18,
    marginRight: 6,
  },
  langText: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: '#8B8B8B',
  },
  langTextActive: {
    color: '#2D2D2D',
  },

  // Invite Friends Row
  inviteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  inviteLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  inviteIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(139, 115, 85, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  inviteIcon: {
    fontSize: 18,
    color: '#8B7355',
    fontFamily: 'Inter_600SemiBold',
  },
  inviteLabel: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: '#2D2D2D',
    marginBottom: 2,
  },
  inviteHint: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: '#8B8B8B',
  },

  // Logout Button
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  logoutIcon: {
    fontSize: 18,
    marginRight: 10,
  },
  logoutText: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: '#E53935',
  },

  // Danger Zone
  dangerZone: {
    alignItems: 'center',
    paddingTop: 24,
    paddingBottom: 16,
  },
  deleteButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  deleteText: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: '#A0A0A0',
  },
  dangerHint: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: '#C0C0C0',
    marginTop: 4,
  },

  // Footer
  footer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  versionText: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: '#C0C0C0',
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
    color: '#2D2D2D',
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
    color: '#2D2D2D',
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
    backgroundColor: '#8B7355',
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
