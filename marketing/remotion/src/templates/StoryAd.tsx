import React from "react";
import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { AnimatedText } from "../components/AnimatedText";
import { BackgroundMusic } from "../components/BackgroundMusic";
import { Logo } from "../components/Logo";
import { PhotoBackground } from "../components/PhotoBackground";
import { VideoBackground } from "../components/VideoBackground";
import {
  GradientWave,
  AnimatedAppUI,
} from "../components/motion";
import { colors } from "../theme/colors";

// --- StoryAd: Flexible scene-based template for story-driven content ---
// Each video is defined as an array of scenes with durations.
// Simple frame-based cuts (no TransitionSeries).

export interface StoryScene {
  type: "video" | "photo" | "text" | "phone";
  src?: string;
  text?: string;
  subtext?: string;
  textPosition?: "center" | "bottom" | "top";
  textAnimation?: "fadeUp" | "popIn" | "slamIn" | "letterStagger";
  overlay?: number;
  warmth?: number;
  phoneSequence?: "swipe-three" | "wie-eet-mee" | "vote-result" | "recipe-detail";
  phoneSize?: "full" | "corner";
  phoneRecipe?: { name: string; image: string; cookingTime: number };
}

export interface StoryAdProps {
  scenes: StoryScene[];
  sceneDurations: number[];
  music: string;
  durationInSeconds: number;
}

// --- Film grain overlay ---
const FilmGrain: React.FC = () => {
  const frame = useCurrentFrame();
  const grainSeed = frame % 3;

  return (
    <AbsoluteFill
      style={{
        pointerEvents: "none",
        zIndex: 99,
        mixBlendMode: "overlay",
        opacity: 0.04,
      }}
    >
      <svg width="1080" height="1920" viewBox="0 0 1080 1920">
        {Array.from({ length: 150 }).map((_, i) => {
          const seed = i * 7 + grainSeed * 31;
          const x = (Math.sin(seed) * 10000) % 1080;
          const y = (Math.cos(seed * 1.3) * 10000) % 1920;
          const size = 2 + (Math.sin(seed * 0.7) * 10000) % 4;
          return (
            <rect
              key={i}
              x={Math.abs(x)}
              y={Math.abs(y)}
              width={size}
              height={size}
              fill="white"
              opacity={0.3 + (Math.sin(seed * 0.3) + 1) * 0.35}
            />
          );
        })}
      </svg>
    </AbsoluteFill>
  );
};

// --- Text overlay positioned according to textPosition ---
const TextOverlay: React.FC<{
  scene: StoryScene;
  localFrame: number;
}> = ({ scene, localFrame }) => {
  if (!scene.text && !scene.subtext) return null;

  const justifyMap = {
    top: "flex-start" as const,
    center: "center" as const,
    bottom: "flex-end" as const,
  };
  const position = scene.textPosition || "center";
  const paddingMap = {
    top: "200px 60px 60px",
    center: "60px",
    bottom: "60px 60px 250px",
  };

  return (
    <AbsoluteFill
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: justifyMap[position],
        padding: paddingMap[position],
        gap: 12,
        zIndex: 10,
      }}
    >
      {scene.text && (
        <AnimatedText
          text={scene.text}
          fontSize={scene.text.length > 20 ? 42 : 56}
          fontFamily="heading"
          color={colors.white}
          animation={scene.textAnimation || "fadeUp"}
          startFrame={5}
          shadow
          maxWidth={900}
        />
      )}
      {scene.subtext && (
        <AnimatedText
          text={scene.subtext}
          fontSize={28}
          fontFamily="body"
          color="rgba(255,220,180,0.85)"
          animation="fadeUp"
          startFrame={15}
          shadow
          maxWidth={800}
        />
      )}
    </AbsoluteFill>
  );
};

// --- Single scene renderer ---
const SceneRenderer: React.FC<{
  scene: StoryScene;
  localFrame: number;
  sceneDuration: number;
}> = ({ scene, localFrame, sceneDuration }) => {
  const overlayAlpha = scene.overlay ?? 0.3;
  const warmth = scene.warmth ?? 0;

  switch (scene.type) {
    case "video":
      return (
        <AbsoluteFill>
          <VideoBackground
            src={scene.src || ""}
            overlay={`rgba(0,0,0,${overlayAlpha})`}
            playbackRate={0.9}
          />
          <TextOverlay scene={scene} localFrame={localFrame} />
          <FilmGrain />
        </AbsoluteFill>
      );

    case "photo":
      return (
        <AbsoluteFill>
          <PhotoBackground
            src={scene.src || ""}
            overlay={`rgba(45,27,18,${overlayAlpha})`}
            kenBurns
            kenBurnsScale={[1, 1.08]}
            warmth={warmth}
          />
          <TextOverlay scene={scene} localFrame={localFrame} />
          <FilmGrain />
        </AbsoluteFill>
      );

    case "text":
      return (
        <AbsoluteFill style={{ backgroundColor: "#0a0a0a" }}>
          <AbsoluteFill
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 16,
              padding: "60px",
            }}
          >
            {scene.text && (
              <AnimatedText
                text={scene.text}
                fontSize={scene.text.length > 15 ? 52 : 64}
                fontFamily="heading"
                color={colors.white}
                animation={scene.textAnimation || "slamIn"}
                startFrame={3}
                shadow
                maxWidth={900}
              />
            )}
            {scene.subtext && (
              <AnimatedText
                text={scene.subtext}
                fontSize={32}
                fontFamily="body"
                color="rgba(255,220,180,0.8)"
                animation="fadeUp"
                startFrame={15}
                shadow
                maxWidth={800}
              />
            )}
          </AbsoluteFill>
        </AbsoluteFill>
      );

    case "phone": {
      const phoneSize = scene.phoneSize || "full";
      return (
        <AbsoluteFill>
          {/* Dark warm background */}
          <GradientWave
            colors={["#1a1008", "#2d1b12", "#1a1008"]}
            speed={0.5}
            direction="diagonal"
          />
          <AbsoluteFill
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 16,
              ...(phoneSize === "corner"
                ? {
                    alignItems: "flex-end",
                    justifyContent: "flex-end",
                    padding: "0 40px 200px 0",
                    transform: "scale(0.6)",
                    transformOrigin: "bottom right",
                  }
                : {}),
            }}
          >
            {scene.text && phoneSize === "full" && (
              <AnimatedText
                text={scene.text}
                fontSize={32}
                fontFamily="heading"
                color="rgba(255,220,180,0.9)"
                animation="fadeUp"
                startFrame={3}
                shadow
              />
            )}
            <AnimatedAppUI
              startFrame={5}
              sequence={scene.phoneSequence || "swipe-three"}
              recipe={{
                name: scene.phoneRecipe?.name || "Pasta Carbonara",
                image: scene.phoneRecipe?.image || "carbonara.jpg",
                cookingTime: scene.phoneRecipe?.cookingTime || 25,
                description: "Lekker en simpel.",
                ingredients: ["Pasta", "Groente", "Kruiden"],
              }}
              swipeResults={["like", "dislike", "like"]}
              membersEating={6}
              totalMembers={8}
            />
          </AbsoluteFill>
          {scene.text && phoneSize === "corner" && (
            <AbsoluteFill
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 5,
              }}
            >
              <AnimatedText
                text={scene.text}
                fontSize={44}
                fontFamily="heading"
                color={colors.white}
                animation="fadeUp"
                startFrame={3}
                shadow
              />
            </AbsoluteFill>
          )}
        </AbsoluteFill>
      );
    }

    default:
      return <AbsoluteFill style={{ backgroundColor: "#000" }} />;
  }
};

// --- Logo scene (always rendered as last scene) ---
const LogoScene: React.FC<{
  text?: string;
  localFrame: number;
  sceneDuration: number;
}> = ({ text, localFrame, sceneDuration }) => {
  const fadeOut = interpolate(
    localFrame,
    [sceneDuration - 15, sceneDuration],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  return (
    <AbsoluteFill style={{ backgroundColor: "#0a0a0a" }}>
      <AbsoluteFill
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 24,
        }}
      >
        <Logo animation="bounce" size={650} startFrame={3} />
        {text && (
          <AnimatedText
            text={text}
            fontSize={30}
            fontFamily="heading"
            color="rgba(255,220,180,0.9)"
            animation="fadeUp"
            startFrame={20}
            shadow
          />
        )}
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

// --- Main Template ---
export const StoryAd: React.FC<StoryAdProps> = ({
  scenes,
  sceneDurations,
  music,
}) => {
  const frame = useCurrentFrame();

  // Find current scene based on frame
  let accumulated = 0;
  let currentSceneIndex = 0;
  for (let i = 0; i < sceneDurations.length; i++) {
    if (frame >= accumulated && frame < accumulated + sceneDurations[i]) {
      currentSceneIndex = i;
      break;
    }
    accumulated += sceneDurations[i];
    if (i === sceneDurations.length - 1) {
      currentSceneIndex = i;
    }
  }

  // Recalculate accumulated for current scene
  let sceneStart = 0;
  for (let i = 0; i < currentSceneIndex; i++) {
    sceneStart += sceneDurations[i];
  }
  const localFrame = frame - sceneStart;
  const scene = scenes[currentSceneIndex];
  const sceneDuration = sceneDurations[currentSceneIndex];

  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      {scene ? (
        <SceneRenderer
          scene={scene}
          localFrame={localFrame}
          sceneDuration={sceneDuration}
        />
      ) : (
        <LogoScene
          localFrame={localFrame}
          sceneDuration={sceneDuration}
        />
      )}
      <BackgroundMusic src={music} />
    </AbsoluteFill>
  );
};
