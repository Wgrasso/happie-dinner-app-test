import React from "react";
import {
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  AbsoluteFill,
} from "remotion";
import { PhoneMockup } from "../components/PhoneMockup";
import { Logo } from "../components/Logo";
import { BackgroundMusic } from "../components/BackgroundMusic";
import {
  HomeScreen,
  SwipeScreen,
  ResultScreen,
  BoodschappenScreen,
} from "../components/AppScreens";
import { colors } from "../theme/colors";
import { fonts } from "../theme/fonts";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface AppDemoProps {
  probleem: string;
  schermen: ("home" | "swipe" | "result" | "boodschappen")[];
  features: string[];
  music: string;
  durationInSeconds: number;
}

// ─── Screen resolver ─────────────────────────────────────────────────────────

const SCREEN_MAP: Record<AppDemoProps["schermen"][number], React.FC> = {
  home: HomeScreen,
  swipe: SwipeScreen,
  result: ResultScreen,
  boodschappen: BoodschappenScreen,
};

// ─── Scene 1: Problem (frames 0–90) ──────────────────────────────────────────

const ProblemScene: React.FC<{ probleem: string }> = ({ probleem }) => {
  const frame = useCurrentFrame();

  // Shake: oscillates ±5px with a sin-like pattern using interpolate keyframes
  const shakeX = interpolate(
    frame % 24,
    [0, 4, 8, 12, 16, 20, 24],
    [0, 5, -5, 4, -4, 2, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  const fadeIn = interpolate(frame, [0, 20], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: colors.background,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 40,
        opacity: fadeIn,
        transform: `translateX(${shakeX}px)`,
      }}
    >
      {/* Emoji */}
      <div style={{ fontSize: 80, lineHeight: 1 }}>🤷‍♂️</div>

      {/* Problem text */}
      <div
        style={{
          fontFamily: fonts.heading,
          fontSize: 48,
          fontWeight: 700,
          color: colors.text,
          textAlign: "center",
          lineHeight: 1.2,
          maxWidth: 800,
          paddingLeft: 60,
          paddingRight: 60,
        }}
      >
        {probleem}
      </div>
    </AbsoluteFill>
  );
};

// ─── Scene 2: Phone (frames 90–300) ──────────────────────────────────────────

interface PhoneSceneProps {
  schermen: AppDemoProps["schermen"];
}

const PhoneScene: React.FC<PhoneSceneProps> = ({ schermen }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Relative frame within this scene
  const relFrame = frame - 90;

  // Float in from bottom
  const phoneY = spring({
    frame: relFrame,
    fps,
    config: { damping: 18, stiffness: 80 },
    durationInFrames: 40,
  });
  const translateY = interpolate(phoneY, [0, 1], [400, 0]);

  // Gentle tilt: rotateY oscillates ±3deg over the scene length (210 frames)
  const tiltY = interpolate(
    relFrame,
    [0, 52, 105, 157, 210],
    [0, 3, 0, -3, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  // Screen cycling with slide transitions
  const totalScreenFrames = 210;
  const framesPerScreen = Math.floor(totalScreenFrames / schermen.length);
  const transitionFrames = 15; // frames for slide transition

  const screenIndex = Math.min(
    Math.floor(relFrame / framesPerScreen),
    schermen.length - 1
  );
  const frameWithinScreen = relFrame - screenIndex * framesPerScreen;

  const currentKey = schermen[screenIndex] ?? "home";
  const nextKey = schermen[Math.min(screenIndex + 1, schermen.length - 1)];
  const CurrentScreen = SCREEN_MAP[currentKey];
  const NextScreen = SCREEN_MAP[nextKey];

  // Slide-out / slide-in animation
  const isTransitioning =
    frameWithinScreen >= framesPerScreen - transitionFrames &&
    screenIndex < schermen.length - 1;

  const slideProgress = isTransitioning
    ? interpolate(
        frameWithinScreen,
        [framesPerScreen - transitionFrames, framesPerScreen],
        [0, 1],
        { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
      )
    : 0;

  const currentX = interpolate(slideProgress, [0, 1], [0, -300]);
  const nextX = interpolate(slideProgress, [0, 1], [300, 0]);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: colors.background,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transform: `translateY(${translateY}px)`,
      }}
    >
      <PhoneMockup tilt={{ x: 0, y: tiltY }}>
        {/* Screen container with overflow hidden so slides clip */}
        <div
          style={{
            width: 300,
            height: 620,
            position: "relative",
            overflow: "hidden",
            backgroundColor: colors.background,
          }}
        >
          {/* Current screen sliding out */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: 300,
              height: 620,
              transform: `translateX(${currentX}px)`,
            }}
          >
            <CurrentScreen />
          </div>

          {/* Next screen sliding in */}
          {isTransitioning && (
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: 300,
                height: 620,
                transform: `translateX(${nextX}px)`,
              }}
            >
              <NextScreen />
            </div>
          )}
        </div>
      </PhoneMockup>
    </AbsoluteFill>
  );
};

// ─── Scene 3: Features (frames 300–390) ──────────────────────────────────────

interface FeaturesSceneProps {
  schermen: AppDemoProps["schermen"];
  features: string[];
}

const FeaturesScene: React.FC<FeaturesSceneProps> = ({ schermen, features }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const relFrame = frame - 300;

  // Phone scales down and moves left
  const phoneScale = interpolate(relFrame, [0, 30], [1, 0.5], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const phoneX = interpolate(relFrame, [0, 30], [0, -280], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Determine which screen to show (last in the list)
  const lastKey = schermen[schermen.length - 1] ?? "home";
  const LastScreen = SCREEN_MAP[lastKey];

  return (
    <AbsoluteFill
      style={{
        backgroundColor: colors.background,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* Phone — left side */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          transform: `translate(calc(-50% + ${phoneX}px), -50%) scale(${phoneScale})`,
        }}
      >
        <PhoneMockup>
          <LastScreen />
        </PhoneMockup>
      </div>

      {/* Feature checklist — right side */}
      <div
        style={{
          position: "absolute",
          right: 80,
          top: "50%",
          transform: "translateY(-50%)",
          display: "flex",
          flexDirection: "column",
          gap: 28,
          width: 420,
        }}
      >
        {features.map((feature, i) => {
          const startFrame = i * 10;
          const itemSpring = spring({
            frame: Math.max(0, relFrame - startFrame),
            fps,
            config: { damping: 14, stiffness: 120 },
            durationInFrames: 20,
          });
          const itemOpacity = interpolate(itemSpring, [0, 1], [0, 1]);
          const itemX = interpolate(itemSpring, [0, 1], [40, 0]);

          return (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 20,
                opacity: itemOpacity,
                transform: `translateX(${itemX}px)`,
              }}
            >
              {/* Check circle */}
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  backgroundColor: colors.likeGreen,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  color: colors.white,
                  fontSize: 18,
                  fontWeight: 700,
                }}
              >
                ✓
              </div>

              {/* Feature text */}
              <span
                style={{
                  fontFamily: fonts.body,
                  fontSize: 24,
                  color: colors.text,
                  fontWeight: 500,
                }}
              >
                {feature}
              </span>
            </div>
          );
        })}
      </div>

      {/* Logo + CTA at bottom center */}
      <div
        style={{
          position: "absolute",
          bottom: 120,
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 16,
        }}
      >
        <Logo animation="fadeIn" size={200} startFrame={350 - 300} />

        <div
          style={{
            fontFamily: fonts.heading,
            fontSize: 28,
            fontWeight: 700,
            color: colors.accent,
            textAlign: "center",
          }}
        >
          Download gratis
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ─── Main AppDemo composition ─────────────────────────────────────────────────

export const AppDemo: React.FC<AppDemoProps> = ({
  probleem,
  schermen,
  features,
  music,
}) => {
  const frame = useCurrentFrame();

  // Scene transitions with fade
  const scene1Opacity = interpolate(frame, [75, 90], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const scene2Opacity =
    frame >= 90 && frame < 300
      ? interpolate(frame, [90, 105, 285, 300], [0, 1, 1, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        })
      : 0;

  const scene3Opacity =
    frame >= 300
      ? interpolate(frame, [300, 315], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        })
      : 0;

  return (
    <AbsoluteFill style={{ backgroundColor: colors.background }}>
      {/* Scene 1 — Problem */}
      {frame < 90 && (
        <div style={{ position: "absolute", inset: 0, opacity: scene1Opacity }}>
          <ProblemScene probleem={probleem} />
        </div>
      )}

      {/* Scene 2 — Phone */}
      {frame >= 90 && frame < 300 && (
        <div style={{ position: "absolute", inset: 0, opacity: scene2Opacity }}>
          <PhoneScene schermen={schermen} />
        </div>
      )}

      {/* Scene 3 — Features */}
      {frame >= 300 && (
        <div style={{ position: "absolute", inset: 0, opacity: scene3Opacity }}>
          <FeaturesScene schermen={schermen} features={features} />
        </div>
      )}

      {/* Background music */}
      <BackgroundMusic src={music} />
    </AbsoluteFill>
  );
};
