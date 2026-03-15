export interface Meal {
  naam: string;
  foto: string;
  liked: boolean;
}

export interface ChartBar {
  label: string;
  value: number;
  highlight?: boolean;
}

export interface Vergelijking {
  linksLabel: string;
  linksWaarde: string;
  rechtsLabel: string;
  rechtsWaarde: string;
  conclusie: string;
}

export interface ChatBericht {
  tekst: string;
  isReply: boolean;
}

export type VideoConfig =
  | {
      id: string;
      template: "SwipeTinder";
      durationInSeconds: 10;
      music: string;
      props: {
        hookText: string;
        meals: Meal[];
        matchMeal: string;
        ctaText?: string;
      };
    }
  | {
      id: string;
      template: "TekstStory";
      durationInSeconds: 8 | 10;
      music: string;
      props: {
        hookText: string;
        antwoord: string;
        tagline?: string;
        mode?: "dark" | "light";
      };
    }
  | {
      id: string;
      template: "StatReel";
      durationInSeconds: 10 | 12;
      music: string;
      props: {
        statNummer: number;
        statSuffix: string;
        statLabel: string;
        chartData: ChartBar[];
        vergelijking: Vergelijking;
      };
    }
  | {
      id: string;
      template: "AppDemo";
      durationInSeconds: 13 | 15;
      music: string;
      props: {
        probleem: string;
        schermen: ("home" | "swipe" | "result" | "boodschappen")[];
        features: string[];
      };
    }
  | {
      id: string;
      template: "MemeFormat";
      durationInSeconds: 8 | 10;
      music: string;
      props:
        | { variant: "split"; links: { tekst: string; emoji: string }; rechts: { tekst: string; emoji: string } }
        | { variant: "tierlist"; items: { tier: "S" | "A" | "B" | "F"; label: string }[] }
        | { variant: "chat"; berichten: ChatBericht[]; punchline: string };
    };
