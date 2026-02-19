import React, { createContext, useContext, useReducer, useCallback, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';
import { getUserGroups, getGroupMembers } from './groupsService';
import { getAllDinnerRequests } from './dinnerRequestService';
import { getCurrentUserProfile } from './profileService';
import { checkAndPerformMidnightReset } from './midnightResetService';
import { getActiveMealRequest, getTopVotedMeals } from './mealRequestService';
import { getMySpecialOccasions } from './specialOccasionService';
import { loadAllGroupsOverview, preloadAllGroupData as batchPreloadAllGroupData, loadUserDashboardData } from './batchDataService';
import { log, debugError } from './debugConfig';
// import { initializeNotifications } from './notificationService'; // Disabled - slowing down app

// Stable sort for top meals: votes DESC, then alphabetical by name for ties
const sortTopMeals = (meals) => {
  if (!Array.isArray(meals) || meals.length <= 1) return meals;
  return [...meals].sort((a, b) => {
    const votesA = a.yes_votes ?? 0;
    const votesB = b.yes_votes ?? 0;
    if (votesB !== votesA) return votesB - votesA;
    const nameA = (a.meal_data?.name || '').toLowerCase();
    const nameB = (b.meal_data?.name || '').toLowerCase();
    return nameA.localeCompare(nameB);
  });
};

// AsyncStorage keys for persistent caching
const STORAGE_KEYS = {
  CACHED_PROFILE: 'cachedUserProfile',
  CACHED_GROUPS: 'cachedGroups',
  CACHED_DAILY_RESPONSES: 'cachedDailyResponses',
  CACHED_GROUP_MEMBERS: 'cachedGroupMembers',
  CACHED_EXPANSION_DATA: 'cachedExpansionData',
  CACHED_RECIPES: 'cachedRecipes',
};

// Cache expiry times (in milliseconds) - Optimized for lower request volume
const CACHE_EXPIRY = {
  GROUPS: 30 * 60 * 1000,           // 30 minutes - groups rarely change
  DINNER_REQUESTS: 30 * 60 * 1000,  // 30 minutes
  GROUP_MEMBERS: 30 * 60 * 1000,    // 30 minutes - members rarely change
  ACTIVE_REQUESTS: 15 * 60 * 1000,  // 15 minutes - meal requests
  TOP_MEALS: 15 * 1000,             // 15 seconds - fast updates when voting
  SPECIAL_OCCASIONS: 30 * 60 * 1000, // 30 minutes
  DAILY_RESPONSES: 3 * 60 * 1000,   // 3 minutes - keep fresh for multi-user Yes/No
  RECIPES: 60 * 60 * 1000           // 1 hour - recipes change rarely
};

// Initial state
const initialState = {
  // User data
  user: null,
  userProfile: null,
  isGuest: false,
  
  // Groups data with caching
  groups: [],
  groupsLoading: false,
  groupsLastUpdated: null,
  groupsOverview: {}, // { [groupId]: { memberCount, hasActiveMealRequest, ... } }
  
  // Group members cache: { [groupId]: { members: [], lastUpdated: timestamp } }
  groupMembersCache: {},
  
  // Active meal requests cache: { [groupId]: { request: {...}, lastUpdated: timestamp } }
  activeMealRequestsCache: {},
  
  // Top voted meals cache: { [requestId]: { meals: [], lastUpdated: timestamp } }
  topMealsCache: {},
  
  // Daily responses cache: { [groupId]: { responses: {userId: response}, lastUpdated: timestamp, date: 'YYYY-MM-DD' } }
  dailyResponsesCache: {},
  
  // Preloaded group expansion data: { [groupId]: { members, responses, topMeals, mealRequest, timestamp } }
  // This enables instant group card expansion without loading spinners
  preloadedExpansionData: {},
  preloadedExpansionTimestamp: null,
  
  // Cached recipes: { recipes: [], timestamp: number }
  cachedRecipes: [],
  cachedRecipesTimestamp: null,
  
  // Dinner requests with caching
  dinnerRequests: [],
  dinnerRequestsLoading: false,
  dinnerRequestsLastUpdated: null,
  
  // Special occasions (independent system)
  specialOccasions: [],
  specialOccasionsLoading: false,
  specialOccasionsLastUpdated: null,
  
  // Local optimistic updates
  localResponseMap: new Map(),
  
  // App state
  currentScreen: 'profile',
  refreshTrigger: 0,
  isInitialLoadComplete: false,
  
  // Legacy cache expiry (kept for backwards compatibility)
  cacheExpiryTime: 5 * 60 * 1000,
};

// Action types
const actionTypes = {
  SET_USER: 'SET_USER',
  SET_USER_PROFILE: 'SET_USER_PROFILE',
  SET_GUEST_STATUS: 'SET_GUEST_STATUS',
  
  SET_GROUPS_LOADING: 'SET_GROUPS_LOADING',
  SET_GROUPS: 'SET_GROUPS',
  UPDATE_GROUP: 'UPDATE_GROUP',
  ADD_GROUP: 'ADD_GROUP',
  SET_GROUPS_OVERVIEW: 'SET_GROUPS_OVERVIEW',
  
  // New cache actions
  SET_GROUP_MEMBERS: 'SET_GROUP_MEMBERS',
  SET_ACTIVE_MEAL_REQUEST: 'SET_ACTIVE_MEAL_REQUEST',
  SET_TOP_MEALS: 'SET_TOP_MEALS',
  SET_DAILY_RESPONSES: 'SET_DAILY_RESPONSES',
  UPDATE_SINGLE_RESPONSE: 'UPDATE_SINGLE_RESPONSE',
  INVALIDATE_GROUP_CACHE: 'INVALIDATE_GROUP_CACHE',
  SET_PRELOADED_EXPANSION_DATA: 'SET_PRELOADED_EXPANSION_DATA',
  
  SET_DINNER_REQUESTS_LOADING: 'SET_DINNER_REQUESTS_LOADING',
  SET_DINNER_REQUESTS: 'SET_DINNER_REQUESTS',
  UPDATE_DINNER_REQUEST: 'UPDATE_DINNER_REQUEST',
  REMOVE_DINNER_REQUEST: 'REMOVE_DINNER_REQUEST',
  
  // Special occasions
  SET_SPECIAL_OCCASIONS_LOADING: 'SET_SPECIAL_OCCASIONS_LOADING',
  SET_SPECIAL_OCCASIONS: 'SET_SPECIAL_OCCASIONS',
  
  ADD_LOCAL_RESPONSE: 'ADD_LOCAL_RESPONSE',
  CLEAR_LOCAL_RESPONSE: 'CLEAR_LOCAL_RESPONSE',
  
  SET_CURRENT_SCREEN: 'SET_CURRENT_SCREEN',
  TRIGGER_REFRESH: 'TRIGGER_REFRESH',
  SET_INITIAL_LOAD_COMPLETE: 'SET_INITIAL_LOAD_COMPLETE',
  
  // Recipes caching
  SET_CACHED_RECIPES: 'SET_CACHED_RECIPES',
  
  INVALIDATE_CACHE: 'INVALIDATE_CACHE',
};

// Reducer
const appStateReducer = (state, action) => {
  switch (action.type) {
    case actionTypes.SET_USER:
      return { ...state, user: action.payload };
      
    case actionTypes.SET_USER_PROFILE:
      return { ...state, userProfile: action.payload };
      
    case actionTypes.SET_GUEST_STATUS:
      return { 
        ...state, 
        isGuest: action.payload,
        // Clear all data when switching to guest
        ...(action.payload ? {
          groups: [],
          dinnerRequests: [],
          specialOccasions: [],
          userProfile: null,
          localResponseMap: new Map(),
          groupMembersCache: {},
          activeMealRequestsCache: {},
          topMealsCache: {},
          groupsOverview: {},
          isInitialLoadComplete: false
        } : {})
      };
      
    case actionTypes.SET_GROUPS_LOADING:
      return { ...state, groupsLoading: action.payload };
      
    case actionTypes.SET_GROUPS:
      return { 
        ...state, 
        groups: action.payload,
        groupsLoading: false,
        groupsLastUpdated: Date.now()
      };
      
    case actionTypes.UPDATE_GROUP:
      return {
        ...state,
        groups: state.groups.map(group => 
          group.group_id === action.payload.group_id 
            ? { ...group, ...action.payload } 
            : group
        )
      };
      
    case actionTypes.ADD_GROUP:
      return {
        ...state,
        groups: [...state.groups, action.payload],
        groupsLastUpdated: Date.now()
      };
      
    case actionTypes.SET_GROUPS_OVERVIEW:
      return {
        ...state,
        groupsOverview: action.payload
      };
      
    // New cache reducers
    case actionTypes.SET_GROUP_MEMBERS:
      return {
        ...state,
        groupMembersCache: {
          ...state.groupMembersCache,
          [action.payload.groupId]: {
            members: action.payload.members,
            lastUpdated: Date.now()
          }
        }
      };
      
    case actionTypes.SET_ACTIVE_MEAL_REQUEST:
      return {
        ...state,
        activeMealRequestsCache: {
          ...state.activeMealRequestsCache,
          [action.payload.groupId]: {
            request: action.payload.request,
            hasActiveRequest: action.payload.hasActiveRequest,
            mealOptions: action.payload.mealOptions || [],
            lastUpdated: Date.now()
          }
        }
      };
      
    case actionTypes.SET_TOP_MEALS:
      return {
        ...state,
        topMealsCache: {
          ...state.topMealsCache,
          [action.payload.requestId]: {
            meals: action.payload.meals,
            lastUpdated: Date.now()
          }
        }
      };
      
    case actionTypes.SET_DAILY_RESPONSES:
      return {
        ...state,
        dailyResponsesCache: {
          ...state.dailyResponsesCache,
          [action.payload.groupId]: {
            responses: action.payload.responses,
            date: action.payload.date,
            lastUpdated: Date.now()
          }
        }
      };
      
    case actionTypes.UPDATE_SINGLE_RESPONSE:
      const { groupId: respGroupId, userId, response, date } = action.payload;
      const existingCache = state.dailyResponsesCache[respGroupId] || { responses: {}, date };
      return {
        ...state,
        dailyResponsesCache: {
          ...state.dailyResponsesCache,
          [respGroupId]: {
            ...existingCache,
            responses: {
              ...existingCache.responses,
              [userId]: response
            },
            lastUpdated: Date.now()
          }
        }
      };
      
    case actionTypes.INVALIDATE_GROUP_CACHE:
      const invGroupId = action.payload;
      const newMembersCache = { ...state.groupMembersCache };
      const newActiveCache = { ...state.activeMealRequestsCache };
      const newResponsesCache = { ...state.dailyResponsesCache };
      const newPreloadedData = { ...state.preloadedExpansionData };
      delete newMembersCache[invGroupId];
      delete newActiveCache[invGroupId];
      delete newResponsesCache[invGroupId];
      delete newPreloadedData[invGroupId];
      return {
        ...state,
        groupMembersCache: newMembersCache,
        activeMealRequestsCache: newActiveCache,
        dailyResponsesCache: newResponsesCache,
        preloadedExpansionData: newPreloadedData
      };
      
    case actionTypes.SET_PRELOADED_EXPANSION_DATA:
      return {
        ...state,
        preloadedExpansionData: action.payload.data,
        preloadedExpansionTimestamp: action.payload.timestamp
      };
      
    case actionTypes.SET_DINNER_REQUESTS_LOADING:
      return { ...state, dinnerRequestsLoading: action.payload };
      
    case actionTypes.SET_DINNER_REQUESTS:
      return {
        ...state,
        dinnerRequests: action.payload,
        dinnerRequestsLoading: false,
        dinnerRequestsLastUpdated: Date.now()
      };
      
    case actionTypes.UPDATE_DINNER_REQUEST:
      return {
        ...state,
        dinnerRequests: state.dinnerRequests.map(request =>
          request.id === action.payload.id
            ? { ...request, ...action.payload }
            : request
        )
      };
      
    case actionTypes.REMOVE_DINNER_REQUEST:
      return {
        ...state,
        dinnerRequests: state.dinnerRequests.filter(request => request.id !== action.payload)
      };
      
    case actionTypes.SET_SPECIAL_OCCASIONS_LOADING:
      return { ...state, specialOccasionsLoading: action.payload };
      
    case actionTypes.SET_SPECIAL_OCCASIONS:
      return {
        ...state,
        specialOccasions: action.payload,
        specialOccasionsLoading: false,
        specialOccasionsLastUpdated: Date.now()
      };
      
    case actionTypes.ADD_LOCAL_RESPONSE:
      const newMap = new Map(state.localResponseMap);
      newMap.set(action.payload.requestId, action.payload.response);
      return { ...state, localResponseMap: newMap };
      
    case actionTypes.CLEAR_LOCAL_RESPONSE:
      const clearedMap = new Map(state.localResponseMap);
      clearedMap.delete(action.payload);
      return { ...state, localResponseMap: clearedMap };
      
    case actionTypes.SET_CURRENT_SCREEN:
      return { ...state, currentScreen: action.payload };
      
    case actionTypes.TRIGGER_REFRESH:
      return { ...state, refreshTrigger: state.refreshTrigger + 1 };
      
    case actionTypes.SET_INITIAL_LOAD_COMPLETE:
      return { ...state, isInitialLoadComplete: action.payload };
      
    case actionTypes.SET_CACHED_RECIPES:
      return { 
        ...state, 
        cachedRecipes: action.payload.recipes,
        cachedRecipesTimestamp: action.payload.timestamp || Date.now()
      };
      
    case actionTypes.INVALIDATE_CACHE:
      const invalidations = {};
      if (action.payload.includes('groups')) {
        invalidations.groupsLastUpdated = null;
      }
      if (action.payload.includes('dinnerRequests')) {
        invalidations.dinnerRequestsLastUpdated = null;
      }
      if (action.payload.includes('specialOccasions')) {
        invalidations.specialOccasionsLastUpdated = null;
      }
      if (action.payload.includes('topMeals')) {
        invalidations.topMealsCache = {};
      }
      if (action.payload.includes('dailyResponses') || action.payload.includes('all')) {
        invalidations.dailyResponsesCache = {};
      }
      if (action.payload.includes('all')) {
        invalidations.groupMembersCache = {};
        invalidations.activeMealRequestsCache = {};
        invalidations.topMealsCache = {};
        invalidations.groupsLastUpdated = null;
        invalidations.dinnerRequestsLastUpdated = null;
        invalidations.specialOccasionsLastUpdated = null;
      }
      return { ...state, ...invalidations };
      
    default:
      return state;
  }
};

// Context
const AppStateContext = createContext();

// Provider component
export const AppStateProvider = ({ children }) => {
  const [state, dispatch] = useReducer(appStateReducer, initialState);
  const midnightResetPerformed = useRef(false);
  const initialLoadPerformed = useRef(false);
  const lastCheckedDate = useRef(new Date().toISOString().split('T')[0]);

  // Check if date has changed (for midnight reset while app is open)
  const checkDateChange = useCallback(async () => {
    const today = new Date().toISOString().split('T')[0];
    if (lastCheckedDate.current !== today) {
      log.cache('Date changed from', lastCheckedDate.current, 'to', today, '- performing midnight reset...');
      lastCheckedDate.current = today;
      
      // Perform midnight reset
      try {
        await checkAndPerformMidnightReset();
        log.cache('Midnight reset completed after date change');
        
        // Clear all caches to force fresh data
        dispatch({ type: actionTypes.INVALIDATE_CACHE, payload: ['all'] });
        
        return true; // Date changed
      } catch (error) {
        debugError('CACHE', 'Error during date-change reset:', error);
      }
    }
    return false; // No date change
  }, []);

  // Load cached profile IMMEDIATELY on mount for instant avatar display
  // This runs before any other data loading to ensure profile is available ASAP
  const profileLoadedRef = useRef(false);
  useEffect(() => {
    if (!profileLoadedRef.current) {
      profileLoadedRef.current = true;
      // Load cached profile synchronously-ish (first thing on mount)
      AsyncStorage.getItem(STORAGE_KEYS.CACHED_PROFILE)
        .then(cached => {
          if (cached) {
            const profile = JSON.parse(cached);
            log.cache('INSTANT: Loaded cached profile for avatar:', profile?.full_name);
            dispatch({ type: actionTypes.SET_USER_PROFILE, payload: profile });
          }
        })
        .catch(error => {
          debugError('CACHE', 'Error loading instant profile:', error);
        });
    }
  }, []);

  // Perform midnight reset on app startup (only once)
  useEffect(() => {
    if (!midnightResetPerformed.current) {
      midnightResetPerformed.current = true;
      log.cache('Checking for midnight reset on app startup...');
      checkAndPerformMidnightReset()
        .then(result => {
          if (result.alreadyReset) {
            log.cache('Midnight reset already done today');
          } else {
            log.cache('Midnight reset completed:', result);
          }
        })
        .catch(error => {
          debugError('CACHE', 'Midnight reset error:', error);
        });
    }
  }, []);

  // Helper function to check if cache is fresh (also checks for date change)
  const isCacheFresh = useCallback((lastUpdated, expiryTime = CACHE_EXPIRY.GROUPS) => {
    if (!lastUpdated) return false;
    
    // Check if date has changed (cache is stale if day changed)
    const today = new Date().toISOString().split('T')[0];
    if (lastCheckedDate.current !== today) {
      // Trigger date change check asynchronously
      checkDateChange();
      return false; // Cache is stale when date changes
    }
    
    return (Date.now() - lastUpdated) < expiryTime;
  }, [checkDateChange]);

  // Load cached profile from AsyncStorage (for instant display on app launch)
  const loadCachedProfile = useCallback(async () => {
    try {
      const cached = await AsyncStorage.getItem(STORAGE_KEYS.CACHED_PROFILE);
      if (cached) {
        const profile = JSON.parse(cached);
        log.cache('Loaded cached profile from AsyncStorage:', profile?.full_name);
        dispatch({ type: actionTypes.SET_USER_PROFILE, payload: profile });
        return profile;
      }
    } catch (error) {
      debugError('CACHE', 'Error loading cached profile:', error);
    }
    return null;
  }, []);

  // Save profile to AsyncStorage for persistent caching
  const saveCachedProfile = useCallback(async (profile) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.CACHED_PROFILE, JSON.stringify(profile));
      log.cache('Saved profile to AsyncStorage');
    } catch (error) {
      debugError('CACHE', 'Error saving profile to AsyncStorage:', error);
    }
  }, []);

  // Load cached groups from AsyncStorage (for instant display on app launch)
  // Only dispatches if state.groups is empty to avoid double-render
  const loadCachedGroups = useCallback(async () => {
    // Skip if we already have groups in state (avoid double dispatch)
    if (state.groups && state.groups.length > 0) {
      log.cache('Skipping cached groups - already have groups in state');
      return state.groups;
    }
    
    try {
      const cached = await AsyncStorage.getItem(STORAGE_KEYS.CACHED_GROUPS);
      if (cached) {
        const data = JSON.parse(cached);
        log.cache('INSTANT: Loaded cached groups from AsyncStorage:', data.groups?.length);
        dispatch({ type: actionTypes.SET_GROUPS, payload: data.groups || [] });
        return data.groups || [];
      }
    } catch (error) {
      debugError('CACHE', 'Error loading cached groups:', error);
    }
    return [];
  }, [state.groups]);

  // Save groups to AsyncStorage for persistent caching
  const saveCachedGroups = useCallback(async (groups) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.CACHED_GROUPS, JSON.stringify({ 
        groups, 
        timestamp: Date.now() 
      }));
      log.cache('Saved groups to AsyncStorage:', groups?.length);
    } catch (error) {
      debugError('CACHE', 'Error saving groups to AsyncStorage:', error);
    }
  }, []);

  // Load cached daily responses from AsyncStorage
  // Only dispatches if cache is empty to avoid double-render
  const loadCachedDailyResponses = useCallback(async () => {
    // Skip if we already have responses in cache (avoid double dispatch)
    if (state.dailyResponsesCache && Object.keys(state.dailyResponsesCache).length > 0) {
      log.cache('Skipping cached responses - already have responses in cache');
      return state.dailyResponsesCache;
    }
    
    try {
      const cached = await AsyncStorage.getItem(STORAGE_KEYS.CACHED_DAILY_RESPONSES);
      if (cached) {
        const data = JSON.parse(cached);
        // Only use if from today
        const today = new Date().toISOString().split('T')[0];
        if (data.date === today) {
          log.cache('INSTANT: Loaded cached daily responses from AsyncStorage');
          // Dispatch to update cache state
          Object.entries(data.responses || {}).forEach(([groupId, responses]) => {
            dispatch({ 
              type: actionTypes.SET_DAILY_RESPONSES, 
              payload: { groupId, responses, date: today } 
            });
          });
          return data.responses || {};
        } else {
          log.cache('Cached daily responses are from a different day, ignoring');
        }
      }
    } catch (error) {
      debugError('CACHE', 'Error loading cached daily responses:', error);
    }
    return {};
  }, [state.dailyResponsesCache]);

  // Save daily responses to AsyncStorage
  const saveCachedDailyResponses = useCallback(async (groupId, responses) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const existingRaw = await AsyncStorage.getItem(STORAGE_KEYS.CACHED_DAILY_RESPONSES);
      const existing = existingRaw ? JSON.parse(existingRaw) : { date: today, responses: {} };
      
      // Reset if from a different day
      if (existing.date !== today) {
        existing.date = today;
        existing.responses = {};
      }
      
      existing.responses[groupId] = responses;
      await AsyncStorage.setItem(STORAGE_KEYS.CACHED_DAILY_RESPONSES, JSON.stringify(existing));
      log.cache('Saved daily responses for group:', groupId);
    } catch (error) {
      debugError('CACHE', 'Error saving daily responses to AsyncStorage:', error);
    }
  }, []);

  // Load user profile with caching (AsyncStorage + Supabase)
  const loadUserProfile = useCallback(async (force = false) => {
    if (state.isGuest) return;
    
    try {
      const result = await getCurrentUserProfile();
      if (result.success) {
        dispatch({ type: actionTypes.SET_USER_PROFILE, payload: result.profile });
        // Save to AsyncStorage for instant display on next app launch
        await saveCachedProfile(result.profile);
      }
    } catch (error) {
      debugError('CACHE', 'Error loading user profile:', error);
    }
  }, [state.isGuest, saveCachedProfile]);

  // Load groups with stale-while-revalidate caching + AsyncStorage persistence
  const loadGroups = useCallback(async (force = false) => {
    if (state.isGuest) return [];
    
    // If no groups in state, try loading from AsyncStorage first for instant display
    if (state.groups.length === 0 && !force) {
      try {
        const cached = await AsyncStorage.getItem(STORAGE_KEYS.CACHED_GROUPS);
        if (cached) {
          const data = JSON.parse(cached);
          if (data.groups?.length > 0) {
            log.cache('INSTANT: Loading groups from AsyncStorage first');
            dispatch({ type: actionTypes.SET_GROUPS, payload: data.groups });
            // Continue to fetch fresh data in background (don't return yet)
          }
        }
      } catch (error) {
        debugError('CACHE', 'Error loading AsyncStorage groups:', error);
      }
    }
    
    const hasCachedData = state.groups.length > 0;
    const isFresh = isCacheFresh(state.groupsLastUpdated);
    
    // If cache is fresh and not forced, just return cached data
    if (!force && isFresh && hasCachedData) {
      log.cache('Using fresh cached groups data');
      return state.groups;
    }
    
    // If we have stale cached data, return it immediately and refresh in background
    if (hasCachedData && !force) {
      log.cache('Returning stale groups, refreshing in background...');
      
      // Background refresh (don't await)
      if (!state.groupsLoading) {
        (async () => {
          dispatch({ type: actionTypes.SET_GROUPS_LOADING, payload: true });
          try {
            const result = await getUserGroups();
            if (result.success) {
              dispatch({ type: actionTypes.SET_GROUPS, payload: result.groups });
              // Save to AsyncStorage for instant display on next app launch
              await saveCachedGroups(result.groups);
              log.cache('Background groups refresh complete');
            }
          } catch (error) {
            debugError('CACHE', 'Background groups refresh failed:', error);
          } finally {
            dispatch({ type: actionTypes.SET_GROUPS_LOADING, payload: false });
          }
        })();
      }
      
      return state.groups; // Return stale data immediately
    }
    
    // No cached data - must fetch synchronously (shows loading)
    if (state.groupsLoading) {
      log.cache('Groups already loading, skipping duplicate call');
      return state.groups;
    }
    
    dispatch({ type: actionTypes.SET_GROUPS_LOADING, payload: true });
    
    try {
      log.cache('Loading fresh groups data (no cache)...');
      const result = await getUserGroups();
      
      if (result.success) {
        dispatch({ type: actionTypes.SET_GROUPS, payload: result.groups });
        // Save to AsyncStorage for instant display on next app launch
        await saveCachedGroups(result.groups);
        return result.groups;
      } else {
        debugError('CACHE', 'Failed to load groups:', result.error);
        dispatch({ type: actionTypes.SET_GROUPS_LOADING, payload: false });
        return [];
      }
    } catch (error) {
      debugError('CACHE', 'Error loading groups:', error);
      dispatch({ type: actionTypes.SET_GROUPS_LOADING, payload: false });
      return [];
    }
  }, [state.isGuest, state.groupsLoading, state.groups, state.groupsLastUpdated, isCacheFresh, saveCachedGroups]);

  // Load group members with stale-while-revalidate caching
  const loadGroupMembers = useCallback(async (groupId, force = false) => {
    if (state.isGuest || !groupId) return [];
    
    const cached = state.groupMembersCache[groupId];
    const hasCachedData = cached && cached.members?.length > 0;
    const isFresh = cached && isCacheFresh(cached.lastUpdated, CACHE_EXPIRY.GROUP_MEMBERS);
    
    // If cache is fresh and not forced, return cached data
    if (!force && isFresh && hasCachedData) {
      log.cache('Using fresh cached members for group:', groupId);
      return cached.members;
    }
    
    // If we have stale cached data, return immediately and refresh in background
    if (hasCachedData && !force) {
      log.cache('Returning stale members, refreshing in background...');
      
      // Background refresh
      (async () => {
        try {
          const result = await getGroupMembers(groupId);
          if (result.success) {
            dispatch({ 
              type: actionTypes.SET_GROUP_MEMBERS, 
              payload: { groupId, members: result.members } 
            });
          }
        } catch (error) {
          debugError('CACHE', 'Background members refresh failed:', error);
        }
      })();
      
      return cached.members; // Return stale data immediately
    }
    
    // No cached data - fetch synchronously
    try {
      log.cache('Loading members for group (no cache):', groupId);
      const result = await getGroupMembers(groupId);
      
      if (result.success) {
        dispatch({ 
          type: actionTypes.SET_GROUP_MEMBERS, 
          payload: { groupId, members: result.members } 
        });
        return result.members;
      }
      return [];
    } catch (error) {
      debugError('CACHE', 'Error loading group members:', error);
      return [];
    }
  }, [state.isGuest, state.groupMembersCache, isCacheFresh]);

  // Load active meal request with caching
  const loadActiveMealRequest = useCallback(async (groupId, force = false) => {
    if (state.isGuest || !groupId) return null;
    
    const cached = state.activeMealRequestsCache[groupId];
    if (!force && cached && isCacheFresh(cached.lastUpdated, CACHE_EXPIRY.ACTIVE_REQUESTS)) {
      log.cache('Using cached meal request for group:', groupId);
      return cached;
    }
    
    try {
      log.cache('Loading active meal request for group:', groupId);
      const result = await getActiveMealRequest(groupId);
      
      if (result.success) {
        dispatch({ 
          type: actionTypes.SET_ACTIVE_MEAL_REQUEST, 
          payload: { 
            groupId, 
            request: result.request,
            hasActiveRequest: result.hasActiveRequest,
            mealOptions: result.request?.mealOptions || []
          } 
        });
        return result;
      }
      return { hasActiveRequest: false, request: null };
    } catch (error) {
      debugError('CACHE', 'Error loading active meal request:', error);
      return { hasActiveRequest: false, request: null };
    }
  }, [state.isGuest, state.activeMealRequestsCache, isCacheFresh]);

  // Load top voted meals with caching
  const loadTopMeals = useCallback(async (requestId, force = false) => {
    console.log('[TOP3-LOAD] loadTopMeals called with requestId:', requestId, 'force:', force, 'isGuest:', state.isGuest);
    if (state.isGuest || !requestId) {
      console.log('[TOP3-LOAD] SKIPPED - isGuest:', state.isGuest, 'requestId:', requestId);
      return [];
    }
    
    const cached = state.topMealsCache[requestId];
    if (!force && cached && isCacheFresh(cached.lastUpdated, CACHE_EXPIRY.TOP_MEALS)) {
      console.log('[TOP3-LOAD] Returning CACHED meals for request:', requestId, 'count:', cached.meals?.length);
      return cached.meals;
    }
    
    try {
      console.log('[TOP3-LOAD] Fetching FRESH top meals for request:', requestId);
      const result = await getTopVotedMeals(requestId);
      
      console.log('[TOP3-LOAD] Result:', result.success ? 'SUCCESS' : 'FAILED', 'meals:', result.topMeals?.length);
      if (result.success) {
        dispatch({ 
          type: actionTypes.SET_TOP_MEALS, 
          payload: { requestId, meals: result.topMeals } 
        });
        return result.topMeals;
      }
      return [];
    } catch (error) {
      console.error('[TOP3-LOAD] Error loading top meals:', error);
      return [];
    }
  }, [state.isGuest, state.topMealsCache, isCacheFresh]);

  // Load daily responses with caching + AsyncStorage persistence
  const loadDailyResponses = useCallback(async (groupId, force = false) => {
    if (state.isGuest || !groupId) return {};
    
    const today = new Date().toISOString().split('T')[0];
    const cached = state.dailyResponsesCache[groupId];
    
    // Check if cache is valid (same day and not expired)
    if (!force && cached && cached.date === today && isCacheFresh(cached.lastUpdated, CACHE_EXPIRY.DAILY_RESPONSES)) {
      log.cache('Using cached daily responses for group:', groupId);
      return cached.responses;
    }
    
    try {
      log.cache('Loading daily responses for group:', groupId);
      const { data, error } = await supabase
        .from('daily_responses')
        .select('user_id, response')
        .eq('group_id', groupId)
        .eq('response_date', today);

      if (error) {
        debugError('CACHE', 'Error loading daily responses:', error);
        return cached?.responses || {};
      }

      const responses = {};
      (data || []).forEach(r => {
        responses[r.user_id] = r.response;
      });
      
      dispatch({ 
        type: actionTypes.SET_DAILY_RESPONSES, 
        payload: { groupId, responses, date: today } 
      });
      
      // Save to AsyncStorage for instant display on next app launch
      await saveCachedDailyResponses(groupId, responses);
      
      return responses;
    } catch (error) {
      debugError('CACHE', 'Error loading daily responses:', error);
      return cached?.responses || {};
    }
  }, [state.isGuest, state.dailyResponsesCache, isCacheFresh, saveCachedDailyResponses]);

  // Update single response in cache (for optimistic updates)
  const updateCachedResponse = useCallback((groupId, userId, response) => {
    const today = new Date().toISOString().split('T')[0];
    dispatch({ 
      type: actionTypes.UPDATE_SINGLE_RESPONSE, 
      payload: { groupId, userId, response, date: today } 
    });
  }, []);

  // Load dinner requests with intelligent caching
  const loadDinnerRequests = useCallback(async (force = false) => {
    if (state.isGuest) return [];
    
    // Use cache if fresh and not forced
    if (!force && isCacheFresh(state.dinnerRequestsLastUpdated) && state.dinnerRequests.length >= 0) {
      log.cache('Using cached dinner requests data');
      return state.dinnerRequests;
    }
    
    if (state.dinnerRequestsLoading) {
      log.cache('Dinner requests already loading, skipping duplicate call');
      return state.dinnerRequests;
    }
    
    dispatch({ type: actionTypes.SET_DINNER_REQUESTS_LOADING, payload: true });
    
    try {
      log.cache('Loading fresh dinner requests data...');
      const result = await getAllDinnerRequests();
      
      if (result.success) {
        dispatch({ type: actionTypes.SET_DINNER_REQUESTS, payload: result.requests || [] });
        return result.requests || [];
      } else {
        debugError('CACHE', 'Failed to load dinner requests:', result.error);
        dispatch({ type: actionTypes.SET_DINNER_REQUESTS_LOADING, payload: false });
        return [];
      }
    } catch (error) {
      debugError('CACHE', 'Error loading dinner requests:', error);
      dispatch({ type: actionTypes.SET_DINNER_REQUESTS_LOADING, payload: false });
      return [];
    }
  }, [state.isGuest, state.dinnerRequestsLoading, state.dinnerRequests.length, state.dinnerRequestsLastUpdated, isCacheFresh]);

  // Load special occasions with caching
  const loadSpecialOccasions = useCallback(async (force = false) => {
    if (state.isGuest) return [];
    
    if (!force && isCacheFresh(state.specialOccasionsLastUpdated, CACHE_EXPIRY.SPECIAL_OCCASIONS)) {
      log.cache('Using cached special occasions');
      return state.specialOccasions;
    }
    
    if (state.specialOccasionsLoading) {
      return state.specialOccasions;
    }
    
    dispatch({ type: actionTypes.SET_SPECIAL_OCCASIONS_LOADING, payload: true });
    
    try {
      log.cache('Loading special occasions...');
      const result = await getMySpecialOccasions();
      
      if (result.success) {
        dispatch({ type: actionTypes.SET_SPECIAL_OCCASIONS, payload: result.occasions || [] });
        return result.occasions || [];
      } else {
        dispatch({ type: actionTypes.SET_SPECIAL_OCCASIONS_LOADING, payload: false });
        return [];
      }
    } catch (error) {
      debugError('CACHE', 'Error loading special occasions:', error);
      dispatch({ type: actionTypes.SET_SPECIAL_OCCASIONS_LOADING, payload: false });
      return [];
    }
  }, [state.isGuest, state.specialOccasionsLoading, state.specialOccasions, state.specialOccasionsLastUpdated, isCacheFresh]);

  // Update group optimistically
  const updateGroup = useCallback((groupData) => {
    dispatch({ type: actionTypes.UPDATE_GROUP, payload: groupData });
  }, []);

  // Add group optimistically
  const addGroup = useCallback((groupData) => {
    dispatch({ type: actionTypes.ADD_GROUP, payload: groupData });
  }, []);

  // Update dinner request optimistically
  const updateDinnerRequest = useCallback((requestData) => {
    dispatch({ type: actionTypes.UPDATE_DINNER_REQUEST, payload: requestData });
  }, []);

  // Remove dinner request optimistically
  const removeDinnerRequest = useCallback((requestId) => {
    dispatch({ type: actionTypes.REMOVE_DINNER_REQUEST, payload: requestId });
  }, []);

  // Add local response for immediate UI updates
  const addLocalResponse = useCallback((requestId, response) => {
    dispatch({ type: actionTypes.ADD_LOCAL_RESPONSE, payload: { requestId, response } });
  }, []);

  // Clear local response
  const clearLocalResponse = useCallback((requestId) => {
    dispatch({ type: actionTypes.CLEAR_LOCAL_RESPONSE, payload: requestId });
  }, []);

  // Invalidate specific cache
  const invalidateCache = useCallback((cacheTypes) => {
    dispatch({ type: actionTypes.INVALIDATE_CACHE, payload: cacheTypes });
  }, []);

  // Invalidate cache for a specific group
  const invalidateGroupCache = useCallback((groupId) => {
    dispatch({ type: actionTypes.INVALIDATE_GROUP_CACHE, payload: groupId });
  }, []);

  // Invalidate top meals cache to force fresh vote counts
  const invalidateTopMeals = useCallback(() => {
    dispatch({ type: actionTypes.INVALIDATE_CACHE, payload: ['topMeals'] });
  }, []);

  // Refresh all data
  const refreshAll = useCallback(async () => {
    log.cache('Refreshing all app data...');
    dispatch({ type: actionTypes.TRIGGER_REFRESH });
    dispatch({ type: actionTypes.INVALIDATE_CACHE, payload: ['all'] });
    
    if (!state.isGuest) {
      await Promise.all([
        loadGroups(true),
        loadDinnerRequests(true),
        loadUserProfile(true),
        loadSpecialOccasions(true)
      ]);
    }
  }, [state.isGuest, loadGroups, loadDinnerRequests, loadUserProfile, loadSpecialOccasions]);

  // Set current screen
  const setCurrentScreen = useCallback((screen) => {
    dispatch({ type: actionTypes.SET_CURRENT_SCREEN, payload: screen });
  }, []);

  // Set auth status
  const setGuestStatus = useCallback((isGuest) => {
    dispatch({ type: actionTypes.SET_GUEST_STATUS, payload: isGuest });
  }, []);

  // Set user
  const setUser = useCallback((user) => {
    dispatch({ type: actionTypes.SET_USER, payload: user });
  }, []);

  // Get cached group members (synchronous, for immediate UI display)
  const getCachedGroupMembers = useCallback((groupId) => {
    return state.groupMembersCache[groupId]?.members || null;
  }, [state.groupMembersCache]);

  // Get cached active meal request (synchronous)
  const getCachedActiveMealRequest = useCallback((groupId) => {
    return state.activeMealRequestsCache[groupId] || null;
  }, [state.activeMealRequestsCache]);

  // Get cached top meals (synchronous)
  const getCachedTopMeals = useCallback((requestId) => {
    return state.topMealsCache[requestId]?.meals || null;
  }, [state.topMealsCache]);

  // Get group overview (synchronous)
  const getGroupOverview = useCallback((groupId) => {
    return state.groupsOverview[groupId] || null;
  }, [state.groupsOverview]);

  // Get preloaded expansion data for a group (synchronous, for instant UI display)
  // Returns { members, responses, topMeals, mealRequest, recipeType } or null
  const getPreloadedExpansionData = useCallback((groupId) => {
    const data = state.preloadedExpansionData[groupId];
    if (!data) return null;
    
    // Check if data is stale (>2 min old)
    const isStale = state.preloadedExpansionTimestamp && 
                    (Date.now() - state.preloadedExpansionTimestamp) > 2 * 60 * 1000;
    
    return isStale ? null : data;
  }, [state.preloadedExpansionData, state.preloadedExpansionTimestamp]);

  // Check if preloaded data is available for instant expansion
  const hasPreloadedData = useCallback((groupId) => {
    return !!getPreloadedExpansionData(groupId);
  }, [getPreloadedExpansionData]);

  // Preload all group data (members, responses, active requests) for instant expansion
  // Uses batch loading for maximum efficiency - single parallel query for all groups
  const preloadAllGroupData = useCallback(async (groups) => {
    if (!groups || groups.length === 0) return;
    
    log.cache(`Batch preloading expansion data for ${groups.length} groups...`);
    
    try {
      // Use the efficient batch service that does all queries in parallel
      const result = await batchPreloadAllGroupData(groups);
      
      if (result.success && result.preloadedData) {
        // Store in context for instant access
        dispatch({ 
          type: actionTypes.SET_PRELOADED_EXPANSION_DATA, 
          payload: { data: result.preloadedData, timestamp: result.timestamp }
        });
        
        // ALSO save to AsyncStorage for instant loading on next app start
        try {
          const today = new Date().toISOString().split('T')[0];
          await AsyncStorage.setItem(STORAGE_KEYS.CACHED_EXPANSION_DATA, JSON.stringify({
            date: today,
            data: result.preloadedData,
            timestamp: result.timestamp
          }));
          log.cache('Saved expansion data to AsyncStorage for instant display');
        } catch (e) {
          // Ignore storage errors
        }
        
        // Also populate individual caches for backwards compatibility
        Object.entries(result.preloadedData).forEach(([groupId, data]) => {
          // Cache members
          if (data.members?.length > 0) {
            dispatch({ 
              type: actionTypes.SET_GROUP_MEMBERS, 
              payload: { groupId, members: data.members } 
            });
          }
          
          // Cache daily responses
          if (data.responses && Object.keys(data.responses).length > 0) {
            const today = new Date().toISOString().split('T')[0];
            dispatch({ 
              type: actionTypes.SET_DAILY_RESPONSES, 
              payload: { groupId, responses: data.responses, date: today } 
            });
          }
          
          // Cache meal request
          if (data.mealRequest) {
            dispatch({ 
              type: actionTypes.SET_ACTIVE_MEAL_REQUEST, 
              payload: { 
                groupId, 
                request: data.mealRequest,
                hasActiveRequest: true
              } 
            });
            
            // Cache top meals
            if (data.topMeals?.length > 0) {
              dispatch({ 
                type: actionTypes.SET_TOP_MEALS, 
                payload: { requestId: data.mealRequest.id, meals: sortTopMeals(data.topMeals) } 
              });
            }
          }
        });
        
        log.cache(`Batch preload complete: ${Object.keys(result.preloadedData).length} groups cached`);
      }
    } catch (error) {
      debugError('CACHE', 'Batch preload failed:', error);
    }
  }, []);

  // Load cached expansion data from AsyncStorage for INSTANT member/topMeals display
  const loadCachedExpansionData = useCallback(async () => {
    try {
      const cached = await AsyncStorage.getItem(STORAGE_KEYS.CACHED_EXPANSION_DATA);
      if (cached) {
        const data = JSON.parse(cached);
        const today = new Date().toISOString().split('T')[0];
        
        // Only use if from today and not too old (< 30 min)
        if (data.date === today && data.data && data.timestamp) {
          const age = Date.now() - data.timestamp;
          if (age < 30 * 60 * 1000) { // 30 minutes
            log.cache('INSTANT: Loaded cached expansion data from AsyncStorage');
            dispatch({ 
              type: actionTypes.SET_PRELOADED_EXPANSION_DATA, 
              payload: { data: data.data, timestamp: data.timestamp }
            });
            return data.data;
          } else {
            log.cache('Cached expansion data too old, will refresh');
          }
        }
      }
    } catch (error) {
      // Ignore errors
    }
    return null;
  }, []);

  // Load cached recipes from AsyncStorage for INSTANT Ideas page display
  const loadCachedRecipes = useCallback(async () => {
    try {
      const cached = await AsyncStorage.getItem(STORAGE_KEYS.CACHED_RECIPES);
      if (cached) {
        const data = JSON.parse(cached);
        
        // Only use if not too old (< 1 hour)
        if (data.recipes && data.timestamp) {
          const age = Date.now() - data.timestamp;
          if (age < CACHE_EXPIRY.RECIPES) {
            log.cache('INSTANT: Loaded', data.recipes.length, 'cached recipes from AsyncStorage');
            dispatch({ 
              type: actionTypes.SET_CACHED_RECIPES, 
              payload: { recipes: data.recipes, timestamp: data.timestamp }
            });
            return data.recipes;
          } else {
            log.cache('Cached recipes too old, will refresh');
          }
        }
      }
    } catch (error) {
      // Ignore errors
    }
    return null;
  }, []);

  // Save recipes to AsyncStorage cache
  const saveCachedRecipes = useCallback(async (recipes) => {
    try {
      const timestamp = Date.now();
      await AsyncStorage.setItem(STORAGE_KEYS.CACHED_RECIPES, JSON.stringify({
        recipes,
        timestamp
      }));
      dispatch({ 
        type: actionTypes.SET_CACHED_RECIPES, 
        payload: { recipes, timestamp }
      });
      log.cache('Saved', recipes.length, 'recipes to AsyncStorage cache');
    } catch (error) {
      debugError('CACHE', 'Error saving cached recipes:', error);
    }
  }, []);

  // Fast-load dashboard data using optimized single-query SQL function
  // This loads profile, groups, members, responses, meal requests, and top meals in one query
  const fastLoadDashboard = useCallback(async () => {
    log.cache('FAST-LOAD: Attempting optimized single-query dashboard load...');
    
    try {
      const result = await loadUserDashboardData();
      
      if (!result.success) {
        log.cache('FAST-LOAD: RPC not available, falling back to individual queries');
        return null;
      }
      
      log.cache('FAST-LOAD: Dashboard data received', {
        hasProfile: !!result.profile,
        groupCount: result.groups?.length || 0
      });
      
      // Dispatch profile
      if (result.profile) {
        dispatch({ type: actionTypes.SET_USER_PROFILE, payload: result.profile });
        
        // Also save to AsyncStorage cache
        try {
          await AsyncStorage.setItem(STORAGE_KEYS.CACHED_PROFILE, JSON.stringify({
            profile: result.profile,
            timestamp: Date.now()
          }));
        } catch (e) {}
      }
      
      // Transform groups to match expected format and dispatch
      const groups = (result.groups || []).map(g => ({
        id: g.group_id,
        group_id: g.group_id,
        name: g.name,
        description: g.description,
        join_code: g.join_code,
        created_by: g.created_by,
        is_main_group: g.is_main_group,
        created_at: g.created_at
      }));
      
      dispatch({ type: actionTypes.SET_GROUPS, payload: groups });
      
      // Build preloaded expansion data from the dashboard response
      const preloadedData = {};
      const today = new Date().toISOString().split('T')[0];
      const timestamp = Date.now();
      
      const isTodayDate = (dateStr) => {
        if (!dateStr) return false;
        const d = new Date(dateStr);
        const now = new Date();
        return d.getFullYear() === now.getFullYear() &&
          d.getMonth() === now.getMonth() &&
          d.getDate() === now.getDate();
      };

      (result.groups || []).forEach(g => {
        const groupId = g.group_id;
        
        const mealRequestIsFromToday = g.active_meal_request && isTodayDate(g.active_meal_request.created_at);
        
        preloadedData[groupId] = {
          members: g.members || [],
          responses: g.today_responses || {},
          mealRequest: mealRequestIsFromToday ? g.active_meal_request : null,
          topMeals: mealRequestIsFromToday ? sortTopMeals(g.top_meals || []) : [],
          recipeType: mealRequestIsFromToday ? g.active_meal_request?.recipe_type : null,
          timestamp: timestamp
        };
        
        // Also dispatch to individual caches for backwards compatibility
        if (g.members?.length > 0) {
          dispatch({ 
            type: actionTypes.SET_GROUP_MEMBERS, 
            payload: { groupId, members: g.members } 
          });
        }
        
        if (g.today_responses && Object.keys(g.today_responses).length > 0) {
          dispatch({ 
            type: actionTypes.SET_DAILY_RESPONSES, 
            payload: { groupId, responses: g.today_responses, date: today } 
          });
        }
        
        if (mealRequestIsFromToday) {
          dispatch({ 
            type: actionTypes.SET_ACTIVE_MEAL_REQUEST, 
            payload: { 
              groupId, 
              request: g.active_meal_request,
              hasActiveRequest: true
            } 
          });
          
          if (g.top_meals?.length > 0) {
            dispatch({ 
              type: actionTypes.SET_TOP_MEALS, 
              payload: { requestId: g.active_meal_request.id, meals: sortTopMeals(g.top_meals) } 
            });
          }
        }
      });
      
      // Store preloaded expansion data
      dispatch({ 
        type: actionTypes.SET_PRELOADED_EXPANSION_DATA, 
        payload: { data: preloadedData, timestamp }
      });
      
      // Save to AsyncStorage for next app start
      try {
        await AsyncStorage.setItem(STORAGE_KEYS.CACHED_EXPANSION_DATA, JSON.stringify({
          date: today,
          data: preloadedData,
          timestamp
        }));
      } catch (e) {}
      
      log.cache('FAST-LOAD: Complete! All data cached and dispatched');
      return groups;
      
    } catch (error) {
      debugError('CACHE', 'FAST-LOAD: Error:', error);
      return null;
    }
  }, []);

  // Initial data load when auth status changes
  useEffect(() => {
    if (!state.isGuest && !initialLoadPerformed.current) {
      initialLoadPerformed.current = true;
      
      log.cache('Initial app data load with INSTANT cached display...');
      
      // STEP 1: Load ALL cached data for INSTANT display (parallel, no network)
      Promise.all([
        loadCachedProfile(),
        loadCachedExpansionData(), // Load cached members/topMeals for instant expansion
        loadCachedRecipes()        // Load cached recipes for instant Ideas page
      ]).catch(() => {}); // Ignore cache load errors
      
      // STEP 2: Try fast-load first (single optimized query), fall back to individual queries
      (async () => {
        // Try fast-load first
        const fastLoadResult = await fastLoadDashboard();
        
        if (fastLoadResult) {
          // Fast-load succeeded! Just need to load remaining data
          
          // Load remaining data that's not in fast-load
          await Promise.all([
            loadDinnerRequests(),
            loadSpecialOccasions()
          ]);
          
          dispatch({ type: actionTypes.SET_INITIAL_LOAD_COMPLETE, payload: true });
          log.cache('FAST-LOAD path complete');
        } else {
          // Fast-load failed or not available, use traditional parallel loading
          const [groups] = await Promise.all([
        loadGroups(),
        loadDinnerRequests(),
        loadUserProfile(),
        loadSpecialOccasions()
          ]);
          
        dispatch({ type: actionTypes.SET_INITIAL_LOAD_COMPLETE, payload: true });
        
        // Preload all group data (members, responses, active requests) in background
        if (groups && groups.length > 0) {
          await preloadAllGroupData(groups);
        }
          log.cache('Traditional load path complete');
        }
        
        // Push notifications disabled for now (was causing slowdowns)
        // initializeNotifications().then(result => {
        //   if (result.success) {
        //     log.cache('Push notifications initialized, token:', result.token?.substring(0, 20) + '...');
        //   } else {
        //     log.cache('Push notifications not available:', result.error);
        //   }
        // }).catch(error => {
        //   debugError('NOTIFICATIONS', 'Failed to initialize:', error);
        // });
      })();
    }
  }, [state.isGuest, loadGroups, loadDinnerRequests, loadUserProfile, loadSpecialOccasions, preloadAllGroupData, loadCachedProfile, loadCachedExpansionData, loadCachedRecipes, fastLoadDashboard]);

  // Reset initial load flag when switching to guest
  useEffect(() => {
    if (state.isGuest) {
      initialLoadPerformed.current = false;
    }
  }, [state.isGuest]);

  // Context value
  const value = {
    // State
    ...state,
    
    // Actions - loading
    loadGroups,
    loadGroupMembers,
    loadActiveMealRequest,
    loadTopMeals,
    loadDailyResponses,
    loadDinnerRequests,
    loadUserProfile,
    loadSpecialOccasions,
    
    // Actions - updates
    updateGroup,
    addGroup,
    updateDinnerRequest,
    removeDinnerRequest,
    addLocalResponse,
    clearLocalResponse,
    updateCachedResponse,
    invalidateCache,
    invalidateGroupCache,
    invalidateTopMeals,
    refreshAll,
    setCurrentScreen,
    setGuestStatus,
    setUser,
    
    // Getters (synchronous cache access)
    getCachedGroupMembers,
    getCachedActiveMealRequest,
    getCachedTopMeals,
    getCachedDailyResponses: (groupId) => state.dailyResponsesCache[groupId]?.responses || null,
    getGroupOverview,
    getPreloadedExpansionData,
    hasPreloadedData,
    
    // Preloading
    preloadAllGroupData,
    
    // Recipe caching
    loadCachedRecipes,
    saveCachedRecipes,
    
    // Utilities
    isCacheFresh,
    checkDateChange,
  };

  return (
    <AppStateContext.Provider value={value}>
      {children}
    </AppStateContext.Provider>
  );
};

// Custom hook to use the context
export const useAppState = () => {
  const context = useContext(AppStateContext);
  if (!context) {
    throw new Error('useAppState must be used within an AppStateProvider');
  }
  return context;
};

// Higher-order component for automatic data loading
export const withAutoRefresh = (WrappedComponent, dataTypes = []) => {
  return function WithAutoRefreshComponent(props) {
    const { loadGroups, loadDinnerRequests, loadSpecialOccasions, refreshTrigger } = useAppState();
    
    useEffect(() => {
      if (dataTypes.includes('groups')) {
        loadGroups();
      }
      if (dataTypes.includes('dinnerRequests')) {
        loadDinnerRequests();
      }
      if (dataTypes.includes('specialOccasions')) {
        loadSpecialOccasions();
      }
    }, [refreshTrigger, loadGroups, loadDinnerRequests, loadSpecialOccasions]);
    
    return <WrappedComponent {...props} />;
  };
};
