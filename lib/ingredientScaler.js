/**
 * Ingredient Scaler - Parse and scale ingredient strings based on serving count
 */

// Words that indicate an ingredient should NOT be scaled
const NO_SCALE_WORDS = [
  'peper', 'zout', 'optioneel', 'scheut', 'snuf', 'handvol', 'klontje',
  'naar keuze', 'naar smaak', 'wat', 'beetje',
];

/**
 * Parse a number from a string, supporting fractions and decimals
 * "1/2" → 0.5, "1,5" → 1.5, "3" → 3
 */
function parseNumber(str) {
  if (str.includes('/')) {
    const [num, den] = str.split('/').map(Number);
    return den ? num / den : num;
  }
  return parseFloat(str.replace(',', '.'));
}

/**
 * Format a scaled number nicely
 * 1 → "1", 1.5 → "1,5", 0.333 → "⅓", 2.0 → "2"
 */
function formatNumber(n) {
  if (Number.isNaN(n) || n <= 0) return '';

  // Common fractions
  const frac = n % 1;
  const whole = Math.floor(n);

  if (Math.abs(frac) < 0.05) return String(whole);
  if (Math.abs(frac - 0.25) < 0.05) return whole ? `${whole}¼` : '¼';
  if (Math.abs(frac - 0.33) < 0.05) return whole ? `${whole}⅓` : '⅓';
  if (Math.abs(frac - 0.5) < 0.05) return whole ? `${whole}½` : '½';
  if (Math.abs(frac - 0.67) < 0.05) return whole ? `${whole}⅔` : '⅔';
  if (Math.abs(frac - 0.75) < 0.05) return whole ? `${whole}¾` : '¾';

  // Round to 1 decimal
  const rounded = Math.round(n * 10) / 10;
  if (rounded === Math.floor(rounded)) return String(Math.floor(rounded));
  return String(rounded).replace('.', ',');
}

/**
 * Scale a single ingredient string
 * "400g spaghetti" with ratio 2 → "800g spaghetti"
 * "Peper en zout" → "Peper en zout" (unchanged)
 */
export function scaleIngredient(ingredient, defaultServings, targetServings) {
  if (!ingredient || defaultServings === targetServings) return ingredient;

  const lower = ingredient.toLowerCase();

  // Don't scale non-quantifiable ingredients
  if (NO_SCALE_WORDS.some(w => lower.startsWith(w) || lower.includes(w))) {
    return ingredient;
  }

  // Match leading number (with optional fraction or decimal)
  // Examples: "6 eieren", "400g pasta", "1/2 tl komijn", "1,5L melk"
  const match = ingredient.match(/^(\d+[\.,]?\d*(?:\/\d+)?)\s*(.*)/);
  if (!match) return ingredient;

  const originalNum = parseNumber(match[1]);
  if (Number.isNaN(originalNum)) return ingredient;

  const ratio = targetServings / defaultServings;
  const scaled = originalNum * ratio;

  return `${formatNumber(scaled)} ${match[2]}`;
}

/**
 * Scale all ingredients in an array
 */
export function scaleIngredients(ingredients, defaultServings, targetServings) {
  if (!ingredients || !Array.isArray(ingredients)) return ingredients;
  return ingredients.map(i =>
    typeof i === 'string'
      ? scaleIngredient(i, defaultServings, targetServings)
      : i
  );
}
