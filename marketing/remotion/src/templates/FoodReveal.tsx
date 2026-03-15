import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { TransitionSeries } from "@remotion/transitions";
import { slide } from "@remotion/transitions/slide";
import { clockWipe } from "@remotion/transitions/clock-wipe";
import { fade } from "@remotion/transitions/fade";
import { springTiming, linearTiming } from "@remotion/transitions";
import { AnimatedText } from "../components/AnimatedText";
import { BackgroundMusic } from "../components/BackgroundMusic";
import { Logo } from "../components/Logo";
import { PhotoBackground } from "../components/PhotoBackground";
import { PriceTag } from "../components/PriceTag";
import { VideoBackground } from "../components/VideoBackground";
import {
  AnimatedCounter,
  AnimatedUnderline,
  GradientBackground,
  GradientWave,
  RevealMask,
  ScreenWipe,
  AnimatedLine,
  AnimatedAppUI,
} from "../components/motion";
import { colors } from "../theme/colors";
import { fonts } from "../theme/fonts";

export interface FoodRevealProps {
  photo: string;
  recipeName: string;
  price: number;
  ingredients: { naam: string; prijs: string }[];
  bezorgPrijs: string;
  besparing: string;
  music: string;
  durationInSeconds: number;
}

// --- FoodReveal PERSONALITY: Luxurious, slow. Food photos linger.
// Warm amber tones dominate. Elegant serif typography.
// Color: warm amber overlay on everything.

// --- Scene 1: HOOK (60 frames) --- Food photo, massive price ---

const HookScene: React.FC<{
  photo: string;
  price: number;
}> = ({ photo, price }) => {
  return (
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
};

// --- Scene 2: RECIPE NAME (60 frames) --- linger on food ---

const RecipeNameScene: React.FC<{
  photo: string;
  recipeName: string;
  price: number;
}> = ({ photo, recipeName, price }) => {
  return (
    <AbsoluteFill>
      <PhotoBackground
        src={photo}
        overlay="rgba(45,27,18,0.35)"
        kenBurns
        kenBurnsScale={[1.05, 1.12]}
        warmth={0.8}
      />
      <ScreenWipe startFrame={0} durationFrames={14} color="rgba(139,115,85,0.8)" direction="right" />
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
};

// --- Scene 3: INGREDIENTS (120 frames) --- over video ---

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

        {/* Running total */}
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

// --- Scene 4: COMPARISON (90 frames) --- PriceTag ---

const CompareScene: React.FC<{
  bezorgPrijs: string;
  price: number;
}> = ({ bezorgPrijs, price }) => {
  return (
    <AbsoluteFill>
      {/* Warm amber background instead of gradient */}
      <GradientBackground
        colors={["#2d1b12", "#1a1008", "#3d2518"]}
        animate
        angle={135}
      />
      <ScreenWipe startFrame={0} durationFrames={14} color="rgba(139,115,85,0.6)" direction="down" />
      <AbsoluteFill
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 36,
        }}
      >
        <AnimatedText
          text="Thuisbezorgd?"
          fontSize={36}
          fontFamily="heading"
          color="rgba(255,220,180,0.6)"
          animation="fadeUp"
          startFrame={3}
          shadow
        />
        <PriceTag
          price={bezorgPrijs}
          newPrice={`\u20AC${price.toFixed(2)}`}
          startFrame={8}
        />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// --- Scene 5: SAVINGS (90 frames) --- AnimatedCounter ---

const SavingsScene: React.FC<{
  besparing: string;
}> = ({ besparing }) => {
  const numMatch = besparing.match(/\d+/);
  const savingsNum = numMatch ? parseInt(numMatch[0], 10) : 120;

  return (
    <AbsoluteFill>
      <GradientBackground
        colors={["#1a1008", "#2d1b12", "#3d2518"]}
        animate
        angle={180}
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
        <AnimatedCounter
          from={0}
          to={savingsNum}
          startFrame={5}
          durationFrames={40}
          prefix={"\u20AC"}
          fontSize={80}
          color="rgba(255,200,150,0.95)"
          showUnderline
          underlineColor="rgba(255,200,150,0.6)"
        />
        <AnimatedText
          text="per maand besparen"
          fontSize={28}
          fontFamily="heading"
          color="rgba(255,220,180,0.7)"
          animation="fadeUp"
          startFrame={40}
          shadow
        />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// --- Scene 6: APP DEMO (120 frames) ---

const AppDemoScene: React.FC<{
  recipeName: string;
}> = ({ recipeName }) => {
  return (
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
};

// --- Scene 7: CTA (90 frames) --- with fade to black ---

const CTAScene: React.FC<{
  photo: string;
}> = ({ photo }) => {
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
      {/* Fade to black for seamless loop */}
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

// --- Main Template -----------------------------------------------------------

export const FoodReveal: React.FC<FoodRevealProps> = ({
  photo,
  recipeName,
  price,
  ingredients,
  bezorgPrijs,
  besparing,
  music,
}) => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <TransitionSeries>
        {/* Scene 1: Hook (60 frames) */}
        <TransitionSeries.Sequence durationInFrames={60}>
          <HookScene photo={photo} price={price} />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: 15 })}
        />

        {/* Scene 2: Recipe name (60 frames) */}
        <TransitionSeries.Sequence durationInFrames={60}>
          <RecipeNameScene photo={photo} recipeName={recipeName} price={price} />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={slide()}
          timing={springTiming({ config: { damping: 14 } })}
        />

        {/* Scene 3: Ingredients over video (120 frames) */}
        <TransitionSeries.Sequence durationInFrames={120}>
          <IngredientsScene ingredients={ingredients} price={price} />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={slide()}
          timing={springTiming({ config: { damping: 14 } })}
        />

        {/* Scene 4: Comparison PriceTag (90 frames) */}
        <TransitionSeries.Sequence durationInFrames={90}>
          <CompareScene bezorgPrijs={bezorgPrijs} price={price} />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: 12 })}
        />

        {/* Scene 5: Savings (90 frames) */}
        <TransitionSeries.Sequence durationInFrames={90}>
          <SavingsScene besparing={besparing} />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: 12 })}
        />

        {/* Scene 6: App demo (120 frames) */}
        <TransitionSeries.Sequence durationInFrames={120}>
          <AppDemoScene recipeName={recipeName} />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: 12 })}
        />

        {/* Scene 7: CTA (90 frames) */}
        <TransitionSeries.Sequence durationInFrames={90}>
          <CTAScene photo={photo} />
        </TransitionSeries.Sequence>
      </TransitionSeries>

      <BackgroundMusic src={music} />
    </AbsoluteFill>
  );
};
