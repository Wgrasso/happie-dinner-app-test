import React from "react";
import {
  AbsoluteFill,
  Img,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { TransitionSeries } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { linearTiming } from "@remotion/transitions";
import { AnimatedText } from "../components/AnimatedText";
import { BackgroundMusic } from "../components/BackgroundMusic";
import { Logo } from "../components/Logo";
import { PhoneMockup } from "../components/PhoneMockup";
import { PhotoBackground } from "../components/PhotoBackground";
import { VideoBackground } from "../components/VideoBackground";
import { HeartPulse } from "../components/lottie-style";
import {
  GradientBackground,
  GradientWave,
  RevealMask,
  ScreenWipe,
  AnimatedUnderline,
  ParallaxLayer,
  AnimatedAppUI,
  AnimatedLine,
} from "../components/motion";
import { colors } from "../theme/colors";
import { fonts } from "../theme/fonts";

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
// All photos get extra warm tint, slightly desaturated.

// Film grain overlay component
const FilmGrain: React.FC = () => {
  const frame = useCurrentFrame();

  // Subtle shifting noise pattern using rectangles
  const grainOpacity = 0.06;
  const grainSeed = frame % 3; // Changes every 3 frames for subtle flicker

  return (
    <AbsoluteFill
      style={{
        pointerEvents: "none",
        zIndex: 99,
        mixBlendMode: "overlay",
        opacity: grainOpacity,
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

// --- Scene 1: PHOTO 1 (75 frames) --- Ken Burns zoom in, golden hour ---

const Photo1Scene: React.FC<{
  photo: string;
}> = ({ photo }) => {
  return (
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
};

// --- Scene 2: PHOTO 2 (75 frames) --- zoom out ---

const Photo2Scene: React.FC<{
  photo: string;
}> = ({ photo }) => {
  return (
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
};

// --- Scene 3: PHOTO 3 (75 frames) --- diagonal reveal ---

const Photo3Scene: React.FC<{
  photo: string;
}> = ({ photo }) => {
  return (
    <AbsoluteFill>
      <RevealMask startFrame={0} durationFrames={20} shape="diagonal">
        <PhotoBackground
          src={photo}
          overlay="rgba(45,27,18,0.15)"
          kenBurns
          kenBurnsScale={[1.02, 1.1]}
          warmth={0.8}
          desaturate={0.15}
        />
      </RevealMask>
      <FilmGrain />
    </AbsoluteFill>
  );
};

// --- Scene 4: VIDEO (75 frames) --- slow-mo food serving ---

const VideoScene: React.FC<{
  recipeName: string;
}> = ({ recipeName }) => {
  return (
    <AbsoluteFill>
      <VideoBackground
        src="serving-food-plate.mp4"
        overlay="rgba(45,27,18,0.3)"
        playbackRate={0.5}
      />
      <ScreenWipe startFrame={0} durationFrames={14} color="rgba(139,115,85,0.5)" direction="up" />
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
};

// --- Scene 5: DETAILS (75 frames) ---

const DetailsScene: React.FC<{
  recipeName: string;
  cookingTime: number;
  price: number;
}> = ({ recipeName, cookingTime, price }) => {
  return (
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
};

// --- Scene 6: THE QUESTION (75 frames) --- HeartPulse ---

const QuestionScene: React.FC<{
  photo: string;
}> = ({ photo }) => {
  return (
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
};

// --- Scene 7: APP DEMO (120 frames) ---

const AppDemoScene: React.FC<{
  recipeName: string;
}> = ({ recipeName }) => {
  return (
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
};

// --- Scene 8: CTA (90 frames) --- illustration bg + fade to black ---

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
      {/* Fade to black — loops to cinematic photo opening */}
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
      <TransitionSeries>
        {/* Scene 1: Photo 1 (75 frames) */}
        <TransitionSeries.Sequence durationInFrames={75}>
          <Photo1Scene photo={photos[0]} />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: 18 })}
        />

        {/* Scene 2: Photo 2 (75 frames) */}
        <TransitionSeries.Sequence durationInFrames={75}>
          <Photo2Scene photo={photos[1]} />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: 18 })}
        />

        {/* Scene 3: Photo 3 (75 frames) */}
        <TransitionSeries.Sequence durationInFrames={75}>
          <Photo3Scene photo={photos[2]} />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: 12 })}
        />

        {/* Scene 4: Video (75 frames) */}
        <TransitionSeries.Sequence durationInFrames={75}>
          <VideoScene recipeName={recipeName} />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: 12 })}
        />

        {/* Scene 5: Details (75 frames) */}
        <TransitionSeries.Sequence durationInFrames={75}>
          <DetailsScene
            recipeName={recipeName}
            cookingTime={cookingTime}
            price={price}
          />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: 12 })}
        />

        {/* Scene 6: The question (75 frames) */}
        <TransitionSeries.Sequence durationInFrames={75}>
          <QuestionScene photo={photos[0]} />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: 12 })}
        />

        {/* Scene 7: App demo (120 frames) */}
        <TransitionSeries.Sequence durationInFrames={120}>
          <AppDemoScene recipeName={recipeName} />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: 12 })}
        />

        {/* Scene 8: CTA (90 frames) */}
        <TransitionSeries.Sequence durationInFrames={90}>
          <CTAScene />
        </TransitionSeries.Sequence>
      </TransitionSeries>

      <BackgroundMusic src={music} />
    </AbsoluteFill>
  );
};
