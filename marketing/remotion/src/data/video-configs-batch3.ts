import { VideoConfig } from "../types";
import type { StoryScene } from "../templates/StoryAd";

// ── Batch 3: 10 story-driven videos using StoryAd template ──────────────────
// Each video = 30 seconds (900 frames at 30fps).
// Structure: ~24 seconds of STORY, ~6 seconds of APP.

export const videosBatch3: VideoConfig[] = [
  // ── 1. "Dinsdagavond" ──────────────────────────────────────────────────────
  // The mundane beauty of a Tuesday dinner together.
  {
    id: "b3-dinsdagavond",
    template: "StoryAd",
    durationInSeconds: 30,
    music: "",
    props: {
      scenes: [
        { type: "video", src: "student-studying-tired.mp4", overlay: 0.2 },
        { type: "video", src: "person-phone-couch.mp4", text: "Het is 18:00", textPosition: "bottom", textAnimation: "fadeUp" },
        { type: "video", src: "hands-phone-texting.mp4", text: "Wie eet er mee?", textPosition: "center", textAnimation: "slamIn" },
        { type: "video", src: "group-cooking-kitchen.mp4", text: "6 van 8", textPosition: "bottom", textAnimation: "popIn" },
        { type: "video", src: "cutting-vegetables.mp4", overlay: 0.15, warmth: 0.5 },
        { type: "video", src: "cooking-pan-sizzle.mp4", text: "Pasta Aglio e Olio", subtext: "", textPosition: "bottom", textAnimation: "fadeUp", warmth: 0.6 },
        { type: "video", src: "table-setting-plates.mp4", overlay: 0.15, warmth: 0.7 },
        { type: "video", src: "friends-laughing-dinner.mp4", text: "Gewoon dinsdag.", textPosition: "bottom", textAnimation: "fadeUp", warmth: 0.5 },
        { type: "video", src: "toast-cheers-dinner.mp4", text: "Gewoon samen.", textPosition: "center", textAnimation: "popIn", warmth: 0.6 },
        { type: "phone", phoneSequence: "swipe-three", phoneSize: "corner", phoneRecipe: { name: "Pasta Aglio e Olio", image: "carbonara.jpg", cookingTime: 20 } },
        { type: "text", text: "Studenten Happie.", textAnimation: "fadeUp" },
      ] as StoryScene[],
      sceneDurations: [60, 60, 60, 60, 90, 120, 90, 120, 60, 90, 90],
    },
  },

  // ── 2. "De Vraag" ──────────────────────────────────────────────────────────
  // The eternal question, shown through real moments.
  {
    id: "b3-de-vraag",
    template: "StoryAd",
    durationInSeconds: 30,
    music: "",
    props: {
      scenes: [
        { type: "video", src: "student-apartment.mp4", text: "De vraag van elke dag.", textPosition: "center", textAnimation: "letterStagger" },
        { type: "video", src: "person-thinking.mp4", text: "Wat eten we?", textPosition: "center", textAnimation: "slamIn" },
        { type: "video", src: "hands-phone-texting.mp4", overlay: 0.25 },
        { type: "video", src: "fridge-opening.mp4", text: "Niks in huis.", textPosition: "bottom", textAnimation: "fadeUp" },
        { type: "video", src: "supermarket-walking.mp4", text: "Geen plan.", textPosition: "center", textAnimation: "fadeUp" },
        { type: "video", src: "person-phone-couch.mp4", text: "Tot nu.", textPosition: "center", textAnimation: "popIn" },
        { type: "phone", phoneSequence: "wie-eet-mee", text: "Wie eet er mee?", phoneSize: "full", phoneRecipe: { name: "Nasi Goreng", image: "carbonara.jpg", cookingTime: 25 } },
        { type: "phone", phoneSequence: "swipe-three", phoneSize: "full", phoneRecipe: { name: "Nasi Goreng", image: "carbonara.jpg", cookingTime: 25 } },
        { type: "video", src: "cooking-pan-sizzle.mp4", text: "Nasi Goreng", textPosition: "bottom", textAnimation: "fadeUp", warmth: 0.6 },
        { type: "video", src: "happy-eating-together.mp4", overlay: 0.15, warmth: 0.5 },
        { type: "text", text: "Studenten Happie.", textAnimation: "fadeUp" },
      ] as StoryScene[],
      sceneDurations: [60, 60, 60, 60, 90, 60, 120, 120, 90, 90, 90],
    },
  },

  // ── 3. "8 Mensen" ─────────────────────────────────────────────────────────
  // When 8 people need to agree on one meal.
  {
    id: "b3-8-mensen",
    template: "StoryAd",
    durationInSeconds: 30,
    music: "",
    props: {
      scenes: [
        { type: "text", text: "8 mensen.", textAnimation: "slamIn" },
        { type: "text", text: "1 keuken.", textAnimation: "slamIn" },
        { type: "text", text: "0 idee\u00EBn.", textAnimation: "slamIn" },
        { type: "video", src: "person-thinking.mp4", overlay: 0.3 },
        { type: "video", src: "hands-phone-texting.mp4", text: "Groepsapp chaos", textPosition: "top", textAnimation: "fadeUp" },
        { type: "phone", phoneSequence: "swipe-three", phoneSize: "full", text: "Iedereen swipet.", phoneRecipe: { name: "Bibimbap", image: "carbonara.jpg", cookingTime: 30 } },
        { type: "phone", phoneSequence: "vote-result", phoneSize: "full", text: "Top 3 staat vast.", phoneRecipe: { name: "Bibimbap", image: "carbonara.jpg", cookingTime: 30 } },
        { type: "video", src: "group-cooking-kitchen.mp4", overlay: 0.15, warmth: 0.5 },
        { type: "video", src: "happy-eating-together.mp4", text: "8 mensen. 1 keuze.", textPosition: "bottom", textAnimation: "popIn", warmth: 0.6 },
        { type: "text", text: "Studenten Happie.", textAnimation: "fadeUp" },
      ] as StoryScene[],
      sceneDurations: [60, 60, 60, 90, 90, 120, 90, 90, 120, 120],
    },
  },

  // ── 4. "Vrijdagavond" ─────────────────────────────────────────────────────
  // Friday night, special dinner, good vibes.
  {
    id: "b3-vrijdagavond",
    template: "StoryAd",
    durationInSeconds: 30,
    music: "",
    props: {
      scenes: [
        { type: "video", src: "late-night-kitchen.mp4", text: "Vrijdagavond.", textPosition: "center", textAnimation: "letterStagger", warmth: 0.7, overlay: 0.2 },
        { type: "video", src: "supermarket-walking.mp4", overlay: 0.2 },
        { type: "video", src: "cutting-vegetables.mp4", overlay: 0.15, warmth: 0.5 },
        { type: "video", src: "cooking-pan-sizzle.mp4", warmth: 0.6, overlay: 0.15 },
        { type: "video", src: "food-plating-restaurant.mp4", overlay: 0.15, warmth: 0.7 },
        { type: "video", src: "table-setting-plates.mp4", warmth: 0.6, overlay: 0.15 },
        { type: "video", src: "friends-laughing-dinner.mp4", overlay: 0.15, warmth: 0.5 },
        { type: "video", src: "toast-cheers-dinner.mp4", text: "Dit is het.", textPosition: "center", textAnimation: "fadeUp", warmth: 0.7 },
        { type: "phone", phoneSequence: "swipe-three", phoneSize: "corner", phoneRecipe: { name: "Risotto ai Funghi", image: "carbonara.jpg", cookingTime: 35 } },
        { type: "text", text: "Het begint met swipen.", textAnimation: "fadeUp" },
      ] as StoryScene[],
      sceneDurations: [90, 90, 75, 75, 75, 75, 90, 90, 90, 150],
    },
  },

  // ── 5. "De Held" ──────────────────────────────────────────────────────────
  // One person decides to cook something special.
  {
    id: "b3-de-held",
    template: "StoryAd",
    durationInSeconds: 30,
    music: "",
    props: {
      scenes: [
        { type: "video", src: "student-studying-tired.mp4", text: "Zelfde routine.", textPosition: "center", textAnimation: "fadeUp" },
        { type: "video", src: "person-phone-couch.mp4", text: "Zelfde eten.", textPosition: "center", textAnimation: "fadeUp" },
        { type: "phone", phoneSequence: "swipe-three", phoneSize: "full", phoneRecipe: { name: "Chicken Teriyaki", image: "carbonara.jpg", cookingTime: 25 } },
        { type: "video", src: "supermarket-walking.mp4", overlay: 0.2 },
        { type: "video", src: "cutting-vegetables.mp4", overlay: 0.15, warmth: 0.4 },
        { type: "video", src: "cooking-stir-fry.mp4", warmth: 0.5, overlay: 0.15 },
        { type: "video", src: "cooking-pan-sizzle.mp4", warmth: 0.6, overlay: 0.15 },
        { type: "video", src: "serving-food-plate.mp4", overlay: 0.15, warmth: 0.7 },
        { type: "video", src: "happy-eating-together.mp4", overlay: 0.15, warmth: 0.5 },
        { type: "text", text: "Vanavond ben jij de held.", textAnimation: "popIn" },
        { type: "text", text: "Studenten Happie.", textAnimation: "fadeUp" },
      ] as StoryScene[],
      sceneDurations: [60, 60, 90, 75, 75, 90, 75, 75, 90, 120, 90],
    },
  },

  // ── 6. "Eerste Week" ──────────────────────────────────────────────────────
  // First week in a new student house, nobody knows each other.
  {
    id: "b3-eerste-week",
    template: "StoryAd",
    durationInSeconds: 30,
    music: "",
    props: {
      scenes: [
        { type: "text", text: "Nieuwe stad. Nieuw huis.", textAnimation: "letterStagger" },
        { type: "video", src: "student-apartment.mp4", overlay: 0.3 },
        { type: "text", text: "8 vreemden.", textAnimation: "slamIn" },
        { type: "video", src: "person-thinking.mp4", overlay: 0.3 },
        { type: "text", text: "Wie breekt het ijs?", textAnimation: "fadeUp" },
        { type: "phone", phoneSequence: "wie-eet-mee", phoneSize: "full", text: "Vanavond samen eten?", phoneRecipe: { name: "Pasta Pesto", image: "carbonara.jpg", cookingTime: 15 } },
        { type: "video", src: "group-cooking-kitchen.mp4", overlay: 0.15, warmth: 0.5 },
        { type: "video", src: "friends-laughing-dinner.mp4", overlay: 0.15, warmth: 0.6 },
        { type: "video", src: "toast-cheers-dinner.mp4", text: "Geen vreemden meer.", textPosition: "bottom", textAnimation: "fadeUp", warmth: 0.7 },
        { type: "text", text: "Samen eten verbindt.", textAnimation: "popIn" },
        { type: "text", text: "Studenten Happie.", textAnimation: "fadeUp" },
      ] as StoryScene[],
      sceneDurations: [60, 60, 60, 75, 75, 120, 90, 90, 90, 90, 90],
    },
  },

  // ── 7. "Zondag" ───────────────────────────────────────────────────────────
  // Sunday lazy cooking session.
  {
    id: "b3-zondag",
    template: "StoryAd",
    durationInSeconds: 30,
    music: "",
    props: {
      scenes: [
        { type: "video", src: "student-apartment.mp4", text: "Zondag.", textPosition: "center", textAnimation: "letterStagger", overlay: 0.2 },
        { type: "video", src: "person-phone-couch.mp4", overlay: 0.2 },
        { type: "video", src: "fridge-opening.mp4", overlay: 0.25 },
        { type: "phone", phoneSequence: "swipe-three", phoneSize: "full", phoneRecipe: { name: "One-pot Pasta", image: "carbonara.jpg", cookingTime: 20 } },
        { type: "video", src: "cutting-vegetables.mp4", overlay: 0.15, warmth: 0.4 },
        { type: "video", src: "cooking-pasta-close-up.mp4", warmth: 0.5, overlay: 0.15 },
        { type: "video", src: "serving-food-plate.mp4", overlay: 0.15, warmth: 0.6 },
        { type: "video", src: "happy-eating-together.mp4", text: "Niks moet. Alles mag.", textPosition: "bottom", textAnimation: "fadeUp", warmth: 0.5 },
        { type: "phone", phoneSequence: "swipe-three", phoneSize: "corner", phoneRecipe: { name: "One-pot Pasta", image: "carbonara.jpg", cookingTime: 20 } },
        { type: "text", text: "Studenten Happie.", textAnimation: "fadeUp" },
      ] as StoryScene[],
      sceneDurations: [90, 75, 75, 90, 90, 105, 90, 120, 75, 90],
    },
  },

  // ── 8. "Het Recept" ───────────────────────────────────────────────────────
  // Following a recipe step by step from the app.
  {
    id: "b3-het-recept",
    template: "StoryAd",
    durationInSeconds: 30,
    music: "",
    props: {
      scenes: [
        { type: "video", src: "fridge-opening.mp4", text: "Stap 1.", textPosition: "top", textAnimation: "slamIn" },
        { type: "phone", phoneSequence: "recipe-detail", phoneSize: "full", text: "Ingredi\u00EBnten", phoneRecipe: { name: "Pad Thai", image: "carbonara.jpg", cookingTime: 25 } },
        { type: "video", src: "supermarket-walking.mp4", text: "Stap 2. Boodschappen.", textPosition: "bottom", textAnimation: "fadeUp" },
        { type: "video", src: "cutting-vegetables.mp4", text: "Stap 3.", textPosition: "top", textAnimation: "fadeUp", warmth: 0.4 },
        { type: "video", src: "cooking-pan-sizzle.mp4", text: "Stap 4.", textPosition: "top", textAnimation: "fadeUp", warmth: 0.5 },
        { type: "video", src: "cooking-stir-fry.mp4", warmth: 0.5, overlay: 0.15 },
        { type: "video", src: "serving-food-plate.mp4", text: "Stap 5.", textPosition: "top", textAnimation: "fadeUp", warmth: 0.6 },
        { type: "video", src: "happy-eating-together.mp4", text: "Stap 6. Genieten.", textPosition: "center", textAnimation: "popIn", warmth: 0.5 },
        { type: "text", text: "Van recept naar tafel.", textAnimation: "fadeUp" },
        { type: "text", text: "Studenten Happie.", textAnimation: "fadeUp" },
      ] as StoryScene[],
      sceneDurations: [60, 90, 90, 90, 90, 90, 90, 90, 120, 90],
    },
  },

  // ── 9. "Maakt Niet Uit" ───────────────────────────────────────────────────
  // The classic: someone who says anything is fine, then complains.
  {
    id: "b3-maakt-niet-uit",
    template: "StoryAd",
    durationInSeconds: 30,
    music: "",
    props: {
      scenes: [
        { type: "text", text: "'Maakt me niet uit.'", textAnimation: "letterStagger" },
        { type: "video", src: "person-phone-couch.mp4", overlay: 0.25 },
        { type: "text", text: "Pasta dan?", subtext: "Nee geen pasta.", textAnimation: "fadeUp" },
        { type: "text", text: "Rijst?", subtext: "Nee had ik gisteren.", textAnimation: "fadeUp" },
        { type: "text", text: "Pizza?", subtext: "Te duur.", textAnimation: "fadeUp" },
        { type: "video", src: "person-thinking.mp4", overlay: 0.35 },
        { type: "phone", phoneSequence: "swipe-three", phoneSize: "full", text: "Iedereen MOET kiezen.", phoneRecipe: { name: "Chicken Wrap", image: "carbonara.jpg", cookingTime: 20 } },
        { type: "phone", phoneSequence: "vote-result", phoneSize: "full", text: "Geen excuses.", phoneRecipe: { name: "Chicken Wrap", image: "carbonara.jpg", cookingTime: 20 } },
        { type: "video", src: "happy-eating-together.mp4", overlay: 0.15, warmth: 0.5 },
        { type: "text", text: "Probleem opgelost.", textAnimation: "popIn" },
        { type: "text", text: "Studenten Happie.", textAnimation: "fadeUp" },
      ] as StoryScene[],
      sceneDurations: [60, 60, 75, 60, 60, 75, 120, 120, 90, 90, 90],
    },
  },

  // ── 10. "22:00" ───────────────────────────────────────────────────────────
  // Late night cooking, unexpected bonding.
  {
    id: "b3-22-uur",
    template: "StoryAd",
    durationInSeconds: 30,
    music: "",
    props: {
      scenes: [
        { type: "video", src: "late-night-kitchen.mp4", text: "22:00", textPosition: "center", textAnimation: "slamIn", warmth: 0.6 },
        { type: "video", src: "student-apartment.mp4", text: "Iedereen heeft honger.", textPosition: "bottom", textAnimation: "fadeUp" },
        { type: "video", src: "fridge-opening.mp4", text: "Niks gepland.", textPosition: "center", textAnimation: "fadeUp" },
        { type: "phone", phoneSequence: "swipe-three", phoneSize: "full", phoneRecipe: { name: "Midnight Pasta", image: "carbonara.jpg", cookingTime: 15 } },
        { type: "video", src: "cooking-pan-sizzle.mp4", warmth: 0.6, overlay: 0.15 },
        { type: "video", src: "late-night-kitchen.mp4", warmth: 0.7, overlay: 0.15 },
        { type: "video", src: "happy-eating-together.mp4", text: "De beste avonden", textPosition: "center", textAnimation: "fadeUp", warmth: 0.5 },
        { type: "text", text: "zijn niet gepland.", textAnimation: "popIn" },
        { type: "phone", phoneSequence: "swipe-three", phoneSize: "corner", phoneRecipe: { name: "Midnight Pasta", image: "carbonara.jpg", cookingTime: 15 } },
        { type: "text", text: "Studenten Happie.", textAnimation: "fadeUp" },
      ] as StoryScene[],
      sceneDurations: [60, 75, 90, 90, 105, 105, 105, 90, 90, 90],
    },
  },
];
