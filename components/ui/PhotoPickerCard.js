import React, { useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Feather } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../lib/ThemeContext';
import { lightHaptic } from '../../lib/haptics';
import { useToast } from './Toast';

/**
 * PhotoPickerCard
 *
 * A hero-sized 16:9 photo picker card for recipe forms. Handles three states:
 *   1. Empty → dashed border + "Add photo" hint + camera/gallery action
 *   2. Remote image (from URL import) → image + "Tap to change" overlay + remove button
 *   3. Local image (from camera/gallery) → same overlay
 *
 * Exposes a single `onChange(uri)` callback. Parent decides whether to upload
 * the URI to storage or keep a remote URL as-is.
 *
 * Props:
 *   value?: string | null      — current image URI (local or remote)
 *   onChange: (uri|null) => void
 *   aspectRatio?: number       — defaults to 16/9
 *   showCameraOption?: boolean — if true, empty state shows camera + gallery side by side
 */
export default function PhotoPickerCard({
  value,
  onChange,
  aspectRatio = 16 / 9,
  showCameraOption = false,
}) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const toast = useToast();
  const styles = useMemo(
    () => createStyles(theme, aspectRatio),
    [theme, aspectRatio],
  );

  const pickFromGallery = async () => {
    lightHaptic();
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert(
          t('common.permissionRequired') || 'Toestemming nodig',
          t('userRecipes.photoPermission') ||
            'Geef toegang tot je fotobibliotheek om een foto te kiezen.',
        );
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.7,
      });
      if (!result.canceled && result.assets[0]) {
        onChange(result.assets[0].uri);
      }
    } catch {
      toast.error(t('userRecipes.imagePickError') || 'Kon foto niet laden');
    }
  };

  const pickFromCamera = async () => {
    lightHaptic();
    try {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) {
        Alert.alert(
          t('common.permissionRequired') || 'Toestemming nodig',
          t('userRecipes.cameraPermission') ||
            'Geef toegang tot je camera om een foto te maken.',
        );
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.7,
      });
      if (!result.canceled && result.assets[0]) {
        onChange(result.assets[0].uri);
      }
    } catch {
      toast.error(t('userRecipes.imagePickError') || 'Kon foto niet maken');
    }
  };

  // ── Filled state ──
  if (value) {
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={pickFromGallery}
        activeOpacity={0.9}
        accessibilityRole="button"
        accessibilityLabel={t('userRecipes.changePhoto') || 'Wijzig foto'}
      >
        <Image source={{ uri: value }} style={styles.image} />
        <View style={styles.overlay}>
          <View style={styles.overlayPill}>
            <Feather name="camera" size={14} color={theme.colors.textInverse} />
            <Text style={styles.overlayPillText}>
              {t('userRecipes.changePhoto') || 'Tik om te wijzigen'}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.removeBtn}
            onPress={(e) => {
              e.stopPropagation();
              lightHaptic();
              onChange(null);
            }}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityLabel={t('common.delete') || 'Verwijderen'}
          >
            <Feather name="trash-2" size={14} color={theme.colors.textInverse} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  }

  // ── Empty state ──
  if (showCameraOption) {
    return (
      <View style={styles.emptyRow}>
        <TouchableOpacity
          style={styles.emptyBtn}
          onPress={pickFromCamera}
          activeOpacity={0.8}
        >
          <Feather name="camera" size={18} color={theme.colors.primary} />
          <Text style={styles.emptyBtnText}>
            {t('userRecipes.camera') || 'Camera'}
          </Text>
        </TouchableOpacity>
        <View style={styles.emptyRowDivider} />
        <TouchableOpacity
          style={styles.emptyBtn}
          onPress={pickFromGallery}
          activeOpacity={0.8}
        >
          <Feather name="image" size={18} color={theme.colors.primary} />
          <Text style={styles.emptyBtnText}>
            {t('userRecipes.gallery') || 'Galerij'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={pickFromGallery}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel={t('userRecipes.addPhoto') || 'Foto toevoegen'}
    >
      <View style={styles.empty}>
        <View style={styles.emptyIcon}>
          <Feather name="image" size={26} color={theme.colors.primary} />
        </View>
        <Text style={styles.emptyTitle}>
          {t('userRecipes.addPhoto') || 'Foto toevoegen'}
        </Text>
        <Text style={styles.emptyHint}>
          {t('userRecipes.photoHint') ||
            'Een goede foto maakt je recept aantrekkelijker'}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const createStyles = (theme, aspectRatio) =>
  StyleSheet.create({
    card: {
      width: '100%',
      aspectRatio,
      borderRadius: theme.borderRadius?.lg || 20,
      overflow: 'hidden',
      backgroundColor: theme.colors.surfaceAlt,
      borderWidth: 1.5,
      borderColor: theme.colors.border,
      borderStyle: 'dashed',
    },
    image: {
      width: '100%',
      height: '100%',
      resizeMode: 'cover',
    },
    overlay: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 10,
      backgroundColor: 'rgba(0,0,0,0.35)',
    },
    overlayPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: 'rgba(255,255,255,0.22)',
      paddingHorizontal: 12,
      paddingVertical: 7,
      borderRadius: 12,
    },
    overlayPillText: {
      fontSize: 13,
      fontWeight: '500',
      color: theme.colors.textInverse,
    },
    removeBtn: {
      width: 34,
      height: 34,
      borderRadius: 12,
      backgroundColor: 'rgba(255,255,255,0.18)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    empty: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 24,
    },
    emptyIcon: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: theme.colors.modal,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 10,
      shadowColor: theme.colors.shadowColor,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 6,
      elevation: 2,
    },
    emptyTitle: {
      fontSize: 15,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 3,
    },
    emptyHint: {
      fontSize: 12,
      color: theme.colors.textTertiary,
      textAlign: 'center',
      lineHeight: 16,
    },
    // Side-by-side camera+gallery (legacy empty state for NewRecipeScreen)
    emptyRow: {
      flexDirection: 'row',
      borderRadius: 16,
      backgroundColor: theme.colors.surfaceAlt,
      borderWidth: 1,
      borderColor: theme.colors.border,
      overflow: 'hidden',
    },
    emptyBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 18,
      gap: 8,
    },
    emptyRowDivider: {
      width: 1,
      backgroundColor: theme.colors.border,
      marginVertical: 10,
    },
    emptyBtnText: {
      fontSize: 14,
      fontWeight: '500',
      color: theme.colors.textSecondary,
    },
  });
