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

// --- Scene 1: PHOTO 1 --- Ken Burns zoom IN ----------------------------------

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

// --- Scene 2: PHOTO 2 --- Ken Burns zoom OUT ---------------------------------

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

// --- Scene 3: PHOTO 3 --- diagonal reveal ------------------------------------

const Photo3Scene: React.FC<{
  photo: string;
}> = ({ photo }) => {
  return (
    <AbsoluteFill>
      <RevealMask startFrame={0} durationFrames={25} shape="diagonal">
        <PhotoBackground
          src={photo}
          overlay="rgba(0,0,0,0.25)"
          kenBurns
          kenBurnsScale={[1.02, 1.1]}
          warmth={0.5}
        />
      </RevealMask>
    </AbsoluteFill>
  );
};

// --- Scene 4: VIDEO --- slow-mo food serving ---------------------------------

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
      <ScreenWipe startFrame={0} durationFrames={16} color="#8B7355" direction="up" />
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
          text={recipeName}
          fontSize={48}
          fontFamily="heading"
          color={colors.white}
          animation="fadeUp"
          startFrame={20}
          shadow
        />
        <AnimatedUnderline startFrame={45} width={300} color={colors.logoCoral} strokeWidth={4} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// --- Scene 5: DETAILS --------------------------------------------------------

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

// --- Scene 6: THE QUESTION + HeartPulse --------------------------------------

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
        <HeartPulse startFrame={40} color={colors.logoCoral} size={80} pulseRate={1} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// --- Scene 7: APP DEMO --- AnimatedAppUI -------------------------------------

const AppDemoScene: React.FC<{
  recipeName: string;
}> = ({ recipeName }) => {
  return (
    <AbsoluteFill>
      <GradientWave
        colors={["#1a1a2e", "#0d1117", "#16213e"]}
        speed={0.8}
        direction="diagonal"
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
          text="Swipe je avondeten."
          fontSize={36}
          fontFamily="heading"
          color={colors.white}
          animation="fadeUp"
          startFrame={5}
          shadow
        />
        <AnimatedAppUI
          startFrame={15}
          sequence="wie-eet-mee"
          recipe={{
            name: recipeName,
            image: "carbonara.jpg",
            cookingTime: 25,
            description: "Romige Italiaanse klassieker.",
            ingredients: ["Spaghetti", "Pancetta", "Eieren", "Parmezaan"],
          }}
          membersEating={6}
          totalMembers={8}
        />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// --- Scene 8: CTA ------------------------------------------------------------

const CTAScene: React.FC = () => {
  return (
    <AbsoluteFill>
      <GradientBackground
        colors={["#1a1a2e", "#2d1b12", "#0f3460"]}
        animate
        angle={135}
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
          text="Swipe je avondeten."
          fontSize={32}
          fontFamily="body"
          color={colors.white}
          animation="fadeUp"
          startFrame={40}
          shadow
        />
      </AbsoluteFill>
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
        {/* Scene 1: Photo 1 --- zoom in (90 frames) */}
        <TransitionSeries.Sequence durationInFrames={90}>
          <Photo1Scene photo={photos[0]} />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: 20 })}
        />

        {/* Scene 2: Photo 2 --- zoom out (90 frames) */}
        <TransitionSeries.Sequence durationInFrames={90}>
          <Photo2Scene photo={photos[1]} />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: 20 })}
        />

        {/* Scene 3: Photo 3 --- diagonal reveal (90 frames) */}
        <TransitionSeries.Sequence durationInFrames={90}>
          <Photo3Scene photo={photos[2]} />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: 15 })}
        />

        {/* Scene 4: Video --- slow-mo serving (90 frames) */}
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

        {/* Scene 7: App demo --- AnimatedAppUI (120 frames) */}
        <TransitionSeries.Sequence durationInFrames={120}>
          <AppDemoScene recipeName={recipeName} />
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
