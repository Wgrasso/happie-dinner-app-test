import React, { useState, useEffect, useRef, useCallback } from 'react';
import { StyleSheet, Text, View, SafeAreaView, ScrollView, TouchableOpacity, Image, Linking, ActivityIndicator, Modal, Animated, Dimensions, Alert } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { getCurrentUserProfile } from '../lib/profileService';
import { getUserWishlist, addToWishlist as addToWishlistDB, removeFromWishlist as removeFromWishlistDB, clearWishlist as clearWishlistDB } from '../lib/wishlistService';
import { getRandomRecipes, getAllRecipes } from '../lib/recipesService';
import { getMyRecipes } from '../lib/userRecipesService';
import { useTranslation } from 'react-i18next';
import { formatDateLongNL } from '../lib/dateFormatting';
import { useAppState } from '../lib/AppStateContext';
import { log } from '../lib/debugConfig';

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
  const { cachedRecipes, cachedRecipesTimestamp, saveCachedRecipes } = useAppState();
  
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [recipes, setRecipes] = useState([]);
  const [allLoadedRecipes, setAllLoadedRecipes] = useState([]); // Store all 100 recipes
  const [displayedCount, setDisplayedCount] = useState(20); // How many we're currently showing
  const [isInitialized, setIsInitialized] = useState(false); // Track if data has been loaded
  const [usedCachedRecipes, setUsedCachedRecipes] = useState(false); // Track if we used cached data
  const [userPreferences, setUserPreferences] = useState({
    cuisines: [],
    dietaryRestrictions: []
  });
  
  // Tab and wishlist states
  const [activeTab, setActiveTab] = useState('meals'); // 'meals' or 'wishlist'
  const [wishlist, setWishlist] = useState([]); // Array of saved recipes
  
  // Modal states
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalAnimation] = useState(new Animated.Value(0));

  const { width, height } = Dimensions.get('window');

  // Animation refs for + button fade-out per recipe card
  const plusButtonAnimations = useRef({});

  const getPlusButtonOpacity = useCallback((recipeId) => {
    if (!plusButtonAnimations.current[recipeId]) {
      plusButtonAnimations.current[recipeId] = new Animated.Value(1);
    }
    return plusButtonAnimations.current[recipeId];
  }, []);

  const handleAddToMyMeals = useCallback(async (recipe) => {
    const opacity = getPlusButtonOpacity(recipe.id);
    // Start fade-out animation
    Animated.timing(opacity, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
    // Add to wishlist
    await addToWishlist(recipe);
  }, []);

  // Reload wishlist when switching to wishlist tab
  useEffect(() => {
    if (activeTab === 'wishlist') {
      loadWishlistFromDB();
    }
  }, [activeTab]);

  // INSTANT: Use cached recipes from context for immediate display
  useEffect(() => {
    if (!usedCachedRecipes && cachedRecipes && cachedRecipes.length > 0) {
      log.cache('INSTANT: Using', cachedRecipes.length, 'cached recipes for immediate display');
      setAllLoadedRecipes(cachedRecipes);
      setRecipes(cachedRecipes.slice(0, 20));
      setDisplayedCount(Math.min(20, cachedRecipes.length));
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
        await loadWishlistFromDB();
        
        // Check if cached recipes are fresh enough (< 1 hour)
        const cacheAge = cachedRecipesTimestamp ? Date.now() - cachedRecipesTimestamp : Infinity;
        const RECIPE_CACHE_EXPIRY = 60 * 60 * 1000; // 1 hour
        
        if (cachedRecipes && cachedRecipes.length > 0 && cacheAge < RECIPE_CACHE_EXPIRY) {
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
        result = await getAllRecipes(0, 40);
      }
      
      if (!result.success) {
        throw new Error(result.error);
      }

      const dbRecipes = result.recipes || [];
      if (dbRecipes.length === 0) {
        throw new Error('No recipes found in database');
      }

      // Convert database format to our recipe format (only system recipes, no user recipes)
      const fromDb = dbRecipes.map(dbRecipe => ({
        id: dbRecipe.id,
        title: dbRecipe.name || 'Unnamed Recipe',
        image: dbRecipe.image || 'https://images.unsplash.com/photo-1546548970-71785318a17b?w=400&h=300&fit=crop',
        readyInMinutes: dbRecipe.cooking_time_minutes || 30,
        dietary: dbRecipe.cuisine_type ? [dbRecipe.cuisine_type] : [],
        description: dbRecipe.description || 'A delicious recipe perfect for your next meal',
        sourceUrl: `#recipe-${dbRecipe.id}`,
        tastyId: dbRecipe.id,
        ingredients: dbRecipe.ingredients || [],
        instructions: Array.isArray(dbRecipe.steps) ? dbRecipe.steps.join('\n') : (dbRecipe.steps || ''),
        pricePerServing: null,
        cuisine_type: dbRecipe.cuisine_type,
        steps: dbRecipe.steps,
        name: dbRecipe.name,
      }));

      const merged = fromDb;

      if (isLoadingMore) {
        // Add new recipes to existing ones
        setAllLoadedRecipes(prev => [...prev, ...merged]);
        setRecipes(prev => [...prev, ...merged]);
      } else {
        // Initial load - replace all recipes
        setAllLoadedRecipes(merged);
        setRecipes(merged.slice(0, 20)); // Show first 20
        setDisplayedCount(Math.min(20, merged.length));
        
        // Save to cache for instant display on next app launch
        log.cache('Saving', merged.length, 'recipes to cache');
        saveCachedRecipes(merged);
      }

    } catch (error) {
      console.error('❌ Error loading recipes from database:', error);
      console.error('❌ Full error details:', error.message, error.stack);
      
      // Show alert to user about the database issue
      Alert.alert(
        'Database Connection Issue', 
        `Could not load recipes from database: ${error.message}. Showing sample recipes instead.`,
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

  // Open recipe when navigating from Profile (user tapped their recipe)
  useEffect(() => {
    if (pendingOpenRecipe && isActive && pendingOpenRecipe.id) {
      const r = pendingOpenRecipe;
      const formatted = {
        id: r.id,
        title: r.name || r.title,
        image: r.image || 'https://images.unsplash.com/photo-1546548970-71785318a17b?w=400&h=300&fit=crop',
        readyInMinutes: r.readyInMinutes || r.cooking_time_minutes || 30,
        dietary: r.dietary || (r.cuisine_type ? [r.cuisine_type] : []),
        description: r.description || '',
        sourceUrl: `#recipe-${r.id}`,
        tastyId: r.id,
        ingredients: r.ingredients || [],
        instructions: r.instructions || '',
        name: r.name,
        cuisine_type: r.cuisine_type,
        isUserRecipe: true,
      };
      openRecipe(formatted);
      onOpenRecipeHandled?.();
    }
  }, [pendingOpenRecipe, isActive]);

  const openRecipe = (recipe) => {
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
    });
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

  // Wishlist management functions
  const loadWishlistFromDB = async () => {
    try {
      // Load both user recipes and wishlist items in parallel
      const [wishlistResult, userResult] = await Promise.all([
        getUserWishlist(),
        getMyRecipes(),
      ]);

      let combined = [];

      // Add user's own recipes first (auto-included in My Meals)
      if (userResult.recipes && userResult.recipes.length > 0) {
        const userRecipes = userResult.recipes.map(r => ({
          id: r.id,
          title: r.name || r.title,
          image: r.image || 'https://images.unsplash.com/photo-1546548970-71785318a17b?w=400&h=300&fit=crop',
          readyInMinutes: r.readyInMinutes || r.cooking_time_minutes || 30,
          dietary: r.dietary || (r.cuisine_type ? [r.cuisine_type] : []),
          description: r.description || '',
          sourceUrl: `#recipe-${r.id}`,
          tastyId: r.id,
          ingredients: r.ingredients || [],
          instructions: r.instructions || '',
          name: r.name,
          cuisine_type: r.cuisine_type,
          isUserRecipe: true,
        }));
        combined = [...userRecipes];
      }

      // Then add wishlist items
      if (wishlistResult.success) {
        const wishlistRecipes = wishlistResult.wishlist.map(item => {
          const data = item.recipe_data;
          return {
            id: data.id,
            title: data.name || data.title || 'Unnamed Recipe',
            image: data.image || 'https://images.unsplash.com/photo-1546548970-71785318a17b?w=400&h=300&fit=crop',
            readyInMinutes: data.cooking_time_minutes || 30,
            dietary: data.cuisine_type ? [data.cuisine_type] : [],
            description: data.description || '',
            sourceUrl: `#recipe-${data.id}`,
            tastyId: data.id,
            ingredients: data.ingredients || [],
            instructions: Array.isArray(data.steps) ? data.steps.join('\n') : (data.instructions || ''),
            pricePerServing: null,
            cuisine_type: data.cuisine_type,
            steps: data.steps,
            name: data.name
          };
        });

        // Deduplicate: don't add wishlist items that are already user recipes
        const userRecipeIds = new Set(combined.map(r => r.id));
        const uniqueWishlist = wishlistRecipes.filter(r => !userRecipeIds.has(r.id));
        combined = [...combined, ...uniqueWishlist];
      }

      setWishlist(combined);
    } catch (error) {
      console.error('❌ Error loading wishlist:', error);
    }
  };

  const addToWishlist = async (recipe) => {
    if (!isRecipeInWishlist(recipe.id)) {
      // Optimistic update
      setWishlist(prev => [...prev, recipe]);
      
      const result = await addToWishlistDB(recipe);
      if (!result.success) {
        // Revert on failure
        setWishlist(prev => prev.filter(r => r.id !== recipe.id));
        console.error('❌ Failed to add to wishlist:', result.error);
      }
    }
  };

  const removeFromWishlist = async (recipeId) => {
    // Optimistic update
    setWishlist(prev => prev.filter(recipe => recipe.id !== recipeId));
    
    const result = await removeFromWishlistDB(recipeId);
    if (!result.success) {
      // Revert on failure (would need to re-fetch to get the exact recipe back)
      console.error('Failed to remove from wishlist:', result.error);
      await loadWishlistFromDB(); // Reload to ensure consistency
    }
  };

  const isRecipeInWishlist = (recipeId) => {
    return wishlist.some(recipe => recipe.id === recipeId);
  };

  // Check if a recipe is in "My Meals" (either user recipe or in wishlist)
  const isInMyMeals = useCallback((recipe) => {
    if (recipe.isUserRecipe) return true;
    return isRecipeInWishlist(recipe.id);
  }, [wishlist]);

  const toggleWishlist = async (recipe) => {
    if (isRecipeInWishlist(recipe.id)) {
      await removeFromWishlist(recipe.id);
    } else {
      await addToWishlist(recipe);
    }
  };

  const clearUserWishlist = async () => {
    const result = await clearWishlistDB();
    if (result.success) {
      setWishlist([]);
    } else {
      console.error('❌ Failed to clear wishlist:', result.error);
    }
  };

  // Transform meals from API format to recipe format
  const transformMealsToRecipes = (meals) => {
    return meals.map(normalizeRecipe);
  };



  const getCurrentDate = () => {
    const today = new Date();
    return formatDateLongNL(today);
  };

  const refreshRecipes = async () => {
    const newDisplayCount = displayedCount + 20;
    
    if (newDisplayCount <= allLoadedRecipes.length) {
      // Show more from existing loaded recipes
      setLoadingMore(true);
      setTimeout(() => {
        setRecipes(allLoadedRecipes.slice(0, newDisplayCount));
        setDisplayedCount(newDisplayCount);
        setLoadingMore(false);
      }, 500); // Small delay for UX
    } else {
      // Need to load more from API
      await loadFeaturedRecipes(true);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8B7355" />
          <Text style={styles.loadingText}>Loading delicious recipes...</Text>
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
      
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
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
              style={[styles.tab, activeTab === 'wishlist' && styles.activeTab]}
              onPress={() => setActiveTab('wishlist')}
            >
              <Text style={[styles.tabText, activeTab === 'wishlist' && styles.activeTabText]}>
                {t('meals.wishlist')}
              </Text>
            </TouchableOpacity>
          </View>
          
          {activeTab === 'meals' && (
          <Text style={styles.dateText}>{getCurrentDate()}</Text>
          )}

          {activeTab === 'wishlist' && (
            <Text style={styles.dateText}>
              {wishlist.length !== 1 
                ? t('recipes.savedRecipesPlural', { count: wishlist.length })
                : t('recipes.savedRecipes', { count: wishlist.length })
              }
            </Text>
          )}
        </View>

        {/* Content based on active tab */}
        {activeTab === 'meals' ? (
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
                {!isInMyMeals(recipe) && (
                  <Animated.View style={{ opacity: getPlusButtonOpacity(recipe.id) }}>
                    <TouchableOpacity 
                      style={styles.plusButton}
                      onPress={(e) => {
                        e.stopPropagation();
                        handleAddToMyMeals(recipe);
                      }}
                    >
                      <Text style={styles.plusButtonText}>+</Text>
                    </TouchableOpacity>
                  </Animated.View>
                )}
              </View>
              
              <View style={styles.recipeContent}>
                <View style={styles.recipeHeader}>
                  <Text style={styles.recipeTitle}>{recipe.title}</Text>
                  <View style={styles.recipeMetrics}>
                    <View style={styles.timeContainer}>
                      <Text style={styles.timeText}>{formatTime(recipe.readyInMinutes)}</Text>
                    </View>
                      {recipe.pricePerServing && (
                        <View style={styles.priceContainer}>
                          <Text style={styles.priceText}>€{recipe.pricePerServing.toFixed(2)}</Text>
                    </View>
                      )}
                  </View>
                </View>
                
                <Text style={styles.recipeDescription}>{recipe.description}</Text>
                
                {recipe.dietary.length > 0 && (
                  <View style={styles.dietaryTags}>
                    {recipe.dietary.slice(0, 2).map((dietary, index) => (
                      <View key={index} style={styles.dietaryTag}>
                        <Text style={styles.dietaryTagText}>{dietary}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>
        ) : (
          <View style={styles.recipesContainer}>
            <Text style={styles.sectionTitle}>{t('recipes.yourWishlist')}</Text>
            
            {wishlist.length === 0 ? (
              <View style={styles.emptyWishlist}>
                <Text style={styles.emptyWishlistIcon}>🍽️</Text>
                <Text style={styles.emptyWishlistTitle}>{t('recipes.noSavedRecipes')}</Text>
                <Text style={styles.emptyWishlistText}>
                  {t('recipes.tapHeartToSave')}
                </Text>
              </View>
            ) : (
              wishlist.map((recipe) => (
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
                  </View>
                  
                  <View style={styles.recipeContent}>
                    <View style={styles.recipeHeader}>
                      <Text style={styles.recipeTitle}>{recipe.title}</Text>
                      <View style={styles.recipeMetrics}>
                        <View style={styles.timeContainer}>
                          <Text style={styles.timeText}>{formatTime(recipe.readyInMinutes)}</Text>
                        </View>
                        {recipe.pricePerServing && (
                          <View style={styles.priceContainer}>
                            <Text style={styles.priceText}>€{recipe.pricePerServing.toFixed(2)}</Text>
                          </View>
                        )}
                      </View>
                    </View>
                    
                    <Text style={styles.recipeDescription}>{recipe.description}</Text>
                    
                    {recipe.dietary.length > 0 && (
                      <View style={styles.dietaryTags}>
                        {recipe.dietary.slice(0, 2).map((dietary, index) => (
                          <View key={index} style={styles.dietaryTag}>
                            <Text style={styles.dietaryTagText}>{dietary}</Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              ))
            )}
          </View>
        )}

        {/* Bottom Action */}
        {activeTab === 'meals' && (
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
                {displayedCount >= allLoadedRecipes.length ? 
                  'Discover New Recipes' : 
                  `Show More (${Math.min(20, allLoadedRecipes.length - displayedCount)} more available)`
                }
              </Text>
            )}
          </TouchableOpacity>
          
          </View>
        )}
        
        {activeTab === 'wishlist' && wishlist.length > 0 && (
          <View style={styles.bottomAction}>
            <TouchableOpacity 
              style={styles.clearWishlistButton}
              onPress={() => {
                Alert.alert(
                  t('recipes.clearWishlist'),
                  t('recipes.confirmClearWishlist'),
                  [
                    { text: t('common.cancel'), style: 'cancel' },
                    { 
                      text: 'Clear', 
                      style: 'destructive',
                      onPress: () => clearUserWishlist()
                    }
                  ]
                );
              }}
            >
              <Text style={styles.clearWishlistButtonText}>{t('recipes.clearWishlist')}</Text>
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
                        <Text style={styles.metricLabel}>Cooking Time</Text>
                        <Text style={styles.metricValue}>{formatTime(selectedRecipe.readyInMinutes)}</Text>
                      </View>
                      {selectedRecipe.pricePerServing && (
                      <View style={styles.modalMetricItem}>
                          <Text style={styles.metricLabel}>Price per Serving</Text>
                          <Text style={styles.metricValue}>€{selectedRecipe.pricePerServing.toFixed(2)}</Text>
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

                    {/* Ingredients Section */}
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

                    {/* Instructions Section */}
                    {selectedRecipe.instructions && selectedRecipe.instructions.length > 0 && (
                      <View style={styles.modalSection}>
                        <Text style={styles.dietaryTitle}>Instructions</Text>
                        <Text style={styles.instructionsText}>{selectedRecipe.instructions}</Text>
                      </View>
                    )}

                    {/* Action Buttons */}
                    <View style={styles.modalActions}>
                      {selectedRecipe && selectedRecipe.isUserRecipe ? (
                        <View style={[styles.modalWishlistButton, styles.modalWishlistButtonInMyMeals]}>
                          <Text style={[styles.modalWishlistIcon, { color: '#8B7355' }]}>✓</Text>
                          <Text style={styles.modalWishlistText}>
                            {t('recipes.inMyMeals')}
                          </Text>
                        </View>
                      ) : selectedRecipe && isRecipeInWishlist(selectedRecipe.id) ? (
                        <TouchableOpacity 
                          style={styles.modalWishlistButton}
                          onPress={() => toggleWishlist(selectedRecipe)}
                        >
                          <Text style={[styles.modalWishlistIcon, { color: '#8B7355' }]}>✓</Text>
                          <Text style={styles.modalWishlistText}>
                            {t('recipes.removeFromMyMeals')}
                          </Text>
                        </TouchableOpacity>
                      ) : (
                        <TouchableOpacity 
                          style={styles.modalWishlistButton}
                          onPress={() => toggleWishlist(selectedRecipe)}
                        >
                          <Text style={[styles.modalWishlistIcon, { fontSize: 22, fontWeight: '600' }]}>+</Text>
                          <Text style={styles.modalWishlistText}>
                            {t('recipes.addToMyMeals')}
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FEFEFE',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 120,
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
    marginBottom: 8,
  },
  personalizedText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    lineHeight: 16,
    color: '#8B7355',
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
  recipeImage: {
    width: '100%',
    height: '100%',
  },
  recipeContent: {
    padding: 20,
  },
  recipeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
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
    backgroundColor: '#8B7355',
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
  priceContainer: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  priceText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    lineHeight: 16,
    color: '#FEFEFE',
    letterSpacing: 0.1,
  },

  recipeDescription: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    lineHeight: 20,
    color: '#6B6B6B',
    marginBottom: 16,
    letterSpacing: 0.1,
  },
  dietaryTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  dietaryTag: {
    backgroundColor: '#E8E2DA',
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
    backgroundColor: '#8B7355',
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
    color: '#8B7355',
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
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E2DA',
    backgroundColor: '#FEFEFE',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#F8F6F3',
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
    backgroundColor: '#F8F6F3',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E8E2DA',
  },
  modalDietaryText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    lineHeight: 16,
    color: '#8B7355',
    letterSpacing: 0.2,
    textTransform: 'capitalize',
  },
  modalActions: {
    alignItems: 'center',
    marginTop: 12,
  },
  viewRecipeButton: {
    backgroundColor: '#8B7355',
    borderRadius: 12,
    paddingHorizontal: 36,
    paddingVertical: 16,
    shadowColor: '#8B7355',
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
    backgroundColor: '#F8F6F3',
    borderRadius: 8,
    padding: 4,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: '#8B7355',
    shadowColor: '#8B7355',
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
  
  // Plus button styles (replaces heart/wishlist)
  plusButton: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#8B7355',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  plusButtonText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '600',
    lineHeight: 24,
    marginTop: -1,
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
  
  // Modal my meals button styles
  modalWishlistButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F6F3',
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E8E2DA',
  },
  modalWishlistButtonInMyMeals: {
    opacity: 0.6,
  },
  modalWishlistIcon: {
    fontSize: 20,
    marginRight: 8,
    color: '#8B7355',
  },
  modalWishlistText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 15,
    lineHeight: 20,
    color: '#8B7355',
    letterSpacing: 0.2,
  },
}); 
