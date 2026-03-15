import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { AnimatedText } from "../components/AnimatedText";
import { BackgroundMusic } from "../components/BackgroundMusic";
import { Logo } from "../components/Logo";
import { PhotoBackground } from "../components/PhotoBackground";
import { VideoBackground } from "../components/VideoBackground";
import {
  AnimatedCounter,
  AnimatedUnderline,
  GradientBackground,
  GradientWave,
  AnimatedAppUI,
} from "../components/motion";
import { colors } from "../theme/colors";
import { fonts } from "../theme/fonts";

export interface FoodRevealProps {
  photo: string;
  recipeName: string;
  price: number;
  ingredients: { naam: string; prijs: string }[];
  music: string;
  durationInSeconds: number;
}

// --- FoodReveal PERSONALITY: Luxurious, slow. Food photos linger.
// Warm amber tones. Story-first: food visuals 80%, app 20%.
// No more bezorgPrijs/besparing/Thuisbezorgd comparisons.

const HookScene: React.FC<{
  photo: string;
  price: number;
}> = ({ photo, price }) => (
  <AbsoluteFill>
    <PhotoBackground
      src={photo}
      overlay="rgba(45,27,18,0.25)"
      kenBurns
      kenBurnsScale={[1, 1.1]}
      warmth={0.7}
    />
    <AbsoluteFill
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
      }}
    >
      <AnimatedText
        text={`\u20AC${price.toFixed(2)}`}
        fontSize={120}
        fontFamily="heading"
        color={colors.white}
        animation="popIn"
        startFrame={5}
        shadow
        glow="rgba(255,200,150,0.3)"
      />
      <AnimatedUnderline startFrame={22} width={300} color="rgba(255,200,150,0.6)" strokeWidth={4} />
    </AbsoluteFill>
  </AbsoluteFill>
);

const RecipeNameScene: React.FC<{
  photo: string;
  recipeName: string;
  price: number;
}> = ({ photo, recipeName, price }) => (
  <AbsoluteFill>
    <PhotoBackground
      src={photo}
      overlay="rgba(45,27,18,0.35)"
      kenBurns
      kenBurnsScale={[1.05, 1.12]}
      warmth={0.8}
    />
    <AbsoluteFill
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 16,
      }}
    >
      <AnimatedText
        text={recipeName}
        fontSize={52}
        fontFamily="heading"
        color={colors.white}
        animation="letterStagger"
        startFrame={5}
        shadow
      />
      <AnimatedText
        text={`\u20AC${price.toFixed(2)} per persoon`}
        fontSize={28}
        fontFamily="body"
        color="rgba(255,220,180,0.85)"
        animation="fadeUp"
        startFrame={25}
        shadow
      />
    </AbsoluteFill>
  </AbsoluteFill>
);

const IngredientsScene: React.FC<{
  ingredients: { naam: string; prijs: string }[];
  price: number;
}> = ({ ingredients, price }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const totalProgress = interpolate(frame, [10, 110], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const displayTotal = (totalProgress * price).toFixed(2);

  return (
    <AbsoluteFill>
      <VideoBackground
        src="cutting-vegetables.mp4"
        overlay="rgba(45,27,18,0.6)"
        playbackRate={0.7}
      />
      <AbsoluteFill
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "0 80px",
          gap: 0,
        }}
      >
        {ingredients.slice(0, 6).map((item, i) => {
          const itemStart = 10 + i * 18;
          const itemProgress = spring({
            frame: Math.max(0, frame - itemStart),
            fps,
            config: { damping: 14, stiffness: 160 },
          });
          const itemX = interpolate(itemProgress, [0, 1], [250, 0]);
          const itemOpacity = interpolate(itemProgress, [0, 1], [0, 1]);

          return (
            <div
              key={i}
              style={{
                display: "flex",
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                width: "100%",
                maxWidth: 700,
                padding: "12px 0",
                borderBottom: "1px solid rgba(255,220,180,0.15)",
                opacity: itemOpacity,
                transform: `translateX(${itemX}px)`,
              }}
            >
              <span
                style={{
                  fontFamily: fonts.heading,
                  fontSize: 28,
                  color: colors.white,
                  fontWeight: 400,
                  textShadow: "0 4px 30px rgba(0,0,0,0.8), 0 2px 10px rgba(0,0,0,0.5)",
                }}
              >
                {item.naam}
              </span>
              <span
                style={{
                  fontFamily: fonts.body,
                  fontSize: 28,
                  color: "rgba(255,200,150,0.9)",
                  fontWeight: 600,
                  textShadow: "0 4px 30px rgba(0,0,0,0.8), 0 2px 10px rgba(0,0,0,0.5)",
                }}
              >
                {item.prijs}
              </span>
            </div>
          );
        })}
        <div
          style={{
            marginTop: 30,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <span
            style={{
              fontFamily: fonts.heading,
              fontSize: 52,
              fontWeight: 700,
              color: colors.white,
              textShadow: "0 4px 30px rgba(0,0,0,0.8), 0 2px 10px rgba(0,0,0,0.5)",
            }}
          >
            Totaal: {"\u20AC"}{displayTotal}
          </span>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const CookingScene: React.FC = () => (
  <AbsoluteFill>
    <VideoBackground
      src="cooking-pan-sizzle.mp4"
      overlay="rgba(45,27,18,0.3)"
      playbackRate={0.8}
    />
    <AbsoluteFill
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-end",
        paddingBottom: 300,
      }}
    >
      <AnimatedText
        text="Van boodschappen naar tafel."
        fontSize={40}
        fontFamily="heading"
        color={colors.white}
        animation="fadeUp"
        startFrame={15}
        shadow
        maxWidth={800}
      />
    </AbsoluteFill>
  </AbsoluteFill>
);

const AppDemoScene: React.FC<{ recipeName: string }> = ({ recipeName }) => (
  <AbsoluteFill>
    <GradientWave
      colors={["#2d1b12", "#1a1008", "#3d2518"]}
      speed={0.6}
      direction="diagonal"
    />
    <AbsoluteFill
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 16,
      }}
    >
      <AnimatedAppUI
        startFrame={5}
        sequence="recipe-detail"
        recipe={{
          name: recipeName,
          image: "carbonara.jpg",
          cookingTime: 20,
          description: "Snel, simpel en betaalbaar.",
          ingredients: ["Pasta", "Groente", "Kruiden", "Olie", "Kaas"],
        }}
      />
    </AbsoluteFill>
  </AbsoluteFill>
);

const CTAScene: React.FC<{ photo: string }> = ({ photo }) => {
  const frame = useCurrentFrame();
  const fadeOut = interpolate(frame, [75, 90], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill>
      <PhotoBackground
        src={photo}
        overlay="rgba(45,27,18,0.6)"
        kenBurns
        kenBurnsScale={[1, 1.06]}
        warmth={0.8}
      />
      <AbsoluteFill
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 30,
        }}
      >
        <Logo animation="fadeIn" size={650} startFrame={5} />
        <AnimatedText
          text="60+ recepten onder \u20AC5"
          fontSize={36}
          fontFamily="heading"
          color={colors.white}
          animation="fadeUp"
          startFrame={25}
          shadow
        />
      </AbsoluteFill>
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundColor: "#000",
          opacity: fadeOut,
          zIndex: 100,
        }}
      />
    </AbsoluteFill>
  );
};

// --- Main Template: frame-based cuts ---
export const FoodReveal: React.FC<FoodRevealProps> = ({
  photo,
  recipeName,
  price,
  ingredients,
  music,
}) => {
  const frame = useCurrentFrame();

  // Story-first: food visuals 80%, app 20%
  // Total 750 frames = 25s
  // Story: Hook(75) + RecipeName(75) + Ingredients(150) + Cooking(120) = 420 (14s)
  // + more food(90) = 510 (17s)
  // App: AppDemo(120) + CTA(120) = 240 (8s) => ~68/32 split
  const sceneDurations = [75, 75, 150, 120, 90, 120, 120];

  let accumulated = 0;
  let sceneIndex = 0;
  for (let i = 0; i < sceneDurations.length; i++) {
    if (frame < accumulated + sceneDurations[i]) {
      sceneIndex = i;
      break;
    }
    accumulated += sceneDurations[i];
    if (i === sceneDurations.length - 1) sceneIndex = i;
  }

  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      {sceneIndex === 0 && <HookScene photo={photo} price={price} />}
      {sceneIndex === 1 && <RecipeNameScene photo={photo} recipeName={recipeName} price={price} />}
      {sceneIndex === 2 && <IngredientsScene ingredients={ingredients} price={price} />}
      {sceneIndex === 3 && <CookingScene />}
      {sceneIndex === 4 && (
        <AbsoluteFill>
          <PhotoBackground
            src={photo}
            overlay="rgba(45,27,18,0.2)"
            kenBurns
            kenBurnsScale={[1, 1.1]}
            warmth={0.7}
          />
          <AbsoluteFill
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 14,
            }}
          >
            <AnimatedText
              text={recipeName}
              fontSize={48}
              fontFamily="heading"
              color={colors.white}
              animation="popIn"
              startFrame={10}
              shadow
              glow="rgba(255,200,150,0.2)"
            />
          </AbsoluteFill>
        </AbsoluteFill>
      )}
      {sceneIndex === 5 && <AppDemoScene recipeName={recipeName} />}
      {sceneIndex === 6 && <CTAScene photo={photo} />}
      <BackgroundMusic src={music} />
    </AbsoluteFill>
  );
};
