import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  TouchableOpacity,
  Image,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
  Dimensions,
  Keyboard,
  Pressable,
  Modal,
  Animated,
} from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { Feather } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { getMyRecipes, deleteUserRecipe, addUserRecipe } from '../lib/userRecipesService';
import { uploadRecipeImage } from '../lib/recipeImageService';
import { useTranslation } from 'react-i18next';
import { lightHaptic, successHaptic } from '../lib/haptics';
import { useToast } from './ui/Toast';

const SafeDrawing = ({ source, style, resizeMode = 'contain' }) => {
  const [imageError, setImageError] = useState(false);
  if (imageError) return null;
  return <Image source={source} style={style} resizeMode={resizeMode} onError={() => setImageError(true)} />;
};

const PLACEHOLDER_IMAGE = 'https://images.unsplash.com/photo-1546548970-71785318a17b?w=400&h=300&fit=crop';
const { width } = Dimensions.get('window');

const formatTime = (minutes) => {
  if (!minutes) return '30 min';
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rem = minutes % 60;
  return rem > 0 ? `${hours}h ${rem}m` : `${hours}h`;
};

export default function MainProfileScreen({
  route,
  navigation,
  isActive,
  shouldPreload,
  onSwitchToGroups,
  onSwitchToInspiration,
}) {
  const { t } = useTranslation();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [recipes, setRecipes] = useState([]);
  const [hasLoadedData, setHasLoadedData] = useState(false);
  // Inline recipe creation state
  const [saving, setSaving] = useState(false);
  const [recipeName, setRecipeName] = useState('');
  const [recipeDescription, setRecipeDescription] = useState('');
  const [recipeCookingTime, setRecipeCookingTime] = useState('30');
  const [recipeCuisine, setRecipeCuisine] = useState('');
  const [recipeImageUri, setRecipeImageUri] = useState(null);

  // Recipe detail modal state
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [recipeModalVisible, setRecipeModalVisible] = useState(false);
  const [modalAnimation] = useState(new Animated.Value(0));

  const openRecipeModal = (recipe) => {
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

  const loadRecipes = useCallback(async () => {
    const result = await getMyRecipes();
    if (result.success) setRecipes(result.recipes || []);
  }, []);

  useEffect(() => {
    const shouldLoad = isActive || shouldPreload;
    if (!shouldLoad) return;
    if (hasLoadedData) return;
    setLoading(true);
    loadRecipes().finally(() => {
      setLoading(false);
      setHasLoadedData(true);
    });
  }, [isActive, shouldPreload, hasLoadedData, loadRecipes]);

  useFocusEffect(
    useCallback(() => {
      if (isActive && hasLoadedData) loadRecipes();
    }, [isActive, hasLoadedData, loadRecipes])
  );

  const resetForm = () => {
    setRecipeName('');
    setRecipeDescription('');
    setRecipeCookingTime('30');
    setRecipeCuisine('');
    setRecipeImageUri(null);
  };

  /* ── Image picker helpers (inline form) ── */
  const handlePickGallery = async () => {
    lightHaptic();
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert(
          t('common.permissionRequired') || 'Toestemming nodig',
          t('userRecipes.photoPermission') || 'Geef toegang tot je fotobibliotheek.',
        );
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
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

  const handlePickCamera = async () => {
    lightHaptic();
    try {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) {
        Alert.alert(
          t('common.permissionRequired') || 'Toestemming nodig',
          t('userRecipes.cameraPermission') || 'Geef toegang tot je camera.',
        );
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.7,
      });
      if (!result.canceled && result.assets[0]) {
        setRecipeImageUri(result.assets[0].uri);
      }
    } catch {
      toast.error(t('userRecipes.imagePickError') || 'Kon foto niet maken');
    }
  };

  const handleInlineSubmit = async () => {
    const trimmedName = recipeName.trim();
    if (!trimmedName) {
      toast.error(t('userRecipes.nameRequired') || 'Naam is verplicht');
      return;
    }
    setSaving(true);
    lightHaptic();
    try {
      // Upload image if one was picked
      let finalImageUrl = null;
      if (recipeImageUri) {
        const upload = await uploadRecipeImage(recipeImageUri);
        if (upload.success) {
          finalImageUrl = upload.url;
        } else {
          console.warn('Image upload failed:', upload.error);
        }
      }

      const result = await addUserRecipe({
        name: trimmedName,
        description: recipeDescription.trim() || null,
        cooking_time_minutes: parseInt(recipeCookingTime, 10) || 30,
        cuisine_type: recipeCuisine.trim() || null,
        image: finalImageUrl,
      });
      if (result.success) {
        successHaptic();
        toast.success(t('userRecipes.added') || 'Recept toegevoegd!');
        resetForm();
        loadRecipes();
      } else {
        toast.error(result.error || 'Kon recept niet toevoegen');
      }
    } catch (e) {
      toast.error(e?.message || 'Er is iets misgegaan');
    } finally {
      setSaving(false);
    }
  };

  const handleOpenNewRecipe = () => {
    lightHaptic();
    navigation.navigate('NewRecipe');
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
            const result = await deleteUserRecipe(recipe.id);
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

  const handleRecipePress = (recipe) => {
    lightHaptic();
    openRecipeModal(recipe);
  };


  if (loading && !hasLoadedData) {
    return (
      <SafeAreaView style={styles.container}>
        <Pressable style={{ flex: 1 }} onPress={Keyboard.dismiss} accessible={false}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#8B7355" />
            <Text style={styles.loadingText}>{t('loading.preparingStudentExperience') || 'Laden...'}</Text>
          </View>
        </Pressable>
      </SafeAreaView>
    );
  }

  // ── Has recipes: show featured-style cards ──
  if (recipes.length > 0) {
    return (
      <SafeAreaView style={styles.container}>
        <Pressable style={{ flex: 1 }} onPress={Keyboard.dismiss} accessible={false}>
          <SafeDrawing source={require('../assets/drawing1.png')} style={styles.subtleBackground} />
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Section header */}
          <View style={styles.cardSectionHeader}>
            <View>
              <Text style={styles.cardSectionTitle}>{t('userRecipes.myRecipes') || 'Mijn recepten'}</Text>
              <Text style={styles.cardSectionCount}>
                {recipes.length} {recipes.length === 1 ? (t('userRecipes.recipeOne') || 'recept') : (t('userRecipes.recipeMany') || 'recepten')}
              </Text>
            </View>
            <TouchableOpacity style={styles.addCardBtn} onPress={handleOpenNewRecipe} activeOpacity={0.8}>
              <Feather name="plus" size={20} color="#FFF" />
            </TouchableOpacity>
          </View>

          {/* Recipe cards — matching IdeasScreen style */}
          {recipes.map((r) => (
            <TouchableOpacity
              key={r.id}
              style={styles.recipeCard}
              onPress={() => handleRecipePress(r)}
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
                {/* Delete overlay (top-right of image) */}
                <TouchableOpacity
                  style={styles.deleteOverlay}
                  onPress={(e) => {
                    e.stopPropagation();
                    handleDeleteRecipe(r);
                  }}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Feather name="trash-2" size={16} color="#8B7355" />
                </TouchableOpacity>
              </View>

              <View style={styles.cardContent}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTitle} numberOfLines={2}>{r.title || r.name}</Text>
                  <View style={styles.cardMetrics}>
                    <View style={styles.timeBadge}>
                      <Text style={styles.timeBadgeText}>
                        {formatTime(r.readyInMinutes || r.cooking_time_minutes)}
                      </Text>
                    </View>
                  </View>
                </View>

                {r.description ? (
                  <Text style={styles.cardDescription} numberOfLines={2}>{r.description}</Text>
                ) : null}

                {r.dietary && r.dietary.length > 0 && (
                  <View style={styles.cardDietaryTags}>
                    {r.dietary.slice(0, 2).map((tag, index) => (
                      <View key={index} style={styles.cardDietaryTag}>
                        <Text style={styles.cardDietaryTagText}>{tag}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            </TouchableOpacity>
          ))}

          </ScrollView>
        </Pressable>

        {/* Recipe Detail Modal — identical to IdeasScreen */}
        <Modal
          visible={recipeModalVisible}
          transparent={true}
          animationType="none"
          onRequestClose={closeRecipeModal}
        >
          <View style={styles.modalOverlay}>
            <TouchableOpacity
              style={styles.modalBackground}
              activeOpacity={1}
              onPress={closeRecipeModal}
            />

            <Animated.View
              style={[
                styles.modalContainer,
                {
                  transform: [
                    {
                      scale: modalAnimation.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.8, 1],
                      }),
                    },
                  ],
                  opacity: modalAnimation,
                },
              ]}
            >
              {/* Modal Header */}
              <View style={styles.modalHeader}>
                <TouchableOpacity style={styles.backButton} onPress={closeRecipeModal}>
                  <Text style={styles.backArrow}>←</Text>
                  <Text style={styles.backText}>{t('common.back')}</Text>
                </TouchableOpacity>
              </View>

              {/* Modal Content */}
              <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
                {selectedRecipe ? (
                  <>
                    <ExpoImage
                      source={{ uri: selectedRecipe.image || PLACEHOLDER_IMAGE }}
                      style={styles.modalImage}
                      contentFit="cover"
                      transition={300}
                      cachePolicy="memory-disk"
                    />

                    <View style={styles.modalInfo}>
                      <Text style={styles.modalTitle}>{selectedRecipe.title || selectedRecipe.name}</Text>

                      <View style={styles.modalMetrics}>
                        <View style={styles.modalMetricItem}>
                          <Text style={styles.metricLabel}>Cooking Time</Text>
                          <Text style={styles.metricValue}>{formatTime(selectedRecipe.readyInMinutes || selectedRecipe.cooking_time_minutes)}</Text>
                        </View>
                        {selectedRecipe.cuisine_type && (
                          <View style={styles.modalMetricItem}>
                            <Text style={styles.metricLabel}>Cuisine</Text>
                            <Text style={styles.metricValue}>{selectedRecipe.cuisine_type}</Text>
                          </View>
                        )}
                      </View>

                      {selectedRecipe.dietary && selectedRecipe.dietary.length > 0 && (
                        <View style={styles.modalDietary}>
                          <Text style={styles.dietaryTitle}>Dietary Information</Text>
                          <View style={styles.modalDietaryTags}>
                            {selectedRecipe.dietary.map((dietary, index) => (
                              <View key={index} style={styles.modalDietaryTag}>
                                <Text style={styles.modalDietaryText}>{dietary}</Text>
                              </View>
                            ))}
                          </View>
                        </View>
                      )}

                      {selectedRecipe.description && (
                        <View style={styles.modalDescription}>
                          <Text style={styles.dietaryTitle}>Description</Text>
                          <Text style={styles.descriptionText}>{selectedRecipe.description}</Text>
                        </View>
                      )}

                      {selectedRecipe.ingredients && selectedRecipe.ingredients.length > 0 && (
                        <View style={styles.modalSection}>
                          <Text style={styles.dietaryTitle}>Ingredients</Text>
                          {selectedRecipe.ingredients.map((ingredient, index) => (
                            <Text key={index} style={styles.ingredientText}>
                              • {ingredient}
                            </Text>
                          ))}
                        </View>
                      )}

                      {selectedRecipe.instructions && selectedRecipe.instructions.length > 0 && (
                        <View style={styles.modalSection}>
                          <Text style={styles.dietaryTitle}>Instructions</Text>
                          <Text style={styles.instructionsText}>{selectedRecipe.instructions}</Text>
                        </View>
                      )}
                    </View>
                  </>
                ) : (
                  <View style={styles.modalInfo}>
                    <Text style={styles.modalTitle}>Loading recipe...</Text>
                    <Text style={styles.metricValue}>Recipe data not available</Text>
                  </View>
                )}
              </ScrollView>
            </Animated.View>
          </View>
        </Modal>
      </SafeAreaView>
    );
  }

  // ── No recipes: show creation form directly ──
  return (
    <SafeAreaView style={styles.container}>
      <Pressable style={{ flex: 1 }} onPress={Keyboard.dismiss} accessible={false}>
        <SafeDrawing source={require('../assets/drawing1.png')} style={styles.subtleBackground} />
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled"
        >
        {/* Title */}
        <View style={styles.createHeader}>
          <Text style={styles.createTitle}>{t('userRecipes.newRecipeTitle') || 'Nieuw recept'}</Text>
          <Text style={styles.createSubtext}>
            {t('userRecipes.creatingNew') || 'Voeg je eerste recept toe'}
          </Text>
        </View>

        {/* ── Photo picker (hero) ── */}
        {recipeImageUri ? (
          <View style={styles.heroFilled}>
            <ExpoImage
              source={{ uri: recipeImageUri }}
              style={styles.heroImage}
              contentFit="cover"
              transition={200}
            />
            <View style={styles.heroOverlay}>
              <TouchableOpacity style={styles.heroChangeBtn} onPress={handlePickGallery} activeOpacity={0.8}>
                <Feather name="repeat" size={14} color="#FFF" />
                <Text style={styles.heroChangeTxt}>{t('userRecipes.changePhoto') || 'Wijzig'}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.heroRemoveBtn}
                onPress={() => setRecipeImageUri(null)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Feather name="trash-2" size={15} color="#FFF" />
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.heroEmptyRow}>
            <TouchableOpacity style={styles.heroBtn} onPress={handlePickCamera} activeOpacity={0.8}>
              <Feather name="camera" size={17} color="#8B7355" />
              <Text style={styles.heroBtnText}>{t('userRecipes.camera') || 'Camera'}</Text>
            </TouchableOpacity>
            <View style={styles.heroBtnDivider} />
            <TouchableOpacity style={styles.heroBtn} onPress={handlePickGallery} activeOpacity={0.8}>
              <Feather name="image" size={17} color="#8B7355" />
              <Text style={styles.heroBtnText}>{t('userRecipes.gallery') || 'Gallerij'}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── Form fields ── */}
        <View style={styles.inlineFieldLabel}>
          <Feather name="edit-3" size={14} color="#B0A392" />
          <Text style={styles.inlineLabel}>{t('userRecipes.name') || 'Naam'}</Text>
        </View>
        <TextInput
          style={styles.softInput}
          value={recipeName}
          onChangeText={setRecipeName}
          placeholder={t('userRecipes.namePlaceholder') || 'bijv. Pasta Carbonara'}
          placeholderTextColor="#C4BAB0"
        />

        <View style={styles.inlineFieldLabel}>
          <Feather name="align-left" size={14} color="#B0A392" />
          <Text style={styles.inlineLabel}>{t('userRecipes.description') || 'Omschrijving'}</Text>
        </View>
        <TextInput
          style={[styles.softInput, styles.softTextArea]}
          value={recipeDescription}
          onChangeText={setRecipeDescription}
          placeholder={t('userRecipes.descriptionPlaceholder') || 'Korte omschrijving'}
          placeholderTextColor="#C4BAB0"
          multiline
          numberOfLines={3}
        />

        <View style={styles.formRow}>
          <View style={styles.formRowItem}>
            <View style={styles.inlineFieldLabel}>
              <Feather name="clock" size={14} color="#B0A392" />
              <Text style={styles.inlineLabel}>{t('userRecipes.cookingTime') || 'Bereidingstijd'}</Text>
            </View>
            <TextInput
              style={styles.softInput}
              value={recipeCookingTime}
              onChangeText={setRecipeCookingTime}
              placeholder="30 min"
              placeholderTextColor="#C4BAB0"
              keyboardType="number-pad"
            />
          </View>
          <View style={styles.formRowItem}>
            <View style={styles.inlineFieldLabel}>
              <Feather name="globe" size={14} color="#B0A392" />
              <Text style={styles.inlineLabel}>{t('userRecipes.cuisine') || 'Keuken'}</Text>
            </View>
            <TextInput
              style={styles.softInput}
              value={recipeCuisine}
              onChangeText={setRecipeCuisine}
              placeholder={t('userRecipes.cuisinePlaceholder') || 'bijv. Italiaans'}
              placeholderTextColor="#C4BAB0"
            />
          </View>
        </View>

        <TouchableOpacity
          style={[styles.submitBtn, saving && styles.submitBtnDisabled]}
          onPress={handleInlineSubmit}
          disabled={saving}
          activeOpacity={0.85}
        >
          {saving ? (
            <ActivityIndicator color="#FFF" size="small" />
          ) : (
            <Text style={styles.submitBtnText}>{t('userRecipes.createRecipe') || 'Recept aanmaken'}</Text>
          )}
        </TouchableOpacity>

        </ScrollView>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FEFEFE',
  },
  subtleBackground: {
    position: 'absolute',
    top: -60,
    left: -80,
    width: 400,
    height: 400,
    opacity: 0.04,
    zIndex: 0,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    color: '#8B8B8B',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 120,
    zIndex: 1,
  },

  // ── Section header (when recipes exist) ──
  cardSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  cardSectionTitle: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 24,
    lineHeight: 30,
    color: '#2D2D2D',
    letterSpacing: 0.3,
  },
  cardSectionCount: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    lineHeight: 20,
    color: '#8B7355',
    marginTop: 2,
  },
  addCardBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#8B7355',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#6B5640',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },

  // ── Recipe cards (featured style) ──
  recipeCard: {
    backgroundColor: '#F8F6F3',
    borderRadius: 16,
    marginBottom: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardImageContainer: {
    position: 'relative',
    width: '100%',
    height: 200,
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  deleteOverlay: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderRadius: 20,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
  },
  cardContent: {
    padding: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  cardTitle: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 20,
    lineHeight: 26,
    color: '#2D2D2D',
    letterSpacing: 0.3,
    flex: 1,
    marginRight: 12,
  },
  cardMetrics: {
    alignItems: 'flex-end',
    gap: 6,
  },
  timeBadge: {
    backgroundColor: '#8B7355',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  timeBadgeText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    lineHeight: 16,
    color: '#FEFEFE',
    letterSpacing: 0.1,
  },
  cardDescription: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    lineHeight: 20,
    color: '#6B6B6B',
    marginBottom: 16,
    letterSpacing: 0.1,
  },
  cardDietaryTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  cardDietaryTag: {
    backgroundColor: '#E8E2DA',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  cardDietaryTagText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 10,
    lineHeight: 14,
    color: '#6B6B6B',
    letterSpacing: 0.1,
    textTransform: 'uppercase',
  },

  // ── Create form (no recipes) ──
  createHeader: {
    marginBottom: 20,
  },
  createTitle: {
    fontSize: 26,
    fontFamily: 'PlayfairDisplay_700Bold',
    color: '#3D3227',
    marginBottom: 4,
  },
  createSubtext: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: '#9B8E7E',
    lineHeight: 20,
  },

  /* Hero photo picker */
  heroFilled: {
    borderRadius: 18,
    overflow: 'hidden',
    marginBottom: 22,
  },
  heroImage: {
    width: '100%',
    height: 180,
  },
  heroOverlay: {
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
  heroChangeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.22)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    gap: 5,
  },
  heroChangeTxt: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    color: '#FFF',
  },
  heroRemoveBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroEmptyRow: {
    flexDirection: 'row',
    borderRadius: 16,
    backgroundColor: '#EDE8E1',
    marginBottom: 22,
    overflow: 'hidden',
  },
  heroBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    gap: 7,
  },
  heroBtnDivider: {
    width: 1,
    backgroundColor: '#DDD7CF',
    marginVertical: 10,
  },
  heroBtnText: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    color: '#6B5D4D',
  },

  /* Soft inputs */
  inlineFieldLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 7,
    marginTop: 14,
    marginLeft: 2,
  },
  inlineLabel: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    color: '#6B5D4D',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  softInput: {
    backgroundColor: '#F0EBE5',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 13,
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    color: '#3D3227',
  },
  softTextArea: {
    minHeight: 76,
    textAlignVertical: 'top',
  },
  formRow: {
    flexDirection: 'row',
    gap: 12,
  },
  formRowItem: {
    flex: 1,
  },
  submitBtn: {
    backgroundColor: '#8B7355',
    height: 54,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    shadowColor: '#6B5640',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 10,
    elevation: 5,
  },
  submitBtnDisabled: {
    opacity: 0.5,
  },
  submitBtnText: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: '#FFF',
    letterSpacing: 0.2,
  },

  // Recipe detail modal — matches IdeasScreen exactly
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(45, 45, 45, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 50,
  },
  modalBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 420,
    height: '88%',
    backgroundColor: '#FEFEFE',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#2D2D2D',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F3F0',
    backgroundColor: '#FEFEFE',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#F5F3F0',
  },
  backArrow: {
    fontFamily: 'Inter_500Medium',
    fontSize: 18,
    color: '#8B7355',
    marginRight: 6,
  },
  backText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 15,
    color: '#8B7355',
    letterSpacing: 0.2,
  },
  modalContent: {
    flex: 1,
    backgroundColor: '#FEFEFE',
  },
  modalImage: {
    width: '100%',
    height: 240,
  },
  modalInfo: {
    padding: 32,
  },
  modalTitle: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 26,
    lineHeight: 34,
    color: '#2D2D2D',
    marginBottom: 26,
    letterSpacing: 0.3,
  },
  modalMetrics: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 30,
    gap: 28,
  },
  modalMetricItem: {
    flex: 1,
  },
  metricLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    lineHeight: 16,
    color: '#8B7355',
    marginBottom: 6,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  metricValue: {
    fontFamily: 'Inter_500Medium',
    fontSize: 16,
    lineHeight: 22,
    color: '#2D2D2D',
    letterSpacing: 0.1,
  },
  modalDietary: {
    marginBottom: 26,
  },
  dietaryTitle: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 18,
    lineHeight: 24,
    color: '#2D2D2D',
    marginBottom: 14,
    letterSpacing: 0.2,
  },
  modalDietaryTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  modalDietaryTag: {
    backgroundColor: '#F5F3F0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E8E6E3',
  },
  modalDietaryText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    lineHeight: 16,
    color: '#8B7355',
    letterSpacing: 0.2,
    textTransform: 'capitalize',
  },
  modalDescription: {
    marginBottom: 26,
  },
  descriptionText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    lineHeight: 22,
    color: '#6B6B6B',
    letterSpacing: 0.1,
  },
  modalSection: {
    marginBottom: 26,
  },
  ingredientText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    lineHeight: 22,
    color: '#6B6B6B',
    letterSpacing: 0.1,
    marginBottom: 8,
  },
  instructionsText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    lineHeight: 22,
    color: '#6B6B6B',
    letterSpacing: 0.1,
  },
});
