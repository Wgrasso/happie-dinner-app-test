import React from "react";
import {
  AbsoluteFill,
  Img,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { AnimatedText } from "../components/AnimatedText";
import { BackgroundMusic } from "../components/BackgroundMusic";
import { Logo } from "../components/Logo";
import { PhotoBackground } from "../components/PhotoBackground";
import { SceneTransition } from "../components/SceneTransition";
import { colors } from "../theme/colors";

export interface HetMomentProps {
  photos: [string, string, string]; // 3 food photos
  recipeName: string;
  cookingTime: number;
  price: number;
  servings: number;
  music: string;
  durationInSeconds: number;
}

// ─── Scene 1: FOOD SEQUENCE (frames 0-240) ─────────────────────────────────
// 3 photos, each 80 frames, crossfading, alternating ken burns direction

const FoodSequenceScene: React.FC<{
  photos: [string, string, string];
}> = ({ photos }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const PHOTO_DURATION = 80;

  return (
    <AbsoluteFill>
      {photos.map((photo, i) => {
        const start = i * PHOTO_DURATION;
        const end = start + PHOTO_DURATION;

        // Opacity: fade in over first 8 frames, fade out over last 8 frames
        const fadeIn = interpolate(
          frame,
          [start, start + 15],
          [0, 1],
          { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
        );
        const fadeOut = interpolate(
          frame,
          [end - 15, end],
          [1, 0],
          { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
        );
        const opacity = i === photos.length - 1
          ? fadeIn // Last photo doesn't fade out
          : Math.min(fadeIn, fadeOut);

        // Alternating Ken Burns: even = zoom in, odd = zoom out
        const localProgress = interpolate(
          frame,
          [start, end],
          [0, 1],
          { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
        );
        const scale = i % 2 === 0
          ? interpolate(localProgress, [0, 1], [1, 1.15], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            })
          : interpolate(localProgress, [0, 1], [1.15, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            });

        return (
          <div
            key={i}
            style={{
              position: "absolute",
              inset: 0,
              opacity,
              overflow: "hidden",
            }}
          >
            <Img
              src={staticFile(`meals/${photo}`)}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                transform: `scale(${scale})`,
              }}
            />
            {/* Warm amber overlay */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                backgroundColor: "rgba(255, 165, 0, 0.1)",
              }}
            />
            {/* Subtle dark overlay for depth */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                background:
                  "linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.3) 100%)",
              }}
            />
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

// ─── Scene 2: THE RECIPE (frames 240-450) ──────────────────────────────────

const RecipeScene: React.FC<{
  photos: [string, string, string];
  recipeName: string;
  cookingTime: number;
  price: number;
  servings: number;
}> = ({ photos, recipeName, cookingTime, price, servings }) => {
  return (
    <AbsoluteFill>
      <PhotoBackground
        src={photos[0]}
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
          text={recipeName}
          fontSize={48}
          fontFamily="heading"
          color={colors.white}
          animation="popIn"
          startFrame={260}
          shadow
        />
        <AnimatedText
          text={`${cookingTime} min \u2022 \u20AC${price.toFixed(2)} \u2022 ${servings} personen`}
          fontSize={24}
          fontFamily="body"
          color="rgba(255,255,255,0.85)"
          animation="fadeUp"
          startFrame={290}
          shadow
        />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ─── Scene 3: THE QUESTION (frames 450-750) ────────────────────────────────

const QuestionScene: React.FC<{
  photos: [string, string, string];
}> = ({ photos }) => {
  return (
    <AbsoluteFill>
      <PhotoBackground
        src={photos[2]}
        overlay="rgba(0,0,0,0.4)"
        kenBurns
        kenBurnsScale={[1, 1.1]}
        warmth={0.6}
      />
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
          text="Wat wordt jouw happie vanavond?"
          fontSize={52}
          fontFamily="heading"
          color={colors.white}
          animation="fadeUp"
          startFrame={470}
          shadow
          maxWidth={800}
        />
        <Logo animation="fadeIn" size={200} startFrame={550} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ─── Main Template ──────────────────────────────────────────────────────────

export const HetMoment: React.FC<HetMomentProps> = ({
  photos,
  recipeName,
  cookingTime,
  price,
  servings,
  music,
}) => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <SceneTransition enterFrame={0} exitFrame={240} fadeFrames={12}>
        <FoodSequenceScene photos={photos} />
      </SceneTransition>

      <SceneTransition enterFrame={240} exitFrame={450} fadeFrames={12}>
        <RecipeScene
          photos={photos}
          recipeName={recipeName}
          cookingTime={cookingTime}
          price={price}
          servings={servings}
        />
      </SceneTransition>

      <SceneTransition enterFrame={450} exitFrame={750} fadeFrames={15}>
        <QuestionScene photos={photos} />
      </SceneTransition>

      <BackgroundMusic src={music} />
    </AbsoluteFill>
  );
};
