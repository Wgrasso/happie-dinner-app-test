/**
 * Recipe URL Importer
 *
 * Fetches a recipe webpage and extracts structured recipe data so it can
 * pre-fill the "New Recipe" form.
 *
 * Three-tier cascade, cheapest first:
 *   1. Direct fetch + JSON-LD schema.org Recipe parsing (free, works on ~60%
 *      of sites — BBC Good Food, Food Network, LeukeRecepten, etc.)
 *   2. Spoonacular /recipes/extract API (150 free calls/day, purpose-built
 *      for recipe extraction, covers most major English recipe sites).
 *   3. ScrapingBee residential proxy → raw HTML → JSON-LD parser (handles
 *      Cloudflare-protected sites like AH.nl, Jumbo.com, AllRecipes).
 *
 * Returns a normalized shape ready for `addUserRecipe`:
 *   {
 *     name, description, image,
 *     cooking_time_minutes, cuisine_type,
 *     ingredients: string[], steps: string[],
 *     source_url
 *   }
 */

const FETCH_TIMEOUT_MS = 15000;
const SCRAPINGBEE_TIMEOUT_MS = 60000;

const SPOONACULAR_KEY = process.env.EXPO_PUBLIC_SPOONACULAR_API_KEY || '';
const SCRAPINGBEE_KEY = process.env.EXPO_PUBLIC_SCRAPINGBEE_API_KEY || '';

/* ──────────────────────────────────────────────
   Parsers / coercers
   ────────────────────────────────────────────── */

/** Parse ISO 8601 duration ("PT1H30M", "PT45M") → minutes. */
export const parseIsoDuration = (iso) => {
  if (!iso || typeof iso !== 'string') return null;
  const match = iso.match(/^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/i);
  if (!match) return null;
  const [, h, m, s] = match;
  const total =
    parseInt(h || '0', 10) * 60 +
    parseInt(m || '0', 10) +
    Math.round(parseInt(s || '0', 10) / 60);
  return total > 0 ? total : null;
};

/** Coerce schema.org image field (string | array | ImageObject) → URL string. */
const coerceImage = (img) => {
  if (!img) return null;
  if (typeof img === 'string') return img;
  if (Array.isArray(img)) return coerceImage(img[0]);
  if (typeof img === 'object') return img.url || img['@id'] || null;
  return null;
};

/** Coerce cuisine field to a simple string. */
const coerceCuisine = (c) => {
  if (!c) return null;
  if (typeof c === 'string') return c;
  if (Array.isArray(c)) return typeof c[0] === 'string' ? c[0] : null;
  return null;
};

/** Decode basic HTML entities and strip any inline tags. */
const decodeEntities = (s) => {
  if (s == null) return s;
  return String(s)
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&rsquo;/gi, "'")
    .replace(/&lsquo;/gi, "'")
    .replace(/&ldquo;/gi, '"')
    .replace(/&rdquo;/gi, '"')
    .replace(/\s+/g, ' ')
    .trim();
};

/** Coerce recipeIngredient → string[]. */
const coerceIngredients = (ing) => {
  if (!ing) return [];
  const arr = Array.isArray(ing) ? ing : [ing];
  return arr
    .map((i) => (typeof i === 'string' ? i : i?.text || i?.name || ''))
    .map(decodeEntities)
    .filter(Boolean);
};

/** Coerce recipeInstructions → string[]. Handles HowToStep, HowToSection, plain strings. */
const coerceSteps = (ins) => {
  if (!ins) return [];

  // Plain string: split on newlines or numbered list prefixes.
  if (typeof ins === 'string') {
    return ins
      .split(/\r?\n+|(?=\s\d+\.\s)/)
      .map((s) => s.replace(/^\s*\d+\.\s*/, ''))
      .map(decodeEntities)
      .filter(Boolean);
  }

  if (!Array.isArray(ins)) return [];

  const flat = [];
  for (const item of ins) {
    if (typeof item === 'string') {
      flat.push(item);
      continue;
    }
    if (!item || typeof item !== 'object') continue;

    const type = item['@type'];
    const isSection =
      type === 'HowToSection' ||
      (Array.isArray(type) && type.includes('HowToSection'));

    if (isSection && Array.isArray(item.itemListElement)) {
      for (const sub of item.itemListElement) {
        if (typeof sub === 'string') flat.push(sub);
        else if (sub?.text) flat.push(sub.text);
        else if (sub?.name) flat.push(sub.name);
      }
    } else if (item.text) {
      flat.push(item.text);
    } else if (item.name) {
      flat.push(item.name);
    }
  }

  return flat.map(decodeEntities).filter(Boolean);
};

/* ──────────────────────────────────────────────
   HTML parsing
   ────────────────────────────────────────────── */

/** Walk a JSON-LD value and return the first Recipe node found. Handles @graph. */
const findRecipeNode = (obj) => {
  if (!obj || typeof obj !== 'object') return null;

  const type = obj['@type'];
  const isRecipe =
    type === 'Recipe' || (Array.isArray(type) && type.includes('Recipe'));
  if (isRecipe) return obj;

  if (Array.isArray(obj)) {
    for (const item of obj) {
      const found = findRecipeNode(item);
      if (found) return found;
    }
    return null;
  }

  if (Array.isArray(obj['@graph'])) {
    const found = findRecipeNode(obj['@graph']);
    if (found) return found;
  }

  for (const key of Object.keys(obj)) {
    if (key === '@graph') continue;
    const val = obj[key];
    if (val && typeof val === 'object') {
      const found = findRecipeNode(val);
      if (found) return found;
    }
  }
  return null;
};

/** Extract all <script type="application/ld+json"> blocks as parsed JSON. */
const extractJsonLdBlocks = (html) => {
  const re =
    /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  const blocks = [];
  for (const match of html.matchAll(re)) {
    const raw = (match[1] || '').trim();
    if (!raw) continue;
    try {
      blocks.push(JSON.parse(raw));
    } catch {
      // Some sites embed trailing whitespace / comments. Try to salvage.
      try {
        const cleaned = raw.replace(/^[^{\[]*/, '').replace(/[^}\]]*$/, '');
        blocks.push(JSON.parse(cleaned));
      } catch {
        // skip this block
      }
    }
  }
  return blocks;
};

/** Extract OpenGraph / Twitter / basic meta tag content. */
const extractMeta = (html, key) => {
  const patterns = [
    new RegExp(
      `<meta[^>]+property=["']${key}["'][^>]+content=["']([^"']+)["']`,
      'i',
    ),
    new RegExp(
      `<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${key}["']`,
      'i',
    ),
    new RegExp(
      `<meta[^>]+name=["']${key}["'][^>]+content=["']([^"']+)["']`,
      'i',
    ),
    new RegExp(
      `<meta[^>]+content=["']([^"']+)["'][^>]+name=["']${key}["']`,
      'i',
    ),
  ];
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match && match[1]) return decodeEntities(match[1]);
  }
  return null;
};

/* ──────────────────────────────────────────────
   Fetch
   ────────────────────────────────────────────── */

/** Fetch raw HTML with a timeout. No bot-bypass — for sites that are open. */
const fetchHtmlDirect = async (url) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
        Accept:
          'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.text();
  } finally {
    clearTimeout(timeoutId);
  }
};

/**
 * Fetch raw HTML via ScrapingBee with residential proxy + JS rendering.
 * Handles Cloudflare-protected sites (AH.nl, Jumbo, AllRecipes).
 * Costs ~10-25 credits per call on the free 1000/month tier.
 */
const fetchHtmlViaScrapingBee = async (targetUrl) => {
  if (!SCRAPINGBEE_KEY) throw new Error('ScrapingBee key not configured');
  const params = new URLSearchParams({
    api_key: SCRAPINGBEE_KEY,
    url: targetUrl,
    premium_proxy: 'true',
    render_js: 'true',
    country_code: 'nl',
  });
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), SCRAPINGBEE_TIMEOUT_MS);
  try {
    const res = await fetch(`https://app.scrapingbee.com/api/v1/?${params}`, {
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`ScrapingBee HTTP ${res.status}`);
    return await res.text();
  } finally {
    clearTimeout(timeoutId);
  }
};

/** Parse HTML → normalized recipe via JSON-LD. Returns null if no Recipe found. */
const parseHtmlForRecipe = (html, sourceUrl) => {
  const blocks = extractJsonLdBlocks(html);
  let node = null;
  for (const b of blocks) {
    node = findRecipeNode(b);
    if (node) break;
  }
  if (!node) return null;

  const totalMin =
    parseIsoDuration(node.totalTime) ||
    parseIsoDuration(node.cookTime) ||
    parseIsoDuration(node.prepTime);

  return {
    name: decodeEntities(node.name) || null,
    description: decodeEntities(node.description) || null,
    image: coerceImage(node.image),
    cooking_time_minutes: totalMin || null,
    cuisine_type: coerceCuisine(node.recipeCuisine),
    ingredients: coerceIngredients(node.recipeIngredient || node.ingredients),
    steps: coerceSteps(node.recipeInstructions),
    source_url: sourceUrl,
  };
};

/** Parse HTML → OG meta fallback (title + description + image only). */
const parseHtmlForOg = (html, sourceUrl) => {
  const ogTitle =
    extractMeta(html, 'og:title') || extractMeta(html, 'twitter:title');
  const ogDesc =
    extractMeta(html, 'og:description') || extractMeta(html, 'description');
  const ogImage =
    extractMeta(html, 'og:image') || extractMeta(html, 'twitter:image');
  if (!ogTitle && !ogImage) return null;
  return {
    name: ogTitle,
    description: ogDesc,
    image: ogImage,
    cooking_time_minutes: null,
    cuisine_type: null,
    ingredients: [],
    steps: [],
    source_url: sourceUrl,
  };
};

/** Strip HTML tags from a string (for Spoonacular summary/instructions). */
const stripTags = (s) => decodeEntities(s);

/**
 * Spoonacular /recipes/extract — purpose-built recipe extraction API.
 * Free tier: 150 calls/day. Works on most major English recipe sites.
 * Returns normalized recipe shape or null on failure / low-confidence result.
 */
const fetchViaSpoonacular = async (targetUrl) => {
  if (!SPOONACULAR_KEY) return null;
  const params = new URLSearchParams({
    apiKey: SPOONACULAR_KEY,
    url: targetUrl,
    forceExtraction: 'true',
    analyze: 'false',
  });
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  let data;
  try {
    const res = await fetch(
      `https://api.spoonacular.com/recipes/extract?${params}`,
      { signal: controller.signal },
    );
    if (!res.ok) return null;
    data = await res.json();
  } catch {
    return null;
  } finally {
    clearTimeout(timeoutId);
  }

  // Ingredients
  const ingredients = Array.isArray(data.extendedIngredients)
    ? data.extendedIngredients
        .map((i) => (i?.original || i?.originalString || i?.name || '').trim())
        .filter(Boolean)
    : [];

  // Instructions: prefer analyzedInstructions (structured), fall back to
  // the instructions HTML blob.
  let steps = [];
  if (Array.isArray(data.analyzedInstructions)) {
    for (const section of data.analyzedInstructions) {
      if (Array.isArray(section?.steps)) {
        for (const step of section.steps) {
          const text = (step?.step || '').trim();
          if (text) steps.push(text);
        }
      }
    }
  }
  if (steps.length === 0 && typeof data.instructions === 'string') {
    steps = data.instructions
      .split(/\r?\n+|(?=\s\d+\.\s)/)
      .map((s) => stripTags(s.replace(/^\s*\d+\.\s*/, '')))
      .filter(Boolean);
  }

  // Spoonacular sometimes returns an error-page title like "Page Not Found"
  // when the source page didn't actually have recipe data. Require at least
  // one of the core signals to avoid returning garbage.
  const confident =
    (data.readyInMinutes && data.readyInMinutes > 0) ||
    ingredients.length >= 3 ||
    steps.length >= 2;
  if (!confident) return null;

  return {
    name: data.title || null,
    description: data.summary ? stripTags(data.summary).slice(0, 500) : null,
    image: data.image || null,
    cooking_time_minutes: data.readyInMinutes || null,
    cuisine_type:
      Array.isArray(data.cuisines) && data.cuisines.length > 0
        ? data.cuisines[0]
        : null,
    ingredients,
    steps,
    source_url: targetUrl,
  };
};

/* ──────────────────────────────────────────────
   Public API
   ────────────────────────────────────────────── */

/**
 * Import a recipe from a URL.
 *
 * @param {string} rawUrl - The recipe page URL.
 * @returns {Promise<{
 *   success: boolean,
 *   recipe?: {
 *     name: string|null,
 *     description: string|null,
 *     image: string|null,
 *     cooking_time_minutes: number|null,
 *     cuisine_type: string|null,
 *     ingredients: string[],
 *     steps: string[],
 *     source_url: string,
 *   },
 *   partial?: boolean,
 *   error?: string,
 * }>}
 */
export const importRecipeFromUrl = async (rawUrl) => {
  const url = String(rawUrl || '').trim();
  if (!url) return { success: false, error: 'URL is required' };
  if (!/^https?:\/\//i.test(url)) {
    return { success: false, error: 'URL must start with http:// or https://' };
  }

  // ── Tier 1: Direct fetch + JSON-LD (free, works on most sites) ──
  let directHtml = null;
  try {
    directHtml = await fetchHtmlDirect(url);
    const parsed = parseHtmlForRecipe(directHtml, url);
    if (parsed) return { success: true, recipe: parsed };
  } catch {
    // Fall through to next tier.
  }

  // ── Tier 2: Spoonacular /recipes/extract (150/day free) ──
  try {
    const parsed = await fetchViaSpoonacular(url);
    if (parsed) return { success: true, recipe: parsed };
  } catch {
    // Fall through.
  }

  // ── Tier 3: ScrapingBee residential proxy + JSON-LD ──
  if (SCRAPINGBEE_KEY) {
    try {
      const html = await fetchHtmlViaScrapingBee(url);
      const parsed = parseHtmlForRecipe(html, url);
      if (parsed) return { success: true, recipe: parsed };
      // Last resort: OG fallback on the scraped HTML.
      const og = parseHtmlForOg(html, url);
      if (og) return { success: true, partial: true, recipe: og };
    } catch (e) {
      return {
        success: false,
        error: `Could not load page: ${e?.message || 'proxy error'}`,
      };
    }
  }

  // ── Final fallback: OG meta from the direct fetch, if we got any HTML ──
  if (directHtml) {
    const og = parseHtmlForOg(directHtml, url);
    if (og) return { success: true, partial: true, recipe: og };
  }

  return {
    success: false,
    error:
      'No recipe data found on this page. Try another URL or enter it manually.',
  };
};
