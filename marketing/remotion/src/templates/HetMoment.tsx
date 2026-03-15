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
import { PhoneMockup } from "../components/PhoneMockup";
import { PhotoBackground } from "../components/PhotoBackground";
import { VideoBackground } from "../components/VideoBackground";
import { HeartPulse } from "../components/lottie-style";
import {
  GradientWave,
  RevealMask,
  AnimatedUnderline,
  AnimatedAppUI,
} from "../components/motion";
import { colors } from "../theme/colors";

export interface HetMomentProps {
  photos: [string, string, string];
  recipeName: string;
  cookingTime: number;
  price: number;
  servings: number;
  music: string;
  durationInSeconds: number;
}

// --- HetMoment PERSONALITY: Cinematic. Slow Ken Burns. Minimal text.
// Maximum atmosphere. Film grain feel. Golden hour.

const FilmGrain: React.FC = () => {
  const frame = useCurrentFrame();
  const grainSeed = frame % 3;

  return (
    <AbsoluteFill
      style={{
        pointerEvents: "none",
        zIndex: 99,
        mixBlendMode: "overlay",
        opacity: 0.06,
      }}
    >
      <svg width="1080" height="1920" viewBox="0 0 1080 1920">
        {Array.from({ length: 200 }).map((_, i) => {
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

// Scene durations (frames) - story-first: 80% atmosphere, 20% app
// Total: 750 frames (25s at 30fps)
const SCENE_DURATIONS = [90, 90, 90, 90, 75, 75, 120, 120];
// Photos(3x90=270) + Video(90) + Question(75) + MoreFood(75) = 600 story
// App(120) + CTA(120) = 240 => but let's keep it at 150 for app portion
// Adjusted: 90+90+90+75+75+75+120+90 = 705 ~close enough

const Photo1Scene: React.FC<{ photo: string }> = ({ photo }) => (
  <AbsoluteFill>
    <PhotoBackground
      src={photo}
      overlay="rgba(45,27,18,0.1)"
      kenBurns
      kenBurnsScale={[1, 1.12]}
      warmth={0.7}
      desaturate={0.15}
    />
    <FilmGrain />
  </AbsoluteFill>
);

const Photo2Scene: React.FC<{ photo: string }> = ({ photo }) => (
  <AbsoluteFill>
    <PhotoBackground
      src={photo}
      overlay="rgba(45,27,18,0.1)"
      kenBurns
      kenBurnsScale={[1.12, 1]}
      warmth={0.6}
      desaturate={0.15}
    />
    <FilmGrain />
  </AbsoluteFill>
);

const Photo3Scene: React.FC<{ photo: string }> = ({ photo }) => (
  <AbsoluteFill>
    <PhotoBackground
      src={photo}
      overlay="rgba(45,27,18,0.15)"
      kenBurns
      kenBurnsScale={[1.02, 1.1]}
      warmth={0.8}
      desaturate={0.15}
    />
    <FilmGrain />
  </AbsoluteFill>
);

const VideoScene: React.FC<{ recipeName: string }> = ({ recipeName }) => (
  <AbsoluteFill>
    <VideoBackground
      src="serving-food-plate.mp4"
      overlay="rgba(45,27,18,0.3)"
      playbackRate={0.5}
    />
    <AbsoluteFill
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
      }}
    >
      <AnimatedText
        text={recipeName}
        fontSize={48}
        fontFamily="heading"
        color={colors.white}
        animation="fadeUp"
        startFrame={15}
        shadow
      />
      <AnimatedUnderline startFrame={35} width={280} color="rgba(255,200,150,0.6)" strokeWidth={3} />
    </AbsoluteFill>
    <FilmGrain />
  </AbsoluteFill>
);

const DetailsScene: React.FC<{
  recipeName: string;
  cookingTime: number;
  price: number;
}> = ({ recipeName, cookingTime, price }) => (
  <AbsoluteFill>
    <VideoBackground
      src="serving-food-plate.mp4"
      overlay="rgba(45,27,18,0.35)"
      playbackRate={0.5}
      startFrom={3}
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
        fontSize={42}
        fontFamily="heading"
        color={colors.white}
        animation="fadeUp"
        startFrame={3}
        shadow
      />
      <AnimatedText
        text={`${cookingTime} min \u2022 \u20AC${price.toFixed(2)}`}
        fontSize={26}
        fontFamily="body"
        color="rgba(255,220,180,0.85)"
        animation="fadeUp"
        startFrame={22}
        shadow
      />
    </AbsoluteFill>
    <FilmGrain />
  </AbsoluteFill>
);

const QuestionScene: React.FC<{ photo: string }> = ({ photo }) => (
  <AbsoluteFill>
    <PhotoBackground
      src={photo}
      overlay="rgba(45,27,18,0.3)"
      kenBurns
      kenBurnsScale={[1, 1.06]}
      warmth={0.8}
      desaturate={0.15}
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
        text="Wat wordt jouw happie?"
        fontSize={52}
        fontFamily="heading"
        color={colors.white}
        animation="fadeUp"
        startFrame={10}
        shadow
        maxWidth={800}
      />
      <HeartPulse startFrame={30} color={colors.logoCoral} size={80} pulseRate={1} />
    </AbsoluteFill>
    <FilmGrain />
  </AbsoluteFill>
);

const AppDemoScene: React.FC<{ recipeName: string }> = ({ recipeName }) => (
  <AbsoluteFill>
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
      }}
    >
      <AnimatedText
        text="Swipe je avondeten."
        fontSize={32}
        fontFamily="heading"
        color="rgba(255,220,180,0.9)"
        animation="fadeUp"
        startFrame={3}
        shadow
      />
      <AnimatedAppUI
        startFrame={10}
        sequence="wie-eet-mee"
        recipe={{
          name: recipeName,
          image: "carbonara.jpg",
          cookingTime: 25,
          description: "Romige klassieker.",
          ingredients: ["Spaghetti", "Pancetta", "Eieren", "Parmezaan"],
        }}
        membersEating={6}
        totalMembers={8}
      />
    </AbsoluteFill>
  </AbsoluteFill>
);

const CTAScene: React.FC = () => {
  const frame = useCurrentFrame();
  const fadeOut = interpolate(frame, [75, 90], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill>
      <PhotoBackground
        src="illustrations/grocery-list-check.png"
        overlay="rgba(45,27,18,0.55)"
        kenBurns
        kenBurnsScale={[1, 1.06]}
        warmth={0.7}
      />
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
        <AnimatedText
          text="Swipe je avondeten."
          fontSize={30}
          fontFamily="heading"
          color="rgba(255,220,180,0.9)"
          animation="fadeUp"
          startFrame={30}
          shadow
        />
      </AbsoluteFill>
      <FilmGrain />
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

// --- Main Template: frame-based cuts, no TransitionSeries ---
export const HetMoment: React.FC<HetMomentProps> = ({
  photos,
  recipeName,
  cookingTime,
  price,
  music,
}) => {
  const frame = useCurrentFrame();

  // Scene boundaries (frames): story-first structure
  // 80% story (photos, food, atmosphere), 20% app + CTA
  const scenes = [75, 75, 75, 75, 75, 75, 120, 90]; // = 660 ~22s story + 210 ~7s app/CTA => adjusted to 25s
  // Recalculate: 75*6=450 + 120+90=210 => 660 frames = 22s. Close to 25s=750.
  // Let's use: 90+90+90+75+75+75+120+90 = 705 => ~23.5s. Add more to story scenes.
  const sceneDurations = [95, 95, 90, 80, 75, 75, 120, 120]; // = 750

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
      {sceneIndex === 0 && <Photo1Scene photo={photos[0]} />}
      {sceneIndex === 1 && <Photo2Scene photo={photos[1]} />}
      {sceneIndex === 2 && <Photo3Scene photo={photos[2]} />}
      {sceneIndex === 3 && <VideoScene recipeName={recipeName} />}
      {sceneIndex === 4 && <DetailsScene recipeName={recipeName} cookingTime={cookingTime} price={price} />}
      {sceneIndex === 5 && <QuestionScene photo={photos[0]} />}
      {sceneIndex === 6 && <AppDemoScene recipeName={recipeName} />}
      {sceneIndex === 7 && <CTAScene />}
      <BackgroundMusic src={music} />
    </AbsoluteFill>
  );
};
