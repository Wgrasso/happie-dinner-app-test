import { VideoConfig } from "../types";
import { recipes } from "./recipes";

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
const caprese = recipes.find((r) => r.name === "Caprese Salad")!;

export const videos: VideoConfig[] = [
  // ─── 1. WatEtenWe — Carbonara match ────────────────────────────────────
  {
    id: "wateten-carbonara",
    template: "WatEtenWe",
    durationInSeconds: 10,
    music: "",
    props: {
      hookPhoto: bolognese.localImage,
      solutionPhoto: pestoP.localImage,
      resultPhoto: carbonara.localImage,
      recipeName: carbonara.name,
      cookingTime: carbonara.cookingTime,
      price: carbonara.estimatedPrice,
      meals: [
        { naam: padThai.name, foto: padThai.localImage, liked: false },
        { naam: risotto.name, foto: risotto.localImage, liked: false },
        { naam: carbonara.name, foto: carbonara.localImage, liked: true },
      ],
    },
  },

  // ─── 2. WatEtenWe — Ramen match ────────────────────────────────────────
  {
    id: "wateten-ramen",
    template: "WatEtenWe",
    durationInSeconds: 10,
    music: "",
    props: {
      hookPhoto: friedRice.localImage,
      solutionPhoto: greenCurry.localImage,
      resultPhoto: ramen.localImage,
      recipeName: ramen.name,
      cookingTime: ramen.cookingTime,
      price: ramen.estimatedPrice,
      meals: [
        { naam: burger.name, foto: burger.localImage, liked: false },
        { naam: tikka.name, foto: tikka.localImage, liked: false },
        { naam: ramen.name, foto: ramen.localImage, liked: true },
      ],
    },
  },

  // ─── 3. FoodReveal — Carbonara budget ──────────────────────────────────
  {
    id: "reveal-carbonara",
    template: "FoodReveal",
    durationInSeconds: 10,
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
      bezorgPrijs: "\u20AC14,50",
      besparing: "\u20AC11,50",
    },
  },

  // ─── 4. FoodReveal — Pesto Pasta ───────────────────────────────────────
  {
    id: "reveal-pesto",
    template: "FoodReveal",
    durationInSeconds: 10,
    music: "",
    props: {
      photo: pestoP.localImage,
      recipeName: pestoP.name,
      price: pestoP.estimatedPrice,
      ingredients: [
        { naam: "Penne", prijs: "\u20AC0,80" },
        { naam: "Basilicum", prijs: "\u20AC0,90" },
        { naam: "Pijnboompitten", prijs: "\u20AC1,00" },
        { naam: "Parmezaan", prijs: "\u20AC0,80" },
        { naam: "Kerstomaten", prijs: "\u20AC0,50" },
      ],
      bezorgPrijs: "\u20AC13,00",
      besparing: "\u20AC9,00",
    },
  },

  // ─── 5. DataStory — recepten onder 5 euro ──────────────────────────────
  {
    id: "data-budget",
    template: "DataStory",
    durationInSeconds: 10,
    music: "",
    props: {
      bgPhoto: bolognese.localImage,
      statNummer: 11,
      statSuffix: "",
      statLabel: "recepten onder \u20AC5 in Happie",
      chartData: [
        { label: "bezorgen", value: 60 },
        { label: "zelf", value: 40 },
        { label: "afhaal", value: 50 },
        { label: "happie", value: 85, highlight: true },
      ],
      vergelijking: {
        linksLabel: "Thuisbezorgd",
        linksWaarde: "\u20AC12",
        rechtsLabel: "Happie",
        rechtsWaarde: "\u20AC3",
        conclusie: "Bespaar \u20AC270/maand",
      },
      ctaPhoto: tikka.localImage,
    },
  },

  // ─── 6. DataStory — maandelijkse besparing ────────────────────────────
  {
    id: "data-bespaar",
    template: "DataStory",
    durationInSeconds: 12,
    music: "",
    props: {
      bgPhoto: pizza.localImage,
      statNummer: 80,
      statSuffix: "\u20AC",
      statLabel: "per maand besparen op eten",
      chartData: [
        { label: "jan", value: 30 },
        { label: "feb", value: 55 },
        { label: "mrt", value: 75, highlight: true },
        { label: "apr", value: 90, highlight: true },
      ],
      vergelijking: {
        linksLabel: "Zonder Happie",
        linksWaarde: "\u20AC400",
        rechtsLabel: "Met Happie",
        rechtsWaarde: "\u20AC130",
        conclusie: "Dat is 3 festivals per jaar",
      },
      ctaPhoto: ramen.localImage,
    },
  },

  // ─── 7. SamenEten — huisgenoten ───────────────────────────────────────
  {
    id: "samen-huisgenoten",
    template: "SamenEten",
    durationInSeconds: 15,
    music: "",
    props: {
      chatMessages: [
        { tekst: "Wat eten we?", isReply: false },
        { tekst: "Weet niet", isReply: false },
        { tekst: "Ugh weer pasta", isReply: false },
        { tekst: "Download Happie!", isReply: true },
      ],
      meals: [
        { naam: burger.name, foto: burger.localImage, liked: false },
        { naam: padThai.name, foto: padThai.localImage, liked: false },
        { naam: bibimbap.name, foto: bibimbap.localImage, liked: true },
      ],
      matchMeal: bibimbap.name,
      resultPhoto: bibimbap.localImage,
    },
  },

  // ─── 8. SamenEten — koppel ────────────────────────────────────────────
  {
    id: "samen-koppel",
    template: "SamenEten",
    durationInSeconds: 15,
    music: "",
    props: {
      chatMessages: [
        { tekst: "Schat wat eten we?", isReply: false },
        { tekst: "Maakt me niet uit", isReply: true },
        { tekst: "Kies dan iets", isReply: false },
        { tekst: "Laten we swipen!", isReply: true },
      ],
      meals: [
        { naam: shakshuka.name, foto: shakshuka.localImage, liked: false },
        { naam: greenCurry.name, foto: greenCurry.localImage, liked: false },
        { naam: ramen.name, foto: ramen.localImage, liked: true },
      ],
      matchMeal: ramen.name,
      resultPhoto: ramen.localImage,
    },
  },

  // ─── 9. HetMoment — Gnocchi ───────────────────────────────────────────
  {
    id: "moment-gnocchi",
    template: "HetMoment",
    durationInSeconds: 8,
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

  // ─── 10. HetMoment — Caprese ──────────────────────────────────────────
  {
    id: "moment-caprese",
    template: "HetMoment",
    durationInSeconds: 10,
    music: "",
    props: {
      photos: [
        caprese.localImage,
        pestoP.localImage,
        pizza.localImage,
      ] as [string, string, string],
      recipeName: caprese.name,
      cookingTime: caprese.cookingTime,
      price: caprese.estimatedPrice,
      servings: 2,
    },
  },
];
