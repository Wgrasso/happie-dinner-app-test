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
      template: "WatEtenWe";
      durationInSeconds: 10;
      music: string;
      props: {
        hookPhoto: string;
        solutionPhoto: string;
        resultPhoto: string;
        recipeName: string;
        cookingTime: number;
        price: number;
        meals: Meal[];
      };
    }
  | {
      id: string;
      template: "FoodReveal";
      durationInSeconds: 10;
      music: string;
      props: {
        photo: string;
        recipeName: string;
        price: number;
        ingredients: { naam: string; prijs: string }[];
        bezorgPrijs: string;
        besparing: string;
      };
    }
  | {
      id: string;
      template: "DataStory";
      durationInSeconds: 10 | 12;
      music: string;
      props: {
        bgPhoto: string;
        statNummer: number;
        statSuffix: string;
        statLabel: string;
        chartData: ChartBar[];
        vergelijking: Vergelijking;
        ctaPhoto: string;
      };
    }
  | {
      id: string;
      template: "SamenEten";
      durationInSeconds: 12 | 15;
      music: string;
      props: {
        chatMessages: ChatBericht[];
        meals: Meal[];
        matchMeal: string;
        resultPhoto: string;
      };
    }
  | {
      id: string;
      template: "HetMoment";
      durationInSeconds: 8 | 10;
      music: string;
      props: {
        photos: [string, string, string];
        recipeName: string;
        cookingTime: number;
        price: number;
        servings: number;
      };
    };
