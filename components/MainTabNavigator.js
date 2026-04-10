import React, { useState, useEffect, useRef, useCallback } from 'react';
import { StyleSheet, View, Text, Image, Animated, SafeAreaView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../lib/supabase';
import IdeasScreen from './IdeasScreen';
import MainProfileScreen from './MainProfileScreen';
import GroupsScreen from './GroupsScreenSimple';
import BottomTabNavigation from './BottomTabNavigation';
import { useTranslation } from 'react-i18next';
import { useAppState } from '../lib/AppStateContext';
import { initializeNotifications } from '../lib/notificationService';
import AppPopup from './AppPopup';
import OnboardingModal from './OnboardingModal';
import NamePromptModal from './NamePromptModal';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

export default function MainTabNavigator({ navigation, route, pendingJoinCode, onJoinCodeHandled }) {
  const { t } = useTranslation();
  const appState = useAppState();
  const [currentTab, setCurrentTab] = useState('groups');
  const [pendingOpenRecipe, setPendingOpenRecipe] = useState(null);
  const [isInitialLoading, setIsInitialLoading] = useState(false);
  const [splashVisible, setSplashVisible] = useState(true);
  const splashOpacity = useRef(new Animated.Value(1)).current;
  const [profileRefreshKey, setProfileRefreshKey] = useState(0);
  const [imagesPreloaded, setImagesPreloaded] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showNamePrompt, setShowNamePrompt] = useState(false);
  
  // Track if we need to reopen group modal (when returning from voting/results)
  const [pendingGroupReopen, setPendingGroupReopen] = useState(null);
  
  // Preloading state - other tabs start preloading after groups is ready
  const [groupsReady, setGroupsReady] = useState(false);
  const [shouldPreloadOthers, setShouldPreloadOthers] = useState(false);
  
  // When groups is ready, trigger preloading of other tabs after a short delay
  useEffect(() => {
    if (groupsReady && !shouldPreloadOthers) {
      // Wait a bit for groups UI to settle, then preload others
      const timer = setTimeout(() => {
        setShouldPreloadOthers(true);
      }, 1000); // 1 second delay
      return () => clearTimeout(timer);
    }
  }, [groupsReady, shouldPreloadOthers]);
  
  // Callback for GroupsScreen to signal it's ready
  const onGroupsReady = useCallback(() => {
    setGroupsReady(true);
    // Fade out splash overlay
    Animated.timing(splashOpacity, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setSplashVisible(false);
      // Always request notification permission first
      initializeNotifications().catch(() => {});
      // Save app version to profile
      (async () => {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            const version = Constants.expoConfig?.version || Constants.manifest?.version || '?';
            await supabase.from('profiles').update({ app_version: version }).eq('id', user.id);
          }
        } catch (_) {}
      })();
      // Then check onboarding and name
      AsyncStorage.getItem('hasSeenOnboarding').then(async (val) => {
        if (!val) {
          setShowOnboarding(true);
        } else {
          try {
            const { data: { user } } = await supabase.auth.getUser();
            const name = user?.user_metadata?.full_name;
            if (user && (!name || name === user.email?.split('@')[0])) {
              setShowNamePrompt(true);
            }
          } catch (_) {}
        }
      }).catch(() => {});
    });
  }, []);

  useEffect(() => {
    // Start preloading images immediately
    preloadImages();
    initializeApp();
  }, []);

  useEffect(() => {
    // Handle navigation params to set current tab
    if (route?.params?.screen) {
      setCurrentTab(route.params.screen);
    }
    
    // Handle switching to groups tab and reopening group modal
    if (route?.params?.switchToGroupsTab) {
      setCurrentTab('groups');
      
      // Store the pending group reopen request
      if (route?.params?.reopenGroupModal && route?.params?.groupId) {
        setPendingGroupReopen({
          groupId: route.params.groupId,
          timestamp: Date.now()
        });
      }
      
      // Invalidate top meals cache if returning from voting
      if (route?.params?.refreshTopMeals && appState?.invalidateTopMeals) {
        appState.invalidateTopMeals();
      }
    }
  }, [route?.params]);
  
  // Use focus effect to handle returning from other screens
  useFocusEffect(
    useCallback(() => {
      // Process pending group reopen if within 5 seconds
      if (pendingGroupReopen && (Date.now() - pendingGroupReopen.timestamp) < 5000) {
        // GroupsScreen will handle this via route params
      }
      
      return () => {};
    }, [pendingGroupReopen])
  );

  const preloadImages = async () => {
    try {
      // Preload remote images in background using Image.prefetch
      const fallbackImages = [
        'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=300&fit=crop',
        'https://images.unsplash.com/photo-1598103442097-8b74394b95c6?w=400&h=300&fit=crop',
        'https://images.unsplash.com/photo-1621996346565-e3dbc353d2c5?w=400&h=300&fit=crop'
      ];

      // Preload remote images in background (local images load instantly)
      fallbackImages.forEach(url => {
        Image.prefetch(url).catch(() => {});
      });

      setImagesPreloaded(true);
    } catch (error) {
      console.error('❌ Error preloading images:', error);
      setImagesPreloaded(true);
    }
  };

  const initializeApp = async () => {
    await checkAuthStatus();
      setIsInitialLoading(false);
  };

  const checkAuthStatus = async () => {
    try {
      await supabase.auth.getUser();
      // Auth state is handled by AppStateContext
    } catch (error) {
      // Auth check failed - user may not be signed in
    }
  };

  const handleReloadAll = () => {
    setProfileRefreshKey(prev => prev + 1);
    
    // Trigger full refresh in context
    if (appState?.refreshAll) {
      appState.refreshAll();
    }
  };

  const handleTabPress = (screen) => {
    if (screen === currentTab) return;
    setCurrentTab(screen);
    
    if (screen === 'profile') {
      checkAuthStatus();
    }
  };

  // Create enhanced navigation that intercepts tab-level routes but passes stack routes through
  const stackNavigate = navigation.navigate.bind(navigation);
  const enhancedNavigation = {
    ...navigation,
    navigate: (routeName, params) => {
      if (routeName === 'Profile') {
        stackNavigate('Profile', params);
      } else if (routeName === 'MainTabs') {
        checkAuthStatus();
        setCurrentTab('groups');
        setProfileRefreshKey(prev => prev + 1);
        
        // Refresh all data when signing in
        if (appState?.refreshAll) {
          setTimeout(() => appState.refreshAll(), 500);
        }
      } else {
        navigation.navigate(routeName, params);
      }
    }
  };

  if (isInitialLoading || !imagesPreloaded) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Image 
            source={require('../assets/splash-logo.png')}
            style={styles.loadingLogo}
            resizeMode="contain"
          />
          <Text style={styles.loadingText}>
            {!imagesPreloaded ? t('loading.loadingImages') : t('loading.preparingStudentExperience')}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const tabBg = currentTab === 'groups' ? '#FAF8F5' : '#FEFEFE';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: tabBg }]}>
      <View style={styles.content}>
        {/* Groups Screen - Always mounted, loads first */}
        <View style={[
          styles.screenContainer,
          currentTab === 'groups' ? styles.activeScreen : styles.hiddenScreen
        ]}>
          <GroupsScreen
            key="groups"
            route={route || { params: {} }}
            navigation={enhancedNavigation}
            isActive={currentTab === 'groups'}
            onReady={onGroupsReady}
            pendingGroupReopen={pendingGroupReopen}
            pendingJoinCode={pendingJoinCode}
            onJoinCodeHandled={onJoinCodeHandled}
            onPendingGroupReopenCleared={() => setPendingGroupReopen(null)}
          />
        </View>

        {/* Ideas Screen - Preloads after groups is ready, or loads immediately when active */}
        <View style={[
          styles.screenContainer,
          currentTab === 'inspiration' ? styles.activeScreen : styles.hiddenScreen
        ]}>
          <IdeasScreen 
            key="ideas"
            route={{ params: {} }} 
            navigation={enhancedNavigation}
            hideBottomNav={true}
            isActive={currentTab === 'inspiration'}
            shouldPreload={shouldPreloadOthers}
            pendingOpenRecipe={pendingOpenRecipe}
            onOpenRecipeHandled={() => setPendingOpenRecipe(null)}
          />
        </View>

        {/* Profile Screen - Preloads after groups is ready, or loads immediately when active */}
        <View style={[
          styles.screenContainer,
          currentTab === 'profile' ? styles.activeScreen : styles.hiddenScreen
        ]}>
          <MainProfileScreen 
            key={`profile-${profileRefreshKey}`}
            route={{ params: {} }} 
            navigation={enhancedNavigation}
            hideBottomNav={true}
            isActive={currentTab === 'profile'}
            shouldPreload={shouldPreloadOthers}
            onSwitchToGroups={() => handleTabPress('groups')}
            onSwitchToInspiration={(recipe) => { setPendingOpenRecipe(recipe); handleTabPress('inspiration'); }}
          />
        </View>
      </View>
      
      <View style={styles.bottomNavContainer}>
        <BottomTabNavigation
          currentScreen={currentTab}
          onTabPress={handleTabPress}
        />
      </View>

      {/* Onboarding (first time only) */}
      <OnboardingModal
        visible={showOnboarding}
        onDone={async () => {
          setShowOnboarding(false);
          // After onboarding, check if name is needed
          try {
            const { data: { user } } = await supabase.auth.getUser();
            const name = user?.user_metadata?.full_name;
            if (user && (!name || name === user.email?.split('@')[0])) {
              setShowNamePrompt(true);
            }
          } catch (_) {}
        }}
      />

      {/* Name prompt (for Apple/Google sign in users without a name) */}
      <NamePromptModal
        visible={showNamePrompt}
        onDone={() => {
          setShowNamePrompt(false);
          if (appState?.refreshAll) appState.refreshAll();
        }}
      />

      {/* In-app popup (controlled from admin dashboard) */}
      {!splashVisible && !showOnboarding && <AppPopup />}

      {/* Splash overlay with logo, fades out when ready */}
      {splashVisible && (
        <Animated.View style={[styles.splashOverlay, { opacity: splashOpacity }]}>
          <Image
            source={require('../assets/splash-logo.png')}
            style={{ width: 560, height: 280 }}
            resizeMode="contain"
          />
        </Animated.View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF8F5',
  },
  content: {
    flex: 1,
  },
  screenContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 47, // Space for bottom nav
  },
  activeScreen: {
    zIndex: 1,
    // No opacity animation - instant switch
  },
  hiddenScreen: {
    // Use display: 'none' instead of opacity: 0 to prevent layout recalculations
    // This makes tab switching completely static with no visual movement
    display: 'none',
  },
  bottomNavContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 999,
    elevation: 10,
    backgroundColor: 'transparent',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingLogo: {
    width: 170,
    height: 170,
    marginBottom: 20,
  },
  loadingText: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
    color: '#FF6B00',
  },
  splashOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#FEFEFE',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
}); 
