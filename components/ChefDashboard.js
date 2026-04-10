import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  ActivityIndicator,
  Modal,
  Animated,
  Dimensions,
  Keyboard,
  Pressable,
  Alert,
  KeyboardAvoidingView,
  Platform, SafeAreaView } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { updateChefProfile, deleteChefProfile } from '../lib/chefService';
import { getMyChefRecipes, addChefRecipe, updateChefRecipe, deleteChefRecipe, shareRecipeWithGroups } from '../lib/recipesService';
import { uploadRecipeImage } from '../lib/recipeImageService';
import { importRecipeFromUrl } from '../lib/recipeUrlImporter';
import * as Clipboard from 'expo-clipboard';
import PhotoPickerCard from './ui/PhotoPickerCard';
import FormSection from './ui/FormSection';
import PrimaryButton from './ui/PrimaryButton';
import Input from './ui/Input';
import ListEditor from './ui/ListEditor';
import EmptyState from './ui/EmptyState';
import { lightHaptic, successHaptic } from '../lib/haptics';
import { useToast } from './ui/Toast';
import { useAppState } from '../lib/AppStateContext';
import ServingSelector from './ui/ServingSelector';
import { scaleIngredients } from '../lib/ingredientScaler';
import { getRecipeExtras } from '../lib/recipeExtrasService';
import { useTheme } from '../lib/ThemeContext';


const { width } = Dimensions.get('window');
const PLACEHOLDER_IMAGE = 'https://images.unsplash.com/photo-1546548970-71785318a17b?w=400&h=300&fit=crop';

const formatTime = (minutes) => {
  if (!minutes) return '30 min';
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rem = minutes % 60;
  return rem > 0 ? `${hours}h ${rem}m` : `${hours}h`;
};

// Extract username from a URL or @handle
// "https://instagram.com/chef_maria" → "@chef_maria"
// "@chef_maria" → "@chef_maria"
// "chef_maria" → "@chef_maria"
const extractUsername = (value) => {
  if (!value) return '';
  const cleaned = value.trim().replace(/\/+$/, '');
  // If it's a URL, grab the last path segment
  const urlMatch = cleaned.match(/(?:instagram\.com|tiktok\.com|twitter\.com|x\.com)\/(?:@)?([^/?#]+)/i);
  if (urlMatch) return `@${urlMatch[1]}`;
  // If it starts with @, keep as-is
  if (cleaned.startsWith('@')) return cleaned;
  // Otherwise prepend @
  return `@${cleaned}`;
};

const UNIT_OPTIONS = ['', 'g', 'kg', 'ml', 'L', 'el', 'tl', 'stuks', 'snuf', 'scheutje', 'blik', 'zakje', 'teen', 'takje'];

const VISIBILITY_OPTIONS = [
  { key: 'private', icon: 'lock', label: 'visibilityPrivate' },
  { key: 'public', icon: 'globe', label: 'visibilityPublic' },
  { key: 'groups', icon: 'users', label: 'visibilityGroups' },
  { key: 'public_groups', icon: 'share-2', label: 'visibilityPublicGroups' },
];

export default function ChefDashboard({ chef, onChefUpdated, navigation }) {
  const { t } = useTranslation();
  const toast = useToast();
  const { groups } = useAppState();
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);

  // Add recipe form
  const [showAddForm, setShowAddForm] = useState(false);
  const [recipeName, setRecipeName] = useState('');
  const [recipeDescription, setRecipeDescription] = useState('');
  const [recipeCookingTime, setRecipeCookingTime] = useState('30');
  const [recipeCuisine, setRecipeCuisine] = useState('');
  const [recipeImageUri, setRecipeImageUri] = useState(null);
  const [recipeCost, setRecipeCost] = useState('');
  const [recipeServings, setRecipeServings] = useState('4');
  const [inputMode, setInputMode] = useState('simple'); // 'simple' or 'structured'
  const [simpleIngredients, setSimpleIngredients] = useState('');
  const [simpleSteps, setSimpleSteps] = useState('');
  const [ingredients, setIngredients] = useState([{ qty: '', unit: '', name: '' }]);
  const [editingIngIdx, setEditingIngIdx] = useState(0);
  const [steps, setSteps] = useState(['']);
  const [editingStepIdx, setEditingStepIdx] = useState(0);
  const [visibility, setVisibility] = useState('public');
  const [selectedGroups, setSelectedGroups] = useState([]);
  const [saving, setSaving] = useState(false);
  // URL import — primary path. Full form stays hidden until import succeeds
  // or the user explicitly picks manual entry.
  const [urlInput, setUrlInput] = useState('');
  const [importing, setImporting] = useState(false);
  const [showFullForm, setShowFullForm] = useState(false);
  // Accordion: only one form section expanded at a time.
  const [expandedSection, setExpandedSection] = useState('basis');
  const toggleSection = (key) => {
    lightHaptic();
    setExpandedSection((prev) => (prev === key ? null : key));
  };

  // Edit profile state
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editProfileType, setEditProfileType] = useState('chef');
  const [editInstagram, setEditInstagram] = useState('');
  const [editTiktok, setEditTiktok] = useState('');
  const [editWebsite, setEditWebsite] = useState('');
  const [editImageUri, setEditImageUri] = useState(null);
  const [savingProfile, setSavingProfile] = useState(false);

  // Edit recipe state
  const [editingRecipe, setEditingRecipe] = useState(null);
  const [showEditRecipe, setShowEditRecipe] = useState(false);
  const [editRecipeName, setEditRecipeName] = useState('');
  const [editRecipeDescription, setEditRecipeDescription] = useState('');
  const [editRecipeCookingTime, setEditRecipeCookingTime] = useState('30');
  const [editRecipeCuisine, setEditRecipeCuisine] = useState('');
  const [editRecipeCost, setEditRecipeCost] = useState('');
  const [editRecipeImageUri, setEditRecipeImageUri] = useState(null);
  const [editRecipeServings, setEditRecipeServings] = useState('4');
  const [editInputMode, setEditInputMode] = useState('simple');
  const [editSimpleIngredients, setEditSimpleIngredients] = useState('');
  const [editSimpleSteps, setEditSimpleSteps] = useState('');
  const [editIngredients, setEditIngredients] = useState([{ qty: '', unit: '', name: '' }]);
  const [editingEditIngIdx, setEditingEditIngIdx] = useState(null);
  const [editSteps, setEditSteps] = useState(['']);
  const [editingEditStepIdx, setEditingEditStepIdx] = useState(null);
  const [editRecipeVisibility, setEditRecipeVisibility] = useState('public');
  const [savingRecipeEdit, setSavingRecipeEdit] = useState(false);

  // Recipe detail modal
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [recipeModalVisible, setRecipeModalVisible] = useState(false);
  const [modalAnimation] = useState(new Animated.Value(0));
  const [servingCount, setServingCount] = useState(4);

  const loadRecipes = useCallback(async () => {
    if (!chef?.id) return;
    try {
      const result = await getMyChefRecipes(chef.id);
      if (result.success) {
        setRecipes(result.recipes || []);
      }
    } catch (e) {
      // silently fail — recipes stay as-is
    }
  }, [chef?.id]);

  useEffect(() => {
    setLoading(true);
    loadRecipes().finally(() => setLoading(false));
  }, [loadRecipes]);

  // Format a single ingredient for display
  const formatIngredient = (ing) => {
    const parts = [];
    if (ing.qty?.trim()) parts.push(ing.qty.trim());
    if (ing.unit) parts.push(ing.unit);
    parts.push(ing.name?.trim() || '');
    return parts.join(' ').trim();
  };

  // Convert structured ingredients to string array for DB
  const ingredientsToStrings = (items) =>
    items
      .filter((i) => i.name.trim())
      .map((i) => {
        const parts = [];
        if (i.qty.trim()) parts.push(i.qty.trim());
        if (i.unit) parts.push(i.unit);
        parts.push(i.name.trim());
        return parts.join(' ');
      });

  // Parse string array back to structured ingredients
  const stringsToIngredients = (arr) => {
    if (!arr || arr.length === 0) return [{ qty: '', unit: '', name: '' }];
    return arr.map((s) => {
      if (typeof s !== 'string') return { qty: '', unit: '', name: String(s) };
      const match = s.match(/^(\d+[\.,]?\d*(?:\/\d+)?)\s*(g|kg|ml|L|el|tl|stuks|snuf|scheutje|blik|zakje|teen|takje)?\s*(.*)/i);
      if (match) {
        return { qty: match[1] || '', unit: match[2] || '', name: match[3] || '' };
      }
      return { qty: '', unit: '', name: s };
    });
  };

  const resetForm = () => {
    setRecipeName('');
    setRecipeDescription('');
    setRecipeCookingTime('30');
    setRecipeCuisine('');
    setRecipeCost('');
    setRecipeServings('4');
    setInputMode('simple');
    setSimpleIngredients('');
    setSimpleSteps('');
    setIngredients([{ qty: '', unit: '', name: '' }]);
    setSteps(['']);
    setRecipeImageUri(null);
    setVisibility('public');
    setSelectedGroups([]);
    setShowAddForm(false);
    setUrlInput('');
    setShowFullForm(false);
  };

  // Paste from clipboard. If it looks like a URL, trigger import immediately.
  const handlePasteUrl = async () => {
    lightHaptic();
    try {
      const text = (await Clipboard.getStringAsync())?.trim() || '';
      if (!text) {
        toast.error(t('userRecipes.clipboardEmpty') || 'Klembord is leeg');
        return;
      }
      setUrlInput(text);
      // Auto-import if it's a plausible URL — saves a tap.
      if (/^https?:\/\/\S+\.\S+/i.test(text)) {
        // Defer so setUrlInput lands before handleImportUrl reads state.
        setTimeout(() => handleImportUrlWith(text), 0);
      }
    } catch {
      toast.error(t('userRecipes.clipboardError') || 'Kon klembord niet lezen');
    }
  };

  // Core import — accepts an explicit URL so paste-auto-import can pass the
  // fresh value without waiting for React state to settle.
  const handleImportUrlWith = async (url) => {
    const clean = (url || '').trim();
    if (!clean) {
      toast.error(t('userRecipes.urlRequired') || 'Voer een link in');
      return;
    }
    setImporting(true);
    lightHaptic();
    try {
      const result = await importRecipeFromUrl(clean);
      if (!result.success) {
        toast.error(result.error || 'Kon recept niet importeren');
        return;
      }
      const r = result.recipe;
      if (r.name) setRecipeName(r.name);
      if (r.description) setRecipeDescription(r.description);
      if (r.cooking_time_minutes) setRecipeCookingTime(String(r.cooking_time_minutes));
      if (r.cuisine_type) setRecipeCuisine(r.cuisine_type);
      if (r.image) setRecipeImageUri(r.image);
      setInputMode('simple');
      if (r.ingredients?.length) setSimpleIngredients(r.ingredients.join('\n'));
      if (r.steps?.length) setSimpleSteps(r.steps.join('\n'));
      setShowFullForm(true);
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

  // Import using whatever is currently in the URL input field.
  const handleImportUrl = () => handleImportUrlWith(urlInput);

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
        aspect: [16, 9],
        quality: 0.7,
      });
      if (!result.canceled && result.assets[0]) {
        setRecipeImageUri(result.assets[0].uri);
      }
    } catch {
      toast.error(t('userRecipes.imagePickError') || 'Kon foto niet laden');
    }
  };

  const handleAddRecipe = async () => {
    const trimmedName = recipeName.trim();
    if (!trimmedName) {
      toast.error(t('userRecipes.nameRequired') || 'Naam is verplicht');
      return;
    }
    if ((visibility === 'groups' || visibility === 'public_groups') && selectedGroups.length === 0) {
      toast.error(t('chef.selectGroups') || 'Selecteer minstens 1 groep');
      return;
    }

    setSaving(true);
    lightHaptic();
    try {
      let finalImageUrl = null;
      if (recipeImageUri) {
        // Remote URLs (from URL import) are stored as-is; only local URIs
        // (camera/gallery) need uploading to Supabase storage.
        if (/^https?:\/\//i.test(recipeImageUri)) {
          finalImageUrl = recipeImageUri;
        } else {
          const upload = await uploadRecipeImage(recipeImageUri);
          if (upload.success) finalImageUrl = upload.url;
        }
      }

      // public_groups → store as 'public' in DB (visible to everyone) AND share with groups
      const dbVisibility = visibility === 'public_groups' ? 'public' : visibility;

      const result = await addChefRecipe(chef.id, {
        name: trimmedName,
        description: recipeDescription.trim() || null,
        cooking_time_minutes: parseInt(recipeCookingTime, 10) || 30,
        cuisine_type: recipeCuisine.trim() || null,
        image: finalImageUrl,
        visibility: dbVisibility,
        estimated_cost: recipeCost.trim() || null,
        ingredients: inputMode === 'simple'
          ? simpleIngredients.split('\n').map(s => s.trim()).filter(Boolean)
          : ingredientsToStrings(ingredients),
        steps: inputMode === 'simple'
          ? simpleSteps.split('\n').map(s => s.trim()).filter(Boolean)
          : steps.filter((s) => s.trim()),
        default_servings: parseInt(recipeServings, 10) || 4,
      });

      if (result.success) {
        // If shared with groups (either 'groups' only or 'public_groups'), create the shares
        if ((visibility === 'groups' || visibility === 'public_groups') && selectedGroups.length > 0) {
          await shareRecipeWithGroups(result.recipe.id, selectedGroups);
        }
        successHaptic();
        toast.success(t('chef.recipePublished') || 'Recept gepubliceerd!');
        resetForm();
        await loadRecipes();
      } else {
        toast.error(result.error || 'Kon recept niet toevoegen');
      }
    } catch (e) {
      toast.error(e?.message || 'Er is iets misgegaan');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRecipe = (recipe) => {
    lightHaptic();
    Alert.alert(
      t('common.delete') || 'Verwijderen',
      t('userRecipes.confirmDelete', { name: recipe.name }) || `Weet je zeker dat je "${recipe.name}" wilt verwijderen?`,
      [
        { text: t('common.cancel') || 'Annuleren', style: 'cancel' },
        {
          text: t('common.delete') || 'Verwijderen',
          style: 'destructive',
          onPress: async () => {
            const result = await deleteChefRecipe(recipe.id, chef.id);
            if (result.success) {
              successHaptic();
              loadRecipes();
            } else {
              toast.error(result.error || 'Kon niet verwijderen');
            }
          },
        },
      ]
    );
  };

  const openEditProfile = () => {
    lightHaptic();
    setEditName(chef?.name || '');
    setEditDescription(chef?.description || '');
    setEditProfileType(chef?.profile_type || 'chef');
    setEditInstagram(chef?.links?.instagram || '');
    setEditTiktok(chef?.links?.tiktok || '');
    setEditWebsite(chef?.links?.website || '');
    setEditImageUri(null);
    setShowEditProfile(true);
  };

  const handlePickEditImage = async () => {
    lightHaptic();
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) return;
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });
      if (!result.canceled && result.assets[0]) {
        setEditImageUri(result.assets[0].uri);
      }
    } catch {
      toast.error(t('userRecipes.imagePickError') || 'Kon foto niet laden');
    }
  };

  const handleSaveProfile = async () => {
    const trimmedName = editName.trim();
    if (!trimmedName) {
      toast.error(t('chef.chefName') + ' ' + (t('common.required') || 'is verplicht'));
      return;
    }
    setSavingProfile(true);
    lightHaptic();
    try {
      let imageUrl = chef?.profile_image || null;
      if (editImageUri) {
        const upload = await uploadRecipeImage(editImageUri);
        if (upload.success) imageUrl = upload.url;
      }

      const links = {};
      if (editInstagram.trim()) links.instagram = editInstagram.trim();
      if (editTiktok.trim()) links.tiktok = editTiktok.trim();
      if (editWebsite.trim()) links.website = editWebsite.trim();

      const result = await updateChefProfile(chef.id, {
        name: trimmedName,
        description: editDescription.trim() || null,
        profile_image: imageUrl,
        links,
        profile_type: editProfileType,
      });

      if (result.success) {
        successHaptic();
        toast.success(t('chef.profileUpdated') || 'Profiel bijgewerkt!');
        setShowEditProfile(false);
        onChefUpdated?.(result.chef);
      } else {
        toast.error(result.error || 'Kon profiel niet bijwerken');
      }
    } catch (e) {
      toast.error(e?.message || 'Er is iets misgegaan');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleDeleteChefAccount = () => {
    lightHaptic();
    Alert.alert(
      t('chef.deleteAccount') || 'Chef profiel verwijderen',
      t('chef.deleteAccountConfirm') || 'Weet je zeker dat je je chef profiel wilt verwijderen? Al je recepten worden ook verwijderd. Dit kan niet ongedaan worden.',
      [
        { text: t('common.cancel') || 'Annuleren', style: 'cancel' },
        {
          text: t('common.delete') || 'Verwijderen',
          style: 'destructive',
          onPress: async () => {
            const result = await deleteChefProfile(chef.id);
            if (result.success) {
              successHaptic();
              toast.success(t('chef.accountDeleted') || 'Chef profiel verwijderd');
              setShowEditProfile(false);
              onChefUpdated?.(null);
            } else {
              toast.error(result.error || 'Kon profiel niet verwijderen');
            }
          },
        },
      ]
    );
  };

  const openEditRecipe = (recipe) => {
    lightHaptic();
    setEditingRecipe(recipe);
    setEditRecipeName(recipe.name || '');
    setEditRecipeDescription(recipe.description || '');
    setEditRecipeCookingTime(String(recipe.cooking_time_minutes || 30));
    setEditRecipeCuisine(recipe.cuisine_type || '');
    setEditRecipeCost(recipe.estimated_cost != null ? String(recipe.estimated_cost) : '');
    setEditRecipeImageUri(null);
    setEditRecipeServings(String(recipe.default_servings || 4));
    setEditInputMode('simple');
    setEditSimpleIngredients((recipe.ingredients || []).join('\n'));
    setEditSimpleSteps((recipe.steps || []).join('\n'));
    setEditIngredients(stringsToIngredients(recipe.ingredients));
    setEditSteps(recipe.steps && recipe.steps.length > 0 ? [...recipe.steps] : ['']);
    setEditRecipeVisibility(recipe.visibility || 'public');
    setShowEditRecipe(true);
  };

  const handlePickEditRecipeImage = async () => {
    lightHaptic();
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) return;
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.7,
      });
      if (!result.canceled && result.assets[0]) {
        setEditRecipeImageUri(result.assets[0].uri);
      }
    } catch {
      toast.error(t('userRecipes.imagePickError') || 'Kon foto niet laden');
    }
  };

  const handleSaveRecipeEdit = async () => {
    const trimmedName = editRecipeName.trim();
    if (!trimmedName) {
      toast.error(t('userRecipes.nameRequired') || 'Naam is verplicht');
      return;
    }
    setSavingRecipeEdit(true);
    lightHaptic();
    try {
      let imageUrl = editingRecipe?.image || null;
      if (editRecipeImageUri) {
        const upload = await uploadRecipeImage(editRecipeImageUri);
        if (upload.success) imageUrl = upload.url;
      }

      const result = await updateChefRecipe(editingRecipe.id, chef.id, {
        name: trimmedName,
        description: editRecipeDescription.trim() || null,
        cooking_time_minutes: parseInt(editRecipeCookingTime, 10) || 30,
        cuisine_type: editRecipeCuisine.trim() || null,
        image: imageUrl,
        visibility: editRecipeVisibility,
        estimated_cost: editRecipeCost.trim() || null,
        ingredients: editInputMode === 'simple'
          ? editSimpleIngredients.split('\n').map(s => s.trim()).filter(Boolean)
          : ingredientsToStrings(editIngredients),
        steps: editInputMode === 'simple'
          ? editSimpleSteps.split('\n').map(s => s.trim()).filter(Boolean)
          : editSteps.filter((s) => s.trim()),
      });

      if (result.success) {
        successHaptic();
        toast.success(t('chef.recipeUpdated') || 'Recept bijgewerkt!');
        setShowEditRecipe(false);
        setEditingRecipe(null);
        await loadRecipes();
      } else {
        toast.error(result.error || 'Kon recept niet bijwerken');
      }
    } catch (e) {
      toast.error(e?.message || 'Er is iets misgegaan');
    } finally {
      setSavingRecipeEdit(false);
    }
  };

  const openRecipeModal = (recipe) => {
    const extras = getRecipeExtras(recipe?.name);
    setServingCount(recipe?.default_servings || extras.default_servings);
    setSelectedRecipe(recipe);
    setRecipeModalVisible(true);
    Animated.spring(modalAnimation, {
      toValue: 1,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start();
  };

  const closeRecipeModal = () => {
    Animated.spring(modalAnimation, {
      toValue: 0,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start(() => {
      setRecipeModalVisible(false);
      setSelectedRecipe(null);
    });
  };

  const toggleGroupSelection = (groupId) => {
    lightHaptic();
    setSelectedGroups((prev) =>
      prev.includes(groupId)
        ? prev.filter((id) => id !== groupId)
        : [...prev, groupId]
    );
  };

  const getVisibilityIcon = (vis) => {
    if (vis === 'private') return 'lock';
    if (vis === 'groups') return 'users';
    return 'globe';
  };

  const getVisibilityColor = (vis) => {
    if (vis === 'private') return theme.colors.textTertiary;
    if (vis === 'groups') return '#5B9BD5';
    return theme.colors.success;
  };

  const profileTypeBadge = chef?.profile_type === 'huis' ? 'Huis' : 'Chef';

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
          {/* Chef Profile Header */}
          <View style={styles.profileHeader}>
            {chef?.profile_image ? (
              <ExpoImage
                source={{ uri: chef.profile_image }}
                style={styles.profileImage}
                contentFit="cover"
                transition={200}
              />
            ) : (
              <View style={[styles.profileImage, styles.profileImagePlaceholder]}>
                <MaterialCommunityIcons name="chef-hat" size={36} color={theme.colors.secondary} />
              </View>
            )}
            <View style={styles.profileInfo}>
              <View style={styles.nameRow}>
                <Text style={styles.profileName}>{chef?.name}</Text>
                <View style={[styles.typeBadge, chef?.profile_type === 'huis' && styles.typeBadgeHuis]}>
                  <Text style={styles.typeBadgeText}>{profileTypeBadge}</Text>
                </View>
              </View>
              <Text style={styles.profileTag}>@{chef?.tag}</Text>
              {chef?.description ? (
                <Text style={styles.profileDescription} numberOfLines={3}>{chef.description}</Text>
              ) : null}
              <TouchableOpacity style={styles.editProfileBtn} onPress={openEditProfile} activeOpacity={0.8}>
                <Feather name="edit-2" size={13} color={theme.colors.secondary} />
                <Text style={styles.editProfileBtnText}>{t('chef.editProfile') || 'Bewerken'}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Social Links */}
          {chef?.links && Object.keys(chef.links).length > 0 && (
            <View style={styles.socialLinks}>
              {chef.links.instagram && (
                <View style={styles.socialChip}>
                  <Feather name="instagram" size={13} color={theme.colors.primary} />
                  <Text style={styles.socialChipText}>{extractUsername(chef.links.instagram)}</Text>
                </View>
              )}
              {chef.links.tiktok && (
                <View style={styles.socialChip}>
                  <MaterialCommunityIcons name="music-note" size={13} color={theme.colors.primary} />
                  <Text style={styles.socialChipText}>{extractUsername(chef.links.tiktok)}</Text>
                </View>
              )}
              {chef.links.website && (
                <View style={styles.socialChip}>
                  <Feather name="globe" size={13} color={theme.colors.primary} />
                  <Text style={styles.socialChipText}>{chef.links.website}</Text>
                </View>
              )}
            </View>
          )}

          {/* Section Header: Recipes */}
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>{t('chef.myRecipes') || 'Mijn recepten'}</Text>
              <Text style={styles.sectionCount}>
                {recipes.length} {recipes.length === 1 ? 'recept' : 'recepten'}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.addBtn}
              onPress={() => {
                lightHaptic();
                if (showAddForm) {
                  // Closing: reset URL + full-form flag so next open is fresh.
                  setUrlInput('');
                  setShowFullForm(false);
                }
                setShowAddForm(!showAddForm);
              }}
              activeOpacity={0.8}
            >
              <Feather name={showAddForm ? 'x' : 'plus'} size={20} color={theme.colors.textInverse} />
            </TouchableOpacity>
          </View>

          {/* Add Recipe Form */}
          {showAddForm && (
            <View style={styles.addForm}>
              {/* ── URL import card (primary path) ── */}
              <View style={styles.importCard}>
                {/* Hero icon */}
                <View style={styles.importHero}>
                  <Feather name="link-2" size={22} color={theme.colors.secondary} />
                </View>

                <Text style={styles.importTitle}>
                  {t('userRecipes.importTitle') || 'Recept van een website?'}
                </Text>
                <Text style={styles.importSubtitle}>
                  {t('userRecipes.importSubtitle') ||
                    'Plak een link en we vullen alles automatisch in'}
                </Text>

                {/* URL input with clear button */}
                <View style={styles.importInputWrap}>
                  <Feather
                    name="link"
                    size={16}
                    color={theme.colors.textPlaceholder}
                    style={styles.importInputIcon}
                  />
                  <TextInput
                    style={styles.importInput}
                    placeholder={
                      t('userRecipes.urlPlaceholder') || 'https://ah.nl/allerhande/recept/...'
                    }
                    placeholderTextColor={theme.colors.textPlaceholder}
                    value={urlInput}
                    onChangeText={setUrlInput}
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType="url"
                    returnKeyType="go"
                    onSubmitEditing={handleImportUrl}
                    editable={!importing}
                  />
                  {urlInput.length > 0 && !importing ? (
                    <TouchableOpacity
                      onPress={() => { lightHaptic(); setUrlInput(''); }}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      style={styles.importClearBtn}
                    >
                      <Feather name="x" size={16} color={theme.colors.textPlaceholder} />
                    </TouchableOpacity>
                  ) : null}
                </View>

                {/* Paste from clipboard (quick shortcut) */}
                <TouchableOpacity
                  style={styles.importPasteBtn}
                  onPress={handlePasteUrl}
                  disabled={importing}
                  activeOpacity={0.75}
                >
                  <Feather name="clipboard" size={14} color={theme.colors.primary} />
                  <Text style={styles.importPasteBtnText}>
                    {t('userRecipes.pasteFromClipboard') || 'Plak vanaf klembord'}
                  </Text>
                </TouchableOpacity>

                {/* Big primary action button */}
                <TouchableOpacity
                  style={[
                    styles.importPrimaryBtn,
                    (importing || !urlInput.trim()) && styles.importPrimaryBtnDisabled,
                  ]}
                  onPress={handleImportUrl}
                  disabled={importing || !urlInput.trim()}
                  activeOpacity={0.85}
                  accessibilityRole="button"
                  accessibilityLabel={t('userRecipes.import') || 'Importeer recept'}
                >
                  {importing ? (
                    <>
                      <ActivityIndicator size="small" color={theme.colors.textInverse} />
                      <Text style={styles.importPrimaryBtnText}>
                        {t('userRecipes.importing') || 'Recept ophalen...'}
                      </Text>
                    </>
                  ) : (
                    <>
                      <Feather name="download" size={17} color={theme.colors.textInverse} />
                      <Text style={styles.importPrimaryBtnText}>
                        {t('userRecipes.importAction') || 'Importeer recept'}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>

                {/* Trusted sources hint */}
                <Text style={styles.importSources}>
                  {t('userRecipes.worksWith') ||
                    'Werkt met AH, Jumbo, BBC Good Food, AllRecipes en meer'}
                </Text>
              </View>

              {/* ── Divider + "Or enter manually" (only when full form hidden) ── */}
              {!showFullForm && (
                <>
                  <View style={styles.manualDivider}>
                    <View style={styles.manualDividerLine} />
                    <Text style={styles.manualDividerText}>
                      {t('userRecipes.or') || 'of'}
                    </Text>
                    <View style={styles.manualDividerLine} />
                  </View>
                  <TouchableOpacity
                    style={styles.manualBtn}
                    onPress={() => { lightHaptic(); setShowFullForm(true); }}
                    activeOpacity={0.75}
                  >
                    <Feather name="edit-3" size={15} color={theme.colors.primary} />
                    <Text style={styles.manualBtnText}>
                      {t('userRecipes.enterManually') || 'Voer handmatig in'}
                    </Text>
                  </TouchableOpacity>
                </>
              )}

              {/* ── Full form (hidden until import succeeds or user opts in) ── */}
              {showFullForm && (<>
              {/* ─── Hero photo picker (first thing after import) ─── */}
              <View style={{ marginTop: 4, marginBottom: 12 }}>
                <PhotoPickerCard
                  value={recipeImageUri}
                  onChange={setRecipeImageUri}
                />
              </View>

              {/* ═══ SECTION 1: BASIS ═══ */}
              <FormSection
                icon="file-text"
                title={t('chef.sectionBasics') || 'Basis'}
                status={recipeName.trim() ? recipeName.slice(0, 28) : undefined}
                hint={t('chef.sectionBasicsHint') || 'Naam, tijd, keuken'}
                expanded={expandedSection === 'basis'}
                onToggle={() => toggleSection('basis')}
                showDivider={false}
              >
                <View style={{ paddingBottom: 6 }}>
                  <Text style={styles.formLabel}>{t('userRecipes.name') || 'Naam'}</Text>
                  <TextInput
                    style={styles.formInput}
                    value={recipeName}
                    onChangeText={setRecipeName}
                    placeholder="Bijv. Pasta Carbonara"
                    placeholderTextColor={theme.colors.textPlaceholder}
                    maxLength={100}
                  />

                  <Text style={styles.formLabel}>{t('userRecipes.description') || 'Beschrijving'}</Text>
                  <TextInput
                    style={[styles.formInput, styles.formTextArea]}
                    value={recipeDescription}
                    onChangeText={setRecipeDescription}
                    placeholder="Korte beschrijving..."
                    placeholderTextColor={theme.colors.textPlaceholder}
                    multiline
                    maxLength={500}
                  />

                  <View style={styles.formRow}>
                    <View style={{ flex: 1, marginRight: 8 }}>
                      <Text style={styles.formLabel}>{t('userRecipes.cookingTime') || 'Bereidingstijd (min)'}</Text>
                      <TextInput
                        style={styles.formInput}
                        value={recipeCookingTime}
                        onChangeText={setRecipeCookingTime}
                        keyboardType="numeric"
                        maxLength={4}
                      />
                    </View>
                    <View style={{ flex: 1, marginLeft: 8 }}>
                      <Text style={styles.formLabel}>{t('userRecipes.cuisine') || 'Keuken'}</Text>
                      <TextInput
                        style={styles.formInput}
                        value={recipeCuisine}
                        onChangeText={setRecipeCuisine}
                        placeholder="Bijv. Italiaans"
                        placeholderTextColor={theme.colors.textPlaceholder}
                      />
                    </View>
                  </View>
                </View>
              </FormSection>

              <View style={styles.sectionDivider} />

              {/* ═══ SECTION 2: INGREDIËNTEN & STAPPEN ═══ */}
              {(() => {
                const ingCount = inputMode === 'simple'
                  ? simpleIngredients.split('\n').filter(s => s.trim()).length
                  : ingredients.filter(i => i.name?.trim()).length;
                const stepCount = inputMode === 'simple'
                  ? simpleSteps.split('\n').filter(s => s.trim()).length
                  : steps.filter(s => s.trim()).length;
                const hasContent = ingCount || stepCount;
                return (
                  <FormSection
                    icon="list"
                    title={t('chef.sectionRecipe') || 'Ingrediënten & Stappen'}
                    status={hasContent ? `${ingCount} ingrediënten · ${stepCount} stappen` : undefined}
                    hint={t('chef.sectionRecipeHint') || 'Voeg ingrediënten en stappen toe'}
                    expanded={expandedSection === 'recipe'}
                    onToggle={() => toggleSection('recipe')}
                    showDivider={false}
                  >
                    <View style={{ paddingBottom: 6 }}>
                  {/* Input mode toggle */}
                  <View style={styles.modeToggle}>
                <TouchableOpacity
                  style={[styles.modeToggleBtn, inputMode === 'simple' && styles.modeToggleBtnActive]}
                  onPress={() => setInputMode('simple')}
                >
                  <Text style={[styles.modeToggleText, inputMode === 'simple' && styles.modeToggleTextActive]}>{t('chef.simpleInput') || 'Snel invoeren'}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modeToggleBtn, inputMode === 'structured' && styles.modeToggleBtnActive]}
                  onPress={() => setInputMode('structured')}
                >
                  <Text style={[styles.modeToggleText, inputMode === 'structured' && styles.modeToggleTextActive]}>{t('chef.structuredInput') || 'Per stuk invoeren'}</Text>
                </TouchableOpacity>
              </View>

              {inputMode === 'simple' ? (
                <>
                  <ListEditor
                    label={t('recipes.ingredients') || 'Ingrediënten'}
                    items={(() => {
                      const arr = simpleIngredients.split('\n');
                      return arr.length ? arr : [''];
                    })()}
                    onChange={(arr) => setSimpleIngredients(arr.join('\n'))}
                    placeholder={t('userRecipes.ingredientPlaceholder') || 'bijv. 200g pasta'}
                    addLabel={t('userRecipes.addIngredient') || 'Ingrediënt toevoegen'}
                  />
                  <ListEditor
                    label={t('recipes.instructions') || 'Stappen'}
                    items={(() => {
                      const arr = simpleSteps.split('\n');
                      return arr.length ? arr : [''];
                    })()}
                    onChange={(arr) => setSimpleSteps(arr.join('\n'))}
                    placeholder={t('userRecipes.stepPlaceholder') || 'Beschrijf stap'}
                    addLabel={t('userRecipes.addStep') || 'Stap toevoegen'}
                    numbered
                    multiline
                  />
                </>
              ) : (
                <>
              {/* Ingredients */}
              <Text style={styles.formLabel}>{t('recipes.ingredients') || 'Ingrediënten'}</Text>
              {ingredients.map((ing, idx) => (
                editingIngIdx === idx ? (
                  <View key={idx} style={styles.ingredientEditRow}>
                    <View style={styles.ingredientEditFields}>
                      <TextInput
                        style={[styles.formInput, { width: 70, marginRight: 6 }]}
                        value={ing.qty}
                        onChangeText={(v) => { const u = [...ingredients]; u[idx] = { ...u[idx], qty: v }; setIngredients(u); }}
                        placeholder="Aantal"
                        placeholderTextColor={theme.colors.textPlaceholder}
                        keyboardType="decimal-pad"
                        maxLength={6}
                      />
                      <TextInput
                        style={[styles.formInput, { flex: 1 }]}
                        value={ing.name}
                        onChangeText={(v) => { const u = [...ingredients]; u[idx] = { ...u[idx], name: v }; setIngredients(u); }}
                        placeholder="Ingrediënt"
                        placeholderTextColor={theme.colors.textPlaceholder}
                        autoFocus
                      />
                    </View>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.unitPicker}>
                      {UNIT_OPTIONS.map((u) => (
                        <TouchableOpacity
                          key={u || 'none'}
                          style={[styles.unitChip, ing.unit === u && styles.unitChipActive]}
                          onPress={() => { const upd = [...ingredients]; upd[idx] = { ...upd[idx], unit: u }; setIngredients(upd); }}
                        >
                          <Text style={[styles.unitChipText, ing.unit === u && styles.unitChipTextActive]}>{u || '-'}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                    <TouchableOpacity style={styles.ingDoneBtn} onPress={() => setEditingIngIdx(null)}>
                      <Text style={styles.ingDoneBtnText}>{t('common.done') || 'Klaar'}</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity key={idx} style={styles.ingredientDisplayRow} onPress={() => setEditingIngIdx(idx)}>
                    <Text style={styles.ingredientDisplayText}>• {formatIngredient(ing) || 'Tik om te bewerken'}</Text>
                    <View style={styles.ingredientDisplayActions}>
                      <Feather name="edit-2" size={13} color={theme.colors.textPlaceholder} />
                      {ingredients.length > 1 && (
                        <TouchableOpacity onPress={() => { setIngredients(ingredients.filter((_, i) => i !== idx)); if (editingIngIdx === idx) setEditingIngIdx(null); }}>
                          <Feather name="x" size={14} color={theme.colors.error} />
                        </TouchableOpacity>
                      )}
                    </View>
                  </TouchableOpacity>
                )
              ))}
              <TouchableOpacity
                style={styles.addRowBtn}
                onPress={() => { setIngredients([...ingredients, { qty: '', unit: '', name: '' }]); setEditingIngIdx(ingredients.length); }}
              >
                <Feather name="plus" size={14} color={theme.colors.secondary} />
                <Text style={styles.addRowBtnText}>{t('chef.addIngredient') || 'Ingrediënt toevoegen'}</Text>
              </TouchableOpacity>

              {/* Steps */}
              <Text style={styles.formLabel}>{t('recipes.instructions') || 'Stappen'}</Text>
              {steps.map((step, idx) => (
                editingStepIdx === idx ? (
                  <View key={idx} style={styles.stepEditRow}>
                    <View style={styles.stepInputNumber}>
                      <Text style={styles.stepInputNumberText}>{idx + 1}</Text>
                    </View>
                    <TextInput
                      style={[styles.formInput, styles.stepInputText]}
                      value={step}
                      onChangeText={(v) => { const u = [...steps]; u[idx] = v; setSteps(u); }}
                      placeholder={`Stap ${idx + 1}`}
                      placeholderTextColor={theme.colors.textPlaceholder}
                      multiline
                      autoFocus
                    />
                    <TouchableOpacity onPress={() => setEditingStepIdx(null)} style={{ padding: 6 }}>
                      <Text style={styles.ingDoneBtnText}>{t('common.done') || 'Klaar'}</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity key={idx} style={styles.stepDisplayRow} onPress={() => setEditingStepIdx(idx)}>
                    <View style={styles.stepInputNumber}>
                      <Text style={styles.stepInputNumberText}>{idx + 1}</Text>
                    </View>
                    <Text style={styles.stepDisplayText}>{step || 'Tik om te bewerken'}</Text>
                    <View style={styles.ingredientDisplayActions}>
                      <Feather name="edit-2" size={13} color={theme.colors.textPlaceholder} />
                      {steps.length > 1 && (
                        <TouchableOpacity onPress={() => { setSteps(steps.filter((_, i) => i !== idx)); if (editingStepIdx === idx) setEditingStepIdx(null); }}>
                          <Feather name="x" size={14} color={theme.colors.error} />
                        </TouchableOpacity>
                      )}
                    </View>
                  </TouchableOpacity>
                )
              ))}
              <TouchableOpacity
                style={styles.addRowBtn}
                onPress={() => { setSteps([...steps, '']); setEditingStepIdx(steps.length); }}
              >
                <Feather name="plus" size={14} color={theme.colors.secondary} />
                <Text style={styles.addRowBtnText}>{t('chef.addStep') || 'Stap toevoegen'}</Text>
              </TouchableOpacity>
                        </>
                      )}
                    </View>
                  </FormSection>
                );
              })()}

              <View style={styles.sectionDivider} />

              {/* ═══ SECTION 3: GEAVANCEERD ═══ */}
              <FormSection
                icon="sliders"
                title={t('chef.sectionAdvanced') || 'Geavanceerd'}
                hint={t('chef.sectionAdvancedHint') || 'Prijs, porties, zichtbaarheid'}
                expanded={expandedSection === 'advanced'}
                onToggle={() => toggleSection('advanced')}
                showDivider={false}
              >
                <View style={{ paddingBottom: 6 }}>
                  {/* Cost + Servings row */}
                  <View style={styles.formRow}>
                    <View style={{ flex: 1, marginRight: 8 }}>
                      <Text style={styles.formLabel}>{t('chef.estimatedCost') || 'Prijs (€)'}</Text>
                      <TextInput
                        style={styles.formInput}
                        value={recipeCost}
                        onChangeText={setRecipeCost}
                        placeholder="12.50"
                        placeholderTextColor={theme.colors.textPlaceholder}
                        keyboardType="decimal-pad"
                        maxLength={6}
                      />
                    </View>
                    <View style={{ flex: 1, marginLeft: 8 }}>
                      <Text style={styles.formLabel}>{t('chef.defaultServings') || 'Personen'}</Text>
                      <TextInput
                        style={styles.formInput}
                        value={recipeServings}
                        onChangeText={setRecipeServings}
                        keyboardType="numeric"
                        maxLength={2}
                      />
                    </View>
                  </View>

                  {/* Visibility Picker */}
                  <Text style={styles.formLabel}>{t('chef.visibility') || 'Wie kan dit zien?'}</Text>
                  <View style={styles.visibilityRow}>
                    {VISIBILITY_OPTIONS.map((opt) => (
                      <TouchableOpacity
                        key={opt.key}
                        style={[styles.visibilityOption, visibility === opt.key && styles.visibilityOptionActive]}
                        onPress={() => { lightHaptic(); setVisibility(opt.key); }}
                        activeOpacity={0.8}
                      >
                        <Feather
                          name={opt.icon}
                          size={16}
                          color={visibility === opt.key ? theme.colors.textInverse : theme.colors.primary}
                        />
                        <Text style={[
                          styles.visibilityOptionText,
                          visibility === opt.key && styles.visibilityOptionTextActive,
                        ]}>
                          {t(`chef.${opt.label}`) || opt.key}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  {/* Group Selector (when visibility = groups) */}
                  {(visibility === 'groups' || visibility === 'public_groups') && (
                    <View style={styles.groupSelector}>
                      <Text style={styles.formLabel}>{t('chef.selectGroups') || 'Deel met groepen'}</Text>
                      {(groups || []).map((g) => (
                        <TouchableOpacity
                          key={g.id}
                          style={[styles.groupCheckbox, selectedGroups.includes(g.id) && styles.groupCheckboxActive]}
                          onPress={() => toggleGroupSelection(g.id)}
                          activeOpacity={0.8}
                        >
                          <View style={[styles.checkbox, selectedGroups.includes(g.id) && styles.checkboxChecked]}>
                            {selectedGroups.includes(g.id) && <Feather name="check" size={14} color={theme.colors.textInverse} />}
                          </View>
                          <Text style={styles.groupCheckboxText}>{g.name}</Text>
                        </TouchableOpacity>
                      ))}
                      {(!groups || groups.length === 0) && (
                        <Text style={styles.noGroupsText}>{t('groups.noGroups') || 'Geen groepen gevonden'}</Text>
                      )}
                    </View>
                  )}
                </View>
              </FormSection>

              <View style={styles.sectionDivider} />

              {/* Submit */}
              <PrimaryButton
                label={t('chef.addRecipe') || 'Recept toevoegen'}
                onPress={handleAddRecipe}
                loading={saving}
                variant="accent"
                icon="check"
                style={{ marginTop: 8 }}
              />
              </>)}
            </View>
          )}

          {/* Recipe List */}
          {loading ? (
            <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: 30 }} />
          ) : recipes.length === 0 ? (
            <EmptyState
              title={t('chef.noRecipesYet') || 'Nog geen recepten geplaatst'}
              description={
                t('chef.publicToAppear') ||
                'Deel een recept met "Iedereen" om zichtbaar te worden in de chefs lijst'
              }
              actionLabel={t('chef.addFirstRecipe') || 'Voeg eerste recept toe'}
              actionIcon="plus"
              onAction={() => { lightHaptic(); setShowAddForm(true); }}
            />
          ) : (
            <>
            {recipes.map((r) => (
              <TouchableOpacity
                key={r.id}
                style={styles.recipeCard}
                onPress={() => openRecipeModal(r)}
                activeOpacity={0.9}
              >
                <View style={styles.cardImageContainer}>
                  <ExpoImage
                    source={{ uri: r.image || PLACEHOLDER_IMAGE }}
                    style={styles.cardImage}
                    contentFit="cover"
                    transition={200}
                    cachePolicy="memory-disk"
                  />
                  {/* Visibility badge */}
                  <View style={[styles.visibilityBadge, { backgroundColor: getVisibilityColor(r.visibility) }]}>
                    <Feather name={getVisibilityIcon(r.visibility)} size={11} color={theme.colors.textInverse} />
                  </View>
                </View>
                <View style={styles.cardContent}>
                  <Text style={styles.cardTitle} numberOfLines={2}>{r.name}</Text>
                  <Text style={styles.cardChefTag}>@{chef?.tag}</Text>
                <View style={styles.cardMeta}>
                    <Text style={styles.cardTime}>{formatTime(r.cooking_time_minutes)}</Text>
                    {r.estimated_cost != null && <Text style={styles.cardCost}>€{Number(r.estimated_cost).toFixed(2)}</Text>}
                    {r.cuisine_type && <Text style={styles.cardCuisine}>{r.cuisine_type}</Text>}
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.editRecipeBtn}
                  onPress={(e) => { e.stopPropagation(); openEditRecipe(r); }}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Feather name="edit-2" size={15} color={theme.colors.primary} />
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
            {!recipes.some(r => r.visibility === 'public') && (
              <Text style={styles.publicHintSubtle}>{t('chef.publicToAppear') || 'Deel een recept met "Iedereen" om zichtbaar te worden in de chefs lijst'}</Text>
            )}
          </>
          )}

          <View style={{ height: 100 }} />
        </ScrollView>
      </Pressable>
      </KeyboardAvoidingView>

      {/* Recipe Detail Modal */}
      <Modal
        visible={recipeModalVisible}
        transparent
        animationType="none"
        onRequestClose={closeRecipeModal}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={styles.modalBackground} activeOpacity={1} onPress={closeRecipeModal} />
          <Animated.View
            style={[
              styles.modalContent,
              {
                transform: [{
                  scale: modalAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.8, 1],
                  }),
                }],
                opacity: modalAnimation,
              },
            ]}
          >
            <View style={styles.modalHeader}>
              <TouchableOpacity style={styles.modalBackBtn} onPress={closeRecipeModal}>
                <Text style={styles.modalBackArrow}>←</Text>
                <Text style={styles.modalBackText}>{t('common.back') || 'Terug'}</Text>
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {selectedRecipe?.image && (
                <ExpoImage
                  source={{ uri: selectedRecipe.image }}
                  style={styles.modalImage}
                  contentFit="cover"
                />
              )}
              <View style={styles.modalBody}>
                <Text style={styles.modalTitle}>{selectedRecipe?.name}</Text>
                <Text style={styles.modalChefTag}>{t('ideas.by') || 'door'} @{chef?.tag}</Text>

                <View style={styles.modalMeta}>
                  <View style={styles.modalMetaItem}>
                    <Feather name="clock" size={14} color={theme.colors.primary} />
                    <Text style={styles.modalMetaText}>{formatTime(selectedRecipe?.cooking_time_minutes)}</Text>
                  </View>
                  {selectedRecipe?.estimated_cost != null && (
                    <View style={styles.modalMetaItem}>
                      <Feather name="tag" size={14} color={theme.colors.success} />
                      <Text style={[styles.modalMetaText, { color: theme.colors.success }]}>€{Number(selectedRecipe.estimated_cost).toFixed(2)}</Text>
                    </View>
                  )}
                  {selectedRecipe?.cuisine_type && (
                    <View style={styles.modalMetaItem}>
                      <Text style={styles.modalMetaText}>{selectedRecipe.cuisine_type}</Text>
                    </View>
                  )}
                  <View style={[styles.modalVisibility, { backgroundColor: getVisibilityColor(selectedRecipe?.visibility) }]}>
                    <Feather name={getVisibilityIcon(selectedRecipe?.visibility)} size={12} color={theme.colors.textInverse} />
                    <Text style={styles.modalVisibilityText}>
                      {t(`chef.visibility${(selectedRecipe?.visibility || 'public').charAt(0).toUpperCase() + (selectedRecipe?.visibility || 'public').slice(1)}`) || selectedRecipe?.visibility}
                    </Text>
                  </View>
                </View>

                {selectedRecipe?.description && (
                  <Text style={styles.modalDescription}>{selectedRecipe.description}</Text>
                )}

                {selectedRecipe?.ingredients?.length > 0 && (
                  <View style={styles.modalSection}>
                    <Text style={styles.modalSectionTitle}>{t('recipes.ingredients') || 'Ingrediënten'}</Text>
                    <ServingSelector count={servingCount} onChange={setServingCount} />
                    {scaleIngredients(
                      selectedRecipe.ingredients,
                      selectedRecipe.default_servings || getRecipeExtras(selectedRecipe.name).default_servings,
                      servingCount
                    ).map((ing, i) => (
                      <Text key={i} style={styles.modalIngredient}>• {ing}</Text>
                    ))}
                  </View>
                )}
                {selectedRecipe?.steps?.length > 0 && (
                  <View style={styles.modalSection}>
                    <Text style={styles.modalSectionTitle}>{t('recipes.instructions') || 'Stappen'}</Text>
                    {selectedRecipe.steps.map((step, i) => (
                      <View key={i} style={styles.modalStepRow}>
                        <View style={styles.modalStepNumber}>
                          <Text style={styles.modalStepNumberText}>{i + 1}</Text>
                        </View>
                        <Text style={styles.modalStepText}>{step}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            </ScrollView>
          </Animated.View>
        </View>
      </Modal>

      {/* Edit Profile Modal */}
      <Modal
        visible={showEditProfile}
        transparent
        animationType="slide"
        onRequestClose={() => setShowEditProfile(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.editOverlay}
        >
          <View style={styles.editContainer}>
            <View style={styles.editHeader}>
              <Text style={styles.editTitle}>{t('chef.editProfile') || 'Profiel bewerken'}</Text>
              <TouchableOpacity onPress={() => setShowEditProfile(false)} style={styles.editCloseBtn}>
                <Feather name="x" size={22} color={theme.colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 30 }}>
              {/* Profile Image */}
              <TouchableOpacity style={styles.editImagePicker} onPress={handlePickEditImage} activeOpacity={0.8}>
                {editImageUri ? (
                  <Image source={{ uri: editImageUri }} style={styles.editImagePreview} />
                ) : chef?.profile_image ? (
                  <ExpoImage source={{ uri: chef.profile_image }} style={styles.editImagePreview} contentFit="cover" />
                ) : (
                  <View style={[styles.editImagePreview, styles.editImagePlaceholder]}>
                    <Feather name="camera" size={28} color={theme.colors.primary} />
                  </View>
                )}
                <View style={styles.editImageOverlay}>
                  <Feather name="edit-2" size={14} color={theme.colors.textInverse} />
                </View>
              </TouchableOpacity>

              {/* Profile Type */}
              <Text style={styles.formLabel}>{t('chef.profileType') || 'Profiel type'}</Text>
              <View style={styles.editTypeRow}>
                <TouchableOpacity
                  style={[styles.editTypeOption, editProfileType === 'chef' && styles.editTypeOptionActive]}
                  onPress={() => { lightHaptic(); setEditProfileType('chef'); }}
                >
                  <Text style={[styles.editTypeText, editProfileType === 'chef' && styles.editTypeTextActive]}>
                    {t('chef.profileTypeChef') || 'Chef'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.editTypeOption, editProfileType === 'huis' && styles.editTypeOptionActive]}
                  onPress={() => { lightHaptic(); setEditProfileType('huis'); }}
                >
                  <Text style={[styles.editTypeText, editProfileType === 'huis' && styles.editTypeTextActive]}>
                    {t('chef.profileTypeHuis') || 'Huis'}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Name */}
              <Text style={styles.formLabel}>{t('chef.chefName') || 'Chef naam'}</Text>
              <TextInput
                style={styles.formInput}
                value={editName}
                onChangeText={setEditName}
                maxLength={50}
              />

              {/* Description */}
              <Text style={styles.formLabel}>{t('chef.description') || 'Over jou'}</Text>
              <TextInput
                style={[styles.formInput, styles.formTextArea]}
                value={editDescription}
                onChangeText={setEditDescription}
                multiline
                maxLength={300}
              />

              {/* Social Links */}
              <Text style={styles.formLabel}>{t('chef.socialLinks') || 'Sociale links (optioneel)'}</Text>
              <View style={styles.editSocialRow}>
                <Feather name="instagram" size={16} color={theme.colors.primary} style={{ marginRight: 8, width: 20 }} />
                <TextInput
                  style={[styles.formInput, { flex: 1 }]}
                  value={editInstagram}
                  onChangeText={setEditInstagram}
                  placeholder="@instagram"
                  placeholderTextColor={theme.colors.textPlaceholder}
                  autoCapitalize="none"
                />
              </View>
              <View style={styles.editSocialRow}>
                <MaterialCommunityIcons name="music-note" size={16} color={theme.colors.primary} style={{ marginRight: 8, width: 20 }} />
                <TextInput
                  style={[styles.formInput, { flex: 1 }]}
                  value={editTiktok}
                  onChangeText={setEditTiktok}
                  placeholder="@tiktok"
                  placeholderTextColor={theme.colors.textPlaceholder}
                  autoCapitalize="none"
                />
              </View>
              <View style={styles.editSocialRow}>
                <Feather name="globe" size={16} color={theme.colors.primary} style={{ marginRight: 8, width: 20 }} />
                <TextInput
                  style={[styles.formInput, { flex: 1 }]}
                  value={editWebsite}
                  onChangeText={setEditWebsite}
                  placeholder="website.com"
                  placeholderTextColor={theme.colors.textPlaceholder}
                  autoCapitalize="none"
                />
              </View>

              {/* Save */}
              <TouchableOpacity
                style={[styles.submitBtn, savingProfile && styles.submitBtnDisabled]}
                onPress={handleSaveProfile}
                disabled={savingProfile}
                activeOpacity={0.8}
              >
                {savingProfile ? (
                  <ActivityIndicator color={theme.colors.textInverse} />
                ) : (
                  <Text style={styles.submitBtnText}>{t('common.save') || 'Opslaan'}</Text>
                )}
              </TouchableOpacity>

              {/* Delete Chef Account */}
              <TouchableOpacity
                style={styles.deleteAccountBtn}
                onPress={handleDeleteChefAccount}
                activeOpacity={0.8}
              >
                <Feather name="trash-2" size={16} color={theme.colors.error} />
                <Text style={styles.deleteAccountBtnText}>{t('chef.deleteAccount') || 'Chef profiel verwijderen'}</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Edit Recipe Modal */}
      <Modal
        visible={showEditRecipe}
        transparent
        animationType="slide"
        onRequestClose={() => setShowEditRecipe(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.editOverlay}
        >
          <View style={styles.editContainer}>
            <View style={styles.editHeader}>
              <Text style={styles.editTitle}>{t('chef.editRecipe') || 'Recept bewerken'}</Text>
              <TouchableOpacity onPress={() => setShowEditRecipe(false)} style={styles.editCloseBtn}>
                <Feather name="x" size={22} color={theme.colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 30 }}>
              {/* Image */}
              <TouchableOpacity style={styles.editRecipeImagePicker} onPress={handlePickEditRecipeImage} activeOpacity={0.8}>
                {editRecipeImageUri ? (
                  <Image source={{ uri: editRecipeImageUri }} style={styles.editRecipeImagePreview} />
                ) : editingRecipe?.image ? (
                  <ExpoImage source={{ uri: editingRecipe.image }} style={styles.editRecipeImagePreview} contentFit="cover" />
                ) : (
                  <View style={[styles.editRecipeImagePreview, styles.editImagePlaceholder]}>
                    <Feather name="camera" size={28} color={theme.colors.primary} />
                    <Text style={{ fontSize: theme.typography.fontSize.sm, color: theme.colors.primary, marginTop: 4 }}>{t('userRecipes.addPhoto') || 'Foto toevoegen'}</Text>
                  </View>
                )}
              </TouchableOpacity>

              {/* Name */}
              <Text style={styles.formLabel}>{t('userRecipes.name') || 'Naam'}</Text>
              <TextInput
                style={styles.formInput}
                value={editRecipeName}
                onChangeText={setEditRecipeName}
                maxLength={100}
              />

              {/* Description */}
              <Text style={styles.formLabel}>{t('userRecipes.description') || 'Beschrijving'}</Text>
              <TextInput
                style={[styles.formInput, styles.formTextArea]}
                value={editRecipeDescription}
                onChangeText={setEditRecipeDescription}
                multiline
                maxLength={500}
              />

              {/* Time + Cuisine */}
              <View style={styles.formRow}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={styles.formLabel}>{t('userRecipes.cookingTime') || 'Bereidingstijd (min)'}</Text>
                  <TextInput
                    style={styles.formInput}
                    value={editRecipeCookingTime}
                    onChangeText={setEditRecipeCookingTime}
                    keyboardType="numeric"
                    maxLength={4}
                  />
                </View>
                <View style={{ flex: 1, marginLeft: 8 }}>
                  <Text style={styles.formLabel}>{t('userRecipes.cuisine') || 'Keuken'}</Text>
                  <TextInput
                    style={styles.formInput}
                    value={editRecipeCuisine}
                    onChangeText={setEditRecipeCuisine}
                  />
                </View>
              </View>

              {/* Cost */}
              <Text style={styles.formLabel}>{t('chef.estimatedCost') || 'Geschatte prijs (€)'}</Text>
              <TextInput
                style={styles.formInput}
                value={editRecipeCost}
                onChangeText={setEditRecipeCost}
                keyboardType="decimal-pad"
                maxLength={6}
              />

              {/* Servings */}
              <Text style={styles.formLabel}>{t('chef.defaultServings') || 'Aantal personen'}</Text>
              <TextInput
                style={[styles.formInput, { width: 80 }]}
                value={editRecipeServings}
                onChangeText={setEditRecipeServings}
                keyboardType="numeric"
                maxLength={2}
              />

              {/* Input mode toggle */}
              <View style={styles.modeToggle}>
                <TouchableOpacity
                  style={[styles.modeToggleBtn, editInputMode === 'simple' && styles.modeToggleBtnActive]}
                  onPress={() => setEditInputMode('simple')}
                >
                  <Text style={[styles.modeToggleText, editInputMode === 'simple' && styles.modeToggleTextActive]}>{t('chef.simpleInput') || 'Snel invoeren'}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modeToggleBtn, editInputMode === 'structured' && styles.modeToggleBtnActive]}
                  onPress={() => setEditInputMode('structured')}
                >
                  <Text style={[styles.modeToggleText, editInputMode === 'structured' && styles.modeToggleTextActive]}>{t('chef.structuredInput') || 'Per stuk invoeren'}</Text>
                </TouchableOpacity>
              </View>

              {editInputMode === 'simple' ? (
                <>
                  <Text style={styles.formLabel}>{t('recipes.ingredients') || 'Ingrediënten'}</Text>
                  <TextInput
                    style={[styles.formInput, styles.formTextArea, { minHeight: 100 }]}
                    value={editSimpleIngredients}
                    onChangeText={setEditSimpleIngredients}
                    placeholder={'1 ingredient per regel'}
                    placeholderTextColor={theme.colors.textPlaceholder}
                    multiline
                  />
                  <Text style={styles.formLabel}>{t('recipes.instructions') || 'Stappen'}</Text>
                  <TextInput
                    style={[styles.formInput, styles.formTextArea, { minHeight: 100 }]}
                    value={editSimpleSteps}
                    onChangeText={setEditSimpleSteps}
                    placeholder={'1 stap per regel'}
                    placeholderTextColor={theme.colors.textPlaceholder}
                    multiline
                  />
                </>
              ) : (
                <>
                  <Text style={styles.formLabel}>{t('recipes.ingredients') || 'Ingrediënten'}</Text>
                  {editIngredients.map((ing, idx) => (
                    editingEditIngIdx === idx ? (
                      <View key={idx} style={styles.ingredientEditRow}>
                        <View style={styles.ingredientEditFields}>
                          <TextInput style={[styles.formInput, { width: 70, marginRight: 6 }]} value={ing.qty} onChangeText={(v) => { const u = [...editIngredients]; u[idx] = { ...u[idx], qty: v }; setEditIngredients(u); }} placeholder="Aantal" placeholderTextColor={theme.colors.textPlaceholder} keyboardType="decimal-pad" maxLength={6} />
                          <TextInput style={[styles.formInput, { flex: 1 }]} value={ing.name} onChangeText={(v) => { const u = [...editIngredients]; u[idx] = { ...u[idx], name: v }; setEditIngredients(u); }} placeholder="Ingrediënt" placeholderTextColor={theme.colors.textPlaceholder} autoFocus />
                        </View>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.unitPicker}>
                          {UNIT_OPTIONS.map((u) => (<TouchableOpacity key={u || 'none'} style={[styles.unitChip, ing.unit === u && styles.unitChipActive]} onPress={() => { const upd = [...editIngredients]; upd[idx] = { ...upd[idx], unit: u }; setEditIngredients(upd); }}><Text style={[styles.unitChipText, ing.unit === u && styles.unitChipTextActive]}>{u || '-'}</Text></TouchableOpacity>))}
                        </ScrollView>
                        <TouchableOpacity style={styles.ingDoneBtn} onPress={() => setEditingEditIngIdx(null)}><Text style={styles.ingDoneBtnText}>{t('common.done') || 'Klaar'}</Text></TouchableOpacity>
                      </View>
                    ) : (
                      <TouchableOpacity key={idx} style={styles.ingredientDisplayRow} onPress={() => setEditingEditIngIdx(idx)}>
                        <Text style={styles.ingredientDisplayText}>• {formatIngredient(ing) || 'Tik om te bewerken'}</Text>
                        <View style={styles.ingredientDisplayActions}>
                          <Feather name="edit-2" size={13} color={theme.colors.textPlaceholder} />
                          {editIngredients.length > 1 && (<TouchableOpacity onPress={() => { setEditIngredients(editIngredients.filter((_, i) => i !== idx)); }}><Feather name="x" size={14} color={theme.colors.error} /></TouchableOpacity>)}
                        </View>
                      </TouchableOpacity>
                    )
                  ))}
                  <TouchableOpacity style={styles.addRowBtn} onPress={() => { setEditIngredients([...editIngredients, { qty: '', unit: '', name: '' }]); setEditingEditIngIdx(editIngredients.length); }}>
                    <Feather name="plus" size={14} color={theme.colors.secondary} /><Text style={styles.addRowBtnText}>{t('chef.addIngredient') || 'Ingrediënt toevoegen'}</Text>
                  </TouchableOpacity>

                  <Text style={styles.formLabel}>{t('recipes.instructions') || 'Stappen'}</Text>
                  {editSteps.map((step, idx) => (
                    editingEditStepIdx === idx ? (
                      <View key={idx} style={styles.stepEditRow}>
                        <View style={styles.stepInputNumber}><Text style={styles.stepInputNumberText}>{idx + 1}</Text></View>
                        <TextInput style={[styles.formInput, styles.stepInputText]} value={step} onChangeText={(v) => { const u = [...editSteps]; u[idx] = v; setEditSteps(u); }} placeholder={`Stap ${idx + 1}`} placeholderTextColor={theme.colors.textPlaceholder} multiline autoFocus />
                        <TouchableOpacity onPress={() => setEditingEditStepIdx(null)} style={{ padding: 6 }}><Text style={styles.ingDoneBtnText}>{t('common.done') || 'Klaar'}</Text></TouchableOpacity>
                      </View>
                    ) : (
                      <TouchableOpacity key={idx} style={styles.stepDisplayRow} onPress={() => setEditingEditStepIdx(idx)}>
                        <View style={styles.stepInputNumber}><Text style={styles.stepInputNumberText}>{idx + 1}</Text></View>
                        <Text style={styles.stepDisplayText}>{step || 'Tik om te bewerken'}</Text>
                        <View style={styles.ingredientDisplayActions}>
                          <Feather name="edit-2" size={13} color={theme.colors.textPlaceholder} />
                          {editSteps.length > 1 && (<TouchableOpacity onPress={() => { setEditSteps(editSteps.filter((_, i) => i !== idx)); }}><Feather name="x" size={14} color={theme.colors.error} /></TouchableOpacity>)}
                        </View>
                      </TouchableOpacity>
                    )
                  ))}
                  <TouchableOpacity style={styles.addRowBtn} onPress={() => { setEditSteps([...editSteps, '']); setEditingEditStepIdx(editSteps.length); }}>
                    <Feather name="plus" size={14} color={theme.colors.secondary} /><Text style={styles.addRowBtnText}>{t('chef.addStep') || 'Stap toevoegen'}</Text>
                  </TouchableOpacity>
                </>
              )}

              {/* Visibility */}
              <Text style={styles.formLabel}>{t('chef.visibility') || 'Wie kan dit zien?'}</Text>
              <View style={styles.visibilityRow}>
                {VISIBILITY_OPTIONS.map((opt) => (
                  <TouchableOpacity
                    key={opt.key}
                    style={[styles.visibilityOption, editRecipeVisibility === opt.key && styles.visibilityOptionActive]}
                    onPress={() => { lightHaptic(); setEditRecipeVisibility(opt.key); }}
                    activeOpacity={0.8}
                  >
                    <Feather
                      name={opt.icon}
                      size={16}
                      color={editRecipeVisibility === opt.key ? theme.colors.textInverse : theme.colors.primary}
                    />
                    <Text style={[
                      styles.visibilityOptionText,
                      editRecipeVisibility === opt.key && styles.visibilityOptionTextActive,
                    ]}>
                      {t(`chef.${opt.label}`) || opt.key}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Save */}
              <TouchableOpacity
                style={[styles.submitBtn, savingRecipeEdit && styles.submitBtnDisabled]}
                onPress={handleSaveRecipeEdit}
                disabled={savingRecipeEdit}
                activeOpacity={0.8}
              >
                {savingRecipeEdit ? (
                  <ActivityIndicator color={theme.colors.textInverse} />
                ) : (
                  <Text style={styles.submitBtnText}>{t('common.save') || 'Opslaan'}</Text>
                )}
              </TouchableOpacity>

              {/* Delete recipe */}
              <TouchableOpacity
                style={styles.deleteRecipeBtn}
                onPress={() => {
                  setShowEditRecipe(false);
                  setTimeout(() => handleDeleteRecipe(editingRecipe), 100);
                }}
                activeOpacity={0.8}
              >
                <Feather name="trash-2" size={16} color={theme.colors.error} />
                <Text style={styles.deleteRecipeBtnText}>{t('chef.deleteRecipe') || 'Recept verwijderen'}</Text>
              </TouchableOpacity>

              <View style={{ height: 40 }} />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const createStyles = (theme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  scrollContent: { paddingHorizontal: 16, paddingTop: 16 },

  // Profile Header
  profileHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  profileImage: { width: 72, height: 72, borderRadius: theme.borderRadius.full, borderWidth: 2, borderColor: theme.colors.secondary },
  profileImagePlaceholder: { backgroundColor: theme.colors.borderSubtle, alignItems: 'center', justifyContent: 'center' },
  profileInfo: { flex: 1, marginLeft: 14 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  profileName: { fontSize: theme.typography.fontSize['2xl'], fontWeight: '700', color: theme.colors.text },
  typeBadge: { backgroundColor: theme.colors.secondary, paddingHorizontal: 8, paddingVertical: 2, borderRadius: theme.borderRadius.sm },
  typeBadgeHuis: { backgroundColor: '#5B9BD5' },
  typeBadgeText: { fontSize: theme.typography.fontSize.xs, fontWeight: '700', color: theme.colors.textInverse },
  profileTag: { fontSize: theme.typography.fontSize.md, color: theme.colors.primary, marginTop: 2 },
  editProfileBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8, alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 5, borderRadius: theme.borderRadius.sm, backgroundColor: theme.colors.secondaryLight, borderWidth: 1, borderColor: theme.colors.secondaryLight },
  editProfileBtnText: { fontSize: theme.typography.fontSize.sm, color: theme.colors.secondary, fontWeight: '600' },
  profileDescription: { fontSize: theme.typography.fontSize.sm + 1, color: theme.colors.textSecondary, marginTop: 4, lineHeight: 18 },

  // Social Links
  socialLinks: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  socialChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.borderSubtle, paddingHorizontal: 10, paddingVertical: 5, borderRadius: theme.borderRadius.md, gap: 4 },
  socialChipText: { fontSize: theme.typography.fontSize.sm, color: theme.colors.primary },

  // Section Header
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  sectionTitle: { fontSize: theme.typography.fontSize.xl, fontWeight: '700', color: theme.colors.text },
  sectionCount: { fontSize: theme.typography.fontSize.sm + 1, color: theme.colors.primary, marginTop: 2 },
  addBtn: { width: 36, height: 36, borderRadius: theme.borderRadius.lg, backgroundColor: theme.colors.secondary, alignItems: 'center', justifyContent: 'center' },

  // Add Form
  addForm: { backgroundColor: theme.colors.modal, borderRadius: theme.borderRadius.lg, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: theme.colors.border },
  // URL import card — hero layout
  importCard: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    padding: 20,
    marginBottom: 10,
    alignItems: 'center',
  },
  importHero: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: `${theme.colors.secondary}1A`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  importTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: 6,
  },
  importSubtitle: {
    fontSize: 13,
    color: theme.colors.textSecondary || theme.colors.textPlaceholder,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 18,
    paddingHorizontal: 8,
  },
  importInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    backgroundColor: theme.colors.modal,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    paddingHorizontal: 12,
    minHeight: 50,
    marginBottom: 10,
  },
  importInputIcon: {
    marginRight: 8,
  },
  importInput: {
    flex: 1,
    fontSize: 14,
    color: theme.colors.text,
    paddingVertical: Platform.OS === 'ios' ? 14 : 10,
  },
  importClearBtn: {
    padding: 4,
    marginLeft: 4,
  },
  importPasteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    marginBottom: 12,
  },
  importPasteBtnText: {
    fontSize: 13,
    fontWeight: '500',
    color: theme.colors.primary,
  },
  importPrimaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    width: '100%',
    height: 52,
    borderRadius: 14,
    backgroundColor: theme.colors.primary,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 4,
  },
  importPrimaryBtnDisabled: {
    opacity: 0.4,
    shadowOpacity: 0,
    elevation: 0,
  },
  importPrimaryBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.textInverse,
    letterSpacing: 0.2,
  },
  importSources: {
    marginTop: 14,
    fontSize: 11,
    color: theme.colors.textPlaceholder,
    textAlign: 'center',
    lineHeight: 15,
    paddingHorizontal: 4,
  },
  // Divider between import and manual
  manualDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 18,
    marginBottom: 8,
    paddingHorizontal: 20,
  },
  manualDividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: theme.colors.border,
  },
  manualDividerText: {
    fontSize: 12,
    fontWeight: '500',
    color: theme.colors.textPlaceholder,
    marginHorizontal: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  // "Or enter manually" text button
  manualBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    marginBottom: 4,
  },
  manualBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  formLabel: { fontSize: theme.typography.fontSize.sm, fontWeight: '600', color: theme.colors.primary, marginBottom: 4, marginTop: 12 },
  formInput: { backgroundColor: theme.colors.surfaceWarm, borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.borderRadius.md, paddingHorizontal: 12, paddingVertical: 10, fontSize: theme.typography.fontSize.md, color: theme.colors.text },
  formTextArea: { minHeight: 60, textAlignVertical: 'top' },
  formRow: { flexDirection: 'row' },

  // Image picker
  // Collapsible form section
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 4,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  sectionIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: theme.colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitleText: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 2,
  },
  sectionBadge: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  sectionBadgeMuted: {
    fontSize: 12,
    color: theme.colors.textTertiary,
  },
  sectionContent: {
    paddingHorizontal: 4,
    paddingBottom: 6,
  },
  sectionDivider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginHorizontal: 4,
  },
  // Hero photo card (top of post-import form)
  photoHero: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
    backgroundColor: theme.colors.surfaceAlt,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    borderStyle: 'dashed',
    marginTop: 4,
    marginBottom: 18,
  },
  photoHeroImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  photoHeroOverlay: {
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
  photoHeroOverlayPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.22)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
  },
  photoHeroOverlayText: {
    fontSize: 13,
    fontWeight: '500',
    color: theme.colors.textInverse,
  },
  photoHeroRemoveBtn: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoHeroEmpty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  photoHeroEmptyIcon: {
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
  photoHeroEmptyTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 3,
  },
  photoHeroEmptyHint: {
    fontSize: 12,
    color: theme.colors.textTertiary,
    textAlign: 'center',
    lineHeight: 16,
  },
  imagePickerText: { fontSize: theme.typography.fontSize.sm + 1, color: theme.colors.primary },

  // Visibility
  visibilityRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  visibilityOption: { flexBasis: '47%', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: theme.borderRadius.md, backgroundColor: theme.colors.borderSubtle, borderWidth: 1, borderColor: theme.colors.border },
  visibilityOptionActive: { backgroundColor: theme.colors.secondary, borderColor: theme.colors.secondary },
  visibilityOptionText: { fontSize: theme.typography.fontSize.sm, fontWeight: '600', color: theme.colors.primary },
  visibilityOptionTextActive: { color: theme.colors.textInverse },

  // Group selector
  groupSelector: { marginTop: 8 },
  groupCheckbox: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 12, borderRadius: theme.borderRadius.md, backgroundColor: theme.colors.borderSubtle, marginBottom: 6 },
  groupCheckboxActive: { backgroundColor: '#EBF0F7' },
  checkbox: { width: 22, height: 22, borderRadius: theme.borderRadius.sm, borderWidth: 2, borderColor: theme.colors.tabBarInactive, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  checkboxChecked: { backgroundColor: '#5B9BD5', borderColor: '#5B9BD5' },
  groupCheckboxText: { fontSize: theme.typography.fontSize.md, color: theme.colors.text, fontWeight: '500' },
  noGroupsText: { fontSize: theme.typography.fontSize.sm + 1, color: theme.colors.primary, fontStyle: 'italic' },

  submitBtn: { backgroundColor: theme.colors.secondary, borderRadius: theme.borderRadius.md, paddingVertical: 14, alignItems: 'center', marginTop: 16 },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { color: theme.colors.textInverse, fontSize: theme.typography.fontSize.base, fontWeight: '700' },

  // Empty state
  emptyState: { alignItems: 'center', paddingVertical: 40, paddingHorizontal: 24, marginHorizontal: 4, marginTop: 8, backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.lg, borderWidth: 1, borderColor: theme.colors.border },
  emptyText: { fontSize: theme.typography.fontSize.md, color: theme.colors.primary, marginTop: 12 },
  emptyHint: { fontSize: theme.typography.fontSize.sm, color: theme.colors.textPlaceholder, marginTop: 8, textAlign: 'center', paddingHorizontal: 30, lineHeight: 18 },
  emptyAddButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.secondary,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: theme.borderRadius.lg,
    marginTop: 20,
    shadowColor: theme.colors.secondary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  emptyAddButtonText: {
    fontSize: theme.typography.fontSize.base,
    fontFamily: theme.typography.fontFamily.bodySemiBold,
    color: theme.colors.textInverse,
  },
  publicHintSubtle: { fontSize: theme.typography.fontSize.sm, color: theme.colors.tabBarInactive, textAlign: 'center', marginTop: 16, paddingHorizontal: 20, lineHeight: 17 },

  // Recipe cards
  recipeCard: { flexDirection: 'row', backgroundColor: theme.colors.modal, borderRadius: theme.borderRadius.base, marginBottom: 10, borderWidth: 1, borderColor: theme.colors.border, overflow: 'hidden' },
  cardImageContainer: { width: 90, height: 90, position: 'relative' },
  cardImage: { width: '100%', height: '100%' },
  visibilityBadge: { position: 'absolute', top: 6, left: 6, width: 22, height: 22, borderRadius: theme.borderRadius.md, alignItems: 'center', justifyContent: 'center' },
  cardContent: { flex: 1, paddingHorizontal: 12, paddingVertical: 10, justifyContent: 'center' },
  cardTitle: { fontSize: theme.typography.fontSize.base, fontWeight: '600', color: theme.colors.text },
  cardChefTag: { fontSize: theme.typography.fontSize.xs, color: theme.colors.secondary, fontWeight: '500', marginTop: 1 },
  cardMeta: { flexDirection: 'row', gap: 8, marginTop: 4 },
  cardTime: { fontSize: theme.typography.fontSize.sm, color: theme.colors.primary },
  cardCost: { fontSize: theme.typography.fontSize.sm, color: theme.colors.success, fontWeight: '600' },
  cardCuisine: { fontSize: theme.typography.fontSize.sm, color: theme.colors.primary, fontStyle: 'italic' },
  editRecipeBtn: { padding: 12, justifyContent: 'flex-end', alignSelf: 'stretch' },

  // Ingredient display row (collapsed)
  ingredientDisplayRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: theme.colors.modal, borderRadius: theme.borderRadius.md, paddingVertical: 10, paddingHorizontal: 12, marginBottom: 6, borderWidth: 1, borderColor: theme.colors.border },
  ingredientDisplayText: { fontSize: theme.typography.fontSize.md, color: theme.colors.text, flex: 1 },
  ingredientDisplayActions: { flexDirection: 'row', alignItems: 'center', gap: 10, marginLeft: 8 },

  // Ingredient edit row (expanded)
  ingredientEditRow: { backgroundColor: theme.colors.modal, borderRadius: theme.borderRadius.md, padding: 10, marginBottom: 6, borderWidth: 1, borderColor: theme.colors.secondary },
  ingredientEditFields: { flexDirection: 'row', marginBottom: 6 },
  unitPicker: { marginBottom: 6 },
  unitChip: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: theme.borderRadius.sm, backgroundColor: theme.colors.borderSubtle, marginRight: 6, borderWidth: 1, borderColor: theme.colors.border },
  unitChipActive: { backgroundColor: theme.colors.secondary, borderColor: theme.colors.secondary },
  unitChipText: { fontSize: theme.typography.fontSize.xs, color: theme.colors.primary, fontWeight: '500' },
  unitChipTextActive: { color: theme.colors.textInverse },
  ingDoneBtn: { alignSelf: 'flex-end', paddingVertical: 6, paddingHorizontal: 12 },
  ingDoneBtnText: { fontSize: theme.typography.fontSize.sm + 1, color: theme.colors.secondary, fontWeight: '600' },

  // Add row button
  modeToggle: { flexDirection: 'row', gap: 8, marginTop: 14, marginBottom: 6 },
  modeToggleBtn: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: theme.borderRadius.sm, backgroundColor: theme.colors.borderSubtle, borderWidth: 1, borderColor: theme.colors.border },
  modeToggleBtnActive: { backgroundColor: theme.colors.secondary, borderColor: theme.colors.secondary },
  modeToggleText: { fontSize: theme.typography.fontSize.sm, fontWeight: '600', color: theme.colors.primary },
  modeToggleTextActive: { color: theme.colors.textInverse },
  addRowBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 10, marginBottom: 8 },
  addRowBtnText: { fontSize: theme.typography.fontSize.sm + 1, color: theme.colors.secondary, fontWeight: '500' },

  // Step display row (collapsed)
  stepDisplayRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.modal, borderRadius: theme.borderRadius.md, paddingVertical: 10, paddingHorizontal: 12, marginBottom: 6, borderWidth: 1, borderColor: theme.colors.border },
  stepDisplayText: { fontSize: theme.typography.fontSize.md, color: theme.colors.text, flex: 1, marginLeft: 4 },

  // Step edit row (expanded)
  stepEditRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 6 },
  stepInputNumber: { width: 26, height: 26, borderRadius: theme.borderRadius.base, backgroundColor: theme.colors.secondary, alignItems: 'center', justifyContent: 'center', marginRight: 8, marginTop: 10 },
  stepInputNumberText: { fontSize: theme.typography.fontSize.md, fontWeight: '700', color: theme.colors.textInverse },
  stepInputText: { flex: 1, minHeight: 44 },
  deleteRecipeBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 24, paddingVertical: 14, borderRadius: theme.borderRadius.md, borderWidth: 1, borderColor: theme.colors.errorLight, backgroundColor: theme.colors.errorLight },
  deleteRecipeBtnText: { fontSize: theme.typography.fontSize.md, fontWeight: '600', color: theme.colors.error },
  editRecipeImagePicker: { marginTop: 12, marginBottom: 4, borderRadius: theme.borderRadius.md, overflow: 'hidden' },
  editRecipeImagePreview: { width: '100%', height: 160, borderRadius: theme.borderRadius.md },

  // Modal
  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16 },
  modalBackground: { ...StyleSheet.absoluteFillObject, backgroundColor: theme.colors.overlay },
  modalContent: { backgroundColor: theme.colors.modal, borderRadius: theme.borderRadius['2xl'], width: '100%', maxHeight: '90%', overflow: 'hidden' },
  modalHeader: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
  modalBackBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  modalBackArrow: { fontSize: theme.typography.fontSize["2xl"], color: theme.colors.primary },
  modalBackText: { fontSize: theme.typography.fontSize.base, color: theme.colors.primary, fontWeight: '500' },
  modalImage: { width: '100%', height: 220 },
  modalBody: { padding: 20 },
  modalTitle: { fontSize: theme.typography.fontSize['2xl'] + 2, fontWeight: '700', color: theme.colors.text },
  modalChefTag: { fontSize: theme.typography.fontSize.sm + 1, color: theme.colors.secondary, fontWeight: '500', marginTop: 2 },
  modalDescription: { fontSize: theme.typography.fontSize.md, color: theme.colors.textSecondary, marginTop: 12, lineHeight: 20 },
  modalMeta: { flexDirection: 'row', gap: 16, marginTop: 10, alignItems: 'center', flexWrap: 'wrap' },
  modalMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  modalMetaText: { fontSize: theme.typography.fontSize.sm + 1, color: theme.colors.primary, fontWeight: '500' },
  modalVisibility: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: theme.borderRadius.sm },
  modalVisibilityText: { fontSize: theme.typography.fontSize.xs, color: theme.colors.textInverse, fontWeight: '600' },
  modalSection: { marginTop: 18 },
  modalSectionTitle: { fontSize: theme.typography.fontSize.lg, fontWeight: '700', color: theme.colors.text, marginBottom: 8 },
  modalIngredient: { fontSize: theme.typography.fontSize.md, color: theme.colors.textSecondary, lineHeight: 22 },
  modalStepRow: { flexDirection: 'row', marginBottom: 10, alignItems: 'flex-start' },
  modalStepNumber: { width: 26, height: 26, borderRadius: theme.borderRadius.base, backgroundColor: theme.colors.secondary, alignItems: 'center', justifyContent: 'center', marginRight: 10, marginTop: 1 },
  modalStepNumberText: { fontSize: theme.typography.fontSize.md, fontWeight: '700', color: theme.colors.textInverse },
  modalStepText: { fontSize: theme.typography.fontSize.md, color: theme.colors.textSecondary, lineHeight: 22, flex: 1 },

  // Edit profile modal
  editOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  editKeyboard: { flex: 1, justifyContent: 'flex-end' },
  editContainer: { backgroundColor: theme.colors.surfaceWarm, borderTopLeftRadius: theme.borderRadius['2xl'], borderTopRightRadius: theme.borderRadius['2xl'], paddingHorizontal: 20, paddingBottom: 20, maxHeight: '90%' },
  editHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 20, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  editTitle: { fontSize: theme.typography.fontSize['2xl'], fontWeight: '700', color: theme.colors.text },
  editCloseBtn: { width: 36, height: 36, borderRadius: theme.borderRadius.lg, backgroundColor: theme.colors.borderSubtle, alignItems: 'center', justifyContent: 'center' },
  editImagePicker: { alignSelf: 'center', marginTop: 16, marginBottom: 8, position: 'relative' },
  editImagePreview: { width: 90, height: 90, borderRadius: theme.borderRadius.full, borderWidth: 2, borderColor: theme.colors.secondary },
  editImagePlaceholder: { backgroundColor: theme.colors.borderSubtle, alignItems: 'center', justifyContent: 'center' },
  editImageOverlay: { position: 'absolute', bottom: 0, right: 0, width: 28, height: 28, borderRadius: theme.borderRadius.base, backgroundColor: theme.colors.secondary, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: theme.colors.surfaceWarm },
  editTypeRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
  editTypeOption: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: theme.borderRadius.md, backgroundColor: theme.colors.borderSubtle, borderWidth: 1, borderColor: theme.colors.border },
  editTypeOptionActive: { backgroundColor: theme.colors.secondary, borderColor: theme.colors.secondary },
  editTypeText: { fontSize: theme.typography.fontSize.md, fontWeight: '600', color: theme.colors.primary },
  editTypeTextActive: { color: theme.colors.textInverse },
  editSocialRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  deleteAccountBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 24, paddingVertical: 14, borderRadius: theme.borderRadius.md, borderWidth: 1, borderColor: theme.colors.errorLight, backgroundColor: theme.colors.errorLight },
  deleteAccountBtnText: { fontSize: theme.typography.fontSize.md, fontWeight: '600', color: theme.colors.error },
});
