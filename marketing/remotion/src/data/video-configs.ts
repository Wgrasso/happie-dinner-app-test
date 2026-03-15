import { VideoConfig } from "../types";
import { recipes } from "./recipes";
import { scripts } from "./scripts";

// Pick specific recipes for each video
const bolognese = recipes.find((r) => r.name === "Spaghetti Bolognese")!;
const carbonara = recipes.find((r) => r.name === "Carbonara")!;
const pestoP = recipes.find((r) => r.name === "Pesto Pasta")!;
const padThai = recipes.find((r) => r.name === "Pad Thai")!;
const risotto = recipes.find((r) => r.name === "Mushroom Risotto")!;
const tikka = recipes.find((r) => r.name === "Chicken Tikka Masala")!;
const gnocchi = recipes.find((r) => r.name === "Gnocchi with Sage Butter")!;
const burger = recipes.find((r) => r.name === "Beef Burger")!;
const ramen = recipes.find((r) => r.name === "Ramen")!;
const shakshuka = recipes.find((r) => r.name === "Shakshuka")!;
const pizza = recipes.find((r) => r.name === "Margherita Pizza")!;
const friedRice = recipes.find((r) => r.name === "Fried Rice")!;
const greenCurry = recipes.find((r) => r.name === "Thai Green Curry")!;
const bibimbap = recipes.find((r) => r.name === "Bibimbap")!;
const fajitas = recipes.find((r) => r.name === "Chicken Fajitas")!;
const fishTacos = recipes.find((r) => r.name === "Fish Tacos")!;
const chickenWrap = recipes.find((r) => r.name === "Chicken Wrap")!;

// Map script IDs to their data for reference
const scriptMap = new Map(scripts.map((s) => [s.id, s]));

// 10 selected videos: 2 best from each of the 5 categories
// Connected to scripts.ts for content/hooks
export const videos: VideoConfig[] = [
  // --- PROBLEEM 1: Groepsapp chaos (WatEtenWe) ---
  {
    id: "probleem-groepsapp",
    template: "WatEtenWe",
    durationInSeconds: 30,
    music: "",
    props: {
      hookPhoto: bolognese.localImage,
      solutionPhoto: greenCurry.localImage,
      resultPhoto: padThai.localImage,
      recipeName: padThai.name,
      cookingTime: padThai.cookingTime,
      price: padThai.estimatedPrice,
      meals: [
        { naam: risotto.name, foto: risotto.localImage, liked: false },
        { naam: tikka.name, foto: tikka.localImage, liked: false },
        { naam: padThai.name, foto: padThai.localImage, liked: true },
      ],
    },
  },

  // --- PROBLEEM 2: 8 mensen, 8 meningen (WatEtenWe) ---
  {
    id: "probleem-8-meningen",
    template: "WatEtenWe",
    durationInSeconds: 30,
    music: "",
    props: {
      hookPhoto: pizza.localImage,
      solutionPhoto: friedRice.localImage,
      resultPhoto: burger.localImage,
      recipeName: burger.name,
      cookingTime: burger.cookingTime,
      price: burger.estimatedPrice,
      meals: [
        { naam: shakshuka.name, foto: shakshuka.localImage, liked: false },
        { naam: ramen.name, foto: ramen.localImage, liked: false },
        { naam: burger.name, foto: burger.localImage, liked: true },
      ],
    },
  },

  // --- FOOD REVEAL 1: Carbonara (FoodReveal) ---
  {
    id: "food-carbonara",
    template: "FoodReveal",
    durationInSeconds: 25,
    music: "",
    props: {
      photo: carbonara.localImage,
      recipeName: carbonara.name,
      price: carbonara.estimatedPrice,
      ingredients: [
        { naam: "Spaghetti", prijs: "\u20AC0,90" },
        { naam: "Pancetta", prijs: "\u20AC1,20" },
        { naam: "Eieren", prijs: "\u20AC0,40" },
        { naam: "Pecorino", prijs: "\u20AC0,50" },
      ],
    },
  },

  // --- FOOD REVEAL 2: Pad Thai (FoodReveal) ---
  {
    id: "food-pad-thai",
    template: "FoodReveal",
    durationInSeconds: 25,
    music: "",
    props: {
      photo: padThai.localImage,
      recipeName: padThai.name,
      price: padThai.estimatedPrice,
      ingredients: [
        { naam: "Rijstnoedels", prijs: "\u20AC1,00" },
        { naam: "Garnalen", prijs: "\u20AC2,00" },
        { naam: "Eieren", prijs: "\u20AC0,40" },
        { naam: "Pinda's", prijs: "\u20AC0,60" },
        { naam: "Tamarinde", prijs: "\u20AC0,50" },
        { naam: "Limoen", prijs: "\u20AC0,30" },
      ],
    },
  },

  // --- DATA 1: Makkelijk avondeten kiezen (DataStory) ---
  {
    id: "data-makkelijk",
    template: "DataStory",
    durationInSeconds: 30,
    music: "",
    props: {
      bgPhoto: bolognese.localImage,
      statNummer: 60,
      statSuffix: "+",
      statLabel: "recepten onder \u20AC5 per persoon",
      chartTitle: "Hoe makkelijk is avondeten kiezen?",
      chartData: [
        { label: "Zelf bedenken", value: 25 },
        { label: "Kookboek", value: 45 },
        { label: "Recepten-app", value: 60 },
        { label: "Happie", value: 92, highlight: true },
      ],
      ctaPhoto: tikka.localImage,
    },
  },

  // --- DATA 2: Samen koken data (DataStory) ---
  {
    id: "data-samen-koken",
    template: "DataStory",
    durationInSeconds: 30,
    music: "",
    props: {
      bgPhoto: carbonara.localImage,
      statNummer: 8,
      statSuffix: "van 8",
      statLabel: "huisgenoten eten vanavond mee",
      chartTitle: "Hoe vaak kook je samen?",
      chartData: [
        { label: "Nooit", value: 10 },
        { label: "1x per week", value: 35 },
        { label: "3x per week", value: 55 },
        { label: "Met Happie", value: 90, highlight: true },
      ],
      ctaPhoto: chickenWrap.localImage,
    },
  },

  // --- SAMEN 1: Die ene huisgenoot (SamenEten) ---
  {
    id: "humor-maakt-niet-uit",
    template: "SamenEten",
    durationInSeconds: 30,
    music: "",
    props: {
      chatMessages: [
        { tekst: "Maakt me niet uit", isReply: true },
        { tekst: "Ok\u00E9, pasta!", isReply: false },
        { tekst: "Ugh pasta WEER??", isReply: true },
        { tekst: "JE ZEI MAAKT NIET UIT", isReply: false },
      ],
      meals: [
        { naam: burger.name, foto: burger.localImage, liked: false },
        { naam: padThai.name, foto: padThai.localImage, liked: false },
        { naam: fishTacos.name, foto: fishTacos.localImage, liked: true },
      ],
      matchMeal: fishTacos.name,
      resultPhoto: fishTacos.localImage,
    },
  },

  // --- SAMEN 2: Sushi op studentenbudget (SamenEten) ---
  {
    id: "humor-sushi-budget",
    template: "SamenEten",
    durationInSeconds: 30,
    music: "",
    props: {
      chatMessages: [
        { tekst: "Laten we sushi maken!", isReply: false },
        { tekst: "Bro we hebben \u20AC2 pp", isReply: true },
        { tekst: "Dan doen we 'budget sushi'", isReply: false },
        { tekst: "Dat heet rijst met sojasaus", isReply: true },
      ],
      meals: [
        { naam: tikka.name, foto: tikka.localImage, liked: false },
        { naam: risotto.name, foto: risotto.localImage, liked: false },
        { naam: friedRice.name, foto: friedRice.localImage, liked: true },
      ],
      matchMeal: friedRice.name,
      resultPhoto: friedRice.localImage,
    },
  },

  // --- LIFESTYLE 1: Samen aan tafel (HetMoment) ---
  {
    id: "lifestyle-samen-tafel",
    template: "HetMoment",
    durationInSeconds: 25,
    music: "",
    props: {
      photos: [
        gnocchi.localImage,
        carbonara.localImage,
        risotto.localImage,
      ] as [string, string, string],
      recipeName: gnocchi.name,
      cookingTime: gnocchi.cookingTime,
      price: gnocchi.estimatedPrice,
      servings: 4,
    },
  },

  // --- LIFESTYLE 2: Van chaos naar gezellig (HetMoment) ---
  {
    id: "lifestyle-chaos-gezellig",
    template: "HetMoment",
    durationInSeconds: 25,
    music: "",
    props: {
      photos: [
        fajitas.localImage,
        bibimbap.localImage,
        greenCurry.localImage,
      ] as [string, string, string],
      recipeName: fajitas.name,
      cookingTime: fajitas.cookingTime,
      price: fajitas.estimatedPrice,
      servings: 6,
    },
  },
];
