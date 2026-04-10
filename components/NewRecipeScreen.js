import React, { useState, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Feather } from '@expo/vector-icons';
import { lightHaptic, successHaptic } from '../lib/haptics';
import { useToast } from './ui/Toast';
import { addUserRecipe } from '../lib/userRecipesService';
import { uploadRecipeImage } from '../lib/recipeImageService';
import { importRecipeFromUrl } from '../lib/recipeUrlImporter';
import { useTheme } from '../lib/ThemeContext';
import PhotoPickerCard from './ui/PhotoPickerCard';
import Input from './ui/Input';
import PrimaryButton from './ui/PrimaryButton';
import SecondaryButton from './ui/SecondaryButton';
import ListEditor from './ui/ListEditor';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const MAX_CONTENT_WIDTH = 560;

/* ──────────────────────────────────────────────
   Main Screen
   ────────────────────────────────────────────── */
export default function NewRecipeScreen({ navigation }) {
  const { t } = useTranslation();
  const toast = useToast();
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { s, imp } = styles;

  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [cookingTime, setCookingTime] = useState('30');
  const [cuisine, setCuisine] = useState('');
  const [imageUri, setImageUri] = useState(null);
  const [ingredients, setIngredients] = useState(['']);
  const [steps, setSteps] = useState(['']);
  const [urlInput, setUrlInput] = useState('');
  const [importing, setImporting] = useState(false);
  // Form is hidden by default — URL import is the primary path.
  // Shown after a successful import or when the user explicitly picks manual.
  const [showForm, setShowForm] = useState(false);

  /* ── import from URL ── */
  const handleImport = async () => {
    const url = urlInput.trim();
    if (!url) {
      toast.error(t('userRecipes.urlRequired') || 'Voer een link in');
      return;
    }
    setImporting(true);
    lightHaptic();
    try {
      const result = await importRecipeFromUrl(url);
      if (!result.success) {
        toast.error(result.error || 'Kon recept niet importeren');
        return;
      }
      const r = result.recipe;
      if (r.name) setName(r.name);
      if (r.description) setDescription(r.description);
      if (r.cooking_time_minutes) setCookingTime(String(r.cooking_time_minutes));
      if (r.cuisine_type) setCuisine(r.cuisine_type);
      if (r.image) setImageUri(r.image);
      setIngredients(r.ingredients?.length ? r.ingredients : ['']);
      setSteps(r.steps?.length ? r.steps : ['']);
      setShowForm(true);
      successHaptic();
      if (result.partial) {
        toast.success(
          t('userRecipes.importedPartial') ||
            'Deels geïmporteerd — vul de rest zelf aan',
        );
      } else {
        toast.success(t('userRecipes.imported') || 'Recept geïmporteerd!');
      }
    } catch (e) {
      toast.error(e?.message || 'Kon recept niet importeren');
    } finally {
      setImporting(false);
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
        // Remote URLs (from URL import) are saved directly. Only local URIs
        // (from camera/gallery) need uploading to Supabase storage.
        if (/^https?:\/\//i.test(imageUri)) {
          finalImageUrl = imageUri;
        } else {
          const upload = await uploadRecipeImage(imageUri);
          if (upload.success) finalImageUrl = upload.url;
          else console.warn('Image upload failed:', upload.error);
        }
      }
      const cleanedIngredients = ingredients
        .map((i) => (i || '').trim())
        .filter(Boolean);
      const cleanedSteps = steps.map((s) => (s || '').trim()).filter(Boolean);
      const result = await addUserRecipe({
        name: trimmedName,
        description: description.trim() || null,
        cooking_time_minutes: parseInt(cookingTime, 10) || 30,
        cuisine_type: cuisine.trim() || null,
        image: finalImageUrl,
        ingredients: cleanedIngredients,
        steps: cleanedSteps,
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
            <Feather name="arrow-left" size={20} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={s.scroll}
          contentContainerStyle={s.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="always"
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

            {/* ─── Import from URL (primary shortcut) ─── */}
            <View style={imp.card}>
              <View style={imp.headerRow}>
                <View style={imp.iconCircle}>
                  <Feather name="link" size={15} color={theme.colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={imp.title}>
                    {t('userRecipes.importTitle') || 'Importeer van website'}
                  </Text>
                  <Text style={imp.subtitle}>
                    {t('userRecipes.importSubtitle') ||
                      'Plak een recept-link en wij vullen alles in'}
                  </Text>
                </View>
              </View>
              <View style={imp.inputRow}>
                <TextInput
                  style={imp.input}
                  placeholder="https://..."
                  placeholderTextColor={theme.colors.textPlaceholder}
                  value={urlInput}
                  onChangeText={setUrlInput}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="url"
                  returnKeyType="go"
                  onSubmitEditing={handleImport}
                  editable={!importing}
                />
                <TouchableOpacity
                  style={[imp.btn, importing && imp.btnDisabled]}
                  onPress={handleImport}
                  disabled={importing}
                  activeOpacity={0.85}
                  accessibilityRole="button"
                  accessibilityLabel={t('userRecipes.import') || 'Importeer'}
                >
                  {importing ? (
                    <ActivityIndicator size="small" color={theme.colors.textInverse} />
                  ) : (
                    <Feather name="download" size={16} color={theme.colors.textInverse} />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* ─── Enter manually (only when form hidden) ─── */}
            {!showForm && (
              <SecondaryButton
                icon="edit-3"
                underline
                label={t('userRecipes.enterManually') || 'Of voer handmatig in'}
                onPress={() => setShowForm(true)}
              />
            )}

            {/* ─── Manual form (hidden until import succeeds or user opts in) ─── */}
            {showForm && (<>
            <Input
              label={t('userRecipes.name') || 'Naam'}
              icon="edit-3"
              value={name}
              onChangeText={setName}
              placeholder={t('userRecipes.namePlaceholder') || 'bijv. Pasta Carbonara'}
              autoFocus
              returnKeyType="next"
            />

            <Input
              label={t('userRecipes.description') || 'Omschrijving'}
              icon="align-left"
              multiline
              value={description}
              onChangeText={setDescription}
              placeholder={t('userRecipes.descriptionPlaceholder') || 'Korte omschrijving van je recept'}
              numberOfLines={3}
            />

            {/* Cooking time + Cuisine — side by side */}
            <View style={s.row}>
              <Input
                label={t('userRecipes.cookingTime') || 'Bereidingstijd'}
                icon="clock"
                suffix={<Text style={s.suffixLabel}>min</Text>}
                style={s.rowHalf}
                value={cookingTime}
                onChangeText={setCookingTime}
                placeholder="30"
                keyboardType="number-pad"
                maxLength={4}
                returnKeyType="next"
              />
              <Input
                label={t('userRecipes.cuisine') || 'Keuken'}
                icon="globe"
                suffix={<Feather name="chevron-down" size={16} color={theme.colors.textPlaceholder} />}
                style={s.rowHalf}
                value={cuisine}
                onChangeText={setCuisine}
                placeholder={t('userRecipes.cuisinePlaceholder') || 'bijv. Italiaans'}
                returnKeyType="done"
              />
            </View>

            {/* ─── Photo area (shared component) ─── */}
            <View style={{ marginBottom: 24, marginTop: 4 }}>
              <PhotoPickerCard
                value={imageUri}
                onChange={setImageUri}
                showCameraOption={!imageUri}
              />
            </View>

            {/* ─── Ingredients ─── */}
            <ListEditor
              label={t('userRecipes.ingredients') || 'Ingrediënten'}
              items={ingredients}
              onChange={setIngredients}
              placeholder={t('userRecipes.ingredientPlaceholder') || 'bijv. 200g pasta'}
              addLabel={t('userRecipes.addIngredient') || 'Ingrediënt toevoegen'}
            />

            {/* ─── Steps ─── */}
            <ListEditor
              label={t('userRecipes.steps') || 'Stappen'}
              items={steps}
              onChange={setSteps}
              placeholder={t('userRecipes.stepPlaceholder') || 'Beschrijf stap'}
              addLabel={t('userRecipes.addStep') || 'Stap toevoegen'}
              numbered
              multiline
            />

            {/* ─── Submit ─── */}
            <View style={{ marginTop: 6 }}>
              <PrimaryButton
                onPress={handleSubmit}
                loading={saving}
                label={t('userRecipes.createRecipe') || 'Recept aanmaken'}
              />
            </View>
            </>)}

            <View style={{ height: 72 }} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/* ──────────────────────────────────────────────
   Themed stylesheets (consumed via useMemo)
   ────────────────────────────────────────────── */
const createStyles = (theme) => ({
  s: StyleSheet.create({
    safe: { flex: 1, backgroundColor: theme.colors.background },
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
      backgroundColor: theme.colors.surfaceAlt,
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
      color: theme.colors.text,
      marginBottom: 4,
    },
    subtitle: {
      fontSize: 14,
      fontFamily: 'Inter_400Regular',
      color: theme.colors.textTertiary,
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
      color: theme.colors.textTertiary,
    },
  }),

  /* ── URL import card ── */
  imp: StyleSheet.create({
    card: {
      backgroundColor: theme.colors.card,
      borderRadius: 20,
      borderWidth: 1.5,
      borderColor: theme.colors.border,
      padding: 16,
      marginBottom: 24,
      shadowColor: theme.colors.primary,
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.06,
      shadowRadius: 10,
      elevation: 2,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      marginBottom: 14,
    },
    iconCircle: {
      width: 34,
      height: 34,
      borderRadius: 12,
      backgroundColor: theme.colors.surfaceAlt,
      alignItems: 'center',
      justifyContent: 'center',
    },
    title: {
      fontSize: 14,
      fontFamily: 'Inter_600SemiBold',
      color: theme.colors.text,
      marginBottom: 2,
    },
    subtitle: {
      fontSize: 12,
      fontFamily: 'Inter_400Regular',
      color: theme.colors.textTertiary,
      lineHeight: 16,
    },
    inputRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    input: {
      flex: 1,
      backgroundColor: theme.colors.surfaceAlt,
      borderRadius: 14,
      paddingHorizontal: 14,
      paddingVertical: Platform.OS === 'ios' ? 13 : 10,
      fontSize: 14,
      fontFamily: 'Inter_400Regular',
      color: theme.colors.text,
    },
    btn: {
      width: 48,
      height: 46,
      borderRadius: 14,
      backgroundColor: theme.colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    btnDisabled: { opacity: 0.6 },
  }),

});
