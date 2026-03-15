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
import { CookingPot, HeartPulse } from "../components/lottie-style";
import { colors } from "../theme/colors";
import { fonts } from "../theme/fonts";

export interface HetMomentProps {
  photos: [string, string, string]; // 3 food photos
  recipeName: string;
  cookingTime: number;
  price: number;
  servings: number;
  music: string;
  durationInSeconds: number;
}

// ─── Scene 1: PHOTO 1 — Ken Burns zoom IN ──────────────────────────────────

const Photo1Scene: React.FC<{
  photo: string;
}> = ({ photo }) => {
  return (
    <AbsoluteFill>
      <PhotoBackground
        src={photo}
        overlay="rgba(0,0,0,0.15)"
        kenBurns
        kenBurnsScale={[1, 1.15]}
        warmth={0.4}
      />
    </AbsoluteFill>
  );
};

// ─── Scene 2: PHOTO 2 — Ken Burns zoom OUT ─────────────────────────────────

const Photo2Scene: React.FC<{
  photo: string;
}> = ({ photo }) => {
  return (
    <AbsoluteFill>
      <PhotoBackground
        src={photo}
        overlay="rgba(0,0,0,0.15)"
        kenBurns
        kenBurnsScale={[1.15, 1]}
        warmth={0.3}
      />
    </AbsoluteFill>
  );
};

// ─── Scene 3: PHOTO 3 — subtle zoom ────────────────────────────────────────

const Photo3Scene: React.FC<{
  photo: string;
}> = ({ photo }) => {
  return (
    <AbsoluteFill>
      <PhotoBackground
        src={photo}
        overlay="rgba(0,0,0,0.25)"
        kenBurns
        kenBurnsScale={[1.02, 1.1]}
        warmth={0.5}
      />
    </AbsoluteFill>
  );
};

// ─── Scene 4: VIDEO — slow-mo food serving + CookingPot ────────────────────

const VideoScene: React.FC<{
  recipeName: string;
}> = ({ recipeName }) => {
  return (
    <AbsoluteFill>
      <VideoBackground
        src="serving-food-plate.mp4"
        overlay="rgba(0,0,0,0.35)"
        playbackRate={0.5}
      />
      <AbsoluteFill
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <AnimatedText
          text={recipeName}
          fontSize={48}
          fontFamily="heading"
          color={colors.white}
          animation="fadeUp"
          startFrame={20}
          shadow
        />
      </AbsoluteFill>
      {/* Atmospheric CookingPot in bottom-left corner */}
      <div
        style={{
          position: "absolute",
          bottom: 50,
          left: 50,
          opacity: 0.75,
        }}
      >
        <CookingPot startFrame={10} size={120} />
      </div>
    </AbsoluteFill>
  );
};

// ─── Scene 5: DETAILS ───────────────────────────────────────────────────────

const DetailsScene: React.FC<{
  recipeName: string;
  cookingTime: number;
  price: number;
}> = ({ recipeName, cookingTime, price }) => {
  return (
    <AbsoluteFill>
      <VideoBackground
        src="serving-food-plate.mp4"
        overlay="rgba(0,0,0,0.4)"
        playbackRate={0.5}
        startFrom={3}
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
          text={recipeName}
          fontSize={44}
          fontFamily="heading"
          color={colors.white}
          animation="fadeUp"
          startFrame={5}
          shadow
        />
        <AnimatedText
          text={`${cookingTime} min \u2022 \u20AC${price.toFixed(2)}`}
          fontSize={28}
          fontFamily="body"
          color="rgba(255,255,255,0.85)"
          animation="fadeUp"
          startFrame={30}
          shadow
        />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ─── Scene 6: THE QUESTION + HeartPulse ─────────────────────────────────────

const QuestionScene: React.FC<{
  photo: string;
}> = ({ photo }) => {
  return (
    <AbsoluteFill>
      <PhotoBackground
        src={photo}
        overlay="rgba(0,0,0,0.35)"
        kenBurns
        kenBurnsScale={[1, 1.08]}
        warmth={0.6}
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
          text="Wat wordt jouw happie?"
          fontSize={56}
          fontFamily="heading"
          color={colors.white}
          animation="fadeUp"
          startFrame={15}
          shadow
          maxWidth={800}
        />
        {/* HeartPulse for emotional moment */}
        <HeartPulse startFrame={40} color={colors.logoCoral} size={80} pulseRate={1} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ─── Scene 7: APP PEEK ──────────────────────────────────────────────────────

const AppPeekScene: React.FC<{
  photo: string;
}> = ({ photo }) => {
  const frame = useCurrentFrame();

  const phoneOpacity = interpolate(frame, [10, 40], [0, 0.2], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill>
      <PhotoBackground
        src={photo}
        overlay="rgba(0,0,0,0.45)"
        kenBurns
        kenBurnsScale={[1.02, 1.08]}
        warmth={0.5}
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
        {/* Subtle phone behind text */}
        <div style={{ opacity: phoneOpacity, position: "absolute" }}>
          <PhoneMockup scale={0.6}>
            <div
              style={{
                width: 300,
                height: 620,
                backgroundColor: colors.background,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <span
                style={{
                  fontFamily: fonts.heading,
                  fontSize: 24,
                  fontWeight: 700,
                  color: colors.logoCoral,
                }}
              >
                Swipe
              </span>
            </div>
          </PhoneMockup>
        </div>

        <AnimatedText
          text="Swipe je avondeten."
          fontSize={48}
          fontFamily="heading"
          color={colors.white}
          animation="fadeUp"
          startFrame={20}
          shadow
        />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ─── Scene 8: CTA ───────────────────────────────────────────────────────────

const CTAScene: React.FC = () => {
  return (
    <AbsoluteFill
      style={{
        background: "linear-gradient(135deg, #1a1a2e 0%, #0f3460 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 30,
      }}
    >
      <Logo animation="bounce" size={650} startFrame={5} />
      <AnimatedText
        text="Swipe je avondeten."
        fontSize={32}
        fontFamily="body"
        color={colors.white}
        animation="fadeUp"
        startFrame={40}
        shadow
      />
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
      <TransitionSeries>
        {/* Scene 1: Photo 1 — zoom in (90 frames) */}
        <TransitionSeries.Sequence durationInFrames={90}>
          <Photo1Scene photo={photos[0]} />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: 20 })}
        />

        {/* Scene 2: Photo 2 — zoom out (90 frames) */}
        <TransitionSeries.Sequence durationInFrames={90}>
          <Photo2Scene photo={photos[1]} />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: 20 })}
        />

        {/* Scene 3: Photo 3 — subtle zoom (90 frames) */}
        <TransitionSeries.Sequence durationInFrames={90}>
          <Photo3Scene photo={photos[2]} />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: 15 })}
        />

        {/* Scene 4: Video — slow-mo serving + CookingPot (90 frames) */}
        <TransitionSeries.Sequence durationInFrames={90}>
          <VideoScene recipeName={recipeName} />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: 15 })}
        />

        {/* Scene 5: Details (90 frames) */}
        <TransitionSeries.Sequence durationInFrames={90}>
          <DetailsScene
            recipeName={recipeName}
            cookingTime={cookingTime}
            price={price}
          />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: 15 })}
        />

        {/* Scene 6: The question + HeartPulse (90 frames) */}
        <TransitionSeries.Sequence durationInFrames={90}>
          <QuestionScene photo={photos[0]} />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: 15 })}
        />

        {/* Scene 7: App peek (120 frames) */}
        <TransitionSeries.Sequence durationInFrames={120}>
          <AppPeekScene photo={photos[2]} />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: 15 })}
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
