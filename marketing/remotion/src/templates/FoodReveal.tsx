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
import { SceneTransition } from "../components/SceneTransition";
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

// ─── Scene 1: THE DISH (frames 0-60) ───────────────────────────────────────

const DishScene: React.FC<{
  photo: string;
  price: number;
  recipeName: string;
}> = ({ photo, price, recipeName }) => {
  return (
    <AbsoluteFill>
      <PhotoBackground
        src={photo}
        overlay="rgba(0,0,0,0.25)"
        kenBurns
        kenBurnsScale={[1, 1.15]}
        warmth={0.4}
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
        {/* Large price */}
        <AnimatedText
          text={`\u20AC${price.toFixed(2)}`}
          fontSize={96}
          fontFamily="heading"
          color={colors.white}
          animation="popIn"
          startFrame={5}
          shadow
          glow="rgba(255,255,255,0.3)"
        />
        {/* Recipe name */}
        <AnimatedText
          text={recipeName}
          fontSize={36}
          fontFamily="body"
          color="rgba(255,255,255,0.9)"
          animation="fadeUp"
          startFrame={15}
          shadow
        />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ─── Scene 2: INGREDIENTS + PRICE (frames 60-150) ──────────────────────────

const IngredientsScene: React.FC<{
  photo: string;
  ingredients: { naam: string; prijs: string }[];
  price: number;
}> = ({ photo, ingredients, price }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Running total animation
  const totalProgress = interpolate(frame, [60, 140], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const displayTotal = (totalProgress * price).toFixed(2);

  return (
    <AbsoluteFill>
      <PhotoBackground
        src={photo}
        overlay="rgba(0,0,0,0.65)"
        blur={6}
        kenBurns={false}
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
        {/* Ingredients list */}
        {ingredients.slice(0, 6).map((item, i) => {
          const itemStart = 65 + i * 8;
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
                borderBottom: "1px solid rgba(255,255,255,0.15)",
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
                  textShadow: "0 2px 10px rgba(0,0,0,0.4)",
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
                  textShadow: "0 2px 10px rgba(0,0,0,0.4)",
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
              textShadow: "0 2px 20px rgba(0,0,0,0.5)",
            }}
          >
            Totaal: \u20AC{displayTotal}
          </span>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ─── Scene 3: VERGELIJKING (frames 150-210) ─────────────────────────────────

const CompareScene: React.FC<{
  bezorgPrijs: string;
  price: number;
  besparing: string;
}> = ({ bezorgPrijs, price, besparing }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const leftOpacity = interpolate(frame, [155, 170], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const rightOpacity = interpolate(frame, [165, 180], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const besparingScale = spring({
    frame: Math.max(0, frame - 185),
    fps,
    config: { damping: 10, stiffness: 160 },
  });

  return (
    <AbsoluteFill
      style={{
        background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 60,
      }}
    >
      {/* Split comparison */}
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 80,
          width: "100%",
          padding: "0 60px",
        }}
      >
        {/* Left: Thuisbezorgd */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 16,
            opacity: leftOpacity,
          }}
        >
          <span
            style={{
              fontFamily: fonts.heading,
              fontSize: 64,
              fontWeight: 700,
              color: colors.dislikeRed,
              textDecoration: "line-through",
              textShadow: "0 2px 20px rgba(0,0,0,0.5)",
            }}
          >
            {bezorgPrijs}
          </span>
          <span
            style={{
              fontFamily: fonts.body,
              fontSize: 22,
              color: "rgba(255,255,255,0.6)",
            }}
          >
            Thuisbezorgd
          </span>
        </div>

        {/* Divider */}
        <div
          style={{
            width: 2,
            height: 120,
            backgroundColor: "rgba(255,255,255,0.2)",
          }}
        />

        {/* Right: Happie */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 16,
            opacity: rightOpacity,
          }}
        >
          <span
            style={{
              fontFamily: fonts.heading,
              fontSize: 64,
              fontWeight: 700,
              color: colors.likeGreen,
              textShadow: "0 0 30px rgba(76,175,80,0.4), 0 2px 20px rgba(0,0,0,0.5)",
            }}
          >
            \u20AC{price.toFixed(2)}
          </span>
          <span
            style={{
              fontFamily: fonts.body,
              fontSize: 22,
              color: "rgba(255,255,255,0.6)",
            }}
          >
            Happie
          </span>
        </div>
      </div>

      {/* Besparing */}
      <div
        style={{
          transform: `scale(${besparingScale})`,
          textAlign: "center",
        }}
      >
        <span
          style={{
            fontFamily: fonts.heading,
            fontSize: 48,
            fontWeight: 700,
            color: colors.logoCoral,
            textShadow: "0 2px 20px rgba(0,0,0,0.5)",
          }}
        >
          Bespaar {besparing}
        </span>
      </div>
    </AbsoluteFill>
  );
};

// ─── Scene 4: CTA (frames 210-300) ─────────────────────────────────────────

const CTAScene: React.FC<{
  photo: string;
}> = ({ photo }) => {
  return (
    <AbsoluteFill>
      <PhotoBackground
        src={photo}
        overlay="rgba(0,0,0,0.45)"
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
          gap: 36,
        }}
      >
        <AnimatedText
          text="60+ recepten onder \u20AC5"
          fontSize={44}
          fontFamily="heading"
          color={colors.white}
          animation="fadeUp"
          startFrame={215}
          shadow
        />
        <Logo animation="fadeIn" size={200} startFrame={230} />
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
      <SceneTransition enterFrame={0} exitFrame={50} fadeFrames={10}>
        <DishScene photo={photo} price={price} recipeName={recipeName} />
      </SceneTransition>

      <SceneTransition enterFrame={50} exitFrame={140} fadeFrames={10}>
        <IngredientsScene photo={photo} ingredients={ingredients} price={price} />
      </SceneTransition>

      <SceneTransition enterFrame={140} exitFrame={200} fadeFrames={10}>
        <CompareScene bezorgPrijs={bezorgPrijs} price={price} besparing={besparing} />
      </SceneTransition>

      <SceneTransition enterFrame={200} exitFrame={300} fadeFrames={10}>
        <CTAScene photo={photo} />
      </SceneTransition>

      <BackgroundMusic src={music} />
    </AbsoluteFill>
  );
};
