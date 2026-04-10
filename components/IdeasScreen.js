import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Image, Linking, ActivityIndicator, Modal, Animated, Dimensions, Alert, SafeAreaView } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { getCurrentUserProfile } from '../lib/profileService';
import { getRandomRecipes, getAllRecipes, getMyChefRecipes, shareRecipeWithGroups } from '../lib/recipesService';
import { getAllChefs, getAllHouses } from '../lib/chefService';
import { Feather } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { formatDateLongNL } from '../lib/dateFormatting';
import { useAppState } from '../lib/AppStateContext';
import { log } from '../lib/debugConfig';
import { supabase } from '../lib/supabase';
import { lightHaptic, successHaptic } from '../lib/haptics';
import { useToast } from './ui/Toast';
import ServingSelector from './ui/ServingSelector';
import { scaleIngredients } from '../lib/ingredientScaler';
import { getRecipeExtras } from '../lib/recipeExtrasService';

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

export default function IdeasScreen({ route, navigation, hideBottomNav, isActive, shouldPreload, pendingOpenRecipe, onOpenRecipeHandled }) {
  const { t } = useTranslation();
  const toast = useToast();
  const { cachedRecipes, cachedRecipesTimestamp, saveCachedRecipes, groups } = useAppState();
  
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [recipes, setRecipes] = useState([]);
  const [allLoadedRecipes, setAllLoadedRecipes] = useState([]);
  const [displayedCount, setDisplayedCount] = useState(20);
  const [isInitialized, setIsInitialized] = useState(false);
  const [usedCachedRecipes, setUsedCachedRecipes] = useState(false);
  const [hasMoreFromAPI, setHasMoreFromAPI] = useState(true);
  const [userPreferences, setUserPreferences] = useState({
    cuisines: [],
    dietaryRestrictions: []
  });
  
  // Tab and chefs states
  const [activeTab, setActiveTab] = useState('meals'); // 'meals', 'chefs', or 'houses'
  const [chefs, setChefs] = useState([]);
  const [chefsLoading, setChefsLoading] = useState(false);
  const [houses, setHouses] = useState([]);
  const [housesLoading, setHousesLoading] = useState(false);
  const [selectedChef, setSelectedChef] = useState(null);
  const [selectedChefRecipes, setSelectedChefRecipes] = useState([]);
  const [chefModalVisible, setChefModalVisible] = useState(false);
  const [chefModalAnimation] = useState(new Animated.Value(0));
  const [flippedChefId, setFlippedChefId] = useState(null);
  
  // Modal states
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalAnimation] = useState(new Animated.Value(0));
  const [servingCount, setServingCount] = useState(4);

  // Add to group states
  const [showGroupPicker, setShowGroupPicker] = useState(false);
  const [selectedGroupIds, setSelectedGroupIds] = useState([]);
  const [savingGroups, setSavingGroups] = useState(false);

  const { width, height } = Dimensions.get('window');

  const shuffleRecipes = (list = []) => {
    const arr = [...list];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  };

  // Open recipe passed from another tab (e.g. user taps their own recipe in Profile)
  useEffect(() => {
    if (pendingOpenRecipe && isActive) {
      openRecipe(pendingOpenRecipe);
      if (onOpenRecipeHandled) onOpenRecipeHandled();
    }
  }, [pendingOpenRecipe, isActive]);

  // Load chefs/houses when switching tabs
  useEffect(() => {
    if (activeTab === 'chefs') loadChefs();
    if (activeTab === 'houses') loadHouses();
  }, [activeTab]);

  // INSTANT: Use cached recipes from context for immediate display
  useEffect(() => {
    if (!usedCachedRecipes && cachedRecipes && cachedRecipes.length > 0) {
      log.cache('INSTANT: Using', cachedRecipes.length, 'cached recipes for immediate display');
      const shuffledCached = shuffleRecipes(cachedRecipes);
      setAllLoadedRecipes(shuffledCached);
      setRecipes(shuffledCached.slice(0, 20));
      setDisplayedCount(Math.min(20, shuffledCached.length));
      setLoading(false);
      setUsedCachedRecipes(true);
    }
  }, [cachedRecipes, usedCachedRecipes]);

  // Load data when tab becomes active OR when preloading is triggered
  useEffect(() => {
    // Load immediately if active, or preload if shouldPreload is true
    const shouldLoad = isActive || shouldPreload;
    if (!shouldLoad) return;
    
    const initializeData = async () => {
      if (!isInitialized) {
        await loadUserPreferences();
        
        // Check if cached recipes are fresh enough (< 1 hour)
        const cacheAge = cachedRecipesTimestamp ? Date.now() - cachedRecipesTimestamp : Infinity;
        const RECIPE_CACHE_EXPIRY = 60 * 60 * 1000; // 1 hour
        
        // Invalidate cache if recipes don't have chef field at all (old cache format)
        const cacheHasChefField = cachedRecipes && cachedRecipes.length > 0 && 'chef' in cachedRecipes[0];
        if (cachedRecipes && cachedRecipes.length > 0 && cacheAge < RECIPE_CACHE_EXPIRY && cacheHasChefField) {
          log.cache('Using fresh cached recipes (age:', Math.round(cacheAge / 1000 / 60), 'min)');
          // Already displayed from cache, just mark initialized
        } else {
          // Cache is stale or empty, load fresh recipes
          log.cache('Cache stale or empty, loading fresh recipes...');
          await loadFeaturedRecipes();
        }
        setIsInitialized(true);
      } else if (isActive) {
        // Only refresh preferences when actively viewing
        await loadUserPreferences();
      }
    };
    
    initializeData();
  }, [isActive, shouldPreload, isInitialized, cachedRecipes, cachedRecipesTimestamp]);

  const loadUserPreferences = async () => {
    try {
      const { success, profile } = await getCurrentUserProfile();
      if (!success || !profile) {
        return;
      }

      // Since we've simplified the profile, no user preferences to load
      const preferences = {
        cuisines: [],
        dietaryRestrictions: []
      };
      
      setUserPreferences(preferences);
    } catch (error) {
      console.error('❌ Error loading user preferences:', error);
    }
  };

  const loadFeaturedRecipes = async (isLoadingMore = false) => {
    if (isLoadingMore) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }
    
    try {
      let result;
      if (isLoadingMore) {
        result = await getAllRecipes(allLoadedRecipes.length, 20);
      } else {
        result = await getAllRecipes(0, 120);
      }
      
      if (!result.success) {
        throw new Error(result.error);
      }

      if (!result.hasMore) {
        setHasMoreFromAPI(false);
      }

      if (!result.recipes || result.recipes.length === 0) {
        if (isLoadingMore) {
          setHasMoreFromAPI(false);
          return;
        }
        throw new Error('No recipes found in database');
      }

      const normalizedRecipes = result.recipes.map(dbRecipe => {
        return {
          id: dbRecipe.id,
          title: dbRecipe.name || 'Unnamed Recipe',
          name: dbRecipe.name,
          image: dbRecipe.image || 'https://images.unsplash.com/photo-1546548970-71785318a17b?w=400&h=300&fit=crop',
          readyInMinutes: dbRecipe.cooking_time_minutes || 30,
          cooking_time_minutes: dbRecipe.cooking_time_minutes,
          dietary: dbRecipe.cuisine_type ? [dbRecipe.cuisine_type] : [],
          description: dbRecipe.description || 'A delicious recipe perfect for your next meal',
          sourceUrl: `#recipe-${dbRecipe.id}`,
          tastyId: dbRecipe.id,
          ingredients: dbRecipe.ingredients || [],
          instructions: Array.isArray(dbRecipe.steps) ? dbRecipe.steps.join('\n') : (dbRecipe.steps || ''),
          pricePerServing: null,
          cuisine_type: dbRecipe.cuisine_type,
          steps: dbRecipe.steps,
          chef: dbRecipe.chef || null,
        };
      });

      if (isLoadingMore) {
        const existingIds = new Set(allLoadedRecipes.map(r => r.id));
        const unseenRecipes = normalizedRecipes.filter(r => !existingIds.has(r.id));
        const shuffledUnseen = shuffleRecipes(unseenRecipes);
        const mergedRecipes = [...allLoadedRecipes, ...shuffledUnseen];
        setAllLoadedRecipes(mergedRecipes);
        setRecipes(mergedRecipes.slice(0, displayedCount + 20));
        setDisplayedCount(prev => Math.min(prev + 20, mergedRecipes.length));
      } else {
        const shuffledRecipes = shuffleRecipes(normalizedRecipes);
        setAllLoadedRecipes(shuffledRecipes);
        setRecipes(shuffledRecipes.slice(0, 20));
        setDisplayedCount(Math.min(20, shuffledRecipes.length));
        
        log.cache('Saving', shuffledRecipes.length, 'recipes to cache');
        saveCachedRecipes(shuffledRecipes);
      }

    } catch (error) {
      console.error('❌ Error loading recipes from database:', error);
      console.error('❌ Full error details:', error.message, error.stack);
      
      // Show alert to user about the database issue
      Alert.alert(
        t('recipes.databaseError'), 
        t('recipes.databaseErrorMessage'),
        [{ text: 'OK' }]
      );
      
      // Fallback to sample recipes if database fails
      const fallbackRecipes = [
        {
          id: 'sample-1',
          title: "Sample Recipe 1",
          image: "https://images.unsplash.com/photo-1598103442097-8b74394b95c6?w=400&h=300&fit=crop",
          readyInMinutes: 30,
          dietary: [],
          description: "Add your own recipes to see them here! Go to the database and insert recipe data.",
          sourceUrl: "#",
          tastyId: 'sample-1',
          ingredients: ["Sample ingredient"],
          instructions: "Add your recipes to the database to see real content here.",
          pricePerServing: null
        },
        {
          id: 'sample-2',
          title: "Sample Recipe 2",
          image: "https://images.unsplash.com/photo-1621996346565-e3dbc353d2c5?w=400&h=300&fit=crop",
          readyInMinutes: 25,
          dietary: ["vegetarian"],
          description: "This is a sample recipe. Add your own recipes to the database to see real content.",
          sourceUrl: "#",
          tastyId: 'sample-2',
          ingredients: ["Sample ingredient"],
          instructions: "Add your recipes to the database to see real content here.",
          pricePerServing: 3.50
        }
      ];
      
      if (isLoadingMore) {
        setAllLoadedRecipes(prev => [...prev, ...fallbackRecipes]);
        setRecipes(prev => [...prev, ...fallbackRecipes]);
      } else {
        setAllLoadedRecipes(fallbackRecipes);
        setRecipes(fallbackRecipes);
        setDisplayedCount(fallbackRecipes.length);
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const openRecipe = (recipe) => {
    const extras = getRecipeExtras(recipe?.name || recipe?.title);
    setServingCount(extras.default_servings);
    setSelectedRecipe(recipe);
    setModalVisible(true);
    
    // Start animation
    Animated.spring(modalAnimation, {
      toValue: 1,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start();
  };

  const closeModal = () => {
    Animated.spring(modalAnimation, {
      toValue: 0,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start(() => {
      setModalVisible(false);
      setSelectedRecipe(null);
      setShowGroupPicker(false);
      setSelectedGroupIds([]);
    });
  };

  const toggleGroupSelect = (groupId) => {
    lightHaptic();
    setSelectedGroupIds((prev) =>
      prev.includes(groupId)
        ? prev.filter((id) => id !== groupId)
        : [...prev, groupId]
    );
  };

  const handleSaveToGroups = async () => {
    if (!selectedRecipe?.id || selectedGroupIds.length === 0) return;
    setSavingGroups(true);
    lightHaptic();
    try {
      // Add recipe to each selected group individually (append, not replace)
      for (const gid of selectedGroupIds) {
        await supabase
          .from('recipe_group_shares')
          .upsert(
            { recipe_id: selectedRecipe.id, group_id: gid, shared_by: (await supabase.auth.getUser()).data.user.id },
            { onConflict: 'recipe_id,group_id' }
          );
      }
      successHaptic();
      const count = selectedGroupIds.length;
      toast.success(`${t('chef.addedToGroup') || 'Toegevoegd aan'} ${count} ${count === 1 ? 'groep' : 'groepen'}`);
      setShowGroupPicker(false);
      setSelectedGroupIds([]);
    } catch (e) {
      toast.error(e?.message || 'Er is iets misgegaan');
    } finally {
      setSavingGroups(false);
    }
  };

  const openExternalLink = () => {
    const url = selectedRecipe?.sourceUrl;
    
    if (url) {
      Linking.openURL(url).catch(err => {
        console.error('❌ Failed to open recipe URL:', err);
        
        // If the constructed URL fails, try a generic Tasty search
        const searchQuery = encodeURIComponent(selectedRecipe?.title || '');
        const fallbackUrl = `https://tasty.co/search?q=${searchQuery}`;
        
        Linking.openURL(fallbackUrl).catch(fallbackErr => {
          console.error('❌ Fallback URL also failed:', fallbackErr);
          Alert.alert('Error', `Sorry, we couldn't open the recipe link. You can search for "${selectedRecipe?.title}" on tasty.co manually.`);
        });
      });
    } else {
      // Provide a fallback action - search on Tasty.co
      const searchQuery = encodeURIComponent(selectedRecipe?.title || '');
      const searchUrl = `https://tasty.co/search?q=${searchQuery}`;
      
      Alert.alert(
        'No Direct Link Available',
        `This recipe doesn't have a direct link. Would you like to search for "${selectedRecipe?.title}" on Tasty.co?`,
        [
          { text: t('common.cancel'), style: 'cancel' },
          { 
            text: 'Search', 
            onPress: () => {
              Linking.openURL(searchUrl).catch(err => {
                console.error('❌ Search URL failed:', err);
                Alert.alert('Error', `Please visit tasty.co and search for "${selectedRecipe?.title}" manually.`);
              });
            }
          }
        ]
      );
    }
  };



  const formatTime = (minutes) => {
    if (minutes < 60) {
      return `${minutes} min`;
    } else {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
    }
  };

  const loadChefs = async () => {
    setChefsLoading(true);
    try {
      const result = await getAllChefs();
      if (result.success) {
        setChefs(result.chefs);
      }
    } catch (error) {
      console.error('Error loading chefs:', error);
    } finally {
      setChefsLoading(false);
    }
  };

  const loadHouses = async () => {
    setHousesLoading(true);
    try {
      const result = await getAllHouses();
      if (result.success) {
        setHouses(result.houses);
      }
    } catch (error) {
      // silently fail
    } finally {
      setHousesLoading(false);
    }
  };

  const openChefProfile = async (chef) => {
    setSelectedChef(chef);
    setSelectedChefRecipes([]);
    setChefModalVisible(true);
    // Fetch this chef's public recipes
    const result = await getMyChefRecipes(chef.id);
    if (result.success) {
      setSelectedChefRecipes((result.recipes || []).filter(r => r.visibility === 'public'));
    }
    Animated.spring(chefModalAnimation, {
      toValue: 1,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start();
  };

  const closeChefModal = () => {
    Animated.spring(chefModalAnimation, {
      toValue: 0,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start(() => {
      setChefModalVisible(false);
      setSelectedChef(null);
    });
  };




  const getCurrentDate = () => {
    const today = new Date();
    return formatDateLongNL(today);
  };

  const refreshRecipes = async () => {
    if (displayedCount < allLoadedRecipes.length) {
      const newDisplayCount = Math.min(displayedCount + 20, allLoadedRecipes.length);
      setLoadingMore(true);
      setTimeout(() => {
        setRecipes(allLoadedRecipes.slice(0, newDisplayCount));
        setDisplayedCount(newDisplayCount);
        setLoadingMore(false);
      }, 500);
    } else if (hasMoreFromAPI) {
      await loadFeaturedRecipes(true);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6B00" />
          <Text style={styles.loadingText}>{t('recipes.loadingRecipes')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Background Watermark */}
      <SafeDrawing
        source={require('../assets/drawing4.png')}
        style={styles.backgroundWatermark}
      />

      {/* Fixed Header */}
      <View style={styles.stickyHeader}>
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'meals' && styles.activeTab]}
            onPress={() => setActiveTab('meals')}
          >
            <Text style={[styles.tabText, activeTab === 'meals' && styles.activeTabText]}>
              {t('meals.title')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === 'chefs' && styles.activeTab]}
            onPress={() => setActiveTab('chefs')}
          >
            <Text style={[styles.tabText, activeTab === 'chefs' && styles.activeTabText]}>
              {t('meals.chefs') || 'Chefs'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === 'houses' && styles.activeTab]}
            onPress={() => setActiveTab('houses')}
          >
            <Text style={[styles.tabText, activeTab === 'houses' && styles.activeTabText]}>
              {t('meals.houses') || 'Huizen'}
            </Text>
          </TouchableOpacity>
        </View>

      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === 'meals' && (
          <Text style={styles.dateText}>{getCurrentDate()}</Text>
        )}

        {/* Content based on active tab */}
        {activeTab === 'meals' && (
        <View style={styles.recipesContainer}>
          <Text style={styles.sectionTitle}>{t('recipes.featuredRecipes')}</Text>
          
          {recipes.map((recipe) => (
            <TouchableOpacity 
              key={recipe.id} 
              style={styles.recipeCard}
              onPress={() => openRecipe(recipe)}
              activeOpacity={0.9}
            >
              <View style={styles.imageContainer}>
                <ExpoImage 
                  source={{ uri: recipe.image }} 
                  style={styles.recipeImage}
                  contentFit="cover"
                  transition={200}
                  cachePolicy="memory-disk"
                />
                {recipe.chef && (
                  <TouchableOpacity
                    style={styles.chefTagOverlay}
                    onPress={(e) => {
                      e.stopPropagation();
                      openChefProfile(recipe.chef);
                    }}
                  >
                    <Text style={styles.chefTagText}>@{recipe.chef.tag}</Text>
                  </TouchableOpacity>
                )}
              </View>
              
              <View style={styles.recipeContent}>
                <View style={styles.recipeHeader}>
                  <Text style={styles.recipeTitle}>{recipe.title}</Text>
                  <View style={styles.recipeMetrics}>
                    <View style={styles.timeContainer}>
                      <Text style={styles.timeText}>{formatTime(recipe.readyInMinutes)}</Text>
                    </View>
                  </View>
                </View>

                <Text style={styles.recipeDescription}>{recipe.description}</Text>

                {(() => { const ex = getRecipeExtras(recipe.name || recipe.title); return ex.estimated_cost ? (
                  <View style={styles.priceBadgeRow}>
                    <View style={styles.priceBadge}>
                      <Text style={styles.priceBadgeText}>€{ex.estimated_cost.toFixed(0)}</Text>
                    </View>
                  </View>
                ) : null; })()}
              </View>
            </TouchableOpacity>
          ))}
        </View>
        )}

        {activeTab === 'chefs' && (
          <View style={styles.recipesContainer}>
            <Text style={styles.sectionTitle}>Chefs</Text>

            {chefsLoading ? (
              <View style={styles.emptyWishlist}>
                <ActivityIndicator size="large" color="#FF6B00" />
              </View>
            ) : chefs.length === 0 ? (
              <View style={styles.emptyWishlist}>
                <Text style={styles.emptyWishlistTitle}>{t('common.loading')}</Text>
              </View>
            ) : (
              chefs.map((chef) => {
                const isFlipped = flippedChefId === chef.id;
                const chefRecipes = allLoadedRecipes.filter(r => r.chef_id === chef.id);
                return (
                  <View key={chef.id} style={styles.recipeCard}>
                    {!isFlipped ? (
                      /* Front side - Chef profile */
                      <TouchableOpacity
                        onPress={() => openChefProfile(chef)}
                        activeOpacity={0.9}
                      >
                        <View style={styles.imageContainer}>
                          {chef.profile_image ? (
                            <ExpoImage
                              source={{ uri: chef.profile_image }}
                              style={styles.recipeImage}
                              contentFit="cover"
                              transition={200}
                              cachePolicy="memory-disk"
                            />
                          ) : (
                            <View style={[styles.recipeImage, { backgroundColor: '#E8E6E3', justifyContent: 'center', alignItems: 'center' }]}>
                              <Text style={{ fontSize: 48, color: '#FF6B00' }}>{chef.name.charAt(0)}</Text>
                            </View>
                          )}
                          {chefRecipes.length > 0 && (
                            <TouchableOpacity
                              style={styles.chefRecipesButton}
                              onPress={(e) => {
                                e.stopPropagation();
                                setFlippedChefId(chef.id);
                              }}
                            >
                              <Text style={styles.chefRecipesButtonText}>{t('recipes.recipes') || 'Recepten'} ({chefRecipes.length})</Text>
                            </TouchableOpacity>
                          )}
                        </View>

                        <View style={styles.recipeContent}>
                          <Text style={styles.recipeTitle}>{chef.name}</Text>
                          <Text style={[styles.recipeDescription, { color: '#FF6B00', marginBottom: 8 }]}>@{chef.tag}</Text>
                          {chef.description && (
                            <Text style={styles.recipeDescription} numberOfLines={2}>{chef.description}</Text>
                          )}
                        </View>
                      </TouchableOpacity>
                    ) : (
                      /* Back side - Chef's recipes */
                      <View>
                        <View style={styles.chefRecipesHeader}>
                          <Text style={styles.chefRecipesTitle}>{chef.name}</Text>
                          <TouchableOpacity onPress={() => setFlippedChefId(null)}>
                            <Text style={styles.chefRecipesClose}>✕</Text>
                          </TouchableOpacity>
                        </View>
                        <ScrollView style={styles.chefRecipesList} nestedScrollEnabled>
                          {chefRecipes.map((recipe) => (
                            <TouchableOpacity
                              key={recipe.id}
                              style={styles.chefRecipeItem}
                              onPress={() => {
                                setFlippedChefId(null);
                                openRecipe(recipe);
                              }}
                              activeOpacity={0.7}
                            >
                              <ExpoImage
                                source={{ uri: recipe.image || recipe.thumbnail_url }}
                                style={styles.chefRecipeThumb}
                                contentFit="cover"
                                cachePolicy="memory-disk"
                              />
                              <View style={styles.chefRecipeInfo}>
                                <Text style={styles.chefRecipeName} numberOfLines={1}>{recipe.title || recipe.name}</Text>
                                <Text style={styles.chefRecipeDesc} numberOfLines={1}>{recipe.description}</Text>
                              </View>
                            </TouchableOpacity>
                          ))}
                        </ScrollView>
                      </View>
                    )}
                  </View>
                );
              })
            )}
          </View>
        )}

        {/* Houses Tab */}
        {activeTab === 'houses' && (
          <View style={styles.recipesContainer}>
            <Text style={styles.sectionTitle}>{t('meals.houses') || 'Huizen'}</Text>

            {housesLoading ? (
              <View style={styles.emptyWishlist}>
                <ActivityIndicator size="large" color="#FF6B00" />
              </View>
            ) : houses.length === 0 ? (
              <View style={styles.emptyWishlist}>
                <Text style={styles.emptyWishlistTitle}>{t('meals.noHouses') || 'Nog geen huizen'}</Text>
              </View>
            ) : (
              houses.map((house) => {
                const isFlipped = flippedChefId === house.id;
                const houseRecipes = allLoadedRecipes.filter(r => r.chef_id === house.id);
                return (
                  <View key={house.id} style={styles.recipeCard}>
                    {!isFlipped ? (
                      <TouchableOpacity
                        onPress={() => openChefProfile(house)}
                        activeOpacity={0.9}
                      >
                        <View style={styles.imageContainer}>
                          {house.profile_image ? (
                            <ExpoImage
                              source={{ uri: house.profile_image }}
                              style={styles.recipeImage}
                              contentFit="cover"
                              transition={200}
                              cachePolicy="memory-disk"
                            />
                          ) : (
                            <View style={[styles.recipeImage, { backgroundColor: '#E8E6E3', justifyContent: 'center', alignItems: 'center' }]}>
                              <Text style={{ fontSize: 48, color: '#FF6B00' }}>{house.name.charAt(0)}</Text>
                            </View>
                          )}
                          {houseRecipes.length > 0 && (
                            <TouchableOpacity
                              style={styles.chefRecipesButton}
                              onPress={(e) => {
                                e.stopPropagation();
                                setFlippedChefId(house.id);
                              }}
                            >
                              <Text style={styles.chefRecipesButtonText}>{t('recipes.recipes') || 'Recepten'} ({houseRecipes.length})</Text>
                            </TouchableOpacity>
                          )}
                        </View>

                        <View style={styles.recipeContent}>
                          <Text style={styles.recipeTitle}>{house.name}</Text>
                          <Text style={[styles.recipeDescription, { color: '#FF6B00', marginBottom: 8 }]}>@{house.tag}</Text>
                          {house.description && (
                            <Text style={styles.recipeDescription} numberOfLines={2}>{house.description}</Text>
                          )}
                        </View>
                      </TouchableOpacity>
                    ) : (
                      <View>
                        <View style={styles.chefRecipesHeader}>
                          <Text style={styles.chefRecipesTitle}>{house.name}</Text>
                          <TouchableOpacity onPress={() => setFlippedChefId(null)}>
                            <Text style={styles.chefRecipesClose}>✕</Text>
                          </TouchableOpacity>
                        </View>
                        <ScrollView style={styles.chefRecipesList} nestedScrollEnabled>
                          {houseRecipes.map((recipe) => (
                            <TouchableOpacity
                              key={recipe.id}
                              style={styles.chefRecipeItem}
                              onPress={() => {
                                setFlippedChefId(null);
                                openRecipe(recipe);
                              }}
                              activeOpacity={0.7}
                            >
                              <ExpoImage
                                source={{ uri: recipe.image || recipe.thumbnail_url }}
                                style={styles.chefRecipeThumb}
                                contentFit="cover"
                                cachePolicy="memory-disk"
                              />
                              <View style={styles.chefRecipeInfo}>
                                <Text style={styles.chefRecipeName} numberOfLines={1}>{recipe.title || recipe.name}</Text>
                                <Text style={styles.chefRecipeDesc} numberOfLines={1}>{recipe.description}</Text>
                              </View>
                            </TouchableOpacity>
                          ))}
                        </ScrollView>
                      </View>
                    )}
                  </View>
                );
              })
            )}
          </View>
        )}

        {/* Bottom Action */}
        {activeTab === 'meals' && (displayedCount < allLoadedRecipes.length || hasMoreFromAPI) && (
        <View style={styles.bottomAction}>
          <TouchableOpacity 
            style={[styles.moreRecipesButton, loadingMore && styles.buttonDisabled]}
            onPress={refreshRecipes}
            disabled={loadingMore}
          >
            {loadingMore ? (
              <ActivityIndicator size="small" color="#FEFEFE" />
            ) : (
              <Text style={styles.moreRecipesButtonText}>
                {displayedCount < allLoadedRecipes.length
                  ? t('recipes.showMore', { count: Math.min(20, allLoadedRecipes.length - displayedCount) })
                  : t('recipes.discoverNewRecipes')
                }
              </Text>
            )}
          </TouchableOpacity>
          
          </View>
        )}
        
      </ScrollView>

      {/* Recipe Details Modal */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="none"
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity 
            style={styles.modalBackground}
            activeOpacity={1}
            onPress={closeModal}
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
              <TouchableOpacity style={styles.backButton} onPress={closeModal}>
                <Text style={styles.backArrow}>←</Text>
                <Text style={styles.backText}>{t('common.back')}</Text>
              </TouchableOpacity>
            </View>

            {/* Modal Content */}
            <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
              {selectedRecipe ? (
                <>
                  <ExpoImage 
                    source={{ uri: selectedRecipe.image }} 
                    style={styles.modalImage}
                    contentFit="cover"
                    transition={300}
                    cachePolicy="memory-disk"
                  />
                  
                  <View style={styles.modalInfo}>
                    <Text style={styles.modalTitle}>{selectedRecipe.title}</Text>
                    
                    <View style={styles.modalMetrics}>
                      <View style={styles.modalMetricItem}>
                        <Text style={styles.metricLabel}>{t('recipes.cookingTime')}</Text>
                        <Text style={styles.metricValue}>{formatTime(selectedRecipe.readyInMinutes)}</Text>
                      </View>
                      {(() => { const ex = getRecipeExtras(selectedRecipe.name || selectedRecipe.title); return ex.estimated_cost ? (
                      <View style={styles.modalMetricItem}>
                          <Text style={styles.metricLabel}>{t('recipes.cost')}</Text>
                          <Text style={styles.metricValue}>{'\u20AC'}{ex.estimated_cost.toFixed(0)}</Text>
                      </View>
                      ) : null; })()}
                    </View>

                    {selectedRecipe.description && (
                      <View style={styles.modalDescription}>
                        <Text style={styles.dietaryTitle}>{t('recipes.description')}</Text>
                        <Text style={styles.descriptionText}>{selectedRecipe.description}</Text>
                      </View>
                    )}

                    {/* Ingredients Section */}
                    {selectedRecipe.ingredients && selectedRecipe.ingredients.length > 0 && (
                      <View style={styles.modalSection}>
                        <Text style={styles.dietaryTitle}>{t('recipes.ingredients')}</Text>
                        <ServingSelector count={servingCount} onChange={setServingCount} />
                        {scaleIngredients(selectedRecipe.ingredients, getRecipeExtras(selectedRecipe.name || selectedRecipe.title).default_servings, servingCount).map((ingredient, index) => (
                          <Text key={index} style={styles.ingredientText}>
                            • {ingredient}
                          </Text>
                        ))}
                      </View>
                    )}

                    {/* Instructions Section */}
                    {selectedRecipe.steps && selectedRecipe.steps.length > 0 ? (
                      <View style={styles.modalSection}>
                        <Text style={styles.dietaryTitle}>{t('recipes.instructions')}</Text>
                        {selectedRecipe.steps.map((step, idx) => (
                          <View key={idx} style={styles.stepRow}>
                            <View style={styles.stepNumber}>
                              <Text style={styles.stepNumberText}>{idx + 1}</Text>
                            </View>
                            <Text style={styles.stepText}>{step}</Text>
                          </View>
                        ))}
                      </View>
                    ) : selectedRecipe.instructions && selectedRecipe.instructions.length > 0 ? (
                      <View style={styles.modalSection}>
                        <Text style={styles.dietaryTitle}>{t('recipes.instructions')}</Text>
                        <Text style={styles.instructionsText}>{selectedRecipe.instructions}</Text>
                      </View>
                    ) : null}

                    {/* Chef tag in recipe modal */}
                    {selectedRecipe?.chef && (
                      <TouchableOpacity
                        style={styles.modalChefTag}
                        onPress={() => {
                          const chef = { ...selectedRecipe.chef };
                          setModalVisible(false);
                          setSelectedRecipe(null);
                          setShowGroupPicker(false);
                          setSelectedGroupIds([]);
                          setTimeout(() => openChefProfile(chef), 100);
                        }}
                      >
                        <Text style={styles.modalChefTagText}>@{selectedRecipe.chef.tag}</Text>
                        <Text style={styles.modalChefName}>{selectedRecipe.chef.name}</Text>
                      </TouchableOpacity>
                    )}

                    {/* Add to group button */}
                    {selectedRecipe?.id && (
                      <View style={styles.addToGroupSection}>
                        <TouchableOpacity
                          style={styles.addToGroupBtn}
                          onPress={() => { lightHaptic(); setShowGroupPicker(!showGroupPicker); setSelectedGroupIds([]); }}
                          activeOpacity={0.8}
                        >
                          <Feather name={showGroupPicker ? 'chevron-up' : 'plus-circle'} size={18} color="#FFF" />
                          <Text style={styles.addToGroupBtnText}>
                            {t('chef.addToGroup') || 'Toevoegen aan groep'}
                          </Text>
                        </TouchableOpacity>

                        {showGroupPicker && (
                          <View style={styles.groupPickerList}>
                            {(groups || []).length === 0 ? (
                              <Text style={styles.groupPickerEmpty}>
                                {t('groups.noGroups') || 'Geen groepen'}
                              </Text>
                            ) : (
                              <>
                                {(groups || []).map((g) => {
                                  const isSelected = selectedGroupIds.includes(g.id);
                                  return (
                                    <TouchableOpacity
                                      key={g.id}
                                      style={[styles.groupPickerItem, isSelected && styles.groupPickerItemActive]}
                                      onPress={() => toggleGroupSelect(g.id)}
                                      activeOpacity={0.7}
                                    >
                                      <Text style={styles.groupPickerName}>{g.name}</Text>
                                      <View style={[styles.groupCheckbox, isSelected && styles.groupCheckboxChecked]}>
                                        {isSelected && <Feather name="check" size={14} color="#FFF" />}
                                      </View>
                                    </TouchableOpacity>
                                  );
                                })}
                                {selectedGroupIds.length > 0 && (
                                  <TouchableOpacity
                                    style={styles.groupPickerSaveBtn}
                                    onPress={handleSaveToGroups}
                                    disabled={savingGroups}
                                    activeOpacity={0.8}
                                  >
                                    {savingGroups ? (
                                      <ActivityIndicator size="small" color="#FFF" />
                                    ) : (
                                      <Text style={styles.groupPickerSaveBtnText}>
                                        {t('chef.addToGroupConfirm') || 'Toevoegen'} ({selectedGroupIds.length})
                                      </Text>
                                    )}
                                  </TouchableOpacity>
                                )}
                              </>
                            )}
                          </View>
                        )}
                      </View>
                    )}
                  </View>
                </>
              ) : (
                <View style={styles.modalInfo}>
                  <Text style={styles.modalTitle}>{t('recipes.loadingRecipe')}</Text>
                  <Text style={styles.metricValue}>{t('recipes.recipeNotAvailable')}</Text>
                </View>
              )}
            </ScrollView>
          </Animated.View>
        </View>
      </Modal>

      {/* Chef Profile Modal */}
      <Modal
        visible={chefModalVisible}
        transparent={true}
        animationType="none"
        onRequestClose={closeChefModal}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackground}
            activeOpacity={1}
            onPress={closeChefModal}
          />

          <Animated.View
            style={[
              styles.modalContainer,
              {
                transform: [
                  {
                    scale: chefModalAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.8, 1],
                    }),
                  },
                ],
                opacity: chefModalAnimation,
              },
            ]}
          >
            <View style={styles.modalHeader}>
              <TouchableOpacity style={styles.backButton} onPress={closeChefModal}>
                <Text style={styles.backArrow}>←</Text>
                <Text style={styles.backText}>{t('common.back')}</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
              {selectedChef && (
                <>
                  {selectedChef.profile_image ? (
                    <ExpoImage
                      source={{ uri: selectedChef.profile_image }}
                      style={styles.modalImage}
                      contentFit="cover"
                      transition={300}
                      cachePolicy="memory-disk"
                    />
                  ) : (
                    <View style={[styles.modalImage, { backgroundColor: '#E8E6E3', justifyContent: 'center', alignItems: 'center' }]}>
                      <Text style={{ fontSize: 64, color: '#FF6B00' }}>{selectedChef.name.charAt(0)}</Text>
                    </View>
                  )}

                  <View style={styles.modalInfo}>
                    <Text style={styles.modalTitle}>{selectedChef.name}</Text>
                    <Text style={styles.chefProfileTag}>@{selectedChef.tag}</Text>

                    {selectedChef.description && (
                      <View style={styles.modalDescription}>
                        <Text style={styles.descriptionText}>{selectedChef.description}</Text>
                      </View>
                    )}

                    {selectedChef.links && Object.keys(selectedChef.links).length > 0 && (
                      <View style={styles.chefLinksContainer}>
                        {Object.entries(selectedChef.links).map(([platform, url]) => (
                          <TouchableOpacity
                            key={platform}
                            style={styles.chefLinkButton}
                            onPress={() => Linking.openURL(url)}
                          >
                            <Text style={styles.chefLinkText}>{platform}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}

                    {/* Chef's recipes */}
                    <View style={styles.chefModalRecipes}>
                      <Text style={styles.chefModalRecipesTitle}>{t('recipes.recipes') || 'Recepten'} ({selectedChefRecipes.length})</Text>
                      {selectedChefRecipes.length === 0 ? (
                        <Text style={{ fontSize: 13, color: '#A09485', marginTop: 8 }}>{t('chef.noRecipesYet') || 'Nog geen recepten'}</Text>
                      ) : (
                        selectedChefRecipes.map((recipe) => (
                          <TouchableOpacity
                            key={recipe.id}
                            style={styles.chefModalRecipeCard}
                            onPress={() => {
                              const r = { ...recipe, thumbnail_url: recipe.image, title: recipe.name, chef: { ...selectedChef } };
                              setChefModalVisible(false);
                              setTimeout(() => openRecipe(r), 50);
                            }}
                            activeOpacity={0.9}
                          >
                            <View style={styles.chefModalRecipeImageContainer}>
                              <ExpoImage
                                source={{ uri: recipe.image || recipe.thumbnail_url }}
                                style={styles.chefModalRecipeImage}
                                contentFit="cover"
                                cachePolicy="memory-disk"
                              />
                            </View>
                            <View style={styles.chefModalRecipeContent}>
                              <Text style={styles.chefModalRecipeTitle} numberOfLines={2}>{recipe.title || recipe.name}</Text>
                              <Text style={styles.chefModalRecipeTag}>@{selectedChef?.tag}</Text>
                              <View style={styles.chefModalRecipeMeta}>
                                <Text style={styles.chefModalRecipeTime}>{formatTime(recipe.cooking_time_minutes)}</Text>
                                {recipe.estimated_cost != null && (
                                  <Text style={styles.chefModalRecipeCost}>€{Number(recipe.estimated_cost).toFixed(2)}</Text>
                                )}
                                {recipe.cuisine_type && (
                                  <Text style={styles.chefModalRecipeCuisine}>{recipe.cuisine_type}</Text>
                                )}
                              </View>
                            </View>
                          </TouchableOpacity>
                        ))
                      )}
                    </View>
                  </View>
                </>
              )}
            </ScrollView>
          </Animated.View>
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
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 4,
    paddingBottom: 95,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    color: '#6B6B6B',
    marginTop: 16,
    textAlign: 'center',
  },
  stickyHeader: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
    backgroundColor: '#FEFEFE',
    zIndex: 10,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 32,
    lineHeight: 40,
    color: '#2D2D2D',
    textAlign: 'center',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  dateText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    lineHeight: 20,
    color: '#6B6B6B',
    textAlign: 'center',
    letterSpacing: 0.1,
    marginBottom: 4,
  },
  personalizedText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    lineHeight: 16,
    color: '#FF6B00',
    textAlign: 'center',
    letterSpacing: 0.1,
    fontStyle: 'italic',
  },
  recipesContainer: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 24,
    lineHeight: 30,
    color: '#2D2D2D',
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  sectionDescription: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    lineHeight: 20,
    color: '#6B6B6B',
    marginBottom: 24,
    letterSpacing: 0.1,
  },
  recipeCard: {
    backgroundColor: '#F8F6F3',
    borderRadius: 16,
    marginBottom: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    height: 200,
  },
  chefRecipesButton: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
  },
  chefRecipesButtonText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    color: '#FFFFFF',
  },
  chefRecipesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingBottom: 8,
  },
  chefRecipesTitle: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 18,
    color: '#2D2D2D',
  },
  chefRecipesClose: {
    fontSize: 18,
    color: '#A09485',
    padding: 4,
  },
  chefRecipesList: {
    maxHeight: 240,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  chefRecipeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0EDE8',
  },
  chefRecipeThumb: {
    width: 52,
    height: 52,
    borderRadius: 10,
  },
  chefRecipeInfo: {
    flex: 1,
    marginLeft: 12,
  },
  chefRecipeName: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: '#2D2D2D',
    marginBottom: 2,
  },
  chefRecipeDesc: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: '#FF6B00',
  },
  recipeImage: {
    width: '100%',
    height: '100%',
  },
  recipeContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  recipeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  recipeTitle: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 20,
    lineHeight: 26,
    color: '#2D2D2D',
    letterSpacing: 0.3,
    flex: 1,
    marginRight: 12,
  },
  recipeMetrics: {
    alignItems: 'flex-end',
    gap: 6,
  },
  timeContainer: {
    backgroundColor: '#FF6B00',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  timeText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    lineHeight: 16,
    color: '#FEFEFE',
    letterSpacing: 0.1,
  },
  priceBadgeRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginRight: -20,
    marginBottom: -12,
  },
  priceBadge: {
    backgroundColor: '#FF6B00',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderTopLeftRadius: 12,
  },
  priceBadgeText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    lineHeight: 16,
    color: '#FEFEFE',
    letterSpacing: 0.1,
  },

  recipeDescription: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    lineHeight: 20,
    color: '#6B6B6B',
    marginBottom: 6,
    letterSpacing: 0.1,
  },
  dietaryTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  dietaryTag: {
    backgroundColor: '#E8E6E3',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  dietaryTagText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 10,
    lineHeight: 14,
    color: '#6B6B6B',
    letterSpacing: 0.1,
    textTransform: 'uppercase',
  },
  bottomAction: {
    alignItems: 'center',
    gap: 16,
  },
  moreRecipesButton: {
    backgroundColor: '#FF6B00',
    borderRadius: 8,
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#A0A0A0',
  },
  moreRecipesButtonText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 16,
    lineHeight: 24,
    color: '#FEFEFE',
    letterSpacing: 0.2,
  },
  signInPrompt: {
    padding: 16,
  },
  signInPromptText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    lineHeight: 20,
    color: '#FF6B00',
    textAlign: 'center',
    letterSpacing: 0.1,
    textDecorationLine: 'underline',
  },
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
    shadowOffset: {
      width: 0,
      height: 12,
    },
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
    color: '#FF6B00',
    marginRight: 6,
  },
  backText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 15,
    color: '#FF6B00',
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
    color: '#FF6B00',
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
    color: '#FF6B00',
    letterSpacing: 0.2,
    textTransform: 'capitalize',
  },
  modalActions: {
    alignItems: 'center',
    marginTop: 12,
  },
  viewRecipeButton: {
    backgroundColor: '#FF6B00',
    borderRadius: 12,
    paddingHorizontal: 36,
    paddingVertical: 16,
    shadowColor: '#FF6B00',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  viewRecipeText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 15,
    lineHeight: 20,
    color: '#FEFEFE',
    letterSpacing: 0.3,
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
  stepRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FF6B00',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    marginTop: 1,
  },
  stepNumberText: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    color: '#FEFEFE',
  },
  stepText: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: '#4A4A4A',
    lineHeight: 20,
  },
  backgroundWatermark: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.1,
  },
  
  // Tab styles
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#F5F3F0',
    borderRadius: 8,
    padding: 4,
    marginBottom: 0,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: '#FF6B00',
    shadowColor: '#FF6B00',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  tabText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 16,
    lineHeight: 20,
    color: '#6B6B6B',
    letterSpacing: 0.2,
  },
  activeTabText: {
    color: '#FEFEFE',
  },
  
  // Wishlist styles
  wishlistButton: {
    padding: 8,
    marginRight: 4,
  },
  wishlistButtonOverlay: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 5,
  },
  wishlistIcon: {
    fontSize: 20,
  },
  addIcon: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FF6B00',
    lineHeight: 26,
  },
  modalAddIcon: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FF6B00',
    marginRight: 8,
    lineHeight: 24,
  },
  emptyWishlist: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyWishlistIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyWishlistTitle: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 20,
    lineHeight: 26,
    color: '#2D2D2D',
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  emptyWishlistText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    lineHeight: 20,
    color: '#6B6B6B',
    textAlign: 'center',
    letterSpacing: 0.1,
  },
  clearWishlistButton: {
    backgroundColor: '#F44336',
    borderRadius: 8,
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: 'center',
  },
  clearWishlistButtonText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 16,
    lineHeight: 24,
    color: '#FEFEFE',
    letterSpacing: 0.2,
  },
  
  // Modal wishlist styles
  modalWishlistButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F3F0',
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E8E6E3',
  },
  modalWishlistIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  modalWishlistText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 15,
    lineHeight: 20,
    color: '#FF6B00',
    letterSpacing: 0.2,
  },
  modalRemoveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF2F2',
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F3C7C7',
  },
  modalRemoveIcon: {
    fontSize: 24,
    fontWeight: '700',
    color: '#C62828',
    marginRight: 8,
    lineHeight: 24,
  },
  modalRemoveText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 15,
    lineHeight: 20,
    color: '#C62828',
    letterSpacing: 0.2,
  },
  // Chef tag on recipe card (overlay on image)
  chefTagOverlay: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  chefTagText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    lineHeight: 16,
    color: '#FEFEFE',
    letterSpacing: 0.1,
  },
  // Chef tag in recipe detail modal
  modalChefTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F3F0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginTop: 16,
    gap: 8,
  },
  modalChefTagText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: '#FF6B00',
  },
  modalChefName: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#6B6B6B',
  },
  // Add to group
  addToGroupSection: {
    marginTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#E8E2DA',
    paddingTop: 16,
  },
  addToGroupBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#E8845C',
    borderRadius: 12,
    paddingVertical: 14,
  },
  addToGroupBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFF',
  },
  groupPickerList: {
    marginTop: 10,
    backgroundColor: '#FBF7F4',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E8E2DA',
    overflow: 'hidden',
  },
  groupPickerEmpty: {
    padding: 16,
    fontSize: 13,
    color: '#A09485',
    textAlign: 'center',
  },
  groupPickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E2DA',
  },
  groupPickerItemActive: {
    backgroundColor: '#FFF3EE',
  },
  groupPickerName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#4A3728',
  },
  groupCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#C0B5A8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  groupCheckboxChecked: {
    backgroundColor: '#E8845C',
    borderColor: '#E8845C',
  },
  groupPickerSaveBtn: {
    backgroundColor: '#E8845C',
    margin: 12,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  groupPickerSaveBtnText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '600',
  },
  // Chef profile modal
  chefProfileTag: {
    fontFamily: 'Inter_500Medium',
    fontSize: 16,
    color: '#FF6B00',
    marginTop: 4,
    marginBottom: 12,
  },
  chefLinksContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 16,
  },
  chefLinkButton: {
    backgroundColor: '#FF6B00',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  chefLinkText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: '#FEFEFE',
    textTransform: 'capitalize',
  },
  chefModalRecipes: {
    marginTop: 24,
    borderTopWidth: 1,
    borderTopColor: '#E8E2DA',
    paddingTop: 16,
  },
  chefModalRecipesTitle: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 16,
    color: '#2D2D2D',
    marginBottom: 12,
  },
  chefModalRecipeCard: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderRadius: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E8E2DA',
    overflow: 'hidden',
  },
  chefModalRecipeImageContainer: {
    width: 90,
    height: 90,
  },
  chefModalRecipeImage: {
    width: '100%',
    height: '100%',
  },
  chefModalRecipeContent: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    justifyContent: 'center',
  },
  chefModalRecipeTitle: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 15,
    color: '#4A3728',
  },
  chefModalRecipeTag: {
    fontSize: 11,
    color: '#E8845C',
    fontWeight: '500',
    marginTop: 1,
  },
  chefModalRecipeMeta: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  chefModalRecipeTime: {
    fontSize: 12,
    color: '#FF6B00',
  },
  chefModalRecipeCost: {
    fontSize: 12,
    color: '#FF6B00',
    fontWeight: '600',
  },
  chefModalRecipeCuisine: {
    fontSize: 12,
    color: '#FF6B00',
    fontStyle: 'italic',
  },
}); 
