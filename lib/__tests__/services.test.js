/**
 * Service smoke and functional tests
 */

// Mock env before any imports
process.env.EXPO_PUBLIC_SUPABASE_URL = '';
process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = '';

describe('Supabase', () => {
  it('exports supabase and USE_REAL_SUPABASE', () => {
    const { supabase, USE_REAL_SUPABASE } = require('../supabase');
    expect(typeof supabase).toBe('object');
    expect(typeof USE_REAL_SUPABASE).toBe('boolean');
    expect(USE_REAL_SUPABASE).toBe(false);
  });
});

describe('groupsService', () => {
  it('exports required functions', () => {
    const g = require('../groupsService');
    expect(typeof g.createGroupInSupabase).toBe('function');
    expect(typeof g.joinGroupByCode).toBe('function');
    expect(typeof g.leaveGroup).toBe('function');
    expect(typeof g.getUserGroups).toBe('function');
    expect(typeof g.getGroupMembers).toBe('function');
  });

  it('getUserGroups returns array-like', async () => {
    const { getUserGroups } = require('../groupsService');
    const res = await getUserGroups();
    expect(Array.isArray(res) || (res?.groups && Array.isArray(res.groups))).toBe(true);
  });
});

describe('mealRequestService', () => {
  it('exports required functions', () => {
    const m = require('../mealRequestService');
    expect(typeof m.createMealRequest).toBe('function');
    expect(typeof m.getActiveMealRequest).toBe('function');
    expect(typeof m.getTopVotedMeals).toBe('function');
    expect(typeof m.voteMealOption).toBe('function');
    expect(typeof m.getMealOptions).toBe('function');
  });

  it('getActiveMealRequest returns expected shape', async () => {
    const { getActiveMealRequest } = require('../mealRequestService');
    const res = await getActiveMealRequest('test-id');
    expect(res).toBeDefined();
    expect(typeof res.hasActiveRequest).toBe('boolean');
  });

  it('getTopVotedMeals returns topMeals array', async () => {
    const { getTopVotedMeals } = require('../mealRequestService');
    const res = await getTopVotedMeals('test-id');
    expect(res).toBeDefined();
    expect(Array.isArray(res?.topMeals) || res?.success).toBe(true);
  });

  it('createMealRequest returns success and mealOptions', async () => {
    const { createMealRequest } = require('../mealRequestService');
    const res = await createMealRequest('test-group', 3);
    expect(res.success).toBe(true);
    expect(res.mealOptions).toBeDefined();
    expect(Array.isArray(res.mealOptions)).toBe(true);
  });
});

describe('dailyResponseService', () => {
  it('exports setMyResponseToday and getGroupResponsesToday', () => {
    const d = require('../dailyResponseService');
    expect(typeof d.setMyResponseToday).toBe('function');
    expect(typeof d.getGroupResponsesToday).toBe('function');
  });
});

describe('dinnerRequestService', () => {
  it('exports required functions', () => {
    const d = require('../dinnerRequestService');
    expect(typeof d.saveDinnerRequest).toBe('function');
    expect(typeof d.getAllDinnerRequests).toBe('function');
    expect(typeof d.recordUserResponse).toBe('function');
    expect(typeof d.getGroupMemberResponses).toBe('function');
  });
});

describe('specialOccasionService', () => {
  it('exports required functions', () => {
    const s = require('../specialOccasionService');
    expect(typeof s.createSpecialOccasion).toBe('function');
    expect(typeof s.getMySpecialOccasions).toBe('function');
    expect(typeof s.respondToOccasion).toBe('function');
    expect(typeof s.getOccasionMealOptions).toBe('function');
    expect(typeof s.getOccasionTopMeals).toBe('function');
  });
});

describe('recipesService', () => {
  it('getRandomRecipes returns array', async () => {
    const { getRandomRecipes } = require('../recipesService');
    const res = await getRandomRecipes(5);
    expect(Array.isArray(res)).toBe(true);
  });
});

describe('wishlistService', () => {
  it('getUserWishlist returns success and wishlist', async () => {
    const { getUserWishlist } = require('../wishlistService');
    const res = await getUserWishlist();
    expect(res.success).toBe(true);
    expect(Array.isArray(res.wishlist)).toBe(true);
  });
});

describe('batchDataService', () => {
  it('loadUserDashboardData returns success', async () => {
    const { loadUserDashboardData } = require('../batchDataService');
    const res = await loadUserDashboardData();
    expect(res.success).toBe(true);
    expect(res.profile).toBeDefined();
    expect(res.groups).toBeDefined();
  });
});
