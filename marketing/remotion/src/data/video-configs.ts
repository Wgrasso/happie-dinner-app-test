import { VideoConfig } from "../types";

export const videos: VideoConfig[] = [
  // 1. SwipeTinder
  {
    id: "swipe-pasta",
    template: "SwipeTinder",
    durationInSeconds: 10,
    music: "upbeat-1.mp3",
    props: {
      hookText: "POV: Tinder maar dan voor eten 🍝",
      meals: [
        { naam: "Nasi Goreng", foto: "nasi.jpg", liked: false },
        { naam: "Shoarma Bowl", foto: "shoarma.jpg", liked: false },
        { naam: "Pasta Carbonara", foto: "carbonara.jpg", liked: true },
      ],
      matchMeal: "Pasta Carbonara",
    },
  },
  // 2. SwipeTinder
  {
    id: "swipe-huisgenoten",
    template: "SwipeTinder",
    durationInSeconds: 10,
    music: "upbeat-1.mp3",
    props: {
      hookText: "Mijn huisgenoten en ik swipen voor het avondeten",
      meals: [
        { naam: "Pannenkoeken", foto: "pannenkoeken.jpg", liked: false },
        { naam: "Wraps", foto: "wraps.jpg", liked: true },
        { naam: "Ramen", foto: "ramen.jpg", liked: false },
      ],
      matchMeal: "Wraps",
    },
  },
  // 3. TekstStory
  {
    id: "tekst-budget",
    template: "TekstStory",
    durationInSeconds: 8,
    music: "chill-1.mp3",
    props: {
      hookText: "Je hebt €3 voor avondeten",
      antwoord: "Happie zegt: Pasta Aglio e Olio — €2,80 • 15 min",
      mode: "dark",
    },
  },
  // 4. TekstStory
  {
    id: "tekst-inspiratie",
    template: "TekstStory",
    durationInSeconds: 10,
    music: "chill-1.mp3",
    props: {
      hookText: "Geen inspiratie om te koken?",
      antwoord: "Swipe door 100+ recepten in 30 seconden",
      mode: "light",
    },
  },
  // 5. StatReel
  {
    id: "stat-bezorging",
    template: "StatReel",
    durationInSeconds: 10,
    music: "upbeat-1.mp3",
    props: {
      statNummer: 87,
      statSuffix: "%",
      statLabel: "van studenten kookt max 2x per week",
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
        rechtsWaarde: "€3",
        conclusie: "Bespaar €270/maand",
      },
    },
  },
  // 6. StatReel
  {
    id: "stat-bespaar",
    template: "StatReel",
    durationInSeconds: 12,
    music: "upbeat-1.mp3",
    props: {
      statNummer: 270,
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
  // 7. AppDemo
  {
    id: "demo-swipe",
    template: "AppDemo",
    durationInSeconds: 13,
    music: "upbeat-1.mp3",
    props: {
      probleem: "Wat eten we vanavond?",
      schermen: ["home", "swipe", "result"],
      features: ["Gratis", "Budget recepten", "Met je huisgenoten"],
    },
  },
  // 8. AppDemo
  {
    id: "demo-samen",
    template: "AppDemo",
    durationInSeconds: 15,
    music: "chill-1.mp3",
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
    music: "upbeat-1.mp3",
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
    music: "chill-1.mp3",
    props: {
      variant: "chat",
      berichten: [
        { tekst: "Wat eten we vanavond?", isReply: false },
        { tekst: "Weet niet", isReply: false },
        { tekst: "Pasta?", isReply: false },
        { tekst: "Nee weer pasta", isReply: false },
        { tekst: "Download gewoon Happie 😤", isReply: true },
      ],
      punchline: "Download gewoon Happie 😤",
    },
  },
];
