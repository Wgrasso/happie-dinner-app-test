import React from "react";
import { Composition } from "remotion";
import { recipes } from "./data/recipes";
import { WatEtenWe } from "./templates/WatEtenWe";
import { FoodReveal } from "./templates/FoodReveal";
import { DataStory } from "./templates/DataStory";
import { SamenEten } from "./templates/SamenEten";
import { HetMoment } from "./templates/HetMoment";
import { StoryAd } from "./templates/StoryAd";

const carbonara = recipes.find((r) => r.name === "Carbonara")!;
const bolognese = recipes.find((r) => r.name === "Spaghetti Bolognese")!;
const pestoP = recipes.find((r) => r.name === "Pesto Pasta")!;
const padThai = recipes.find((r) => r.name === "Pad Thai")!;
const risotto = recipes.find((r) => r.name === "Mushroom Risotto")!;
const tikka = recipes.find((r) => r.name === "Chicken Tikka Masala")!;
const gnocchi = recipes.find((r) => r.name === "Gnocchi with Sage Butter")!;
const burger = recipes.find((r) => r.name === "Beef Burger")!;
const ramen = recipes.find((r) => r.name === "Ramen")!;

export const RemotionRoot: React.FC = () => (
  <>
    {/* --- WatEtenWe --- */}
    <Composition
      id="WatEtenWe"
      component={WatEtenWe as unknown as React.ComponentType<Record<string, unknown>>}
      width={1080}
      height={1920}
      fps={30}
      durationInFrames={900}
      calculateMetadata={({ props }: { props: Record<string, unknown> }) => ({
        durationInFrames: ((props.durationInSeconds as number) || 30) * 30,
        props,
      })}
      defaultProps={{
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
        music: "",
        durationInSeconds: 30,
      }}
    />

    {/* --- FoodReveal --- */}
    <Composition
      id="FoodReveal"
      component={FoodReveal as unknown as React.ComponentType<Record<string, unknown>>}
      width={1080}
      height={1920}
      fps={30}
      durationInFrames={750}
      calculateMetadata={({ props }: { props: Record<string, unknown> }) => ({
        durationInFrames: ((props.durationInSeconds as number) || 25) * 30,
        props,
      })}
      defaultProps={{
        photo: carbonara.localImage,
        recipeName: carbonara.name,
        price: carbonara.estimatedPrice,
        ingredients: [
          { naam: "Spaghetti", prijs: "\u20AC0,90" },
          { naam: "Pancetta", prijs: "\u20AC1,20" },
          { naam: "Eieren", prijs: "\u20AC0,40" },
          { naam: "Pecorino", prijs: "\u20AC0,50" },
        ],
        music: "",
        durationInSeconds: 25,
      }}
    />

    {/* --- DataStory --- */}
    <Composition
      id="DataStory"
      component={DataStory as unknown as React.ComponentType<Record<string, unknown>>}
      width={1080}
      height={1920}
      fps={30}
      durationInFrames={900}
      calculateMetadata={({ props }: { props: Record<string, unknown> }) => ({
        durationInFrames: ((props.durationInSeconds as number) || 30) * 30,
        props,
      })}
      defaultProps={{
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
        music: "",
        durationInSeconds: 30,
      }}
    />

    {/* --- SamenEten --- */}
    <Composition
      id="SamenEten"
      component={SamenEten as unknown as React.ComponentType<Record<string, unknown>>}
      width={1080}
      height={1920}
      fps={30}
      durationInFrames={900}
      calculateMetadata={({ props }: { props: Record<string, unknown> }) => ({
        durationInFrames: ((props.durationInSeconds as number) || 30) * 30,
        props,
      })}
      defaultProps={{
        chatMessages: [
          { tekst: "Maakt me niet uit", isReply: true },
          { tekst: "Ok\u00E9, pasta!", isReply: false },
          { tekst: "Ugh pasta WEER??", isReply: true },
          { tekst: "JE ZEI MAAKT NIET UIT", isReply: false },
        ],
        meals: [
          { naam: burger.name, foto: burger.localImage, liked: false },
          { naam: padThai.name, foto: padThai.localImage, liked: false },
          { naam: ramen.name, foto: ramen.localImage, liked: true },
        ],
        matchMeal: ramen.name,
        resultPhoto: ramen.localImage,
        music: "",
        durationInSeconds: 30,
      }}
    />

    {/* --- HetMoment --- */}
    <Composition
      id="HetMoment"
      component={HetMoment as unknown as React.ComponentType<Record<string, unknown>>}
      width={1080}
      height={1920}
      fps={30}
      durationInFrames={750}
      calculateMetadata={({ props }: { props: Record<string, unknown> }) => ({
        durationInFrames: ((props.durationInSeconds as number) || 25) * 30,
        props,
      })}
      defaultProps={{
        photos: [
          gnocchi.localImage,
          carbonara.localImage,
          risotto.localImage,
        ] as [string, string, string],
        recipeName: gnocchi.name,
        cookingTime: gnocchi.cookingTime,
        price: gnocchi.estimatedPrice,
        servings: 4,
        music: "",
        durationInSeconds: 25,
      }}
    />

    {/* --- StoryAd --- */}
    <Composition
      id="StoryAd"
      component={StoryAd as unknown as React.ComponentType<Record<string, unknown>>}
      width={1080}
      height={1920}
      fps={30}
      durationInFrames={900}
      calculateMetadata={({ props }: { props: Record<string, unknown> }) => ({
        durationInFrames: ((props.durationInSeconds as number) || 30) * 30,
        props,
      })}
      defaultProps={{
        scenes: [
          { type: "video", src: "student-studying-tired.mp4", text: "Het is 18:00", textPosition: "center", textAnimation: "fadeUp" },
          { type: "text", text: "Wat eten we?", textAnimation: "slamIn" },
          { type: "phone", phoneSequence: "swipe-three", phoneSize: "full" },
          { type: "text", text: "Studenten Happie.", textAnimation: "fadeUp" },
        ],
        sceneDurations: [225, 225, 225, 225],
        music: "",
        durationInSeconds: 30,
      }}
    />
  </>
);
