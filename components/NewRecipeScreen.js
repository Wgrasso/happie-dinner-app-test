import React, { useState, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Alert,
  Keyboard,
  Pressable,
} from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useTranslation } from 'react-i18next';
import { Feather } from '@expo/vector-icons';
import { lightHaptic, successHaptic } from '../lib/haptics';
import { useToast } from './ui/Toast';
import { addUserRecipe } from '../lib/userRecipesService';
import { uploadRecipeImage } from '../lib/recipeImageService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const MAX_CONTENT_WIDTH = 560;

/* ──────────────────────────────────────────────
   FormInput — soft filled input with icon + focus glow
   ────────────────────────────────────────────── */
function FormInput({ label, icon, suffix, multiline, inputProps, style }) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={[fi.wrapper, style]}>
      {label ? <Text style={fi.label}>{label}</Text> : null}
      <View style={[fi.row, focused && fi.rowFocused]}>
        <View style={fi.iconBox}>
          <Feather name={icon} size={17} color={focused ? '#8B7355' : '#B0A392'} />
        </View>
        <TextInput
          style={[fi.input, multiline && fi.textArea]}
          placeholderTextColor="#C4BAB0"
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          multiline={multiline}
          {...inputProps}
        />
        {suffix && <View style={fi.suffixBox}>{suffix}</View>}
      </View>
    </View>
  );
}

const fi = StyleSheet.create({
  wrapper: { marginBottom: 18 },
  label: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    color: '#6B5D4D',
    marginBottom: 7,
    marginLeft: 2,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0EBE5',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  rowFocused: {
    borderColor: '#C9B99A',
    backgroundColor: '#FFFCF7',
    shadowColor: '#8B7355',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  iconBox: {
    width: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    color: '#3D3227',
    paddingVertical: Platform.OS === 'ios' ? 15 : 13,
    paddingRight: 16,
  },
  textArea: {
    minHeight: 105,
    textAlignVertical: 'top',
    paddingTop: Platform.OS === 'ios' ? 15 : 13,
  },
  suffixBox: {
    paddingRight: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

/* ──────────────────────────────────────────────
   Animated Primary Button
   ────────────────────────────────────────────── */
function PrimaryButton({ onPress, disabled, saving, label }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const onPressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.965,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  };

  const onPressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        style={[pb.btn, disabled && pb.btnDisabled]}
        onPress={onPress}
        disabled={disabled}
        activeOpacity={0.85}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        accessibilityRole="button"
        accessibilityLabel={label}
      >
        {saving ? (
          <ActivityIndicator color="#FFF" size="small" />
        ) : (
          <Text style={pb.text}>{label}</Text>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

const pb = StyleSheet.create({
  btn: {
    backgroundColor: '#8B7355',
    height: 56,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#6B5640',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  btnDisabled: { opacity: 0.5 },
  text: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
});

/* ──────────────────────────────────────────────
   Main Screen
   ────────────────────────────────────────────── */
export default function NewRecipeScreen({ navigation }) {
  const { t } = useTranslation();
  const toast = useToast();
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [cookingTime, setCookingTime] = useState('30');
  const [cuisine, setCuisine] = useState('');
  const [imageUri, setImageUri] = useState(null);

  /* ── image picker ── */
  const pickFromGallery = async () => {
    lightHaptic();
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert(
          t('common.permissionRequired') || 'Toestemming nodig',
          t('userRecipes.photoPermission') || 'Geef toegang tot je fotobibliotheek om een foto te kiezen.',
        );
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.7,
      });
      if (!result.canceled && result.assets[0]) setImageUri(result.assets[0].uri);
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
          t('userRecipes.cameraPermission') || 'Geef toegang tot je camera om een foto te maken.',
        );
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.7,
      });
      if (!result.canceled && result.assets[0]) setImageUri(result.assets[0].uri);
    } catch {
      toast.error(t('userRecipes.imagePickError') || 'Kon foto niet maken');
    }
  };

  /* ── submit ── */
  const handleSubmit = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      toast.error(t('userRecipes.nameRequired') || 'Naam is verplicht');
      return;
    }
    setSaving(true);
    lightHaptic();
    try {
      let finalImageUrl = null;
      if (imageUri) {
        const upload = await uploadRecipeImage(imageUri);
        if (upload.success) finalImageUrl = upload.url;
        else console.warn('Image upload failed:', upload.error);
      }
      const result = await addUserRecipe({
        name: trimmedName,
        description: description.trim() || null,
        cooking_time_minutes: parseInt(cookingTime, 10) || 30,
        cuisine_type: cuisine.trim() || null,
        image: finalImageUrl,
      });
      if (result.success) {
        successHaptic();
        toast.success(t('userRecipes.added') || 'Recept toegevoegd!');
        navigation.goBack();
      } else {
        toast.error(result.error || 'Kon recept niet toevoegen');
      }
    } catch (e) {
      toast.error(e?.message || 'Er is iets misgegaan');
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    lightHaptic();
    navigation.goBack();
  };

  /* ── render ── */
  return (
    <SafeAreaView style={s.safe}>
    <Pressable style={s.flex} onPress={Keyboard.dismiss} accessible={false}>
      <KeyboardAvoidingView
        style={s.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* ─── Floating back button ─── */}
        <View style={s.headerRow}>
          <TouchableOpacity
            style={s.backBtn}
            onPress={handleBack}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Feather name="arrow-left" size={20} color="#7A6B57" />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={s.scroll}
          contentContainerStyle={s.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          bounces
        >
          <View style={s.inner}>
            {/* ─── Title + subtitle (above photo) ─── */}
            <View style={s.titleBlock}>
              <Text style={s.title}>
                {t('userRecipes.newRecipeTitle') || 'Nieuw recept'}
              </Text>
              <Text style={s.subtitle}>
                {t('userRecipes.creatingNew') || 'Je maakt een nieuw recept aan'}
              </Text>
            </View>

            {/* ─── Fields ─── */}
            <FormInput
              label={t('userRecipes.name') || 'Naam'}
              icon="edit-3"
              inputProps={{
                value: name,
                onChangeText: setName,
                placeholder: t('userRecipes.namePlaceholder') || 'bijv. Pasta Carbonara',
                autoFocus: true,
                returnKeyType: 'next',
              }}
            />

            <FormInput
              label={t('userRecipes.description') || 'Omschrijving'}
              icon="align-left"
              multiline
              inputProps={{
                value: description,
                onChangeText: setDescription,
                placeholder: t('userRecipes.descriptionPlaceholder') || 'Korte omschrijving van je recept',
                numberOfLines: 3,
              }}
            />

            {/* Cooking time + Cuisine — side by side */}
            <View style={s.row}>
              <FormInput
                label={t('userRecipes.cookingTime') || 'Bereidingstijd'}
                icon="clock"
                suffix={<Text style={s.suffixLabel}>min</Text>}
                style={s.rowHalf}
                inputProps={{
                  value: cookingTime,
                  onChangeText: setCookingTime,
                  placeholder: '30',
                  keyboardType: 'number-pad',
                  maxLength: 4,
                  returnKeyType: 'next',
                }}
              />
              <FormInput
                label={t('userRecipes.cuisine') || 'Keuken'}
                icon="globe"
                suffix={<Feather name="chevron-down" size={16} color="#B5A898" />}
                style={s.rowHalf}
                inputProps={{
                  value: cuisine,
                  onChangeText: setCuisine,
                  placeholder: t('userRecipes.cuisinePlaceholder') || 'bijv. Italiaans',
                  returnKeyType: 'done',
                }}
              />
            </View>

            {/* ─── Photo area ─── */}
            {imageUri ? (
              <View style={ip.filledWrap}>
                <ExpoImage
                  source={{ uri: imageUri }}
                  style={ip.filledImage}
                  contentFit="cover"
                  transition={200}
                />
                <View style={ip.filledOverlay}>
                  <TouchableOpacity
                    style={ip.changeBtn}
                    onPress={pickFromGallery}
                    activeOpacity={0.8}
                  >
                    <Feather name="repeat" size={14} color="#FFF" />
                    <Text style={ip.changeBtnText}>
                      {t('userRecipes.changePhoto') || 'Wijzig'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={ip.removeBtn}
                    onPress={() => setImageUri(null)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Feather name="trash-2" size={15} color="#FFF" />
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View style={ip.emptyRow}>
                <TouchableOpacity
                  style={ip.emptyBtn}
                  onPress={pickFromCamera}
                  activeOpacity={0.8}
                >
                  <Feather name="camera" size={18} color="#8B7355" />
                  <Text style={ip.emptyBtnText}>
                    {t('userRecipes.camera') || 'Camera'}
                  </Text>
                </TouchableOpacity>

                <View style={ip.emptyDivider} />

                <TouchableOpacity
                  style={ip.emptyBtn}
                  onPress={pickFromGallery}
                  activeOpacity={0.8}
                >
                  <Feather name="image" size={18} color="#8B7355" />
                  <Text style={ip.emptyBtnText}>
                    {t('userRecipes.gallery') || 'Gallerij'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* ─── Submit ─── */}
            <View style={{ marginTop: 6 }}>
              <PrimaryButton
                onPress={handleSubmit}
                disabled={saving}
                saving={saving}
                label={t('userRecipes.createRecipe') || 'Recept aanmaken'}
              />
            </View>

            <View style={{ height: 72 }} />
          </View>
        </ScrollView>
        </KeyboardAvoidingView>
      </Pressable>
    </SafeAreaView>
  );
}

/* ──────────────────────────────────────────────
   Screen styles
   ────────────────────────────────────────────── */
const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FAF7F3' },
  flex: { flex: 1 },

  /* Header */
  headerRow: {
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 4 : 10,
    paddingBottom: 4,
  },
  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#EDE8E1',
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* Scroll */
  scroll: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    paddingBottom: 24,
  },
  inner: {
    width: '100%',
    maxWidth: MAX_CONTENT_WIDTH,
    paddingHorizontal: 22,
  },

  /* Title */
  titleBlock: {
    marginTop: 6,
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontFamily: 'PlayfairDisplay_700Bold',
    color: '#3D3227',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: '#9B8E7E',
    lineHeight: 20,
  },

  /* Row layout */
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  rowHalf: {
    flex: 1,
    marginBottom: 18,
  },

  /* Suffix */
  suffixLabel: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    color: '#A89880',
  },
});

/* ──────────────────────────────────────────────
   Image picker styles
   ────────────────────────────────────────────── */
const ip = StyleSheet.create({
  /* ── Filled (has image) ── */
  filledWrap: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 24,
    marginTop: 4,
  },
  filledImage: {
    width: '100%',
    height: 210,
  },
  filledOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: 'rgba(0,0,0,0.30)',
  },
  changeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.22)',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 12,
    gap: 6,
  },
  changeBtnText: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    color: '#FFF',
  },
  removeBtn: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* ── Empty (no image) ── */
  emptyRow: {
    flexDirection: 'row',
    borderRadius: 16,
    backgroundColor: '#EDE8E1',
    borderWidth: 1,
    borderColor: '#DDD7CF',
    marginBottom: 26,
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
  emptyDivider: {
    width: 1,
    backgroundColor: '#DDD7CF',
    marginVertical: 10,
  },
  emptyBtnText: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: '#6B5D4D',
  },
});
