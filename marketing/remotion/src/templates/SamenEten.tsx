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

// --- Scene 1: HOOK -----------------------------------------------------------

const HookScene: React.FC = () => {
  return (
    <AbsoluteFill>
      <GradientBackground
        colors={["#0a0a1a", "#1a1a2e", "#0d1117"]}
        animate
        angle={135}
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
          text="Vanavond koken we samen."
          fontSize={52}
          fontFamily="heading"
          color={colors.white}
          animation="fadeUp"
          startFrame={5}
          shadow
          maxWidth={800}
        />
        <AnimatedUnderline startFrame={35} width={500} color={colors.logoCoral} strokeWidth={4} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// --- Scene 2: PROBLEM --- NotificationStack ----------------------------------

const ProblemScene: React.FC<{
  chatMessages: { tekst: string; isReply: boolean }[];
}> = ({ chatMessages }) => {
  const notifications = chatMessages.slice(0, 5).map((msg, i) => ({
    sender: msg.isReply ? "Jij" : i === 0 ? "Lisa" : i === 2 ? "Tom" : "Sarah",
    message: msg.tekst,
    color: msg.isReply ? "#4A90D9" : "#25D366",
  }));

  return (
    <AbsoluteFill>
      <GradientBackground colors={["#1a1a2e", "#0d1117"]} angle={180} />
      <ScreenWipe startFrame={0} durationFrames={16} color={colors.logoCoral} direction="right" />
      <AbsoluteFill
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          gap: 20,
        }}
      >
        {/* Chat header */}
        <div
          style={{
            position: "absolute",
            top: 120,
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
              fontSize: 28,
              fontWeight: 700,
              color: "rgba(255,255,255,0.5)",
              textShadow: "0 4px 30px rgba(0,0,0,0.8), 0 2px 10px rgba(0,0,0,0.5)",
            }}
          >
            Groepsapp
          </span>
        </div>

        <NotificationStack
          startFrame={10}
          notifications={notifications}
          width={420}
          staggerFrames={18}
        />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// --- Scene 3: TENSION BREAK -------------------------------------------------

const TensionBreakScene: React.FC = () => {
  return (
    <AbsoluteFill>
      <VideoBackground
        src="empty-fridge.mp4"
        overlay="rgba(0,0,0,0.55)"
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
          startFrame={15}
          shadow
          maxWidth={700}
        />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// --- Scene 4: APP DEMO --- AnimatedAppUI with swipe-three --------------------

const AppDemoScene: React.FC<{
  matchMeal: string;
}> = ({ matchMeal }) => {
  return (
    <AbsoluteFill>
      <GradientWave
        colors={["#1a1a2e", "#0d1117", "#16213e"]}
        speed={0.8}
        direction="diagonal"
      />
      <ScreenWipe startFrame={0} durationFrames={16} color="#8B7355" direction="left" />
      <AbsoluteFill
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 20,
        }}
      >
        <div style={{ position: "relative" }}>
          <AnimatedText
            text="Swipe samen."
            fontSize={40}
            fontFamily="heading"
            color={colors.white}
            animation="fadeUp"
            startFrame={5}
            shadow
          />
          <AnimatedUnderline startFrame={30} width={280} color={colors.logoCoral} strokeWidth={4} y={50} />
        </div>
        <AnimatedAppUI
          startFrame={15}
          sequence="swipe-three"
          recipe={{
            name: matchMeal,
            image: "carbonara.jpg",
            cookingTime: 25,
            description: "Romige Italiaanse klassieker met pancetta en parmezaan.",
            ingredients: ["Spaghetti", "Pancetta", "Eieren", "Parmezaan", "Peper"],
          }}
          swipeResults={["like", "dislike", "like"]}
        />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// --- Scene 5: MATCH --- HeartPulse celebration -------------------------------

const MatchScene: React.FC<{
  matchMeal: string;
  resultPhoto: string;
}> = ({ matchMeal, resultPhoto }) => {
  const frame = useCurrentFrame();

  const flashOpacity = interpolate(frame, [0, 3, 10], [0, 0.8, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill>
      <PhotoBackground
        src={resultPhoto}
        overlay="rgba(0,0,0,0.35)"
        kenBurns
        kenBurnsScale={[1, 1.1]}
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
          gap: 20,
          zIndex: 6,
        }}
      >
        <HeartPulse startFrame={5} color={colors.logoCoral} size={100} />
        <AnimatedText
          text={`${matchMeal} wint!`}
          fontSize={56}
          fontFamily="heading"
          color={colors.white}
          animation="popIn"
          startFrame={8}
          shadow
        />
      </AbsoluteFill>

      <Confetti startFrame={5} particleCount={60} />
    </AbsoluteFill>
  );
};

// --- Scene 6: THE FEELING ----------------------------------------------------

const FeelingScene: React.FC<{
  resultPhoto: string;
}> = ({ resultPhoto }) => {
  return (
    <AbsoluteFill>
      <VideoBackground
        src="friends-eating-dinner-table.mp4"
        overlay="rgba(0,0,0,0.4)"
        playbackRate={0.8}
      />
      <AbsoluteFill
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 30,
        }}
      >
        <ParallaxLayer speed={-0.1}>
          <AbsoluteFill
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 30,
            }}
          >
            <AnimatedText
              text="Samen kiezen."
              fontSize={52}
              fontFamily="heading"
              color={colors.white}
              animation="fadeUp"
              startFrame={20}
              shadow
            />
            <AnimatedText
              text="Samen koken."
              fontSize={52}
              fontFamily="heading"
              color={colors.white}
              animation="fadeUp"
              startFrame={60}
              shadow
            />
            <AnimatedText
              text="Samen eten."
              fontSize={64}
              fontFamily="heading"
              color={colors.logoCoral}
              animation="popIn"
              startFrame={100}
              shadow
            />
          </AbsoluteFill>
        </ParallaxLayer>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// --- Scene 7: CTA ------------------------------------------------------------

const CTAScene: React.FC<{
  resultPhoto: string;
}> = ({ resultPhoto }) => {
  return (
    <AbsoluteFill>
      <GradientBackground
        colors={["#1a1a2e", "#2d1b12", "#0d1117"]}
        animate
        angle={135}
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
        <Logo animation="bounce" size={650} startFrame={10} />
        <AnimatedText
          text="Download Happie"
          fontSize={36}
          fontFamily="heading"
          color={colors.white}
          animation="fadeUp"
          startFrame={40}
          shadow
        />
        <StoreBadges startFrame={60} />
      </AbsoluteFill>
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
    <AbsoluteFill style={{ backgroundColor: "#0d1117" }}>
      <TransitionSeries>
        {/* Scene 1: Hook (60 frames) */}
        <TransitionSeries.Sequence durationInFrames={60}>
          <HookScene />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={slide()}
          timing={springTiming({ config: { damping: 14 } })}
        />

        {/* Scene 2: Problem --- NotificationStack (150 frames) */}
        <TransitionSeries.Sequence durationInFrames={150}>
          <ProblemScene chatMessages={chatMessages} />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={slide()}
          timing={springTiming({ config: { damping: 12 } })}
        />

        {/* Scene 3: Tension break --- video (60 frames) */}
        <TransitionSeries.Sequence durationInFrames={60}>
          <TensionBreakScene />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={slide()}
          timing={springTiming({ config: { damping: 14 } })}
        />

        {/* Scene 4: App demo --- AnimatedAppUI swipe (210 frames) */}
        <TransitionSeries.Sequence durationInFrames={210}>
          <AppDemoScene matchMeal={matchMeal} />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: 12 })}
        />

        {/* Scene 5: Match celebration --- HeartPulse (90 frames) */}
        <TransitionSeries.Sequence durationInFrames={90}>
          <MatchScene matchMeal={matchMeal} resultPhoto={resultPhoto} />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: 15 })}
        />

        {/* Scene 6: The feeling (120 frames) */}
        <TransitionSeries.Sequence durationInFrames={120}>
          <FeelingScene resultPhoto={resultPhoto} />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: 15 })}
        />

        {/* Scene 7: CTA (120 frames) */}
        <TransitionSeries.Sequence durationInFrames={120}>
          <CTAScene resultPhoto={resultPhoto} />
        </TransitionSeries.Sequence>
      </TransitionSeries>

      <BackgroundMusic src={music} />
    </AbsoluteFill>
  );
};
