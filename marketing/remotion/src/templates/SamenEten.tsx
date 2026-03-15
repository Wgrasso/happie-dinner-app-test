import React from "react";
import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
} from "remotion";
import { AnimatedText } from "../components/AnimatedText";
import { BackgroundMusic } from "../components/BackgroundMusic";
import { Confetti } from "../components/Confetti";
import { Logo } from "../components/Logo";
import { PhotoBackground } from "../components/PhotoBackground";
import { StoreBadges } from "../components/StoreBadges";
import { VideoBackground } from "../components/VideoBackground";
import {
  NotificationStack,
  HeartPulse,
} from "../components/lottie-style";
import {
  GradientWave,
  AnimatedUnderline,
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
// Story-first: situation 80%, app 20%.

const NAVY = "#0f172a";

const HookScene: React.FC = () => (
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
      <AbsoluteFill
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          gap: 16,
        }}
      >
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

const TensionScene: React.FC = () => (
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

const FoodScene: React.FC<{ resultPhoto: string }> = ({ resultPhoto }) => (
  <AbsoluteFill>
    <PhotoBackground
      src={resultPhoto}
      overlay="rgba(15,23,42,0.2)"
      kenBurns
      kenBurnsScale={[1, 1.1]}
      warmth={0.5}
    />
    <AbsoluteFill
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-end",
        paddingBottom: 300,
      }}
    >
      <AnimatedText
        text="Dit kan jij ook."
        fontSize={44}
        fontFamily="heading"
        color={colors.white}
        animation="fadeUp"
        startFrame={15}
        shadow
      />
    </AbsoluteFill>
  </AbsoluteFill>
);

const FeelingScene: React.FC = () => (
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

const AppDemoScene: React.FC<{ matchMeal: string }> = ({ matchMeal }) => (
  <AbsoluteFill style={{ backgroundColor: NAVY }}>
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

// --- Main Template: frame-based cuts ---
export const SamenEten: React.FC<SamenEtenProps> = ({
  chatMessages,
  meals,
  matchMeal,
  resultPhoto,
  music,
}) => {
  const frame = useCurrentFrame();

  // Story-first: 80% story, 20% app
  // Total 900 frames = 30s
  // Story: Hook(90) + Problem(120) + Tension(90) + Food(120) + Feeling(120) = 540 (18s)
  // + Match(75) = 615 (20.5s)
  // App: AppDemo(150) + CTA(135) = 285 (9.5s) => ~68/32 split
  // Better: extend story scenes
  const sceneDurations = [100, 140, 100, 120, 120, 80, 140, 100];

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
    <AbsoluteFill style={{ backgroundColor: NAVY }}>
      {sceneIndex === 0 && <HookScene />}
      {sceneIndex === 1 && <ProblemScene chatMessages={chatMessages} />}
      {sceneIndex === 2 && <TensionScene />}
      {sceneIndex === 3 && <FoodScene resultPhoto={resultPhoto} />}
      {sceneIndex === 4 && <FeelingScene />}
      {sceneIndex === 5 && <MatchScene matchMeal={matchMeal} resultPhoto={resultPhoto} />}
      {sceneIndex === 6 && <AppDemoScene matchMeal={matchMeal} />}
      {sceneIndex === 7 && <CTAScene />}
      <BackgroundMusic src={music} />
    </AbsoluteFill>
  );
};
