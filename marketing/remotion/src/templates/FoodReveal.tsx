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
import { CountUp } from "../components/CountUp";
import { Logo } from "../components/Logo";
import { PhotoBackground } from "../components/PhotoBackground";
import { PriceTag } from "../components/PriceTag";
import { SceneTransition } from "../components/SceneTransition";
import { VideoBackground } from "../components/VideoBackground";
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

// ─── Scene 1: HOOK — Food photo, massive price glows in (frames 0-90) ──────

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
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ─── Scene 2: RECIPE NAME over photo (frames 90-120) ───────────────────────

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
          startFrame={95}
          shadow
        />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ─── Scene 3: INGREDIENTS over cutting-vegetables video (frames 120-360) ────

const IngredientsScene: React.FC<{
  ingredients: { naam: string; prijs: string }[];
  price: number;
}> = ({ ingredients, price }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Running total
  const totalProgress = interpolate(frame, [130, 340], [0, 1], {
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
          const itemStart = 135 + i * 25;
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

// ─── Scene 4: COOKING video (frames 360-480) ────────────────────────────────

const CookingScene: React.FC = () => {
  return (
    <AbsoluteFill>
      <VideoBackground
        src="cooking-stir-fry.mp4"
        overlay="rgba(0,0,0,0.35)"
        playbackRate={1}
      />
      <AbsoluteFill
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <AnimatedText
          text="20 minuten."
          fontSize={72}
          fontFamily="heading"
          color={colors.white}
          animation="slamIn"
          startFrame={400}
          shadow
        />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ─── Scene 5: COMPARISON — PriceTag (frames 480-570) ────────────────────────

const CompareScene: React.FC<{
  bezorgPrijs: string;
  price: number;
}> = ({ bezorgPrijs, price }) => {
  return (
    <AbsoluteFill
      style={{
        background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
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
        startFrame={485}
        shadow
      />
      <PriceTag
        price={bezorgPrijs}
        newPrice={`\u20AC${price.toFixed(2)}`}
        startFrame={490}
      />
    </AbsoluteFill>
  );
};

// ─── Scene 6: SAVINGS CountUp (frames 570-660) ──────────────────────────────

const SavingsScene: React.FC<{
  besparing: string;
}> = ({ besparing }) => {
  return (
    <AbsoluteFill
      style={{
        background: "linear-gradient(180deg, #0f3460 0%, #1a1a2e 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 20,
      }}
    >
      <AnimatedText
        text={besparing}
        fontSize={72}
        fontFamily="heading"
        color={colors.logoCoral}
        animation="countUp"
        startFrame={580}
        shadow
        glow="rgba(244,132,95,0.3)"
      />
      <AnimatedText
        text="per maand besparen"
        fontSize={28}
        fontFamily="body"
        color="rgba(255,255,255,0.7)"
        animation="fadeUp"
        startFrame={620}
        shadow
      />
    </AbsoluteFill>
  );
};

// ─── Scene 7: CTA (frames 660-750) ──────────────────────────────────────────

const CTAScene: React.FC<{
  photo: string;
}> = ({ photo }) => {
  return (
    <AbsoluteFill>
      <PhotoBackground
        src={photo}
        overlay="rgba(0,0,0,0.45)"
        kenBurns
        kenBurnsScale={[1.02, 1.1]}
        warmth={0.5}
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
        <Logo animation="fadeIn" size={200} startFrame={670} />
        <AnimatedText
          text="60+ recepten onder \u20AC5"
          fontSize={40}
          fontFamily="heading"
          color={colors.white}
          animation="fadeUp"
          startFrame={700}
          shadow
        />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ─── Main Template ──────────────────────────────────────────────────────────

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
      {/* Scene 1: Hook — massive price (0-90) */}
      <SceneTransition enterFrame={0} exitFrame={90} fadeFrames={12}>
        <HookScene photo={photo} price={price} />
      </SceneTransition>

      {/* Scene 2: Recipe name (90-120) */}
      <SceneTransition enterFrame={90} exitFrame={120} fadeFrames={10}>
        <RecipeNameScene photo={photo} recipeName={recipeName} price={price} />
      </SceneTransition>

      {/* Scene 3: Ingredients over video (120-360) */}
      <SceneTransition enterFrame={120} exitFrame={360} fadeFrames={15}>
        <IngredientsScene ingredients={ingredients} price={price} />
      </SceneTransition>

      {/* Scene 4: Cooking video (360-480) */}
      <SceneTransition enterFrame={360} exitFrame={480} fadeFrames={12}>
        <CookingScene />
      </SceneTransition>

      {/* Scene 5: Comparison PriceTag (480-570) */}
      <SceneTransition enterFrame={480} exitFrame={570} fadeFrames={12}>
        <CompareScene bezorgPrijs={bezorgPrijs} price={price} />
      </SceneTransition>

      {/* Scene 6: Savings CountUp (570-660) */}
      <SceneTransition enterFrame={570} exitFrame={660} fadeFrames={12}>
        <SavingsScene besparing={besparing} />
      </SceneTransition>

      {/* Scene 7: CTA (660-750) */}
      <SceneTransition enterFrame={660} exitFrame={750} fadeFrames={15}>
        <CTAScene photo={photo} />
      </SceneTransition>

      <BackgroundMusic src={music} />
    </AbsoluteFill>
  );
};
