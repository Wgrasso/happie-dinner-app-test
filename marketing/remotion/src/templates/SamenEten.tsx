import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { TransitionSeries } from "@remotion/transitions";
import { slide } from "@remotion/transitions/slide";
import { wipe } from "@remotion/transitions/wipe";
import { fade } from "@remotion/transitions/fade";
import { springTiming, linearTiming } from "@remotion/transitions";
import { AnimatedText } from "../components/AnimatedText";
import { BackgroundMusic } from "../components/BackgroundMusic";
import { Confetti } from "../components/Confetti";
import { Logo } from "../components/Logo";
import { PhoneMockup } from "../components/PhoneMockup";
import { PhotoBackground } from "../components/PhotoBackground";
import { StoreBadges } from "../components/StoreBadges";
import { VideoBackground } from "../components/VideoBackground";
import {
  NotificationStack,
  HeartPulse,
} from "../components/lottie-style";
import {
  GradientBackground,
  GradientWave,
  RevealMask,
  ScreenWipe,
  AnimatedUnderline,
  ParallaxLayer,
  AnimatedAppUI,
} from "../components/motion";
import { colors } from "../theme/colors";
import { fonts } from "../theme/fonts";

export interface SamenEtenProps {
  chatMessages: { tekst: string; isReply: boolean }[];
  meals: { naam: string; foto: string; liked: boolean }[];
  matchMeal: string;
  resultPhoto: string;
  music: string;
  durationInSeconds: number;
}

// --- SamenEten PERSONALITY: Warm, social. Chat bubbles feel real.
// People-focused. Cozy colors. Deep navy #0f172a to warm brown.

const NAVY = "#0f172a";
const WARM_BROWN = "#2d1b12";
const COZY_BG = "#1a1020";

// --- Scene 1: HOOK (60 frames) --- illustration bg + warm text ---

const HookScene: React.FC = () => {
  return (
    <AbsoluteFill>
      <PhotoBackground
        src="illustrations/students-cooking-together.png"
        overlay="rgba(15,23,42,0.5)"
        kenBurns
        kenBurnsScale={[1, 1.1]}
        warmth={0.4}
      />
      <AbsoluteFill
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 12,
        }}
      >
        <AnimatedText
          text="Vanavond koken we samen."
          fontSize={48}
          fontFamily="heading"
          color={colors.white}
          animation="letterStagger"
          startFrame={5}
          shadow
          maxWidth={800}
        />
        <AnimatedUnderline startFrame={35} width={450} color={colors.logoCoral} strokeWidth={4} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// --- Scene 2: PROBLEM (90 frames) --- NotificationStack ---

const ProblemScene: React.FC<{
  chatMessages: { tekst: string; isReply: boolean }[];
}> = ({ chatMessages }) => {
  const notifications = chatMessages.slice(0, 4).map((msg, i) => ({
    sender: msg.isReply ? "Jij" : i === 0 ? "Lisa" : i === 2 ? "Tom" : "Sarah",
    message: msg.tekst,
    color: msg.isReply ? "#4A90D9" : "#25D366",
  }));

  return (
    <AbsoluteFill style={{ backgroundColor: NAVY }}>
      <ScreenWipe startFrame={0} durationFrames={14} color={colors.logoCoral} direction="right" />
      <AbsoluteFill
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          gap: 16,
        }}
      >
        {/* Chat header */}
        <div
          style={{
            position: "absolute",
            top: 130,
            left: 0,
            right: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <span
            style={{
              fontFamily: fonts.body,
              fontSize: 26,
              fontWeight: 700,
              color: "rgba(255,255,255,0.45)",
              textShadow: "0 2px 10px rgba(0,0,0,0.5)",
            }}
          >
            Groepsapp
          </span>
        </div>

        <NotificationStack
          startFrame={8}
          notifications={notifications}
          width={420}
          staggerFrames={14}
        />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// --- Scene 3: TENSION BREAK (60 frames) ---

const TensionBreakScene: React.FC = () => {
  return (
    <AbsoluteFill>
      <VideoBackground
        src="empty-fridge.mp4"
        overlay="rgba(15,23,42,0.55)"
        playbackRate={0.6}
      />
      <AbsoluteFill
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <AnimatedText
          text="Er is een betere manier."
          fontSize={44}
          fontFamily="heading"
          color={colors.white}
          animation="highlight"
          highlightColor={colors.logoCoral}
          startFrame={10}
          shadow
          maxWidth={700}
        />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// --- Scene 4: APP DEMO (180 frames) --- AnimatedAppUI with swipe ---

const AppDemoScene: React.FC<{
  matchMeal: string;
}> = ({ matchMeal }) => {
  return (
    <AbsoluteFill style={{ backgroundColor: NAVY }}>
      <ScreenWipe startFrame={0} durationFrames={14} color="#8B7355" direction="left" />
      <AbsoluteFill
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 16,
        }}
      >
        <div style={{ position: "relative" }}>
          <AnimatedText
            text="Swipe samen."
            fontSize={38}
            fontFamily="heading"
            color={colors.white}
            animation="fadeUp"
            startFrame={3}
            shadow
          />
          <AnimatedUnderline startFrame={22} width={260} color={colors.logoCoral} strokeWidth={4} y={48} />
        </div>
        <AnimatedAppUI
          startFrame={10}
          sequence="swipe-three"
          recipe={{
            name: matchMeal,
            image: "carbonara.jpg",
            cookingTime: 25,
            description: "Romige klassieker.",
            ingredients: ["Spaghetti", "Pancetta", "Eieren", "Parmezaan", "Peper"],
          }}
          swipeResults={["like", "dislike", "like"]}
        />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// --- Scene 5: MATCH (75 frames) --- HeartPulse celebration ---

const MatchScene: React.FC<{
  matchMeal: string;
  resultPhoto: string;
}> = ({ matchMeal, resultPhoto }) => {
  const frame = useCurrentFrame();

  const flashOpacity = interpolate(frame, [0, 3, 10], [0, 0.7, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill>
      <PhotoBackground
        src={resultPhoto}
        overlay="rgba(15,23,42,0.3)"
        kenBurns
        kenBurnsScale={[1, 1.08]}
        warmth={0.5}
      />

      {/* Flash overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundColor: `rgba(255,255,255,${flashOpacity})`,
          zIndex: 5,
        }}
      />

      <AbsoluteFill
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 16,
          zIndex: 6,
        }}
      >
        <HeartPulse startFrame={3} color={colors.logoCoral} size={100} />
        <AnimatedText
          text={`${matchMeal} wint!`}
          fontSize={52}
          fontFamily="heading"
          color={colors.white}
          animation="popIn"
          startFrame={6}
          shadow
        />
      </AbsoluteFill>

      <Confetti startFrame={3} particleCount={60} />
    </AbsoluteFill>
  );
};

// --- Scene 6: THE FEELING (90 frames) ---

const FeelingScene: React.FC = () => {
  return (
    <AbsoluteFill>
      <VideoBackground
        src="friends-eating-dinner-table.mp4"
        overlay="rgba(15,23,42,0.35)"
        playbackRate={0.8}
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
        {/* All three appear more rapidly, overlapping */}
        <AnimatedText
          text="Samen kiezen."
          fontSize={48}
          fontFamily="heading"
          color={colors.white}
          animation="fadeUp"
          startFrame={10}
          shadow
        />
        <AnimatedText
          text="Samen koken."
          fontSize={48}
          fontFamily="heading"
          color={colors.white}
          animation="fadeUp"
          startFrame={35}
          shadow
        />
        <AnimatedText
          text="Samen eten."
          fontSize={60}
          fontFamily="heading"
          color={colors.logoCoral}
          animation="popIn"
          startFrame={60}
          shadow
        />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// --- Scene 7: CTA (90 frames) --- loops back to "Samen eten." ---

const CTAScene: React.FC = () => {
  const frame = useCurrentFrame();

  const fadeOut = interpolate(frame, [75, 90], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ backgroundColor: NAVY }}>
      <AbsoluteFill
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 30,
        }}
      >
        <Logo animation="bounce" size={650} startFrame={5} />
        <AnimatedText
          text="Download Happie"
          fontSize={34}
          fontFamily="heading"
          color={colors.white}
          animation="fadeUp"
          startFrame={30}
          shadow
        />
        <StoreBadges startFrame={45} />
      </AbsoluteFill>
      {/* Fade to black for loop */}
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

export const SamenEten: React.FC<SamenEtenProps> = ({
  chatMessages,
  meals,
  matchMeal,
  resultPhoto,
  music,
}) => {
  return (
    <AbsoluteFill style={{ backgroundColor: NAVY }}>
      <TransitionSeries>
        {/* Scene 1: Hook (60 frames) */}
        <TransitionSeries.Sequence durationInFrames={60}>
          <HookScene />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={slide()}
          timing={springTiming({ config: { damping: 14 } })}
        />

        {/* Scene 2: Problem (90 frames) */}
        <TransitionSeries.Sequence durationInFrames={90}>
          <ProblemScene chatMessages={chatMessages} />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={slide()}
          timing={springTiming({ config: { damping: 14 } })}
        />

        {/* Scene 3: Tension break (60 frames) */}
        <TransitionSeries.Sequence durationInFrames={60}>
          <TensionBreakScene />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={slide()}
          timing={springTiming({ config: { damping: 14 } })}
        />

        {/* Scene 4: App demo (180 frames) */}
        <TransitionSeries.Sequence durationInFrames={180}>
          <AppDemoScene matchMeal={matchMeal} />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: 10 })}
        />

        {/* Scene 5: Match celebration (75 frames) */}
        <TransitionSeries.Sequence durationInFrames={75}>
          <MatchScene matchMeal={matchMeal} resultPhoto={resultPhoto} />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: 12 })}
        />

        {/* Scene 6: The feeling (90 frames) */}
        <TransitionSeries.Sequence durationInFrames={90}>
          <FeelingScene />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: 12 })}
        />

        {/* Scene 7: CTA (90 frames) */}
        <TransitionSeries.Sequence durationInFrames={90}>
          <CTAScene />
        </TransitionSeries.Sequence>
      </TransitionSeries>

      <BackgroundMusic src={music} />
    </AbsoluteFill>
  );
};
