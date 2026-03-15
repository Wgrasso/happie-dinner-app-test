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
  // ─── 1: "De Koelkast Interventie" (WatEtenWe) ─────────────────────────────
  // Hook: "Je koelkast huilt." — lege koelkast → Happie → Mushroom Risotto
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

  // ─── 2: "Wereldkeuken" (FoodReveal) ───────────────────────────────────────
  // Hook: "22 landen. 1 keuken." — Thai Green Curry met prijs breakdown
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
        { naam: "Kippendij", prijs: "€1,80" },
        { naam: "Kokosmelk", prijs: "€1,20" },
        { naam: "Currypasta", prijs: "€0,90" },
        { naam: "Groenten", prijs: "€0,60" },
        { naam: "Jasmine rijst", prijs: "€0,50" },
      ],
      bezorgPrijs: "€16,50",
      besparing: "€345/maand",
    },
  },

  // ─── 3: "Het Stemmen Begint" (SamenEten) ──────────────────────────────────
  // Hook: "Democratie in de keuken." — iedereen swipet → Korean Fried Chicken wint
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
        { tekst: "We gaan STEMMEN 🗳️", isReply: true },
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

  // ─── 4: "20 Minuten" (DataStory) ──────────────────────────────────────────
  // Hook: "Sneller dan Thuisbezorgd." — Poke Bowl als voorbeeld: 20 min, €5
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
      chartTitle: "Wachttijd vs kooktijd",
      chartData: [
        { label: "Thuisbezorgd", value: 45 },
        { label: "Afhalen", value: 30 },
        { label: "Supermarkt", value: 55 },
        { label: "Happie", value: 20, highlight: true },
      ],
      vergelijking: {
        linksLabel: "Bezorging",
        linksWaarde: "45 min + €15",
        rechtsLabel: "Poke Bowl",
        rechtsWaarde: "20 min + €5",
        conclusie: "Sneller, goedkoper, lekkerder",
      },
      ctaPhoto: pokeBowl.localImage,
    },
  },

  // ─── 5: "First Date Dinner" (HetMoment) ───────────────────────────────────
  // Hook: "Indruk maken? Kook." — Ramen close-up, cinematisch, warm
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

  // ─── 6: "De Weekplanner" (WatEtenWe) ──────────────────────────────────────
  // Hook: "Maandag: paniek. Dinsdag: paniek." — plan vooruit → Lasagna + Fish Tacos
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

  // ─── 7: "Geheim Recept" (FoodReveal) ──────────────────────────────────────
  // Hook: "Dit kost €3." — Shakshuka, 5 ingrediënten, 25 minuten
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
        { naam: "Eieren (6x)", prijs: "€1,00" },
        { naam: "Tomaten (blik)", prijs: "€0,80" },
        { naam: "Paprika's", prijs: "€0,60" },
        { naam: "Ui + knoflook", prijs: "€0,30" },
        { naam: "Kruiden", prijs: "€0,30" },
      ],
      bezorgPrijs: "€13,00",
      besparing: "€300/maand",
    },
  },

  // ─── 8: "De Transformation" (SamenEten) ───────────────────────────────────
  // Hook: "Week 1 vs Week 8." — tosti → Vietnamese Pho
  {
    id: "b2-transformation",
    template: "SamenEten",
    durationInSeconds: 30,
    music: "",
    props: {
      chatMessages: [
        { tekst: "Tosti?", isReply: false },
        { tekst: "Tosti.", isReply: true },
        { tekst: "— 8 weken later —", isReply: false },
        { tekst: "Vietnamese Pho vanavond! 🍜", isReply: true },
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

  // ─── 9: "Festival Budget" (DataStory) ─────────────────────────────────────
  // Hook: "3 festivals per jaar." — €270/maand besparen → Chicken Fajitas €4
  {
    id: "b2-festival-budget",
    template: "DataStory",
    durationInSeconds: 30,
    music: "",
    props: {
      bgPhoto: chickenFajitas.localImage,
      statNummer: 3,
      statSuffix: "x",
      statLabel: "festivals per jaar extra",
      chartTitle: "Waar gaat je geld heen?",
      chartData: [
        { label: "Bezorgen", value: 90 },
        { label: "Afhaal", value: 70 },
        { label: "Uit eten", value: 95 },
        { label: "Met Happie", value: 25, highlight: true },
      ],
      vergelijking: {
        linksLabel: "Bezorgen",
        linksWaarde: "€400/maand",
        rechtsLabel: "Happie",
        rechtsWaarde: "€130/maand",
        conclusie: "€270 = 3 festivals per jaar",
      },
      ctaPhoto: chickenFajitas.localImage,
    },
  },

  // ─── 10: "Taco Tuesday" (HetMoment) ───────────────────────────────────────
  // Hook: "Elke dinsdag hetzelfde ritueel." — Fish Tacos, warm, nostalgisch
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
