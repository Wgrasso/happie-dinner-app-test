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

// --- Scene 1: HOOK --- Food photo, massive price glows in --------------------

const HookScene: React.FC<{
  photo: string;
  price: number;
}> = ({ photo, price }) => {
  return (
    <AbsoluteFill>
      <PhotoBackground
        src={photo}
        overlay="rgba(0,0,0,0.2)"
        kenBurns
        kenBurnsScale={[1, 1.12]}
        warmth={0.4}
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
          text={`\u20AC${price.toFixed(2)}`}
          fontSize={120}
          fontFamily="heading"
          color={colors.white}
          animation="popIn"
          startFrame={5}
          shadow
          glow="rgba(255,255,255,0.3)"
        />
        <AnimatedUnderline startFrame={25} width={300} color={colors.logoCoral} strokeWidth={5} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// --- Scene 2: RECIPE NAME over photo -----------------------------------------

const RecipeNameScene: React.FC<{
  photo: string;
  recipeName: string;
  price: number;
}> = ({ photo, recipeName, price }) => {
  return (
    <AbsoluteFill>
      <PhotoBackground
        src={photo}
        overlay="rgba(0,0,0,0.35)"
        kenBurns
        kenBurnsScale={[1.05, 1.12]}
        warmth={0.5}
      />
      <ScreenWipe startFrame={0} durationFrames={16} color={colors.logoCoral} direction="right" />
      <AbsoluteFill
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 20,
        }}
      >
        <AnimatedText
          text={`\u20AC${price.toFixed(2)}`}
          fontSize={96}
          fontFamily="heading"
          color={colors.white}
          animation="fadeUp"
          startFrame={0}
          shadow
          glow="rgba(255,255,255,0.2)"
        />
        <AnimatedText
          text={recipeName}
          fontSize={44}
          fontFamily="heading"
          color="rgba(255,255,255,0.9)"
          animation="popIn"
          startFrame={10}
          shadow
        />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// --- Scene 3: INGREDIENTS over cutting-vegetables video ----------------------

const IngredientsScene: React.FC<{
  ingredients: { naam: string; prijs: string }[];
  price: number;
}> = ({ ingredients, price }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const totalProgress = interpolate(frame, [10, 220], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const displayTotal = (totalProgress * price).toFixed(2);

  return (
    <AbsoluteFill>
      <VideoBackground
        src="cutting-vegetables.mp4"
        overlay="rgba(0,0,0,0.65)"
        playbackRate={0.8}
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
          const itemStart = 15 + i * 25;
          const itemProgress = spring({
            frame: Math.max(0, frame - itemStart),
            fps,
            config: { damping: 14, stiffness: 160 },
          });
          const itemX = interpolate(itemProgress, [0, 1], [300, 0]);
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
                padding: "14px 0",
                borderBottom: "1px solid rgba(255,255,255,0.12)",
                opacity: itemOpacity,
                transform: `translateX(${itemX}px)`,
              }}
            >
              <span
                style={{
                  fontFamily: fonts.body,
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
                  color: colors.logoCoral,
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
            marginTop: 40,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <span
            style={{
              fontFamily: fonts.heading,
              fontSize: 56,
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

// --- Scene 4: COMPARISON --- PriceTag ----------------------------------------

const CompareScene: React.FC<{
  bezorgPrijs: string;
  price: number;
}> = ({ bezorgPrijs, price }) => {
  return (
    <AbsoluteFill>
      <GradientBackground
        colors={["#1a1a2e", "#16213e", "#0f3460"]}
        animate
        angle={135}
      />
      <ScreenWipe startFrame={0} durationFrames={16} color="#8B7355" direction="down" />
      <AbsoluteFill
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 40,
        }}
      >
        <AnimatedText
          text="Thuisbezorgd?"
          fontSize={36}
          fontFamily="body"
          color="rgba(255,255,255,0.5)"
          animation="fadeUp"
          startFrame={5}
          shadow
        />
        <PriceTag
          price={bezorgPrijs}
          newPrice={`\u20AC${price.toFixed(2)}`}
          startFrame={10}
        />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// --- Scene 5: SAVINGS with AnimatedCounter -----------------------------------

const SavingsScene: React.FC<{
  besparing: string;
}> = ({ besparing }) => {
  const numMatch = besparing.match(/\d+/);
  const savingsNum = numMatch ? parseInt(numMatch[0], 10) : 120;

  return (
    <AbsoluteFill>
      <GradientBackground
        colors={["#0f3460", "#1a1a2e", "#16213e"]}
        animate
        angle={180}
      />
      <AbsoluteFill
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 20,
        }}
      >
        <AnimatedCounter
          from={0}
          to={savingsNum}
          startFrame={10}
          durationFrames={50}
          prefix={"\u20AC"}
          fontSize={80}
          color={colors.logoCoral}
          showUnderline
          underlineColor={colors.logoCoral}
        />
        <AnimatedText
          text="per maand besparen"
          fontSize={28}
          fontFamily="body"
          color="rgba(255,255,255,0.7)"
          animation="fadeUp"
          startFrame={50}
          shadow
        />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// --- Scene 6: APP DEMO --- AnimatedAppUI ------------------------------------

const AppDemoScene: React.FC<{
  recipeName: string;
}> = ({ recipeName }) => {
  return (
    <AbsoluteFill>
      <GradientWave
        colors={["#1a1a2e", "#0d1117", "#0f3460"]}
        speed={0.8}
        direction="diagonal"
      />
      <AbsoluteFill
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 20,
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

// --- Scene 7: CTA ------------------------------------------------------------

const CTAScene: React.FC<{
  photo: string;
}> = ({ photo }) => {
  return (
    <AbsoluteFill>
      <GradientBackground
        colors={["#1a1a2e", "#2d1b12", "#0f3460"]}
        animate
        angle={135}
      />
      <AbsoluteFill
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 36,
        }}
      >
        <Logo animation="fadeIn" size={650} startFrame={10} />
        <AnimatedText
          text="60+ recepten onder \u20AC5"
          fontSize={40}
          fontFamily="heading"
          color={colors.white}
          animation="fadeUp"
          startFrame={40}
          shadow
        />
      </AbsoluteFill>
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
  const { width, height } = useVideoConfig();
  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <TransitionSeries>
        {/* Scene 1: Hook --- massive price (90 frames) */}
        <TransitionSeries.Sequence durationInFrames={90}>
          <HookScene photo={photo} price={price} />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={slide()}
          timing={springTiming({ config: { damping: 12 } })}
        />

        {/* Scene 2: Recipe name (45 frames) */}
        <TransitionSeries.Sequence durationInFrames={45}>
          <RecipeNameScene photo={photo} recipeName={recipeName} price={price} />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={slide()}
          timing={springTiming({ config: { damping: 14 } })}
        />

        {/* Scene 3: Ingredients over video (240 frames) */}
        <TransitionSeries.Sequence durationInFrames={240}>
          <IngredientsScene ingredients={ingredients} price={price} />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={slide()}
          timing={springTiming({ config: { damping: 12 } })}
        />

        {/* Scene 4: Comparison PriceTag (90 frames) */}
        <TransitionSeries.Sequence durationInFrames={90}>
          <CompareScene bezorgPrijs={bezorgPrijs} price={price} />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: 15 })}
        />

        {/* Scene 5: Savings with AnimatedCounter (120 frames) */}
        <TransitionSeries.Sequence durationInFrames={120}>
          <SavingsScene besparing={besparing} />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: 12 })}
        />

        {/* Scene 6: App demo (150 frames) */}
        <TransitionSeries.Sequence durationInFrames={150}>
          <AppDemoScene recipeName={recipeName} />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: 15 })}
        />

        {/* Scene 7: CTA (120 frames) */}
        <TransitionSeries.Sequence durationInFrames={120}>
          <CTAScene photo={photo} />
        </TransitionSeries.Sequence>
      </TransitionSeries>

      <BackgroundMusic src={music} />
    </AbsoluteFill>
  );
};
