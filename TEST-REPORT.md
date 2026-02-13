# Happie Dinner – Test Report

**Date:** February 11, 2026  
**Scope:** Speed, functionality, and service layer tests

---

## Build & bundle

| Test | Result | Details |
|------|--------|---------|
| iOS bundle export | Pass | 1,129 modules in ~17s |
| Bundle size | ~3.5 MB | `index.hbc` |
| Metro bundler | OK | No compilation errors |

---

## Unit tests (Jest)

Run: `npm test`

| Suite | Tests | Status |
|-------|-------|--------|
| Supabase | 1 | All pass |
| groupsService | 2 | All pass |
| mealRequestService | 4 | All pass |
| dailyResponseService | 1 | All pass |
| dinnerRequestService | 1 | All pass |
| specialOccasionService | 1 | All pass |
| recipesService | 1 | All pass |
| wishlistService | 1 | All pass |
| batchDataService | 1 | All pass |
| **Total** | **13** | **All pass** |

---

## Coverage by function

- **Supabase:** Exports, mock mode when env empty
- **Groups:** create, join, leave, getUserGroups, getGroupMembers
- **Meal voting:** createMealRequest, getActiveMealRequest, getTopVotedMeals, voteMealOption
- **Daily responses:** setMyResponseToday, getGroupResponsesToday
- **Dinner requests:** save, getAll, recordUserResponse, getGroupMemberResponses
- **Special occasions:** create, getMyOccasions, respond, leave, meal options/voting
- **Recipes:** getRandomRecipes
- **Wishlist:** getUserWishlist
- **Batch load:** loadUserDashboardData (mock mode)

---

## Manual testing checklist

Run the app with `npm start` and verify:

- [ ] Sign-in screen → auto-navigate with mock user
- [ ] Groups tab → create/join group, daily Yes/No toggle
- [ ] Start voting → swipe meals, Top 3 updates
- [ ] Special occasions → create occasion, respond, occasion voting
- [ ] Ideas tab → recipes list, wishlist add/remove
- [ ] Profile tab → settings, send dinner request (mock)
- [ ] With real Supabase (.env filled) → same flows against the database

---

## Commands

```bash
npm test          # Run Jest tests
npm test:watch    # Run tests in watch mode
npm start         # Start Expo dev server
npx expo export --platform ios   # Production bundle check
```
