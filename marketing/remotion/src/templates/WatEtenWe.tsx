import React from "react";
import {
  AbsoluteFill,
  Img,
  interpolate,
  spring,
  staticFile,
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
import { Logo } from "../components/Logo";
import { PhotoBackground } from "../components/PhotoBackground";
import { PhoneMockup } from "../components/PhoneMockup";
import { StoreBadges } from "../components/StoreBadges";
import { VideoBackground } from "../components/VideoBackground";
import { NotificationStack, Checkmark } from "../components/lottie-style";
import {
  GradientBackground,
  GradientWave,
  RevealMask,
  ScreenWipe,
  AnimatedUnderline,
  AnimatedAppUI,
  AnimatedCounter,
  ParallaxLayer,
} from "../components/motion";
import { colors } from "../theme/colors";
import { fonts } from "../theme/fonts";

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

// --- WatEtenWe PERSONALITY: Fast, chaotic energy. Quick cuts. Multiple elements
// simultaneously. High contrast: pure black #000 to bright coral #F4845F.

// --- Scene 1: HOOK (60 frames) --- illustration bg + slamIn text ---

const HookScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Rapid color flash behind text
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
      {/* Flash */}
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
        {/* Both appear almost simultaneously */}
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

// --- Scene 2: PROBLEM (90 frames) --- ScreenWipe + NotificationStack ---

const ProblemScene: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <ScreenWipe startFrame={0} durationFrames={14} color={colors.logoCoral} direction="right" />
      {/* Animated shapes for visual interest */}
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

// --- Scene 3: TRANSITION PUNCH (60 frames) --- food photo flash ---

const TransitionPunchScene: React.FC<{ photo: string }> = ({ photo }) => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill>
      <PhotoBackground
        src={photo}
        overlay="rgba(0,0,0,0.25)"
        kenBurns
        kenBurnsScale={[1.1, 1]}
      />
      <ScreenWipe startFrame={0} durationFrames={12} color="#000" direction="left" />
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
};

// --- Scene 4: APP SOLUTION (180 frames) --- AnimatedAppUI swipe ---

const AppScene: React.FC<{
  recipeName: string;
}> = ({ recipeName }) => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <ScreenWipe startFrame={0} durationFrames={14} color="#8B7355" direction="left" />
      {/* Geometric lines for energy */}
      <div
        style={{
          position: "absolute",
          top: 100,
          left: 0,
          right: 0,
          height: 2,
          background: "linear-gradient(90deg, transparent, rgba(244,132,95,0.3), transparent)",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: 200,
          left: 0,
          right: 0,
          height: 2,
          background: "linear-gradient(90deg, transparent, rgba(244,132,95,0.3), transparent)",
        }}
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
};

// --- Scene 5: FOOD REVEAL (90 frames) --- RevealMask + counter ---

const FoodRevealScene: React.FC<{
  resultPhoto: string;
  recipeName: string;
  cookingTime: number;
  price: number;
}> = ({ resultPhoto, recipeName, cookingTime, price }) => {
  return (
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
};

// --- Scene 6: CTA (90 frames) --- illustration bg + logo + fade to black ---

const CTAScene: React.FC = () => {
  const frame = useCurrentFrame();

  // Fade to black in last 15 frames for loop
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
  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <TransitionSeries>
        {/* Scene 1: Hook (60 frames) --- illustration + slamIn */}
        <TransitionSeries.Sequence durationInFrames={60}>
          <HookScene />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={wipe()}
          timing={springTiming({ config: { damping: 14 } })}
        />

        {/* Scene 2: Problem (90 frames) --- notifications */}
        <TransitionSeries.Sequence durationInFrames={90}>
          <ProblemScene />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={slide()}
          timing={springTiming({ config: { damping: 14 } })}
        />

        {/* Scene 3: Transition punch (60 frames) --- food photo flash */}
        <TransitionSeries.Sequence durationInFrames={60}>
          <TransitionPunchScene photo={solutionPhoto} />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={slide()}
          timing={springTiming({ config: { damping: 14 } })}
        />

        {/* Scene 4: App Solution (180 frames) --- swipe demo */}
        <TransitionSeries.Sequence durationInFrames={180}>
          <AppScene recipeName={recipeName} />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: 12 })}
        />

        {/* Scene 5: Food Reveal (90 frames) */}
        <TransitionSeries.Sequence durationInFrames={90}>
          <FoodRevealScene
            resultPhoto={resultPhoto}
            recipeName={recipeName}
            cookingTime={cookingTime}
            price={price}
          />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: 12 })}
        />

        {/* Scene 6: CTA (90 frames) --- with fade-to-black loop */}
        <TransitionSeries.Sequence durationInFrames={90}>
          <CTAScene />
        </TransitionSeries.Sequence>
      </TransitionSeries>

      <BackgroundMusic src={music} />
    </AbsoluteFill>
  );
};
