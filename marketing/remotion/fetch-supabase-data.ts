/**
 * fetch-supabase-data.ts
 * Connects to the Studenten Happie Supabase database, fetches real recipe data,
 * downloads food photos, and generates video configs + data files.
 *
 * Run: npx ts-node fetch-supabase-data.ts
 */

import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";
import * as https from "https";
import * as http from "http";

// ─── Supabase connection (main app database) ──────────────────────────────────
const SUPABASE_URL = "https://xyynvfmjwhzlqdteofep.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_qDtp_Zng8IcP6kMVLYV4qA_vtwgQlU7";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ─── Types ────────────────────────────────────────────────────────────────────
interface SupabaseRecipe {
  id: string;
  name: string;
  description: string;
  image: string;
  cooking_time_minutes: number;
  cuisine_type: string;
  ingredients: string[];
}

export interface RealRecipe {
  name: string;
  description: string;
  image: string; // local filename in public/meals/
  cookingTime: number; // minutes
  cuisineType: string;
  ingredients: string[];
  estimatedPrice: number; // rough estimate
}

export interface VideoStats {
  totalRecipes: number;
  avgCookingTime: number;
  avgPrice: number;
  cuisineTypes: number;
  cheapestMeal: { name: string; price: number };
  recipesUnder5Euro: number;
  monthlyBezorgdSavings: number; // vs Thuisbezorgd
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Sanitize recipe name to a safe filename */
function sanitizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9\-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/** Rough price estimate: €0.50 per ingredient */
function estimatePrice(ingredients: string[]): number {
  const count = Array.isArray(ingredients) ? ingredients.length : 0;
  return Math.round(count * 0.5 * 100) / 100;
}

/** Download a URL to a local file path */
function downloadFile(url: string, destPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith("https") ? https : http;
    const file = fs.createWriteStream(destPath);
    protocol
      .get(url, (response) => {
        if (response.statusCode === 301 || response.statusCode === 302) {
          // Follow redirect
          file.close();
          fs.unlinkSync(destPath);
          downloadFile(response.headers.location!, destPath)
            .then(resolve)
            .catch(reject);
          return;
        }
        if (response.statusCode !== 200) {
          file.close();
          fs.unlinkSync(destPath);
          reject(new Error(`HTTP ${response.statusCode} for ${url}`));
          return;
        }
        response.pipe(file);
        file.on("finish", () => {
          file.close();
          resolve();
        });
      })
      .on("error", (err) => {
        fs.unlink(destPath, () => {}); // cleanup partial file
        reject(err);
      });
  });
}

/** Append ?w=1080&q=80 to Unsplash URLs (replace any existing w/q params) */
function highQualityUrl(imageUrl: string): string {
  try {
    const u = new URL(imageUrl);
    u.searchParams.set("w", "1080");
    u.searchParams.set("q", "80");
    return u.toString();
  } catch {
    return imageUrl + "?w=1080&q=80";
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  // ── Step 1: Fetch recipes ──────────────────────────────────────────────────
  console.log("Fetching recipes...");
  const { data: rawRecipes, error } = await supabase
    .from("recipes")
    .select(
      "id, name, description, image, cooking_time_minutes, cuisine_type, ingredients"
    )
    .order("name");

  if (error) {
    console.error("Error fetching recipes:", error.message);
    process.exit(1);
  }

  const recipes: SupabaseRecipe[] = rawRecipes ?? [];
  console.log(`Downloaded ${recipes.length} recipes.`);

  // ── Step 2: Download food photos ──────────────────────────────────────────
  const mealsDir = path.join(__dirname, "public", "meals");
  if (!fs.existsSync(mealsDir)) {
    fs.mkdirSync(mealsDir, { recursive: true });
  }

  console.log("Downloading photos...");
  let downloaded = 0;
  let skipped = 0;
  let failed = 0;

  for (let i = 0; i < recipes.length; i++) {
    const recipe = recipes[i];
    if (!recipe.image) {
      skipped++;
      continue;
    }

    const filename = sanitizeName(recipe.name) + ".jpg";
    const destPath = path.join(mealsDir, filename);

    if (fs.existsSync(destPath)) {
      skipped++;
      process.stdout.write(
        `\r  ${i + 1}/${recipes.length} — skipped (exists): ${filename}    `
      );
      continue;
    }

    try {
      const url = highQualityUrl(recipe.image);
      await downloadFile(url, destPath);
      downloaded++;
      process.stdout.write(
        `\r  ${i + 1}/${recipes.length} — downloaded: ${filename}    `
      );
    } catch (err) {
      failed++;
      process.stdout.write(
        `\r  ${i + 1}/${recipes.length} — FAILED: ${filename}    `
      );
    }
  }
  console.log(
    `\nPhotos: ${downloaded} downloaded, ${skipped} skipped, ${failed} failed.`
  );

  // ── Step 3: Calculate real stats ──────────────────────────────────────────
  console.log("Calculating stats...");

  const realRecipes: RealRecipe[] = recipes.map((r) => ({
    name: r.name,
    description: r.description ?? "",
    image: sanitizeName(r.name) + ".jpg",
    cookingTime: r.cooking_time_minutes ?? 0,
    cuisineType: r.cuisine_type ?? "Unknown",
    ingredients: Array.isArray(r.ingredients) ? r.ingredients : [],
    estimatedPrice: estimatePrice(
      Array.isArray(r.ingredients) ? r.ingredients : []
    ),
  }));

  const totalRecipes = realRecipes.length;
  const avgCookingTime =
    totalRecipes > 0
      ? Math.round(
          realRecipes.reduce((s, r) => s + r.cookingTime, 0) / totalRecipes
        )
      : 0;
  const avgPrice =
    totalRecipes > 0
      ? Math.round(
          (realRecipes.reduce((s, r) => s + r.estimatedPrice, 0) /
            totalRecipes) *
            100
        ) / 100
      : 0;
  const cuisineTypeSet = new Set(realRecipes.map((r) => r.cuisineType));
  const cuisineTypes = cuisineTypeSet.size;
  const recipesUnder5Euro = realRecipes.filter(
    (r) => r.estimatedPrice < 5
  ).length;

  const sorted = [...realRecipes].sort(
    (a, b) => a.estimatedPrice - b.estimatedPrice
  );
  const cheapestMeal =
    sorted.length > 0
      ? { name: sorted[0].name, price: sorted[0].estimatedPrice }
      : { name: "N/A", price: 0 };

  // Monthly savings: assume 3 deliveries/week avoided at avg €12 each
  const monthlyBezorgdSavings = Math.round((12 - avgPrice) * 3 * 4);

  const stats: VideoStats = {
    totalRecipes,
    avgCookingTime,
    avgPrice,
    cuisineTypes,
    cheapestMeal,
    recipesUnder5Euro,
    monthlyBezorgdSavings,
  };

  console.log("Stats:", stats);

  // ── Step 4: Write src/data/recipes.ts ──────────────────────────────────────
  const dataDir = path.join(__dirname, "src", "data");
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const recipesTs = `// Auto-generated from Supabase data
// Run: npx ts-node fetch-supabase-data.ts

export interface RealRecipe {
  name: string;
  description: string;
  image: string;        // local filename in public/meals/
  cookingTime: number;  // minutes
  cuisineType: string;
  ingredients: string[];
  estimatedPrice: number; // rough estimate
}

export const recipes: RealRecipe[] = ${JSON.stringify(realRecipes, null, 2)};
`;
  fs.writeFileSync(path.join(dataDir, "recipes.ts"), recipesTs, "utf8");
  console.log(`Wrote src/data/recipes.ts (${realRecipes.length} recipes)`);

  // ── Step 4b: Write src/data/stats.ts ──────────────────────────────────────
  const statsTs = `// Auto-generated from Supabase data
// Run: npx ts-node fetch-supabase-data.ts

export interface VideoStats {
  totalRecipes: number;
  avgCookingTime: number;
  avgPrice: number;
  cuisineTypes: number;
  cheapestMeal: { name: string; price: number };
  recipesUnder5Euro: number;
  monthlyBezorgdSavings: number; // vs Thuisbezorgd
}

export const stats: VideoStats = ${JSON.stringify(stats, null, 2)};
`;
  fs.writeFileSync(path.join(dataDir, "stats.ts"), statsTs, "utf8");
  console.log("Wrote src/data/stats.ts");

  // ── Step 4c: Generate video-configs.ts with real data ─────────────────────
  // Pick diverse recipes for video configs
  const byPrice = [...realRecipes].sort(
    (a, b) => a.estimatedPrice - b.estimatedPrice
  );
  const cheap = byPrice.slice(0, 5);
  const byCuisine = [...realRecipes].sort((a, b) =>
    a.cuisineType.localeCompare(b.cuisineType)
  );
  // Pick up to 6 diverse cuisine types for swipe meals
  const cuisineMap: Record<string, RealRecipe> = {};
  for (const r of byCuisine) {
    if (!cuisineMap[r.cuisineType]) cuisineMap[r.cuisineType] = r;
  }
  const diverseRecipes = Object.values(cuisineMap).slice(0, 9);

  const pick = (arr: RealRecipe[], n: number): RealRecipe[] =>
    arr.slice(0, n);

  const swipe1Meals = pick(diverseRecipes, 3);
  const swipe2Meals = pick(diverseRecipes.slice(3), 3);

  // Ensure we always have at least a fallback
  const r = (i: number) =>
    realRecipes[i % realRecipes.length] ?? {
      name: "Pasta",
      image: "pasta.jpg",
      cookingTime: 20,
      cuisineType: "Italian",
      estimatedPrice: 2.5,
      description: "",
      ingredients: [],
    };

  const videoConfigsTs = `// Auto-generated from Supabase data
// Run: npx ts-node fetch-supabase-data.ts

import { VideoConfig } from "../types";

export const videos: VideoConfig[] = [
  // 1. SwipeTinder — diverse real meals
  {
    id: "swipe-real-1",
    template: "SwipeTinder",
    durationInSeconds: 10,
    music: "",
    props: {
      hookText: "POV: Tinder maar dan voor eten 🍝",
      meals: ${JSON.stringify(
        swipe1Meals.map((m) => ({
          naam: m.name,
          foto: m.image,
          liked: false,
        })),
        null,
        6
      )},
      matchMeal: ${JSON.stringify(swipe1Meals[swipe1Meals.length - 1]?.name ?? r(0).name)},
    },
  },
  // 2. SwipeTinder — huisgenoten swipen
  {
    id: "swipe-real-2",
    template: "SwipeTinder",
    durationInSeconds: 10,
    music: "",
    props: {
      hookText: "Mijn huisgenoten en ik swipen voor het avondeten",
      meals: ${JSON.stringify(
        swipe2Meals.map((m, i) => ({
          naam: m.name,
          foto: m.image,
          liked: i === 1,
        })),
        null,
        6
      )},
      matchMeal: ${JSON.stringify(swipe2Meals[1]?.name ?? r(1).name)},
    },
  },
  // 3. TekstStory — goedkoop recept uit echte data
  {
    id: "tekst-budget",
    template: "TekstStory",
    durationInSeconds: 8,
    music: "",
    props: {
      hookText: "Je hebt €${cheap[0] ? Math.ceil(cheap[0].estimatedPrice) : 3} voor avondeten",
      antwoord: "Happie zegt: ${cheap[0]?.name ?? "Pasta Aglio e Olio"} — €${cheap[0]?.estimatedPrice.toFixed(2) ?? "2.80"} • ${cheap[0]?.cookingTime ?? 15} min",
      mode: "dark",
    },
  },
  // 4. TekstStory — inspiratie
  {
    id: "tekst-inspiratie",
    template: "TekstStory",
    durationInSeconds: 10,
    music: "",
    props: {
      hookText: "Geen inspiratie om te koken?",
      antwoord: "Swipe door ${totalRecipes}+ recepten in 30 seconden",
      mode: "light",
    },
  },
  // 5. StatReel — bezorgkosten vs happie
  {
    id: "stat-bezorging",
    template: "StatReel",
    durationInSeconds: 10,
    music: "",
    props: {
      statNummer: ${stats.recipesUnder5Euro},
      statSuffix: "",
      statLabel: "recepten onder €5 in Happie",
      chartData: [
        { label: "bezorgen", value: 60 },
        { label: "zelf", value: 40 },
        { label: "afhaal", value: 50 },
        { label: "happie", value: 85, highlight: true },
      ],
      vergelijking: {
        linksLabel: "Thuisbezorgd",
        linksWaarde: "€12",
        rechtsLabel: "Happie",
        rechtsWaarde: "€${avgPrice.toFixed(2)}",
        conclusie: "Bespaar €${monthlyBezorgdSavings}/maand",
      },
    },
  },
  // 6. StatReel — bespaar per maand
  {
    id: "stat-bespaar",
    template: "StatReel",
    durationInSeconds: 12,
    music: "",
    props: {
      statNummer: ${monthlyBezorgdSavings},
      statSuffix: "€",
      statLabel: "per maand besparen op eten",
      chartData: [
        { label: "jan", value: 30 },
        { label: "feb", value: 55 },
        { label: "mrt", value: 75, highlight: true },
        { label: "apr", value: 90, highlight: true },
      ],
      vergelijking: {
        linksLabel: "Zonder Happie",
        linksWaarde: "€400",
        rechtsLabel: "Met Happie",
        rechtsWaarde: "€130",
        conclusie: "Dat is 3 festivals per jaar",
      },
    },
  },
  // 7. AppDemo — swipe flow
  {
    id: "demo-swipe",
    template: "AppDemo",
    durationInSeconds: 13,
    music: "",
    props: {
      probleem: "Wat eten we vanavond?",
      schermen: ["home", "swipe", "result"],
      features: ["Gratis", "Budget recepten", "Met je huisgenoten"],
    },
  },
  // 8. AppDemo — samen koken
  {
    id: "demo-samen",
    template: "AppDemo",
    durationInSeconds: 15,
    music: "",
    props: {
      probleem: "Samen koken met je huisgenoten",
      schermen: ["home", "swipe", "result", "boodschappen"],
      features: ["Stem samen", "Automatische boodschappenlijst", "Recepten onder €5"],
    },
  },
  // 9. MemeFormat split
  {
    id: "meme-split",
    template: "MemeFormat",
    durationInSeconds: 8,
    music: "",
    props: {
      variant: "split",
      links: { tekst: "Thuisbezorgd bestellen", emoji: "😩" },
      rechts: { tekst: "Met Happie koken", emoji: "😎" },
    },
  },
  // 10. MemeFormat chat
  {
    id: "meme-chat",
    template: "MemeFormat",
    durationInSeconds: 10,
    music: "",
    props: {
      variant: "chat",
      berichten: [
        { tekst: "Wat eten we vanavond?", isReply: false },
        { tekst: "Weet niet", isReply: false },
        { tekst: "${r(0).name}?", isReply: false },
        { tekst: "Nee weer ${r(0).cuisineType}", isReply: false },
        { tekst: "Download gewoon Happie 😤", isReply: true },
      ],
      punchline: "Download gewoon Happie 😤",
    },
  },
];
`;

  fs.writeFileSync(path.join(dataDir, "video-configs.ts"), videoConfigsTs, "utf8");
  console.log("Wrote src/data/video-configs.ts (10 video configs)");

  console.log("\nDone! All files generated successfully.");
  console.log(`  public/meals/      — ${downloaded + skipped} photos ready`);
  console.log(`  src/data/recipes.ts — ${totalRecipes} recipes`);
  console.log(`  src/data/stats.ts   — video stats`);
  console.log(`  src/data/video-configs.ts — 10 video configs`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
