import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { BackgroundMusic } from "../components/BackgroundMusic";
import { Confetti } from "../components/Confetti";
import { Logo } from "../components/Logo";
import { StoreBadges } from "../components/StoreBadges";
import { SwipeCard } from "../components/SwipeCard";
import { colors } from "../theme/colors";
import { fonts } from "../theme/fonts";

interface SwipeTinderProps {
  hookText: string;
  meals: { naam: string; foto: string; liked: boolean }[];
  matchMeal: string;
  ctaText?: string;
  music: string;
  durationInSeconds: number;
}

// ─── Scene 1: HOOK (frames 0–60) ───────────────────────────────────────────

const HookScene: React.FC<{ hookText: string }> = ({ hookText }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const words = hookText.split(" ");

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#000",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 16,
        padding: "0 80px",
      }}
    >
      {words.map((word, i) => {
        const delay = i * 5;
        const scale = spring({
          frame: frame - delay,
          fps,
          config: { damping: 14, stiffness: 200 },
        });
        const translateY = interpolate(
          frame - delay,
          [0, 12],
          [40, 0],
          { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
        );

        return (
          <span
            key={i}
            style={{
              fontFamily: fonts.heading,
              fontSize: 60,
              fontWeight: 700,
              color: colors.white,
              lineHeight: 1.1,
              transform: `scale(${scale}) translateY(${translateY}px)`,
              display: "inline-block",
            }}
          >
            {word}
          </span>
        );
      })}
    </AbsoluteFill>
  );
};

// ─── Animated Swipe Card ────────────────────────────────────────────────────

interface AnimatedSwipeCardProps {
  meal: { naam: string; foto: string; liked: boolean };
  /** absolute frame at which this card starts to swipe out */
  swipeStartFrame: number;
  /** z-index for stack layering */
  zIndex: number;
  /** scale + offset for "back of the stack" look */
  stackScale: number;
  stackOffsetY: number;
}

const AnimatedSwipeCard: React.FC<AnimatedSwipeCardProps> = ({
  meal,
  swipeStartFrame,
  zIndex,
  stackScale,
  stackOffsetY,
}) => {
  const frame = useCurrentFrame();

  const swipeDuration = 20;
  const localFrame = frame - swipeStartFrame;

  // Before swipe starts: card is in the stack
  // After swipe starts: animate out
  const isSwiping = localFrame >= 0;

  const direction = meal.liked ? 1 : -1;
  const targetX = direction * 700;
  const targetRot = direction * 15;

  const translateX = isSwiping
    ? interpolate(localFrame, [0, swipeDuration], [0, targetX], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      })
    : 0;

  const rotation = isSwiping
    ? interpolate(localFrame, [0, swipeDuration], [0, targetRot], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      })
    : 0;

  const overlayOpacity = isSwiping
    ? interpolate(localFrame, [0, swipeDuration * 0.6], [0, 0.9], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      })
    : 0;

  // Stack appearance before being the active card (localFrame < 0)
  const currentScale = isSwiping ? 1 : stackScale;
  const currentOffsetY = isSwiping ? 0 : stackOffsetY;

  return (
    <div
      style={{
        position: "absolute",
        zIndex,
        transform: `translateX(${translateX}px) translateY(${currentOffsetY}px) rotate(${rotation}deg) scale(${currentScale})`,
        transformOrigin: "center bottom",
      }}
    >
      <div style={{ position: "relative" }}>
        <SwipeCard meal={meal} />

        {/* HAPPIE / NEE overlay */}
        {isSwiping && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: 20,
              backgroundColor: meal.liked ? colors.likeGreen : colors.dislikeRed,
              opacity: overlayOpacity,
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
                letterSpacing: "0.04em",
                transform: `rotate(${meal.liked ? -12 : 12}deg)`,
                border: `5px solid ${colors.white}`,
                padding: "8px 20px",
                borderRadius: 8,
                display: "inline-block",
              }}
            >
              {meal.liked ? "HAPPIE!" : "NEE"}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Scene 2: SWIPE (frames 60–180) ────────────────────────────────────────

const SwipeScene: React.FC<{ meals: { naam: string; foto: string; liked: boolean }[] }> = ({
  meals,
}) => {
  // Three cards, each swipes out at: 60, 95, 130 (relative to video start)
  // The scene runs from frame 60–180
  // We stagger swipes ~35 frames apart
  const swipeFrames = [70, 105, 140];

  // Stack params: top card is index 2 (highest z), others behind
  const stackConfigs = [
    { stackScale: 0.92, stackOffsetY: 24, zIndex: 1 },
    { stackScale: 0.96, stackOffsetY: 12, zIndex: 2 },
    { stackScale: 1.0,  stackOffsetY: 0,  zIndex: 3 },
  ];

  return (
    <AbsoluteFill
      style={{
        backgroundColor: colors.background,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* Tinder-style header */}
      <div
        style={{
          position: "absolute",
          top: 80,
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
        }}
      >
        <span
          style={{
            fontFamily: fonts.heading,
            fontSize: 32,
            fontWeight: 700,
            color: colors.text,
            letterSpacing: "0.02em",
          }}
        >
          Vanavond eten?
        </span>
      </div>

      {/* Card stack — centered */}
      <div style={{ position: "relative", width: 340, height: 420 }}>
        {meals.map((meal, i) => (
          <AnimatedSwipeCard
            key={i}
            meal={meal}
            swipeStartFrame={swipeFrames[i]}
            zIndex={stackConfigs[i].zIndex}
            stackScale={stackConfigs[i].stackScale}
            stackOffsetY={stackConfigs[i].stackOffsetY}
          />
        ))}
      </div>

      {/* Like / Nope icons row */}
      <div
        style={{
          position: "absolute",
          bottom: 140,
          display: "flex",
          gap: 60,
          alignItems: "center",
        }}
      >
        {/* X button */}
        <div
          style={{
            width: 70,
            height: 70,
            borderRadius: "50%",
            border: `3px solid ${colors.dislikeRed}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <span style={{ fontSize: 32, color: colors.dislikeRed, fontWeight: 700 }}>✕</span>
        </div>
        {/* Heart button */}
        <div
          style={{
            width: 70,
            height: 70,
            borderRadius: "50%",
            border: `3px solid ${colors.likeGreen}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <span style={{ fontSize: 32, color: colors.likeGreen }}>♥</span>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ─── Scene 3: MATCH (frames 180–240) ───────────────────────────────────────

const MatchScene: React.FC<{ matchMeal: string }> = ({ matchMeal }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // White flash: opacity 1 → 0 over first 5 frames of the scene (abs frame 180–185)
  const flashOpacity = interpolate(frame, [180, 185], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // "It's a HAPPIE!" spring scale
  const textScale = spring({
    frame: frame - 185,
    fps,
    config: { damping: 12, stiffness: 180 },
  });

  // matchMeal name fade in
  const mealOpacity = interpolate(frame, [200, 215], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: colors.background,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        gap: 24,
      }}
    >
      {/* Confetti starts at frame 180 */}
      <Confetti startFrame={180} particleCount={40} />

      {/* "It's a HAPPIE!" */}
      <span
        style={{
          fontFamily: fonts.heading,
          fontSize: 48,
          fontWeight: 700,
          color: colors.logoCoral,
          textAlign: "center",
          lineHeight: 1.15,
          transform: `scale(${textScale})`,
          display: "block",
          padding: "0 60px",
        }}
      >
        It's a HAPPIE!
      </span>

      {/* Matched meal name */}
      <span
        style={{
          fontFamily: fonts.body,
          fontSize: 28,
          fontWeight: 500,
          color: colors.text,
          textAlign: "center",
          opacity: mealOpacity,
        }}
      >
        {matchMeal}
      </span>

      {/* White flash overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundColor: colors.white,
          opacity: flashOpacity,
          pointerEvents: "none",
        }}
      />
    </AbsoluteFill>
  );
};

// ─── Scene 4: CTA (frames 240–300) ─────────────────────────────────────────

const CTAScene: React.FC<{ ctaText: string }> = ({ ctaText }) => {
  const frame = useCurrentFrame();

  const ctaOpacity = interpolate(frame, [240, 258], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: colors.background,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        gap: 36,
      }}
    >
      {/* Logo with bounce starting at frame 240 */}
      <Logo animation="bounce" size={220} startFrame={240} />

      {/* CTA text */}
      <span
        style={{
          fontFamily: fonts.body,
          fontSize: 36,
          fontWeight: 600,
          color: colors.text,
          textAlign: "center",
          opacity: ctaOpacity,
          letterSpacing: "-0.01em",
        }}
      >
        {ctaText}
      </span>

      {/* Store badges */}
      <StoreBadges startFrame={260} />
    </AbsoluteFill>
  );
};

// ─── Main Template ──────────────────────────────────────────────────────────

export const SwipeTinder: React.FC<SwipeTinderProps> = ({
  hookText,
  meals,
  matchMeal,
  ctaText = "Download gratis",
  music,
}) => {
  const frame = useCurrentFrame();

  // Determine which scene to render based on current frame
  const showHook  = frame < 60;
  const showSwipe = frame >= 60 && frame < 180;
  const showMatch = frame >= 180 && frame < 240;
  const showCTA   = frame >= 240;

  return (
    <AbsoluteFill>
      {showHook  && <HookScene hookText={hookText} />}
      {showSwipe && <SwipeScene meals={meals} />}
      {showMatch && <MatchScene matchMeal={matchMeal} />}
      {showCTA   && <CTAScene ctaText={ctaText} />}

      {/* Background music wraps the entire template */}
      <BackgroundMusic src={music} />
    </AbsoluteFill>
  );
};
