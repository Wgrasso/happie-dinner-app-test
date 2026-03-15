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
import { PhoneMockup } from "../components/PhoneMockup";
import { PhotoBackground } from "../components/PhotoBackground";
import { SceneTransition } from "../components/SceneTransition";
import { VideoBackground } from "../components/VideoBackground";
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

// ─── Scene 1: PHOTO 1 — Ken Burns zoom IN (frames 0-90) ────────────────────

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

// ─── Scene 2: PHOTO 2 — Ken Burns zoom OUT (frames 90-180) ─────────────────

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

// ─── Scene 3: PHOTO 3 — subtle zoom (frames 180-270) ───────────────────────

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

// ─── Scene 4: VIDEO — slow-mo food serving (frames 270-360) ────────────────
// First text appears: recipe name

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
          startFrame={300}
          shadow
        />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ─── Scene 5: DETAILS (frames 360-450) ──────────────────────────────────────
// Continue video bg. "20 min . €3,50" fades in.

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
          startFrame={365}
          shadow
        />
        <AnimatedText
          text={`${cookingTime} min \u2022 \u20AC${price.toFixed(2)}`}
          fontSize={28}
          fontFamily="body"
          color="rgba(255,255,255,0.85)"
          animation="fadeUp"
          startFrame={390}
          shadow
        />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ─── Scene 6: THE QUESTION (frames 450-540) ────────────────────────────────
// Best photo bg. Big elegant text.

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
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <AnimatedText
          text="Wat wordt jouw happie?"
          fontSize={56}
          fontFamily="heading"
          color={colors.white}
          animation="fadeUp"
          startFrame={465}
          shadow
          maxWidth={800}
        />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ─── Scene 7: APP PEEK (frames 540-660) ────────────────────────────────────
// Small phone mockup at 20% opacity behind text

const AppPeekScene: React.FC<{
  photo: string;
}> = ({ photo }) => {
  const frame = useCurrentFrame();

  const phoneOpacity = interpolate(frame, [550, 580], [0, 0.2], {
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
          startFrame={560}
          shadow
        />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ─── Scene 8: CTA (frames 660-750) ──────────────────────────────────────────

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
      <Logo animation="bounce" size={650} startFrame={665} />
      <AnimatedText
        text="Swipe je avondeten."
        fontSize={32}
        fontFamily="body"
        color={colors.white}
        animation="fadeUp"
        startFrame={700}
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
      {/* Scene 1: Photo 1 — zoom in (0-90) */}
      <SceneTransition enterFrame={0} exitFrame={90} fadeFrames={15}>
        <Photo1Scene photo={photos[0]} />
      </SceneTransition>

      {/* Scene 2: Photo 2 — zoom out, crossfade (90-180) */}
      <SceneTransition enterFrame={75} exitFrame={180} fadeFrames={15}>
        <Photo2Scene photo={photos[1]} />
      </SceneTransition>

      {/* Scene 3: Photo 3 — subtle zoom (180-270) */}
      <SceneTransition enterFrame={165} exitFrame={270} fadeFrames={15}>
        <Photo3Scene photo={photos[2]} />
      </SceneTransition>

      {/* Scene 4: Video — slow-mo serving (270-360) */}
      <SceneTransition enterFrame={270} exitFrame={360} fadeFrames={15}>
        <VideoScene recipeName={recipeName} />
      </SceneTransition>

      {/* Scene 5: Details (360-450) */}
      <SceneTransition enterFrame={360} exitFrame={450} fadeFrames={12}>
        <DetailsScene
          recipeName={recipeName}
          cookingTime={cookingTime}
          price={price}
        />
      </SceneTransition>

      {/* Scene 6: The question (450-540) */}
      <SceneTransition enterFrame={450} exitFrame={540} fadeFrames={15}>
        <QuestionScene photo={photos[0]} />
      </SceneTransition>

      {/* Scene 7: App peek (540-660) */}
      <SceneTransition enterFrame={540} exitFrame={660} fadeFrames={15}>
        <AppPeekScene photo={photos[2]} />
      </SceneTransition>

      {/* Scene 8: CTA (660-750) */}
      <SceneTransition enterFrame={660} exitFrame={750} fadeFrames={15}>
        <CTAScene />
      </SceneTransition>

      <BackgroundMusic src={music} />
    </AbsoluteFill>
  );
};
