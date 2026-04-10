import React, { useState, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  Pressable, SafeAreaView } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { createChefProfile, isTagAvailable } from '../lib/chefService';
import { uploadRecipeImage } from '../lib/recipeImageService';
import { lightHaptic, successHaptic } from '../lib/haptics';
import { useToast } from './ui/Toast';
import { useTheme } from '../lib/ThemeContext';
const SafeDrawing = ({ source, style, resizeMode = 'contain' }) => {
  const [imageError, setImageError] = useState(false);
  if (imageError) return null;
  return <Image source={source} style={style} resizeMode={resizeMode} onError={() => setImageError(true)} />;
};

export default function ChefProfileSetup({ onCreated }) {
  const { t } = useTranslation();
  const toast = useToast();
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [name, setName] = useState('');
  const [tag, setTag] = useState('');
  const [tagStatus, setTagStatus] = useState(null); // null | 'checking' | 'available' | 'taken'
  const [description, setDescription] = useState('');
  const [profileImageUri, setProfileImageUri] = useState(null);
  const [profileType, setProfileType] = useState('chef'); // 'chef' or 'huis'
  const [instagram, setInstagram] = useState('');
  const [tiktok, setTiktok] = useState('');
  const [website, setWebsite] = useState('');
  const [saving, setSaving] = useState(false);

  const checkTag = async (value) => {
    const cleaned = value.replace(/[^a-z0-9._-]/gi, '').toLowerCase();
    setTag(cleaned);
    if (cleaned.length < 2) {
      setTagStatus(null);
      return;
    }
    setTagStatus('checking');
    const available = await isTagAvailable(cleaned);
    setTagStatus(available ? 'available' : 'taken');
  };

  const handlePickImage = async () => {
    lightHaptic();
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        toast.error(t('common.permissionRequired') || 'Toestemming nodig');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });
      if (!result.canceled && result.assets[0]) {
        setProfileImageUri(result.assets[0].uri);
      }
    } catch {
      toast.error(t('userRecipes.imagePickError') || 'Kon foto niet laden');
    }
  };

  const handleSubmit = async () => {
    const trimmedName = name.trim();
    const trimmedTag = tag.trim().toLowerCase();

    if (!trimmedName) {
      toast.error(t('chef.chefName') + ' ' + (t('common.required') || 'is verplicht'));
      return;
    }
    if (trimmedTag.length < 2) {
      toast.error(t('chef.tag') + ' ' + (t('common.required') || 'is verplicht'));
      return;
    }
    if (tagStatus === 'taken') {
      toast.error(t('chef.tagTaken') || 'Deze tag is al bezet');
      return;
    }

    setSaving(true);
    lightHaptic();
    try {
      let imageUrl = null;
      if (profileImageUri) {
        const upload = await uploadRecipeImage(profileImageUri);
        if (upload.success) imageUrl = upload.url;
      }

      const links = {};
      if (instagram.trim()) links.instagram = instagram.trim();
      if (tiktok.trim()) links.tiktok = tiktok.trim();
      if (website.trim()) links.website = website.trim();

      const result = await createChefProfile({
        name: trimmedName,
        tag: trimmedTag,
        description: description.trim() || null,
        profile_image: imageUrl,
        links,
        profile_type: profileType,
      });

      if (result.success) {
        successHaptic();
        toast.success(t('chef.profileCreated') || 'Chef profiel aangemaakt!');
        onCreated?.(result.chef);
      } else {
        toast.error(result.error || 'Kon profiel niet aanmaken');
      }
    } catch (e) {
      toast.error(e?.message || 'Er is iets misgegaan');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <Pressable style={{ flex: 1 }} onPress={Keyboard.dismiss}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Header */}
            <View style={styles.header}>
              <MaterialCommunityIcons name="chef-hat" size={48} color={theme.colors.secondary} />
              <Text style={styles.title}>{t('chef.becomeChef') || 'Word een Chef'}</Text>
              <Text style={styles.subtitle}>
                {t('chef.createProfileSubtitle') || 'Maak je chef profiel aan en deel je recepten met iedereen'}
              </Text>
            </View>

            {/* Profile Type Selector */}
            <Text style={styles.label}>{t('chef.profileType') || 'Profiel type'}</Text>
            <View style={styles.typeSelector}>
              <TouchableOpacity
                style={[styles.typeOption, profileType === 'chef' && styles.typeOptionActive]}
                onPress={() => { lightHaptic(); setProfileType('chef'); }}
                activeOpacity={0.8}
              >
                <MaterialCommunityIcons name="account" size={24} color={profileType === 'chef' ? theme.colors.textInverse : theme.colors.primary} />
                <Text style={[styles.typeOptionTitle, profileType === 'chef' && styles.typeOptionTitleActive]}>
                  {t('chef.profileTypeChef') || 'Chef'}
                </Text>
                <Text style={[styles.typeOptionDesc, profileType === 'chef' && styles.typeOptionDescActive]}>
                  {t('chef.profileTypeChefDesc') || 'Post voor jezelf'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.typeOption, profileType === 'huis' && styles.typeOptionActive]}
                onPress={() => { lightHaptic(); setProfileType('huis'); }}
                activeOpacity={0.8}
              >
                <MaterialCommunityIcons name="home-group" size={24} color={profileType === 'huis' ? theme.colors.textInverse : theme.colors.primary} />
                <Text style={[styles.typeOptionTitle, profileType === 'huis' && styles.typeOptionTitleActive]}>
                  {t('chef.profileTypeHuis') || 'Huis'}
                </Text>
                <Text style={[styles.typeOptionDesc, profileType === 'huis' && styles.typeOptionDescActive]}>
                  {t('chef.profileTypeHuisDesc') || 'Post voor je huis'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Profile Image */}
            <TouchableOpacity style={styles.imagePicker} onPress={handlePickImage} activeOpacity={0.8}>
              {profileImageUri ? (
                <Image source={{ uri: profileImageUri }} style={styles.imagePreview} />
              ) : (
                <View style={styles.imagePlaceholder}>
                  <Feather name="camera" size={32} color={theme.colors.primary} />
                  <Text style={styles.imagePlaceholderText}>{t('chef.profileImage') || 'Profielfoto'}</Text>
                </View>
              )}
            </TouchableOpacity>

            {/* Name */}
            <Text style={styles.label}>
              {profileType === 'huis'
                ? (t('chef.houseName') || 'Huis naam')
                : (t('chef.chefName') || 'Chef naam')}
            </Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder={profileType === 'huis' ? 'Bijv. Huis Van der Berg' : 'Bijv. Chef Maria'}
              placeholderTextColor={theme.colors.textPlaceholder}
              maxLength={50}
            />

            {/* Tag */}
            <Text style={styles.label}>{t('chef.tag') || 'Gebruikersnaam (@tag)'}</Text>
            <View style={styles.tagRow}>
              <Text style={styles.tagAt}>@</Text>
              <TextInput
                style={[styles.input, styles.tagInput]}
                value={tag}
                onChangeText={checkTag}
                placeholder="jouw_tag"
                placeholderTextColor={theme.colors.textPlaceholder}
                autoCapitalize="none"
                maxLength={30}
              />
              {tagStatus === 'checking' && <ActivityIndicator size="small" color={theme.colors.primary} style={styles.tagIndicator} />}
              {tagStatus === 'available' && <Feather name="check-circle" size={18} color={theme.colors.success} style={styles.tagIndicator} />}
              {tagStatus === 'taken' && <Feather name="x-circle" size={18} color={theme.colors.error} style={styles.tagIndicator} />}
            </View>
            {tagStatus === 'taken' && (
              <Text style={styles.tagTaken}>{t('chef.tagTaken') || 'Deze tag is al bezet'}</Text>
            )}

            {/* Description */}
            <Text style={styles.label}>
              {profileType === 'huis'
                ? (t('chef.descriptionHuis') || 'Over jullie')
                : (t('chef.description') || 'Over jou')}
            </Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder={profileType === 'huis'
                ? (t('chef.descriptionPlaceholderHuis') || 'Vertel iets over jullie huis...')
                : (t('chef.descriptionPlaceholder') || 'Vertel iets over jezelf...')}
              placeholderTextColor={theme.colors.textPlaceholder}
              multiline
              numberOfLines={3}
              maxLength={300}
            />

            {/* Social Links */}
            <Text style={styles.label}>{t('chef.socialLinks') || 'Sociale links (optioneel)'}</Text>
            <View style={styles.socialRow}>
              <Feather name="instagram" size={18} color={theme.colors.primary} style={styles.socialIcon} />
              <TextInput
                style={[styles.input, styles.socialInput]}
                value={instagram}
                onChangeText={setInstagram}
                placeholder="@instagram"
                placeholderTextColor={theme.colors.textPlaceholder}
                autoCapitalize="none"
              />
            </View>
            <View style={styles.socialRow}>
              <MaterialCommunityIcons name="music-note" size={18} color={theme.colors.primary} style={styles.socialIcon} />
              <TextInput
                style={[styles.input, styles.socialInput]}
                value={tiktok}
                onChangeText={setTiktok}
                placeholder="@tiktok"
                placeholderTextColor={theme.colors.textPlaceholder}
                autoCapitalize="none"
              />
            </View>
            <View style={styles.socialRow}>
              <Feather name="globe" size={18} color={theme.colors.primary} style={styles.socialIcon} />
              <TextInput
                style={[styles.input, styles.socialInput]}
                value={website}
                onChangeText={setWebsite}
                placeholder="website.com"
                placeholderTextColor={theme.colors.textPlaceholder}
                autoCapitalize="none"
                keyboardType="url"
              />
            </View>

            {/* Submit */}
            <TouchableOpacity
              style={[styles.submitBtn, saving && styles.submitBtnDisabled]}
              onPress={handleSubmit}
              disabled={saving}
              activeOpacity={0.8}
            >
              {saving ? (
                <ActivityIndicator color={theme.colors.textInverse} />
              ) : (
                <Text style={styles.submitBtnText}>{t('chef.createProfile') || 'Chef profiel aanmaken'}</Text>
              )}
            </TouchableOpacity>

            <View style={{ height: 40 }} />
          </ScrollView>
        </Pressable>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const createStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 28,
  },
  title: {
    fontSize: theme.typography.fontSize['3xl'] + 2,
    fontWeight: '700',
    color: theme.colors.text,
    marginTop: 12,
  },
  subtitle: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.primary,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 20,
  },
  label: {
    fontSize: theme.typography.fontSize.sm + 1,
    fontWeight: '600',
    color: theme.colors.primary,
    marginBottom: 6,
    marginTop: 16,
  },
  typeSelector: {
    flexDirection: 'row',
    gap: 12,
  },
  typeOption: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: theme.borderRadius.base,
    backgroundColor: theme.colors.modal,
    borderWidth: 2,
    borderColor: theme.colors.border,
  },
  typeOptionActive: {
    backgroundColor: theme.colors.secondary,
    borderColor: theme.colors.secondary,
  },
  typeOptionTitle: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: '700',
    color: theme.colors.text,
    marginTop: 6,
  },
  typeOptionTitleActive: {
    color: theme.colors.textInverse,
  },
  typeOptionDesc: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.primary,
    marginTop: 2,
  },
  typeOptionDescActive: {
    color: 'rgba(255,255,255,0.8)',
  },
  imagePicker: {
    alignSelf: 'center',
    marginTop: 20,
    marginBottom: 8,
  },
  imagePreview: {
    width: 100,
    height: 100,
    borderRadius: theme.borderRadius.full,
    borderWidth: 3,
    borderColor: theme.colors.secondary,
  },
  imagePlaceholder: {
    width: 100,
    height: 100,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.borderSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: theme.colors.border,
    borderStyle: 'dashed',
  },
  imagePlaceholderText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.primary,
    marginTop: 4,
  },
  input: {
    backgroundColor: theme.colors.modal,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tagAt: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: '600',
    color: theme.colors.primary,
    marginRight: 6,
  },
  tagInput: {
    flex: 1,
  },
  tagIndicator: {
    marginLeft: 8,
  },
  tagTaken: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.error,
    marginTop: 4,
  },
  socialRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  socialIcon: {
    marginRight: 10,
    width: 20,
  },
  socialInput: {
    flex: 1,
  },
  submitBtn: {
    backgroundColor: theme.colors.secondary,
    borderRadius: theme.borderRadius.base,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 28,
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    color: theme.colors.textInverse,
    fontSize: theme.typography.fontSize.lg,
    fontWeight: '700',
  },
});
