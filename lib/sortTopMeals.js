/**
 * Stable sort for top meals: votes DESC, then name ASC, then ID for full determinism.
 * Shared across AppStateContext, batchDataService, and GroupsScreenSimple.
 */
export const sortTopMeals = (meals) => {
  if (!Array.isArray(meals) || meals.length <= 1) return meals;
  return [...meals].sort((a, b) => {
    const votesA = a.yes_votes ?? a.vote_total ?? 0;
    const votesB = b.yes_votes ?? b.vote_total ?? 0;
    if (votesB !== votesA) return votesB - votesA;
    const nameA = (a.meal_data?.name || '').toLowerCase();
    const nameB = (b.meal_data?.name || '').toLowerCase();
    const nameCmp = nameA.localeCompare(nameB);
    if (nameCmp !== 0) return nameCmp;
    const idA = a.meal_option_id || a.option_id || '';
    const idB = b.meal_option_id || b.option_id || '';
    return idA < idB ? -1 : idA > idB ? 1 : 0;
  });
};
