import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { AnimatedText } from "../components/AnimatedText";
import { BackgroundMusic } from "../components/BackgroundMusic";
import { Logo } from "../components/Logo";
import { PhotoBackground } from "../components/PhotoBackground";
import { PhoneMockup } from "../components/PhoneMockup";
import { StoreBadges } from "../components/StoreBadges";
import { VideoBackground } from "../components/VideoBackground";
import { NotificationStack, Checkmark } from "../components/lottie-style";
import {
  GradientWave,
  RevealMask,
  AnimatedUnderline,
  AnimatedAppUI,
  AnimatedCounter,
} from "../components/motion";
import { colors } from "../theme/colors";

export interface WatEtenWeProps {
  hookPhoto: string;
  solutionPhoto: string;
  resultPhoto: string;
  recipeName: string;
  cookingTime: number;
  price: number;
  meals: { naam: string; foto: string; liked: boolean }[];
  music: string;
  durationInSeconds: number;
}

// --- WatEtenWe PERSONALITY: Fast, chaotic energy. Quick cuts.
// Story-first: situation takes 80%, app peek at end.

const HookScene: React.FC = () => {
  const frame = useCurrentFrame();
  const flashOpacity = interpolate(frame, [0, 3, 8], [0, 0.6, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill>
      <PhotoBackground
        src="illustrations/empty-fridge-sad.png"
        overlay="rgba(0,0,0,0.55)"
        kenBurns
        kenBurnsScale={[1.05, 1.15]}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundColor: colors.logoCoral,
          opacity: flashOpacity,
          zIndex: 2,
        }}
      />
      <AbsoluteFill
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 12,
          zIndex: 3,
        }}
      >
        <AnimatedText
          text="Het is 17:00."
          fontSize={80}
          fontFamily="heading"
          color={colors.white}
          animation="slamIn"
          startFrame={3}
          shadow
        />
        <AnimatedText
          text="Niemand weet het."
          fontSize={40}
          fontFamily="body"
          color={colors.logoCoral}
          animation="letterStagger"
          startFrame={18}
          shadow
        />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const ProblemScene: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <div
        style={{
          position: "absolute",
          top: "15%",
          right: 60,
          width: 80,
          height: 80,
          borderRadius: "50%",
          border: `3px solid rgba(244,132,95,${interpolate(frame, [0, 60], [0, 0.3], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          })})`,
          transform: `scale(${interpolate(frame, [0, 60], [0.5, 1.5], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          })})`,
        }}
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
        <NotificationStack
          startFrame={5}
          notifications={[
            { sender: "Lisa", message: "Wat eten we?", color: "#25D366" },
            { sender: "Tom", message: "Weet niet...", color: "#25D366" },
            { sender: "Sarah", message: "NIET WEER PASTA", color: "#E74C3C" },
          ]}
          width={380}
          staggerFrames={15}
        />
        <AnimatedText
          text="Elke. Avond. Hetzelfde."
          fontSize={44}
          fontFamily="heading"
          color={colors.logoCoral}
          animation="glitch"
          startFrame={55}
          shadow
        />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const SituationScene: React.FC<{ photo: string }> = ({ photo }) => (
  <AbsoluteFill>
    <PhotoBackground
      src={photo}
      overlay="rgba(0,0,0,0.25)"
      kenBurns
      kenBurnsScale={[1.1, 1]}
    />
    <AbsoluteFill
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <AnimatedText
        text="Er is een app."
        fontSize={56}
        fontFamily="heading"
        color={colors.white}
        animation="slamIn"
        startFrame={8}
        shadow
      />
    </AbsoluteFill>
  </AbsoluteFill>
);

const FoodRevealScene: React.FC<{
  resultPhoto: string;
  recipeName: string;
  cookingTime: number;
  price: number;
}> = ({ resultPhoto, recipeName, cookingTime, price }) => (
  <AbsoluteFill>
    <PhotoBackground
      src={resultPhoto}
      overlay="rgba(0,0,0,0.3)"
      kenBurns
      kenBurnsScale={[1, 1.12]}
      warmth={0.5}
    />
    <RevealMask startFrame={0} durationFrames={16} shape="circle">
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
          fontSize={56}
          fontFamily="heading"
          color={colors.white}
          animation="popIn"
          startFrame={16}
          shadow
          glow="rgba(255,255,255,0.2)"
        />
        <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
          <AnimatedText
            text={`${cookingTime} min`}
            fontSize={28}
            fontFamily="body"
            color="rgba(255,255,255,0.85)"
            animation="fadeUp"
            startFrame={35}
            shadow
          />
          <AnimatedCounter
            from={0}
            to={price}
            startFrame={35}
            durationFrames={25}
            prefix={"\u20AC"}
            fontSize={48}
            color={colors.logoCoral}
            showUnderline
            underlineColor={colors.logoCoral}
          />
        </div>
      </AbsoluteFill>
    </RevealMask>
  </AbsoluteFill>
);

const AppScene: React.FC<{ recipeName: string }> = ({ recipeName }) => (
  <AbsoluteFill style={{ backgroundColor: "#000" }}>
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
        text="Swipe samen."
        fontSize={44}
        fontFamily="heading"
        color={colors.white}
        animation="letterStagger"
        startFrame={5}
        shadow
      />
      <AnimatedAppUI
        startFrame={15}
        sequence="swipe-three"
        recipe={{
          name: recipeName,
          image: "carbonara.jpg",
          cookingTime: 25,
          description: "Romige Italiaanse klassieker.",
          ingredients: ["Spaghetti", "Pancetta", "Eieren", "Parmezaan", "Peper"],
        }}
        swipeResults={["like", "dislike", "like"]}
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
        src="illustrations/happy-dinner-table.png"
        overlay="rgba(0,0,0,0.6)"
        kenBurns
        kenBurnsScale={[1, 1.08]}
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
        <Logo animation="bounce" size={650} startFrame={5} />
        <AnimatedText
          text="Download Happie"
          fontSize={36}
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
export const WatEtenWe: React.FC<WatEtenWeProps> = ({
  hookPhoto,
  solutionPhoto,
  resultPhoto,
  recipeName,
  cookingTime,
  price,
  meals,
  music,
}) => {
  const frame = useCurrentFrame();

  // Story-first: 80% situation, 20% app
  // Total 900 frames = 30s
  // Story: Hook(90) + Problem(120) + Situation(120) + FoodReveal(120) + MoreFood(120) = 570 frames (19s)
  // App: AppScene(180) + CTA(150) = 330 frames (11s) - still a bit much, let's adjust
  // Better: Hook(90) + Problem(120) + Situation(90) + Food1(120) + Food2(120) = 540 (18s)
  //         App(180) + CTA(180) = 360 (12s)... still too app-heavy.
  // Final: Hook(100) + Problem(140) + Situation(100) + FoodReveal(150) + MoreFood(150) = 640 (21.3s)
  //        App(150) + CTA(110) = 260 (8.7s) => ~78/22 split
  const sceneDurations = [100, 140, 100, 150, 150, 150, 110];

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
      {sceneIndex === 0 && <HookScene />}
      {sceneIndex === 1 && <ProblemScene />}
      {sceneIndex === 2 && <SituationScene photo={solutionPhoto} />}
      {sceneIndex === 3 && (
        <FoodRevealScene
          resultPhoto={resultPhoto}
          recipeName={recipeName}
          cookingTime={cookingTime}
          price={price}
        />
      )}
      {sceneIndex === 4 && (
        <AbsoluteFill>
          <PhotoBackground
            src={hookPhoto}
            overlay="rgba(0,0,0,0.3)"
            kenBurns
            kenBurnsScale={[1, 1.1]}
            warmth={0.4}
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
              text="Lekker toch?"
              fontSize={48}
              fontFamily="heading"
              color={colors.white}
              animation="fadeUp"
              startFrame={20}
              shadow
            />
          </AbsoluteFill>
        </AbsoluteFill>
      )}
      {sceneIndex === 5 && <AppScene recipeName={recipeName} />}
      {sceneIndex === 6 && <CTAScene />}
      <BackgroundMusic src={music} />
    </AbsoluteFill>
  );
};
