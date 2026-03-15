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
const fajitas = recipes.find((r) => r.name === "Chicken Fajitas")!;
const fishTacos = recipes.find((r) => r.name === "Fish Tacos")!;
const chickenWrap = recipes.find((r) => r.name === "Chicken Wrap")!;

// 10 selected videos: 2 best from each of the 5 categories
export const videos: VideoConfig[] = [
  // ─── PROBLEEM 1: Groepsapp chaos (WatEtenWe) ────────────────────────────
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

  // ─── PROBLEEM 2: 8 mensen, 8 meningen (WatEtenWe) ──────────────────────
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

  // ─── FEATURE 1: Swipe samen (WatEtenWe) ─────────────────────────────────
  {
    id: "feature-swipe-samen",
    template: "WatEtenWe",
    durationInSeconds: 30,
    music: "",
    props: {
      hookPhoto: carbonara.localImage,
      solutionPhoto: pestoP.localImage,
      resultPhoto: ramen.localImage,
      recipeName: ramen.name,
      cookingTime: ramen.cookingTime,
      price: ramen.estimatedPrice,
      meals: [
        { naam: burger.name, foto: burger.localImage, liked: false },
        { naam: pizza.name, foto: pizza.localImage, liked: false },
        { naam: ramen.name, foto: ramen.localImage, liked: true },
      ],
    },
  },

  // ─── FEATURE 2: Top 3 recepten (WatEtenWe) ──────────────────────────────
  {
    id: "feature-top-3",
    template: "WatEtenWe",
    durationInSeconds: 30,
    music: "",
    props: {
      hookPhoto: friedRice.localImage,
      solutionPhoto: tikka.localImage,
      resultPhoto: shakshuka.localImage,
      recipeName: shakshuka.name,
      cookingTime: shakshuka.cookingTime,
      price: shakshuka.estimatedPrice,
      meals: [
        { naam: pestoP.name, foto: pestoP.localImage, liked: false },
        { naam: carbonara.name, foto: carbonara.localImage, liked: false },
        { naam: shakshuka.name, foto: shakshuka.localImage, liked: true },
      ],
    },
  },

  // ─── HUMOR 1: Die ene huisgenoot (SamenEten) ────────────────────────────
  {
    id: "humor-maakt-niet-uit",
    template: "SamenEten",
    durationInSeconds: 30,
    music: "",
    props: {
      chatMessages: [
        { tekst: "Wat eten we vanavond?", isReply: false },
        { tekst: "Maakt me niet uit", isReply: true },
        { tekst: "Kies dan iets!", isReply: false },
        { tekst: "Ugh, niet dit weer", isReply: true },
        { tekst: "Download Happie!", isReply: false },
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

  // ─── HUMOR 2: Sushi op studentenbudget (SamenEten) ──────────────────────
  {
    id: "humor-sushi-budget",
    template: "SamenEten",
    durationInSeconds: 30,
    music: "",
    props: {
      chatMessages: [
        { tekst: "Laten we sushi doen!", isReply: false },
        { tekst: "Sushi?? Met \u20AC2??", isReply: true },
        { tekst: "Ik ben blut", isReply: false },
        { tekst: "Fried Rice = \u20AC2,50", isReply: true },
        { tekst: "Deal!", isReply: false },
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

  // ─── LIFESTYLE 1: Samen aan tafel (HetMoment) ───────────────────────────
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

  // ─── LIFESTYLE 2: Van chaos naar gezellig (HetMoment) ───────────────────
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

  // ─── DATA 1: \u20AC80 per maand besparen (DataStory) ──────────────────────────
  {
    id: "data-besparing",
    template: "DataStory",
    durationInSeconds: 30,
    music: "",
    props: {
      bgPhoto: bolognese.localImage,
      statNummer: 80,
      statSuffix: "\u20AC",
      statLabel: "per maand besparen op eten",
      chartData: [
        { label: "bezorgen", value: 60 },
        { label: "zelf", value: 40 },
        { label: "afhaal", value: 50 },
        { label: "happie", value: 85, highlight: true },
      ],
      vergelijking: {
        linksLabel: "Thuisbezorgd",
        linksWaarde: "\u20AC400",
        rechtsLabel: "Met Happie",
        rechtsWaarde: "\u20AC130",
        conclusie: "Dat is 3 festivals per jaar",
      },
      ctaPhoto: tikka.localImage,
    },
  },

  // ─── DATA 2: Van \u20AC12 naar \u20AC3 (DataStory) ──────────────────────────────────
  {
    id: "data-van-12-naar-3",
    template: "DataStory",
    durationInSeconds: 30,
    music: "",
    props: {
      bgPhoto: carbonara.localImage,
      statNummer: 285,
      statSuffix: "\u20AC",
      statLabel: "bespaard per maand",
      chartData: [
        { label: "jan", value: 30 },
        { label: "feb", value: 55 },
        { label: "mrt", value: 75, highlight: true },
        { label: "apr", value: 90, highlight: true },
      ],
      vergelijking: {
        linksLabel: "Bezorgd",
        linksWaarde: "\u20AC12,50",
        rechtsLabel: "Happie",
        rechtsWaarde: "\u20AC3,00",
        conclusie: "Bespaar \u20AC285/maand",
      },
      ctaPhoto: chickenWrap.localImage,
    },
  },
];
