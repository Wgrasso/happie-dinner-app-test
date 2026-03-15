import { VideoConfig } from "../types";
import { recipes } from "./recipes";

// Batch 2 recipes
const mushroomRisotto = recipes.find((r) => r.name === "Mushroom Risotto")!;
const thaiGreenCurry = recipes.find((r) => r.name === "Thai Green Curry")!;
const ramen = recipes.find((r) => r.name === "Ramen")!;
const shakshuka = recipes.find((r) => r.name === "Shakshuka")!;
const koreanFriedChicken = recipes.find(
  (r) => r.name === "Korean Fried Chicken",
)!;
const lasagna = recipes.find((r) => r.name === "Lasagna")!;
const fishTacos = recipes.find((r) => r.name === "Fish Tacos")!;
const pokeBowl = recipes.find((r) => r.name === "Poke Bowl")!;
const vietnamesePho = recipes.find((r) => r.name === "Vietnamese Pho")!;
const chickenFajitas = recipes.find((r) => r.name === "Chicken Fajitas")!;

// Supporting meals for swipe screens
const bibimbap = recipes.find((r) => r.name === "Bibimbap")!;
const padThai = recipes.find((r) => r.name === "Pad Thai")!;
const carbonara = recipes.find((r) => r.name === "Carbonara")!;
const burger = recipes.find((r) => r.name === "Beef Burger")!;

// 10 NEW video concepts — completely different hooks, recipes, stories
export const videosBatch2: VideoConfig[] = [
  // --- 1: "De Koelkast Interventie" (WatEtenWe) ---
  {
    id: "b2-koelkast-interventie",
    template: "WatEtenWe",
    durationInSeconds: 30,
    music: "",
    props: {
      hookPhoto: mushroomRisotto.localImage,
      solutionPhoto: thaiGreenCurry.localImage,
      resultPhoto: mushroomRisotto.localImage,
      recipeName: mushroomRisotto.name,
      cookingTime: mushroomRisotto.cookingTime,
      price: mushroomRisotto.estimatedPrice,
      meals: [
        { naam: shakshuka.name, foto: shakshuka.localImage, liked: false },
        {
          naam: koreanFriedChicken.name,
          foto: koreanFriedChicken.localImage,
          liked: false,
        },
        {
          naam: mushroomRisotto.name,
          foto: mushroomRisotto.localImage,
          liked: true,
        },
      ],
    },
  },

  // --- 2: "Wereldkeuken" (FoodReveal) ---
  {
    id: "b2-wereldkeuken",
    template: "FoodReveal",
    durationInSeconds: 25,
    music: "",
    props: {
      photo: thaiGreenCurry.localImage,
      recipeName: thaiGreenCurry.name,
      price: thaiGreenCurry.estimatedPrice,
      ingredients: [
        { naam: "Kippendij", prijs: "\u20AC1,80" },
        { naam: "Kokosmelk", prijs: "\u20AC1,20" },
        { naam: "Currypasta", prijs: "\u20AC0,90" },
        { naam: "Groenten", prijs: "\u20AC0,60" },
        { naam: "Jasmine rijst", prijs: "\u20AC0,50" },
      ],
    },
  },

  // --- 3: "Het Stemmen Begint" (SamenEten) ---
  {
    id: "b2-stemmen-begint",
    template: "SamenEten",
    durationInSeconds: 30,
    music: "",
    props: {
      chatMessages: [
        { tekst: "Ik wil Aziatisch", isReply: false },
        { tekst: "Ik wil Mexicaans!", isReply: true },
        { tekst: "Ik wil gewoon goedkoop", isReply: false },
        { tekst: "We gaan STEMMEN", isReply: true },
      ],
      meals: [
        { naam: fishTacos.name, foto: fishTacos.localImage, liked: false },
        { naam: ramen.name, foto: ramen.localImage, liked: false },
        {
          naam: koreanFriedChicken.name,
          foto: koreanFriedChicken.localImage,
          liked: true,
        },
      ],
      matchMeal: koreanFriedChicken.name,
      resultPhoto: koreanFriedChicken.localImage,
    },
  },

  // --- 4: "20 Minuten" (DataStory) ---
  {
    id: "b2-20-minuten",
    template: "DataStory",
    durationInSeconds: 30,
    music: "",
    props: {
      bgPhoto: pokeBowl.localImage,
      statNummer: 20,
      statSuffix: "min",
      statLabel: "van koelkast naar tafel",
      chartTitle: "Hoe snel staat eten op tafel?",
      chartData: [
        { label: "Afhalen", value: 30 },
        { label: "Supermarkt + koken", value: 55 },
        { label: "Kookboek zoeken", value: 40 },
        { label: "Happie", value: 20, highlight: true },
      ],
      ctaPhoto: pokeBowl.localImage,
    },
  },

  // --- 5: "First Date Dinner" (HetMoment) ---
  {
    id: "b2-first-date-dinner",
    template: "HetMoment",
    durationInSeconds: 25,
    music: "",
    props: {
      photos: [
        ramen.localImage,
        vietnamesePho.localImage,
        pokeBowl.localImage,
      ] as [string, string, string],
      recipeName: ramen.name,
      cookingTime: ramen.cookingTime,
      price: ramen.estimatedPrice,
      servings: 2,
    },
  },

  // --- 6: "De Weekplanner" (WatEtenWe) ---
  {
    id: "b2-weekplanner",
    template: "WatEtenWe",
    durationInSeconds: 30,
    music: "",
    props: {
      hookPhoto: lasagna.localImage,
      solutionPhoto: fishTacos.localImage,
      resultPhoto: lasagna.localImage,
      recipeName: lasagna.name,
      cookingTime: lasagna.cookingTime,
      price: lasagna.estimatedPrice,
      meals: [
        { naam: fishTacos.name, foto: fishTacos.localImage, liked: true },
        { naam: lasagna.name, foto: lasagna.localImage, liked: true },
        { naam: pokeBowl.name, foto: pokeBowl.localImage, liked: false },
      ],
    },
  },

  // --- 7: "Geheim Recept" (FoodReveal) ---
  {
    id: "b2-geheim-recept",
    template: "FoodReveal",
    durationInSeconds: 25,
    music: "",
    props: {
      photo: shakshuka.localImage,
      recipeName: shakshuka.name,
      price: shakshuka.estimatedPrice,
      ingredients: [
        { naam: "Eieren (6x)", prijs: "\u20AC1,00" },
        { naam: "Tomaten (blik)", prijs: "\u20AC0,80" },
        { naam: "Paprika's", prijs: "\u20AC0,60" },
        { naam: "Ui + knoflook", prijs: "\u20AC0,30" },
        { naam: "Kruiden", prijs: "\u20AC0,30" },
      ],
    },
  },

  // --- 8: "De Transformation" (SamenEten) ---
  {
    id: "b2-transformation",
    template: "SamenEten",
    durationInSeconds: 30,
    music: "",
    props: {
      chatMessages: [
        { tekst: "Tosti?", isReply: false },
        { tekst: "Tosti.", isReply: true },
        { tekst: "\u2014 8 weken later \u2014", isReply: false },
        { tekst: "Vietnamese Pho vanavond!", isReply: true },
      ],
      meals: [
        { naam: padThai.name, foto: padThai.localImage, liked: false },
        { naam: bibimbap.name, foto: bibimbap.localImage, liked: false },
        {
          naam: vietnamesePho.name,
          foto: vietnamesePho.localImage,
          liked: true,
        },
      ],
      matchMeal: vietnamesePho.name,
      resultPhoto: vietnamesePho.localImage,
    },
  },

  // --- 9: "Samen Koken Stats" (DataStory) ---
  {
    id: "b2-samen-koken-stats",
    template: "DataStory",
    durationInSeconds: 30,
    music: "",
    props: {
      bgPhoto: chickenFajitas.localImage,
      statNummer: 5,
      statSuffix: "x",
      statLabel: "per week samen aan tafel",
      chartTitle: "Wat maakt studentenleven leuk?",
      chartData: [
        { label: "Studeren", value: 20 },
        { label: "Uitgaan", value: 65 },
        { label: "Sport", value: 55 },
        { label: "Samen koken", value: 88, highlight: true },
      ],
      ctaPhoto: chickenFajitas.localImage,
    },
  },

  // --- 10: "Taco Tuesday" (HetMoment) ---
  {
    id: "b2-taco-tuesday",
    template: "HetMoment",
    durationInSeconds: 25,
    music: "",
    props: {
      photos: [
        fishTacos.localImage,
        chickenFajitas.localImage,
        shakshuka.localImage,
      ] as [string, string, string],
      recipeName: fishTacos.name,
      cookingTime: fishTacos.cookingTime,
      price: fishTacos.estimatedPrice,
      servings: 6,
    },
  },
];
