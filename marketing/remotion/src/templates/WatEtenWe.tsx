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

// --- Scene 1: HOOK --- GradientBackground + bold text + AnimatedUnderline ---

const HookScene: React.FC = () => {
  const frame = useCurrentFrame();

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
          gap: 20,
        }}
      >
        <AnimatedText
          text="Het is 17:00."
          fontSize={80}
          fontFamily="heading"
          color={colors.white}
          animation="slamIn"
          startFrame={5}
          shadow
        />
        <div style={{ marginTop: 8 }}>
          <AnimatedUnderline startFrame={35} width={420} color={colors.logoCoral} strokeWidth={5} />
        </div>
        <AnimatedText
          text="Niemand weet het."
          fontSize={40}
          fontFamily="body"
          color="rgba(255,255,255,0.6)"
          animation="fadeUp"
          startFrame={40}
          shadow
        />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// --- Scene 2: PROBLEM --- ScreenWipe + NotificationStack --------------------

const ProblemScene: React.FC = () => {
  return (
    <AbsoluteFill>
      <GradientBackground colors={["#0d1117", "#1a1a2e"]} angle={180} />
      <ScreenWipe startFrame={0} durationFrames={18} color={colors.logoCoral} direction="right" />
      <AbsoluteFill
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 30,
        }}
      >
        <NotificationStack
          startFrame={10}
          notifications={[
            { sender: "Lisa", message: "Wat eten we vanavond?", color: "#25D366" },
            { sender: "Tom", message: "Weet niet...", color: "#25D366" },
            { sender: "Sarah", message: "NIET WEER PASTA", color: "#25D366" },
            { sender: "Groep", message: "Elke. Avond. Hetzelfde.", color: "#E74C3C" },
          ]}
          width={380}
          staggerFrames={20}
        />
        <AnimatedText
          text="Elke. Avond. Hetzelfde."
          fontSize={48}
          fontFamily="heading"
          color={colors.logoCoral}
          animation="glitch"
          startFrame={90}
          shadow
        />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// --- Scene 3: APP SOLUTION --- ScreenWipe + AnimatedAppUI -------------------

const AppScene: React.FC<{
  recipeName: string;
}> = ({ recipeName }) => {
  return (
    <AbsoluteFill>
      <GradientWave
        colors={["#1a1a2e", "#0d1117", "#16213e"]}
        speed={0.8}
        direction="diagonal"
      />
      <ScreenWipe startFrame={0} durationFrames={18} color="#8B7355" direction="left" />
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
            fontSize={48}
            fontFamily="heading"
            color={colors.white}
            animation="fadeUp"
            startFrame={10}
            shadow
          />
          <AnimatedUnderline startFrame={40} width={320} color={colors.logoCoral} strokeWidth={4} y={60} />
        </div>
        <AnimatedAppUI
          startFrame={20}
          sequence="swipe-three"
          recipe={{
            name: recipeName,
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

// --- Scene 4: FOOD REVEAL --- RevealMask circle + AnimatedCounter -----------

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
        kenBurnsScale={[1, 1.15]}
        warmth={0.6}
      />
      <RevealMask startFrame={0} durationFrames={20} shape="circle">
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
            fontSize={60}
            fontFamily="heading"
            color={colors.white}
            animation="popIn"
            startFrame={20}
            shadow
            glow="rgba(255,255,255,0.2)"
          />
          <AnimatedText
            text={`${cookingTime} min`}
            fontSize={28}
            fontFamily="body"
            color="rgba(255,255,255,0.85)"
            animation="fadeUp"
            startFrame={50}
            shadow
          />
          <AnimatedCounter
            from={0}
            to={price}
            startFrame={60}
            durationFrames={30}
            prefix={"\u20AC"}
            fontSize={56}
            color={colors.logoCoral}
            showUnderline
            underlineColor={colors.logoCoral}
          />
        </AbsoluteFill>
      </RevealMask>
    </AbsoluteFill>
  );
};

// --- Scene 5: CTA -----------------------------------------------------------

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
        {/* Scene 1: Hook --- GradientBg, bold text, underline (90 frames) */}
        <TransitionSeries.Sequence durationInFrames={90}>
          <HookScene />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={wipe()}
          timing={springTiming({ config: { damping: 12 } })}
        />

        {/* Scene 2: Problem --- ScreenWipe + NotificationStack (150 frames) */}
        <TransitionSeries.Sequence durationInFrames={150}>
          <ProblemScene />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={slide()}
          timing={springTiming({ config: { damping: 14 } })}
        />

        {/* Scene 3: App Solution --- ScreenWipe + AnimatedAppUI swipe (240 frames) */}
        <TransitionSeries.Sequence durationInFrames={240}>
          <AppScene recipeName={recipeName} />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: 15 })}
        />

        {/* Scene 4: Food Reveal --- RevealMask + AnimatedCounter (180 frames) */}
        <TransitionSeries.Sequence durationInFrames={180}>
          <FoodRevealScene
            resultPhoto={resultPhoto}
            recipeName={recipeName}
            cookingTime={cookingTime}
            price={price}
          />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: 15 })}
        />

        {/* Scene 5: CTA (180 frames) */}
        <TransitionSeries.Sequence durationInFrames={180}>
          <CTAScene resultPhoto={resultPhoto} />
        </TransitionSeries.Sequence>
      </TransitionSeries>

      <BackgroundMusic src={music} />
    </AbsoluteFill>
  );
};
