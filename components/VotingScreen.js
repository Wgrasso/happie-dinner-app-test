import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Image, ActivityIndicator, Dimensions, Modal, Animated, ScrollView, PanResponder, SafeAreaView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { getMealOptions, voteMealOption, getUserVotingProgress } from '../lib/mealRequestService';
import { getOccasionMealOptions, voteOnOccasionMeal, getOccasionVotingProgress } from '../lib/specialOccasionService';
import { useTranslation } from 'react-i18next';
import { log, debugError } from '../lib/debugConfig';
import { mediumHaptic, successHaptic, lightHaptic } from '../lib/haptics';
import { sendPushNotifications } from '../lib/notificationService';
import { supabase } from '../lib/supabase';
import ServingSelector from './ui/ServingSelector';
import { scaleIngredients } from '../lib/ingredientScaler';
import { getRecipeExtras } from '../lib/recipeExtrasService';

// Swipe configuration
const SWIPE_THRESHOLD = 100; // pixels to trigger vote
const SWIPE_OUT_DURATION = 250; // ms for card exit animation

const { width: screenWidth } = Dimensions.get('window');

// Safe image component
const SafeDrawing = ({ source, style, resizeMode = "contain" }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  
  return (
    <Image
      source={source}
      style={[style, { opacity: imageLoaded ? 1 : 0 }]}
      resizeMode={resizeMode}
      onLoad={() => setImageLoaded(true)}
      onError={() => setImageLoaded(false)}
    />
  );
};

export default function VotingScreen({ route, navigation }) {
  const { requestId, groupName, groupId, preloadedMealOptions, returnToGroupModal, occasionId, isOccasion, occasionName } = route.params || {};
  const { t } = useTranslation();
  const displayName = (isOccasion ? occasionName : groupName) || (isOccasion ? 'Special occasion' : 'Group');
  
  log.voting('Route params:', { requestId, groupName, groupId, occasionId, isOccasion, preloadedMealOptions: preloadedMealOptions?.length, returnToGroupModal });
  
  // Back navigation - simply pop VotingScreen from the stack.
  // IMPORTANT: Do NOT use navigation.navigate('MainTabs', params) here!
  // That creates a NEW MainTabs instance instead of returning to the existing one,
  // which causes all state (activeRequestId, expandedGroupId, topMeals) to be lost.
  // Using goBack() preserves the existing MainTabs and GroupsScreenSimple state.
  // The useFocusEffect in GroupsScreenSimple handles refreshing Top 3 data when focus returns.
  const handleBackNavigation = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      // Fallback: if can't go back (shouldn't happen), navigate to MainTabs
      navigation.navigate('MainTabs');
    }
  };
  
  // Simple state management
  const [loading, setLoading] = useState(true);
  const [mealOptions, setMealOptions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [voting, setVoting] = useState(false);
  const [votes, setVotes] = useState({});
  
  // Refs to track state for PanResponder (avoids stale closure issue)
  const votingRef = useRef(false);
  const mealOptionsRef = useRef([]);
  const currentIndexRef = useRef(0);
  const firstVoteNotifSent = useRef(false);
  
  // Keep refs in sync with state
  useEffect(() => {
    votingRef.current = voting;
  }, [voting]);
  
  useEffect(() => {
    mealOptionsRef.current = mealOptions;
  }, [mealOptions]);
  
  useEffect(() => {
    currentIndexRef.current = currentIndex;
  }, [currentIndex]);
  
  // Track previous index to detect when to reset card position
  const prevIndexRef = useRef(0);
  
  const [isResuming, setIsResuming] = useState(false);
  
  // Recipe modal states
  const [showRecipeModal, setShowRecipeModal] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [servingCount, setServingCount] = useState(4);
  const modalAnimation = useRef(new Animated.Value(0)).current;
  const backdropAnimation = useRef(new Animated.Value(0)).current;
  
  // Swipe animation state
  const swipeX = useRef(new Animated.Value(0)).current;
  const swipeY = useRef(new Animated.Value(0)).current;
  const [swipeDirection, setSwipeDirection] = useState(null); // 'left' | 'right' | null
  
  // Track if a swipe gesture is in progress (to prevent tap-to-open during swipe)
  const isSwipingRef = useRef(false);
  const swipeVoteRef = useRef(null); // Track pending vote from swipe ('yes' or 'no')
  
  // Reset card position when index changes (after new meal renders)
  useEffect(() => {
    if (prevIndexRef.current !== currentIndex) {
      // Index changed - reset card position for the new card immediately
      log.voting('Index changed from', prevIndexRef.current, 'to', currentIndex, '- resetting card position');
      swipeX.setValue(0);
      swipeY.setValue(0);
      prevIndexRef.current = currentIndex;
      isSwipingRef.current = false;
    }
  }, [currentIndex]); // Only depend on currentIndex, not the animated values
  
  // Calculate rotation based on swipe
  const cardRotation = swipeX.interpolate({
    inputRange: [-screenWidth, 0, screenWidth],
    outputRange: ['-15deg', '0deg', '15deg'],
    extrapolate: 'clamp'
  });
  
  // Calculate overlay opacity based on swipe
  const likeOpacity = swipeX.interpolate({
    inputRange: [0, SWIPE_THRESHOLD],
    outputRange: [0, 1],
    extrapolate: 'clamp'
  });
  
  const dislikeOpacity = swipeX.interpolate({
    inputRange: [-SWIPE_THRESHOLD, 0],
    outputRange: [1, 0],
    extrapolate: 'clamp'
  });
  
  // Create PanResponder - using useRef since we access animated values via refs
  const panResponder = useRef(
    PanResponder.create({
      // Always try to become responder
      onStartShouldSetPanResponder: () => !votingRef.current,
      onStartShouldSetPanResponderCapture: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Capture horizontal swipes (more than 10px movement)
        const isHorizontal = Math.abs(gestureState.dx) > Math.abs(gestureState.dy);
        const isMeaningful = Math.abs(gestureState.dx) > 10;
        const shouldRespond = !votingRef.current && isHorizontal && isMeaningful;
        return shouldRespond;
      },
      onMoveShouldSetPanResponderCapture: (_, gestureState) => {
        // Force capture once we've moved enough horizontally
        const isHorizontal = Math.abs(gestureState.dx) > Math.abs(gestureState.dy);
        const isSignificant = Math.abs(gestureState.dx) > 20;
        return !votingRef.current && isHorizontal && isSignificant;
      },
      onPanResponderGrant: () => {
        lightHaptic();
        isSwipingRef.current = true;
        swipeVoteRef.current = null;
      },
      onPanResponderMove: (_, gestureState) => {
        if (votingRef.current) return;
        
        swipeX.setValue(gestureState.dx);
        swipeY.setValue(gestureState.dy * 0.3); // Subtle vertical movement
        
        // Update swipe direction indicator
        if (gestureState.dx > 50) {
          setSwipeDirection('right');
        } else if (gestureState.dx < -50) {
          setSwipeDirection('left');
        } else {
          setSwipeDirection(null);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        const dx = gestureState.dx;
        const vx = gestureState.vx;
        const willSwipeRight = dx > SWIPE_THRESHOLD || (dx > 50 && vx > 0.5);
        const willSwipeLeft = dx < -SWIPE_THRESHOLD || (dx < -50 && vx < -0.5);
        
        if (votingRef.current) {
          resetCardPosition(false);
          isSwipingRef.current = false;
          return;
        }
        
        // Check if swipe exceeds threshold OR has high velocity in that direction
        if (willSwipeRight) {
          swipeVoteRef.current = 'yes';
          swipeRight();
        } else if (willSwipeLeft) {
          swipeVoteRef.current = 'no';
          swipeLeft();
        } else {
          isSwipingRef.current = false;
          resetCardPosition();
        }
        setSwipeDirection(null);
      },
      onPanResponderTerminate: () => {
        isSwipingRef.current = false;
        swipeVoteRef.current = null;
        resetCardPosition();
        setSwipeDirection(null);
      }
    })
  ).current;
  
  // Swipe right animation (Like)
  const swipeRight = () => {
    if (votingRef.current) {
      return;
    }
    
    successHaptic();
    const vote = swipeVoteRef.current || 'yes';
    swipeVoteRef.current = null;
    
    // Start animation
    Animated.timing(swipeX, {
      toValue: screenWidth * 1.5,
      duration: SWIPE_OUT_DURATION,
      useNativeDriver: true
    }).start(() => {
      isSwipingRef.current = false;
    });
    
    // Submit vote immediately (don't wait for animation to complete)
    handleVote(vote);
  };
  
  // Swipe left animation (Dislike)
  const swipeLeft = () => {
    if (votingRef.current) return; // Prevent double-voting
    
    mediumHaptic();
    const vote = swipeVoteRef.current || 'no';
    swipeVoteRef.current = null;
    
    log.voting('Swipe left triggered, submitting vote:', vote);
    
    // Start animation
    Animated.timing(swipeX, {
      toValue: -screenWidth * 1.5,
      duration: SWIPE_OUT_DURATION,
      useNativeDriver: true
    }).start(() => {
      isSwipingRef.current = false;
    });
    
    // Submit vote immediately (don't wait for animation to complete)
    handleVote(vote);
  };
  
  // Reset card position
  const resetCardPosition = (animated = true) => {
    if (animated) {
      Animated.parallel([
        Animated.spring(swipeX, {
          toValue: 0,
          friction: 5,
          tension: 40,
          useNativeDriver: true
        }),
        Animated.spring(swipeY, {
          toValue: 0,
          friction: 5,
          tension: 40,
          useNativeDriver: true
        })
      ]).start();
    } else {
      swipeX.setValue(0);
      swipeY.setValue(0);
    }
  };

  useEffect(() => {
    loadMealOptions();
  }, []);

  // Real-time subscription for this voting session.
  // - Watches the `meal_requests` row so if another member taps "new meals"
  //   (which marks this request completed and creates a new one), or the
  //   request is otherwise ended while we're still voting, we bail out with
  //   a message instead of letting the user vote on a dead session.
  // - Watches `meal_votes` for this request so that if the current user voted
  //   from another device, their votes stay in sync here.
  // Note: occasion voting is left untouched — this only covers regular group
  // meal requests.
  const sessionEndedRef = useRef(false);
  useEffect(() => {
    if (isOccasion || !requestId) return;

    let channel = null;
    let retryTimer = null;

    const handleRequestUpdate = (payload) => {
      const newStatus = payload.new?.status;
      if (newStatus && newStatus !== 'active') {
        // Only bail if the user hasn't already reached the completion view.
        const total = mealOptionsRef.current?.length || 0;
        const idx = currentIndexRef.current || 0;
        if (!sessionEndedRef.current && total > 0 && idx < total) {
          sessionEndedRef.current = true;
          log.voting('Voting session ended remotely (status=' + newStatus + '), navigating back');
          try {
            alert('This voting round has ended. Returning to your group.');
          } catch (_) {}
          handleBackNavigation();
        }
      }
    };

    const handleVoteEvent = async (payload) => {
      const row = payload.new;
      if (!row?.user_id || !row?.meal_option_id) return;
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || row.user_id !== user.id) return;
        // Self vote from another device — mirror it into local state so the
        // UI doesn't show this card as unvoted if the user reopens the screen.
        setVotes((prev) => {
          if (prev[row.meal_option_id] === row.vote) return prev;
          return { ...prev, [row.meal_option_id]: row.vote };
        });
      } catch (_) {}
    };

    const subscribe = () => {
      if (channel) {
        try { supabase.removeChannel(channel); } catch (_) {}
      }
      channel = supabase
        .channel(`voting-session-${requestId}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'meal_requests',
            filter: `id=eq.${requestId}`,
          },
          handleRequestUpdate
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'meal_votes',
            filter: `request_id=eq.${requestId}`,
          },
          handleVoteEvent
        )
        .subscribe((status) => {
          if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            retryTimer = setTimeout(subscribe, 3000);
          }
        });
    };

    subscribe();

    return () => {
      if (retryTimer) clearTimeout(retryTimer);
      if (channel) {
        try { supabase.removeChannel(channel); } catch (_) {}
        channel = null;
      }
    };
  }, [requestId, isOccasion]);

  const handleVote = async (vote) => {
    // Use refs for fresh values (avoids stale closure in PanResponder)
    const currentMealOptions = mealOptionsRef.current;
    const currentIdx = currentIndexRef.current;
    
    if (voting || votingRef.current) {
      swipeX.setValue(0);
      swipeY.setValue(0);
      return;
    }
    
    if (currentIdx >= currentMealOptions.length) {
      swipeX.setValue(0);
      swipeY.setValue(0);
      return;
    }
    
    // Add haptic feedback
    mediumHaptic();
    
    const currentMeal = currentMealOptions[currentIdx];
    if (!currentMeal) {
      debugError('VOTING', 'No current meal found at index:', currentIdx);
      swipeX.setValue(0);
      swipeY.setValue(0);
      return;
    }
    
    // Validate we have the required data
    if (!currentMeal.id) {
      debugError('VOTING', 'Meal option missing ID:', currentMeal);
      // Reset card position even on validation failure
      swipeX.setValue(0);
      swipeY.setValue(0);
      return;
    }
    
    if (!requestId && !occasionId) {
      debugError('VOTING', 'No request or occasion ID available');
      swipeX.setValue(0);
      swipeY.setValue(0);
      return;
    }
    
    // Set voting state - update ref SYNCHRONOUSLY to prevent race conditions
    votingRef.current = true;
    setVoting(true);
    
    try {
      log.voting(`Submitting vote: ${vote} for meal:`, {
        mealOptionId: currentMeal.id,
        mealName: currentMeal.meal_data?.name,
        requestId: requestId
      });
      
      // Add timeout to prevent indefinite hanging (10 seconds)
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Vote timeout - please try again')), 10000)
      );
      
      const voteFn = isOccasion && occasionId
        ? () => voteOnOccasionMeal(occasionId, currentMeal.id, vote === 'yes' ? 'yes' : 'no')
        : () => voteMealOption(requestId, currentMeal.id, vote);
      const result = await Promise.race([
        voteFn(),
        timeoutPromise
      ]);
      
      if (result.success) {
        setVotes(prev => ({ ...prev, [currentMeal.id]: vote }));
        
        // Notify group members when this is the first vote (fire-and-forget)
        if (currentIdx === 0 && groupId && !isOccasion && !firstVoteNotifSent.current) {
          firstVoteNotifSent.current = true;
          (async () => {
            try {
              const { data: { user } } = await supabase.auth.getUser();
              if (!user) return;
              const { data: members } = await supabase
                .from('group_members')
                .select('user_id')
                .eq('group_id', groupId)
                .eq('is_active', true)
                .neq('user_id', user.id);
              if (!members?.length) return;
              const memberIds = members.map(m => m.user_id);
              const { data: profiles } = await supabase
                .from('profiles')
                .select('push_token')
                .in('id', memberIds)
                .not('push_token', 'is', null);
              const tokens = (profiles || []).map(p => p.push_token).filter(Boolean);
              if (tokens.length > 0) {
                const userName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Someone';
                await sendPushNotifications(
                  tokens,
                  groupName || 'Happie',
                  `${userName} eet vanavond mee. vergeet niet te stemmen`,
                  { type: 'voting_started', groupId, requestId }
                );
              }
            } catch (e) {
            }
          })();
        }
        
        // SUCCESS: Move to next card
        setCurrentIndex(currentIdx + 1);
      } else {
        debugError('VOTING', 'Vote failed:', result.error);
        // FAILURE: Reset card position so user can try again
        swipeX.setValue(0);
        swipeY.setValue(0);
        alert(`Vote failed: ${result.error}`);
      }
    } catch (error) {
      debugError('VOTING', 'Unexpected error voting:', error);
      // ERROR: Reset card position so user can try again
      swipeX.setValue(0);
      swipeY.setValue(0);
      alert(error.message || 'An unexpected error occurred. Please try again.');
    } finally {
      // Reset voting state - update ref SYNCHRONOUSLY to allow new swipes
      votingRef.current = false;
      setVoting(false);
    }
  };

  const loadMealOptions = async (retryCount = 0) => {
    const ctx = isOccasion ? `occasion ${occasionId}` : `request ${requestId}`;
    log.voting(`Loading meal options for ${ctx} (attempt ${retryCount + 1})`);
    
    if (!requestId && !occasionId) {
      debugError('VOTING', ' No requestId or occasionId provided!');
      handleBackNavigation();
      return;
    }
    
    setLoading(true);

    try {
      let mealData = [];
      
      // Check if we have pre-loaded meal options first
      if (preloadedMealOptions && Array.isArray(preloadedMealOptions) && preloadedMealOptions.length > 0) {
        log.voting(` Using ${preloadedMealOptions.length} pre-loaded meal options`);
        
        // Validate preloaded data has required fields
        const validOptions = preloadedMealOptions.filter(opt => opt && opt.id && opt.meal_data);
        if (validOptions.length !== preloadedMealOptions.length) {
          console.warn(`[VOTING] Filtered out ${preloadedMealOptions.length - validOptions.length} invalid preloaded options`);
        }
        
        if (validOptions.length > 0) {
          mealData = validOptions;
          log.voting(' First meal option ID:', validOptions[0].id);
        } else {
          log.voting(' Preloaded options are invalid, fetching fresh...');
        }
      }
      
      // If no valid preloaded data, fetch from API
      if (mealData.length === 0) {
        log.voting(' Fetching meal options from database...');
        let result;
        if (isOccasion && occasionId) {
          result = await getOccasionMealOptions(occasionId);
          mealData = result.success && result.mealOptions ? result.mealOptions : [];
        } else {
          result = await getMealOptions(requestId);
          mealData = result.success && result.options ? result.options : [];
        }
        if (mealData.length > 0) {
          log.voting(` Loaded ${mealData.length} meal options from database`);
          log.voting(' First fetched option:', mealData[0]?.id);
        } else {
          debugError('VOTING', ' No meal options found:', result.error);
          
          if (retryCount < 2) {
            log.voting(' Retrying meal options load...');
            setTimeout(() => {
              loadMealOptions(retryCount + 1);
            }, 1500);
            return;
          }
          
          alert('No meal options found for this voting session. The session may have ended.');
          handleBackNavigation();
          return;
        }
      }
      
      // Validate all meal options have required fields
      const validatedMealData = mealData.map((meal, index) => {
        if (!meal.id) {
          debugError('VOTING', `Meal at index ${index} missing ID:`, meal);
        }
        if (!meal.meal_data) {
          debugError('VOTING', `Meal at index ${index} missing meal_data:`, meal);
        }
        return meal;
      });
      
      // Set the meal options
      setMealOptions(validatedMealData);
      log.voting(` Set ${validatedMealData.length} meal options for voting`);
      
      // Check user's voting progress
      const sessionId = requestId || occasionId;
      if (sessionId) {
        log.voting(' Checking user voting progress...');
        const progressResult = isOccasion && occasionId
          ? await getOccasionVotingProgress(occasionId)
          : await getUserVotingProgress(requestId);
        
        if (progressResult.success) {
          const { progress } = progressResult;
          
          log.voting(' Progress:', progress);
          
          if (progress.votedCount > 0) {
            log.voting(`User has already voted on ${progress.votedCount} meals, resuming from meal ${progress.nextMealIndex + 1}`);
            setIsResuming(true);
            firstVoteNotifSent.current = true;
            
            if (progress.nextMealIndex >= 0) {
              setCurrentIndex(progress.nextMealIndex);
            } else {
              // All meals voted
              setCurrentIndex(validatedMealData.length);
            }
          } else {
            log.voting(' Fresh voting session, starting from meal 1');
            setIsResuming(false);
            setCurrentIndex(0);
          }
        } else {
          log.voting('WARN: Could not get voting progress, starting from beginning');
          setCurrentIndex(0);
        }
      }
      
    } catch (error) {
      debugError('VOTING', ' Error loading meal options:', error);
      
      if (retryCount < 1) {
        log.voting(' Retrying due to error...');
        setTimeout(() => {
          loadMealOptions(retryCount + 1);
        }, 1500);
        return;
      }
      
      alert('Failed to load voting options. Please try again later.');
      handleBackNavigation();
    } finally {
      setLoading(false);
    }
  };

  const getCurrentMeal = () => {
    return mealOptions.length > 0 ? mealOptions[currentIndex] : null;
  };

  const formatTime = (minutes) => {
    if (!minutes) return 'Unknown';
    if (minutes < 60) {
      return `${minutes} min`;
    } else {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
    }
  };
  
  const openRecipeModal = (meal) => {
    log.voting('Opening recipe modal for meal:', meal);
    
    // Extract all available data
    if (meal && meal.meal_data) {
      const data = meal.meal_data;
      const original = data.originalRecipeData || {};
      
      // Create a comprehensive meal object with all available data
      const comprehensiveMeal = {
        ...meal,
        meal_data: {
          ...data,
          // Ensure we have all the data we need
          name: data.name || original.name || 'Unknown Recipe',
          description: data.description || original.description || '',
          ingredients: data.ingredients || data.sections?.[0]?.components || original.ingredients || [],
          instructions: data.steps || data.instructions || original.steps || [],
          cooking_time: data.total_time_minutes || original.cooking_time_minutes,
          cuisine_type: data.cuisine_type || data.tags?.[0] || original.cuisine_type || '',
          // Keep original data reference
          originalRecipeData: original
        }
      };
      
      log.voting('Comprehensive meal data:', comprehensiveMeal.meal_data);
      setSelectedRecipe(comprehensiveMeal);
    } else {
      setSelectedRecipe(meal);
    }

    // Set serving count from extras
    const recipeName = meal?.meal_data?.name || '';
    const extras = getRecipeExtras(recipeName);
    setServingCount(extras.default_servings);

    setShowRecipeModal(true);

    // Animate modal entrance
    Animated.parallel([
      Animated.spring(modalAnimation, {
        toValue: 1,
        useNativeDriver: true,
        tension: 65,
        friction: 9,
      }),
      Animated.timing(backdropAnimation, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      })
    ]).start();
  };
  
  const closeRecipeModal = () => {
    // Animate modal exit
    Animated.parallel([
      Animated.spring(modalAnimation, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 9,
      }),
      Animated.timing(backdropAnimation, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      })
    ]).start(() => {
      setShowRecipeModal(false);
      setSelectedRecipe(null);
    });
  };

  const getProgress = () => {
    if (currentIndex >= mealOptions.length) {
      return `Complete! ${mealOptions.length} / ${mealOptions.length}`;
    }
    return `${currentIndex + 1} / ${mealOptions.length}`;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6B00" />
          <Text style={styles.loadingText}>Loading meal options...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const currentMeal = getCurrentMeal();

  // All meals voted on
  if (!currentMeal) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.completedContainer}>
          <Text style={styles.completedTitle}>{t('meals.votingComplete')}</Text>
          <Text style={styles.completedText}>
            You've voted on all {mealOptions.length} meals for "{displayName}".
          </Text>
          <Text style={styles.completedSubtext}>
            Check back later to see the results or wait for others to finish voting.
          </Text>
          
          <TouchableOpacity 
            style={styles.backToGroupButton}
            onPress={() => handleBackNavigation()}
          >
            <Text style={styles.backToGroupButtonText}>← {t('meals.backToGroup')}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Background Drawings */}
      <SafeDrawing 
        source={require('../assets/drawing2.png')}
        style={styles.backgroundDrawingMain}
      />
      <SafeDrawing 
        source={require('../assets/drawing6.jpg')}
        style={styles.backgroundDrawingSecondary}
      />
      <SafeDrawing 
        source={require('../assets/drawing8.png')}
        style={styles.backgroundDrawingAccent}
      />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => handleBackNavigation()}>
          <Text style={styles.backArrow}>←</Text>
          <Text style={styles.backText}>{t('common.back')}</Text>
        </TouchableOpacity>
        
        <View style={styles.headerCenter}>
          <Text style={styles.groupNameText}>{displayName}</Text>
          <Text style={styles.progressText}>{getProgress()}</Text>
          
          <View style={styles.progressBarContainer}>
            <View 
              style={[
                styles.progressBarFill, 
                { 
                  width: `${Math.min(100, Math.max(0, (currentIndex / mealOptions.length) * 100))}%` 
                }
              ]} 
            />
          </View>
        </View>
        
        <View style={styles.headerRight} />
      </View>

      {/* Instructions */}
      <View style={styles.instructionsContainer}>
        <Text style={styles.instructionsTitle}>
          {isResuming ? t('meals.resumingVotes') : t('meals.voteOnMeals')}
        </Text>
        {isResuming && (
          <Text style={styles.instructionsSubtext}>
            Continuing where you left off
          </Text>
        )}
        {/* Swipe hint — arrows + text, moved up from on-card position */}
        <View style={styles.swipeHintRow}>
          <View style={[styles.swipeHintSide, styles.swipeHintSideNo]}>
            <Feather name="arrow-left" size={14} color="#CC4444" />
            <Text style={styles.swipeHintSideTextNo}>{t('meals.dislike') || 'Nee'}</Text>
          </View>
          <Text style={styles.swipeHintCenterText}>
            {t('voting.swipeHint') || 'Swipe om te stemmen'}
          </Text>
          <View style={[styles.swipeHintSide, styles.swipeHintSideYes]}>
            <Text style={styles.swipeHintSideTextYes}>{t('meals.like') || 'Ja'}</Text>
            <Feather name="arrow-right" size={14} color="#3D9A50" />
          </View>
        </View>
      </View>

      {/* Card Stack Container */}
      <View style={styles.cardsContainer}>
        <View style={styles.cardStack}>
          {/* Background Card 3 */}
          {mealOptions[currentIndex + 2] && (
            <View style={[styles.mealCard, styles.stackCard3]}>
              <Image 
                source={{ 
                  uri: mealOptions[currentIndex + 2].meal_data.thumbnail_url || 
                       'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=300&fit=crop'
                }} 
                style={styles.mealImage}
                resizeMode="cover"
              />
              <View style={styles.mealInfo}>
                <Text style={styles.mealTitle} numberOfLines={2}>
                  {mealOptions[currentIndex + 2].meal_data.name || t('recipes.defaultName')}
                </Text>
              </View>
            </View>
          )}
          
          {/* Background Card 2 */}
          {mealOptions[currentIndex + 1] && (
            <View style={[styles.mealCard, styles.stackCard2]}>
              <Image 
                source={{ 
                  uri: mealOptions[currentIndex + 1].meal_data.thumbnail_url || 
                       'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=300&fit=crop'
                }} 
                style={styles.mealImage}
                resizeMode="cover"
              />
              <View style={styles.mealInfo}>
                <Text style={styles.mealTitle} numberOfLines={2}>
                  {mealOptions[currentIndex + 1].meal_data.name || t('recipes.defaultName')}
                </Text>
              </View>
            </View>
          )}

          {/* Current Card (Front) - Swipeable */}
          <Animated.View
            {...panResponder.panHandlers}
            style={[
              styles.mealCard, 
              styles.currentCard,
              {
                transform: [
                  { translateX: swipeX },
                  { translateY: swipeY },
                  { rotate: cardRotation }
                ]
              }
            ]}
          >
          <TouchableOpacity 
              style={styles.cardTouchable}
            onPress={() => {
              // Only open modal if we weren't swiping
              if (!isSwipingRef.current) {
                openRecipeModal(currentMeal);
              }
            }}
            activeOpacity={0.95}
            delayPressIn={100}
            onPressIn={() => {
              // Mark as potential tap, but PanResponder can still capture if it becomes a swipe
            }}
          >
            <Image 
              source={{ 
                uri: currentMeal.meal_data.thumbnail_url || 
                     'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=300&fit=crop'
              }} 
              style={styles.mealImage}
              resizeMode="cover"
            />
              
              {/* Like Overlay (Green) */}
              <Animated.View 
                style={[
                  styles.swipeOverlay, 
                  styles.likeOverlay,
                  { opacity: likeOpacity }
                ]}
              >
                <Text style={styles.swipeOverlayText}>{t('voting.like')}</Text>
              </Animated.View>
              
              {/* Dislike Overlay (Red) */}
              <Animated.View 
                style={[
                  styles.swipeOverlay, 
                  styles.dislikeOverlay,
                  { opacity: dislikeOpacity }
                ]}
              >
                <Text style={styles.swipeOverlayText}>{t('voting.dislike')}</Text>
              </Animated.View>
            
            {currentMeal.meal_data.chef && (
              <View style={styles.votingChefTag}>
                <Text style={styles.votingChefTagText}>@{currentMeal.meal_data.chef.tag}</Text>
              </View>
            )}

            <View style={styles.mealInfo}>
              <Text style={styles.mealTitle} numberOfLines={2}>
                {currentMeal.meal_data.name || t('recipes.defaultName')}
              </Text>

              <View style={styles.mealMeta}>
                <Text style={styles.mealTime}>
                  {formatTime(currentMeal.meal_data.total_time_minutes)}
                </Text>
                {currentMeal.meal_data.description && (
                  <Text style={styles.mealDescription} numberOfLines={3}>
                    {currentMeal.meal_data.description}
                  </Text>
                )}
              </View>
            </View>
          </TouchableOpacity>
            
          </Animated.View>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity 
          style={[styles.dislikeButton, voting && styles.buttonDisabled]}
          onPress={() => handleVote('no')}
          disabled={voting}
          activeOpacity={0.7}
        >
          <Text style={styles.actionButtonLabel}>
            {voting ? t('common.loading') : '' + t('meals.dislike')}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.likeButton, voting && styles.buttonDisabled]}
          onPress={() => handleVote('yes')}
          disabled={voting}
          activeOpacity={0.7}
        >
          <Text style={styles.actionButtonLabel}>
            {voting ? t('common.loading') : '' + t('meals.like')}
          </Text>
        </TouchableOpacity>
      </View>
      
      {/* Recipe Details Modal */}
      <Modal
        visible={showRecipeModal}
        transparent={true}
        animationType="none"
        onRequestClose={closeRecipeModal}
      >
        <View style={styles.modalOverlay}>
          <Animated.View 
            style={[
              styles.modalBackdrop,
              {
                opacity: backdropAnimation
              }
            ]}
          >
            <TouchableOpacity 
              style={styles.modalBackdropTouch}
              activeOpacity={1}
              onPress={closeRecipeModal}
            />
          </Animated.View>
          
          <Animated.View 
            style={[
              styles.modalContainer,
              {
                transform: [
                  {
                    scale: modalAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.8, 1],
                    })
                  }
                ],
                opacity: modalAnimation
              }
            ]}
          >
            {selectedRecipe && selectedRecipe.meal_data && (
              <>
                {/* Modal Header with Image */}
                <View style={styles.modalHeader}>
                  <Image 
                    source={{ 
                      uri: selectedRecipe.meal_data.thumbnail_url || 
                           selectedRecipe.meal_data.image ||
                           'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=600&h=400&fit=crop'
                    }} 
                    style={styles.modalImage}
                    resizeMode="cover"
                  />
                  
                  <TouchableOpacity 
                    style={styles.modalCloseButton}
                    onPress={closeRecipeModal}
                  >
                    <Text style={styles.modalCloseText}></Text>
                  </TouchableOpacity>
                </View>
                
                <ScrollView 
                  style={styles.modalContent}
                  showsVerticalScrollIndicator={false}
                  bounces={true}
                >
                  {/* Recipe Title and Time */}
                  <View style={styles.modalTitleSection}>
                    <Text style={styles.modalTitle}>
                      {selectedRecipe.meal_data.name || selectedRecipe.meal_data.title || t('recipes.defaultName')}
                    </Text>
                    
                    <View style={styles.modalMetaRow}>
                      <View style={styles.modalTimeBadge}>
                        <Text style={styles.modalTimeText}>
                          {formatTime(selectedRecipe.meal_data.cooking_time || selectedRecipe.meal_data.total_time_minutes || selectedRecipe.meal_data.cooking_time_minutes)}
                        </Text>
                      </View>
                      
                      {selectedRecipe.meal_data.cuisine_type && (
                        <View style={styles.modalTag}>
                          <Text style={styles.modalTagText}>{selectedRecipe.meal_data.cuisine_type}</Text>
                        </View>
                      )}

                      {(() => { const ex = getRecipeExtras(selectedRecipe.meal_data.name); return ex.estimated_cost ? (
                        <View style={styles.modalTimeBadge}>
                          <Text style={styles.modalTimeText}>{'\u20AC'}{ex.estimated_cost.toFixed(0)}</Text>
                        </View>
                      ) : null; })()}

                      {selectedRecipe.meal_data.tags && selectedRecipe.meal_data.tags.length > 0 && (
                        <View style={styles.modalTagsContainer}>
                          {selectedRecipe.meal_data.tags.slice(0, 3).map((tag, index) => (
                            <View key={index} style={styles.modalTag}>
                              <Text style={styles.modalTagText}>{tag}</Text>
                            </View>
                          ))}
                        </View>
                      )}
                    </View>
                  </View>
                  
                  {/* Chef tag */}
                  {selectedRecipe.meal_data.chef && (
                    <View style={styles.votingModalChefTag}>
                      <Text style={styles.votingModalChefText}>@{selectedRecipe.meal_data.chef.tag}</Text>
                      <Text style={styles.votingModalChefName}>{selectedRecipe.meal_data.chef.name}</Text>
                    </View>
                  )}

                  {/* Description */}
                  {selectedRecipe.meal_data.description && (
                    <View style={styles.modalSection}>
                      <Text style={styles.modalSectionTitle}>{t('recipes.description')}</Text>
                      <Text style={styles.modalDescription}>
                        {selectedRecipe.meal_data.description}
                      </Text>
                    </View>
                  )}
                  
                  {/* Debug: Show what data is available if nothing is displaying */}
                  {(!selectedRecipe.meal_data.description && 
                    !selectedRecipe.meal_data.ingredients?.length && 
                    !selectedRecipe.meal_data.instructions?.length) && (
                    <View style={styles.modalSection}>
                      <Text style={styles.modalSectionTitle}>Recipe Data Status</Text>
                      <Text style={styles.modalDescription}>
                        This recipe may be missing some information. To see full recipes, make sure your database has complete recipe data.
                      </Text>
                      <Text style={[styles.modalDescription, {marginTop: 10, fontSize: 12, color: '#999'}]}>
                        Debug Info:{'\n'}
                        - Has description: {selectedRecipe.meal_data.description ? 'Yes' : 'No'}{'\n'}
                        - Has ingredients: {selectedRecipe.meal_data.ingredients?.length || 0} items{'\n'}
                        - Has instructions: {selectedRecipe.meal_data.instructions?.length || 0} steps{'\n'}
                        - Has original data: {selectedRecipe.meal_data.originalRecipeData ? 'Yes' : 'No'}
                      </Text>
                    </View>
                  )}
                  
                  {/* Ingredients - with serving selector */}
                  {selectedRecipe.meal_data.ingredients && selectedRecipe.meal_data.ingredients.length > 0 && (
                    <View style={styles.modalSection}>
                      <Text style={styles.modalSectionTitle}>
                        {t('recipes.ingredients')} ({selectedRecipe.meal_data.ingredients.length})
                      </Text>
                      <ServingSelector count={servingCount} onChange={setServingCount} />
                      <View style={styles.ingredientsList}>
                        {scaleIngredients(
                          selectedRecipe.meal_data.ingredients.map(i => typeof i === 'string' ? i : (i.raw_text || i.text || '')),
                          getRecipeExtras(selectedRecipe.meal_data.name).default_servings,
                          servingCount
                        ).map((ingredient, index) => (
                          <View key={index} style={styles.ingredientItem}>
                            <Text style={styles.ingredientBullet}>•</Text>
                            <Text style={styles.ingredientText}>{ingredient}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  )}
                  
                  {/* Instructions - Simplified display */}
                  {selectedRecipe.meal_data.instructions && selectedRecipe.meal_data.instructions.length > 0 && (
                    <View style={styles.modalSection}>
                      <Text style={styles.modalSectionTitle}>
                        {t('recipes.instructions')} ({selectedRecipe.meal_data.instructions.length} steps)
                      </Text>
                      <View style={styles.instructionsList}>
                        {selectedRecipe.meal_data.instructions.map((instruction, index) => (
                          <View key={index} style={styles.instructionItem}>
                            <View style={styles.instructionNumber}>
                              <Text style={styles.instructionNumberText}>{index + 1}</Text>
                            </View>
                            <Text style={styles.instructionText}>
                              {typeof instruction === 'string' ? instruction : (instruction.display_text || instruction.text || t('recipes.instructions'))}
                            </Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  )}
                  
                  {/* Nutrition Info if available */}
                  {selectedRecipe.meal_data.nutrition && (
                    <View style={styles.modalSection}>
                      <Text style={styles.modalSectionTitle}>{t('recipes.nutrition')}</Text>
                      <View style={styles.nutritionGrid}>
                        {selectedRecipe.meal_data.nutrition.calories && (
                          <View style={styles.nutritionItem}>
                            <Text style={styles.nutritionValue}>
                              {Math.round(selectedRecipe.meal_data.nutrition.calories)}
                            </Text>
                            <Text style={styles.nutritionLabel}>{t('recipes.calories')}</Text>
                          </View>
                        )}
                        {selectedRecipe.meal_data.nutrition.protein && (
                          <View style={styles.nutritionItem}>
                            <Text style={styles.nutritionValue}>
                              {Math.round(selectedRecipe.meal_data.nutrition.protein)}g
                            </Text>
                            <Text style={styles.nutritionLabel}>{t('recipes.protein')}</Text>
                          </View>
                        )}
                        {selectedRecipe.meal_data.nutrition.carbs && (
                          <View style={styles.nutritionItem}>
                            <Text style={styles.nutritionValue}>
                              {Math.round(selectedRecipe.meal_data.nutrition.carbs)}g
                            </Text>
                            <Text style={styles.nutritionLabel}>{t('recipes.carbs')}</Text>
                          </View>
                        )}
                        {selectedRecipe.meal_data.nutrition.fat && (
                          <View style={styles.nutritionItem}>
                            <Text style={styles.nutritionValue}>
                              {Math.round(selectedRecipe.meal_data.nutrition.fat)}g
                            </Text>
                            <Text style={styles.nutritionLabel}>{t('recipes.fat')}</Text>
                          </View>
                        )}
                      </View>
                    </View>
                  )}
                  
                  {/* Action Buttons in Modal */}
                  <View style={styles.modalActions}>
                    <TouchableOpacity 
                      style={[styles.modalDislikeButton, voting && styles.buttonDisabled]}
                      onPress={() => {
                        closeRecipeModal();
                        handleVote('no');
                      }}
                      disabled={voting}
                    >
                      <Text style={styles.modalActionText}>{t('voting.dislikeThis')}</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      style={[styles.modalLikeButton, voting && styles.buttonDisabled]}
                      onPress={() => {
                        closeRecipeModal();
                        handleVote('yes');
                      }}
                      disabled={voting}
                    >
                      <Text style={styles.modalActionText}>{t('voting.likeThis')}</Text>
                    </TouchableOpacity>
                  </View>
                  
                  <View style={styles.modalBottomSpacer} />
                </ScrollView>
              </>
            )}
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
  backgroundDrawingMain: {
    position: 'absolute',
    top: '20%',
    left: '-25%',
    width: 200,
    height: 200,
    opacity: 0.08,
    zIndex: -1,
    transform: [{ rotate: '-15deg' }],
  },
  backgroundDrawingSecondary: {
    position: 'absolute',
    bottom: '15%',
    right: '-20%',
    width: 160,
    height: 160,
    opacity: 0.06,
    zIndex: -1,
    transform: [{ rotate: '25deg' }],
  },
  backgroundDrawingAccent: {
    position: 'absolute',
    top: '60%',
    left: '80%',
    width: 120,
    height: 120,
    opacity: 0.07,
    zIndex: -1,
    transform: [{ rotate: '-35deg' }],
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F8F6F3',
    backgroundColor: 'rgba(248, 246, 243, 0.95)',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(139, 115, 85, 0.1)',
    shadowColor: '#FF6B00',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
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
  headerCenter: {
    alignItems: 'center',
  },
  groupNameText: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 18,
    lineHeight: 24,
    color: '#1A1000',
    letterSpacing: 0.3,
  },
  progressText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    lineHeight: 18,
    color: '#6B6B6B',
    marginTop: 2,
  },
  progressBarContainer: {
    width: 120,
    height: 4,
    backgroundColor: 'rgba(139, 115, 85, 0.2)',
    borderRadius: 2,
    marginTop: 8,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#FF6B00',
    borderRadius: 2,
    transition: 'width 0.3s ease',
  },
  headerRight: {
    width: 100, // Same width as back button for centering
  },
  instructionsContainer: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  instructionsTitle: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 24,
    lineHeight: 30,
    color: '#1A1000',
    letterSpacing: 0.3,
    marginBottom: 8,
  },
  instructionsSubtext: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    lineHeight: 18,
    color: '#FF6B00',
    textAlign: 'center',
    letterSpacing: 0.1,
    fontStyle: 'italic',
  },
  instructionsText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    lineHeight: 22,
    color: '#6B6B6B',
    textAlign: 'center',
    letterSpacing: 0.1,
  },
  cardsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    position: 'relative',
  },
  cardStack: {
    position: 'relative',
    width: screenWidth - 48,
    height: Math.min(500, Dimensions.get('window').height * 0.55),
  },
  mealCard: {
    width: screenWidth - 48,
    height: Math.min(500, Dimensions.get('window').height * 0.55),
    borderRadius: 20,
    backgroundColor: '#F8F6F3',
    shadowColor: '#FF6B00',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(139, 115, 85, 0.1)',
  },
  mealImage: {
    width: '100%',
    height: '60%',
  },
  mealInfo: {
    padding: 24,
    flex: 1,
  },
  mealTitle: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 22,
    lineHeight: 28,
    color: '#1A1000',
    letterSpacing: 0.3,
    marginBottom: 16,
  },
  mealMeta: {
    gap: 12,
  },
  mealTime: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    lineHeight: 18,
    color: '#FF6B00',
    letterSpacing: 0.1,
  },
  mealDescription: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    lineHeight: 20,
    color: '#6B6B6B',
    letterSpacing: 0.1,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 40,
    paddingVertical: 24,
    gap: 32,
  },
  dislikeButton: {
    backgroundColor: '#CC4444',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#CC4444',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
    minWidth: 120,
  },
  likeButton: {
    // Green for semantic "yes" — matches the green overlay that appears
    // when swiping right on a card.
    backgroundColor: '#3D9A50',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#3D9A50',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
    minWidth: 120,
  },
  actionButtonLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 16,
    lineHeight: 20,
    color: '#FEFEFE',
    letterSpacing: 0.3,
    textAlign: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  completedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  completedTitle: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 28,
    lineHeight: 36,
    color: '#1A1000',
    letterSpacing: 0.3,
    textAlign: 'center',
    marginBottom: 16,
  },
  completedText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 16,
    lineHeight: 22,
    color: '#6B6B6B',
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: 0.1,
  },
  completedSubtext: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    lineHeight: 20,
    color: '#6B6B6B',
    textAlign: 'center',
    marginBottom: 32,
    letterSpacing: 0.1,
  },
  backToGroupButton: {
    backgroundColor: '#FF6B00',
    borderRadius: 12,
    paddingHorizontal: 32,
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
  backToGroupButtonText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 16,
    lineHeight: 20,
    color: '#FEFEFE',
    letterSpacing: 0.3,
  },
  stackCard3: {
    position: 'absolute',
    top: 12,
    left: 6,
    right: 6,
    height: Math.min(500, Dimensions.get('window').height * 0.55),
    opacity: 0.4,
    transform: [{ scale: 0.9 }],
    zIndex: 1,
  },
  stackCard2: {
    position: 'absolute',
    top: 6,
    left: 3,
    right: 3,
    height: Math.min(500, Dimensions.get('window').height * 0.55),
    opacity: 0.7,
    transform: [{ scale: 0.95 }],
    zIndex: 2,
  },
  currentCard: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: Math.min(500, Dimensions.get('window').height * 0.55),
    zIndex: 10,
  },
  
  // Swipe gesture styles
  cardTouchable: {
    flex: 1,
    width: '100%',
  },
  swipeOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 5,
  },
  likeOverlay: {
    backgroundColor: 'rgba(76, 175, 80, 0.85)',
  },
  dislikeOverlay: {
    backgroundColor: 'rgba(244, 67, 54, 0.85)',
  },
  swipeOverlayText: {
    fontSize: 42,
    fontFamily: 'Inter_700Bold',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
    letterSpacing: 3,
  },
  // New swipe hint row — lives in the header above the cards, not on them.
  // Arrow + "Nee" on the left, centered hint text, "Ja" + arrow on the right.
  swipeHintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
    paddingHorizontal: 18,
    gap: 10,
  },
  swipeHintSide: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  swipeHintSideNo: {
    backgroundColor: 'rgba(204, 68, 68, 0.1)',
  },
  swipeHintSideYes: {
    backgroundColor: 'rgba(61, 154, 80, 0.1)',
  },
  swipeHintSideTextNo: {
    fontSize: 12,
    fontWeight: '600',
    color: '#CC4444',
  },
  swipeHintSideTextYes: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3D9A50',
  },
  swipeHintCenterText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    color: '#9A8770',
    fontWeight: '500',
  },
  
  // Tap indicator styles
  tapToViewMore: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: 'rgba(139, 115, 85, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  tapToViewText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 11,
    color: '#FEFEFE',
    letterSpacing: 0.2,
  },
  
  // Modal styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  modalBackdropTouch: {
    flex: 1,
  },
  modalContainer: {
    width: '92%',
    maxWidth: 400,
    maxHeight: '85%',
    backgroundColor: '#FEFEFE',
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 12,
    },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 15,
  },
  modalHeader: {
    position: 'relative',
    height: 220,
    backgroundColor: '#F8F6F3',
  },
  modalImage: {
    width: '100%',
    height: '100%',
  },
  modalCloseButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  modalCloseText: {
    fontSize: 20,
    color: '#1A1000',
    fontFamily: 'Inter_600SemiBold',
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 24,
  },
  modalTitleSection: {
    paddingTop: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E2DA',
  },
  modalTitle: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 24,
    lineHeight: 32,
    color: '#1A1000',
    letterSpacing: 0.3,
    marginBottom: 12,
  },
  modalMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
  },
  modalTimeBadge: {
    backgroundColor: '#FF6B00',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  modalTimeText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    color: '#FEFEFE',
    letterSpacing: 0.2,
  },
  modalTagsContainer: {
    flexDirection: 'row',
    gap: 6,
  },
  modalTag: {
    backgroundColor: '#E8E2DA',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  modalTagText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: '#6B6B6B',
    letterSpacing: 0.1,
  },
  modalSection: {
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F8F6F3',
  },
  modalSectionTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    lineHeight: 22,
    color: '#1A1000',
    marginBottom: 12,
    letterSpacing: 0.2,
  },
  modalDescription: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    lineHeight: 21,
    color: '#6B6B6B',
    letterSpacing: 0.1,
  },
  ingredientsList: {
    gap: 8,
  },
  ingredientItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  ingredientBullet: {
    fontSize: 14,
    color: '#FF6B00',
    marginTop: 1,
  },
  ingredientText: {
    flex: 1,
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    lineHeight: 20,
    color: '#4A4A4A',
    letterSpacing: 0.1,
  },
  instructionsList: {
    gap: 16,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  instructionNumber: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#FF6B00',
    justifyContent: 'center',
    alignItems: 'center',
  },
  instructionNumberText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
    color: '#FEFEFE',
  },
  instructionText: {
    flex: 1,
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    lineHeight: 20,
    color: '#4A4A4A',
    letterSpacing: 0.1,
  },
  nutritionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  nutritionItem: {
    minWidth: 70,
    alignItems: 'center',
  },
  nutritionValue: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 18,
    color: '#1A1000',
    marginBottom: 4,
  },
  nutritionLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: '#6B6B6B',
    letterSpacing: 0.1,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 20,
  },
  modalDislikeButton: {
    flex: 1,
    backgroundColor: '#6B6B6B',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalLikeButton: {
    flex: 1,
    backgroundColor: '#FF6B00',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalActionText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: '#FEFEFE',
    letterSpacing: 0.3,
  },
  modalBottomSpacer: {
    height: 20,
  },
  votingChefTag: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
    zIndex: 5,
  },
  votingChefTagText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    lineHeight: 16,
    color: '#FEFEFE',
    letterSpacing: 0.1,
  },
  votingModalChefTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F3F0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginHorizontal: 20,
    marginBottom: 12,
    gap: 8,
  },
  votingModalChefText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: '#FF6B00',
  },
  votingModalChefName: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#6B6B6B',
  },
}); 