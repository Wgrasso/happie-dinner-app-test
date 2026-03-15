import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { TransitionSeries } from "@remotion/transitions";
import { wipe } from "@remotion/transitions/wipe";
import { fade } from "@remotion/transitions/fade";
import { springTiming, linearTiming } from "@remotion/transitions";
import { AnimatedText } from "../components/AnimatedText";
import { BackgroundMusic } from "../components/BackgroundMusic";
import { Logo } from "../components/Logo";
import { PhotoBackground } from "../components/PhotoBackground";
import { ProgressBar } from "../components/ProgressBar";
import { VideoBackground } from "../components/VideoBackground";
import {
  AnimatedCounter,
  AnimatedUnderline,
  GradientBackground,
  GradientWave,
  RevealMask,
  ScreenWipe,
  AnimatedLine,
  AnimatedAppUI,
} from "../components/motion";
import { colors } from "../theme/colors";
import { fonts } from "../theme/fonts";

export interface DataStoryProps {
  bgPhoto: string;
  statNummer: number;
  statSuffix: string;
  statLabel: string;
  chartTitle?: string;
  chartData: { label: string; value: number; highlight?: boolean }[];
  vergelijking: {
    linksLabel: string;
    linksWaarde: string;
    rechtsLabel: string;
    rechtsWaarde: string;
    conclusie: string;
  };
  ctaPhoto: string;
  music: string;
  durationInSeconds: number;
}

// --- Scene 1: BIG STAT --- AnimatedCounter -----------------------------------

const StatScene: React.FC<{
  bgPhoto: string;
  statNummer: number;
  statSuffix: string;
  statLabel: string;
}> = ({ bgPhoto, statNummer, statSuffix, statLabel }) => {
  const frame = useCurrentFrame();

  const parallaxY = interpolate(frame, [0, 120], [0, -20], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute",
          inset: 0,
          overflow: "hidden",
          transform: `translateY(${parallaxY}px)`,
        }}
      >
        <PhotoBackground
          src={bgPhoto}
          overlay="rgba(0,0,0,0.75)"
          blur={12}
          kenBurns={false}
        />
      </div>
      <AbsoluteFill
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 20,
        }}
      >
        <AnimatedCounter
          from={0}
          to={statNummer}
          startFrame={5}
          durationFrames={70}
          suffix={` ${statSuffix}`}
          fontSize={80}
          color={colors.logoCoral}
          showUnderline
          underlineColor={colors.logoCoral}
        />
        <AnimatedText
          text={statLabel}
          fontSize={32}
          fontFamily="body"
          color="rgba(255,255,255,0.8)"
          animation="fadeUp"
          startFrame={70}
          shadow
          maxWidth={800}
        />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// --- Scene 2: CHART --- ProgressBar ------------------------------------------

const ChartScene: React.FC<{
  chartData: { label: string; value: number; highlight?: boolean }[];
  chartTitle?: string;
}> = ({ chartData, chartTitle }) => {
  const frame = useCurrentFrame();
  const progressItems = chartData.map((item) => ({
    label: item.label,
    percentage: item.value,
    color: item.highlight ? colors.logoCoral : undefined,
  }));

  const titleOpacity = interpolate(frame, [0, 20], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const titleY = interpolate(frame, [0, 20], [20, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill>
      <GradientBackground
        colors={["#1a1a2e", "#16213e", "#0f3460"]}
        animate
        angle={135}
      />
      <ScreenWipe startFrame={0} durationFrames={16} color={colors.logoCoral} direction="right" />
      <AbsoluteFill
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 32,
        }}
      >
        {chartTitle && (
          <div
            style={{
              opacity: titleOpacity,
              transform: `translateY(${titleY}px)`,
            }}
          >
            <span
              style={{
                fontFamily: fonts.heading,
                fontSize: 36,
                fontWeight: 700,
                color: "rgba(255,255,255,0.85)",
                textShadow: "0 4px 30px rgba(0,0,0,0.8)",
                textAlign: "center",
              }}
            >
              {chartTitle}
            </span>
          </div>
        )}
        <ProgressBar items={progressItems} startFrame={20} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// --- Scene 3: VIDEO BREAK + reveal mask --------------------------------------

const VideoBreakScene: React.FC = () => {
  return (
    <AbsoluteFill>
      <VideoBackground
        src="cooking-pasta-close-up.mp4"
        overlay="rgba(0,0,0,0.3)"
        playbackRate={0.5}
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
        <RevealMask startFrame={10} durationFrames={25} shape="diagonal">
          <AbsoluteFill
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <AnimatedText
              text="Lekker. En goedkoop."
              fontSize={48}
              fontFamily="heading"
              color={colors.white}
              animation="fadeUp"
              startFrame={30}
              shadow
            />
          </AbsoluteFill>
        </RevealMask>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// --- Scene 4: COMPARISON --- Split screen ------------------------------------

const CompareScene: React.FC<{
  vergelijking: {
    linksLabel: string;
    linksWaarde: string;
    rechtsLabel: string;
    rechtsWaarde: string;
  };
}> = ({ vergelijking }) => {
  const frame = useCurrentFrame();

  const linksOpacity = interpolate(frame, [0, 25], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const linksX = interpolate(frame, [0, 25], [-80, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const rechtsOpacity = interpolate(frame, [15, 40], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const rechtsX = interpolate(frame, [15, 40], [80, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const dividerHeight = interpolate(frame, [5, 30], [0, 400], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        display: "flex",
        flexDirection: "row",
        overflow: "hidden",
      }}
    >
      {/* Left: dark, red accent */}
      <div
        style={{
          flex: 1,
          backgroundColor: "#1a0a0a",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 16,
          opacity: linksOpacity,
          transform: `translateX(${linksX}px)`,
        }}
      >
        <span
          style={{
            fontFamily: fonts.heading,
            fontSize: 56,
            fontWeight: 700,
            color: colors.dislikeRed,
            textShadow: "0 4px 30px rgba(0,0,0,0.8), 0 2px 10px rgba(0,0,0,0.5)",
          }}
        >
          {vergelijking.linksWaarde}
        </span>
        <span
          style={{
            fontFamily: fonts.body,
            fontSize: 22,
            color: "rgba(255,255,255,0.5)",
            textShadow: "0 4px 30px rgba(0,0,0,0.8), 0 2px 10px rgba(0,0,0,0.5)",
          }}
        >
          {vergelijking.linksLabel}
        </span>
      </div>

      {/* Animated divider */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          transform: "translate(-50%, -50%)",
          width: 3,
          height: dividerHeight,
          background: `linear-gradient(180deg, transparent, rgba(255,255,255,0.4), transparent)`,
          zIndex: 10,
        }}
      />

      {/* Right: warm, green accent */}
      <div
        style={{
          flex: 1,
          backgroundColor: "#0a1a0a",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 16,
          opacity: rechtsOpacity,
          transform: `translateX(${rechtsX}px)`,
        }}
      >
        <span
          style={{
            fontFamily: fonts.heading,
            fontSize: 56,
            fontWeight: 700,
            color: colors.likeGreen,
            textShadow: "0 0 30px rgba(76,175,80,0.4), 0 4px 30px rgba(0,0,0,0.8)",
          }}
        >
          {vergelijking.rechtsWaarde}
        </span>
        <span
          style={{
            fontFamily: fonts.body,
            fontSize: 22,
            color: "rgba(255,255,255,0.5)",
            textShadow: "0 4px 30px rgba(0,0,0,0.8), 0 2px 10px rgba(0,0,0,0.5)",
          }}
        >
          {vergelijking.rechtsLabel}
        </span>
      </div>
    </AbsoluteFill>
  );
};

// --- Scene 5: CONCLUSIE -----------------------------------------------------

const ConclusieScene: React.FC<{
  conclusie: string;
}> = ({ conclusie }) => {
  return (
    <AbsoluteFill>
      <GradientBackground
        colors={["#0f3460", "#1a1a2e", "#16213e"]}
        animate
        angle={180}
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
          text={conclusie}
          fontSize={52}
          fontFamily="heading"
          color={colors.logoCoral}
          animation="popIn"
          startFrame={10}
          shadow
          glow="rgba(244,132,95,0.3)"
          maxWidth={800}
        />
        <AnimatedUnderline startFrame={30} width={400} color={colors.logoCoral} strokeWidth={4} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// --- Scene 6: APP DEMO --- AnimatedAppUI ------------------------------------

const AppDemoScene: React.FC = () => {
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
          text="Zo werkt Happie"
          fontSize={36}
          fontFamily="heading"
          color={colors.white}
          animation="fadeUp"
          startFrame={5}
          shadow
        />
        <AnimatedAppUI
          startFrame={15}
          sequence="swipe-three"
          recipe={{
            name: "Pasta Carbonara",
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

// --- Scene 7: CTA ------------------------------------------------------------

const CTAScene: React.FC<{
  ctaPhoto: string;
}> = ({ ctaPhoto }) => {
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
        <Logo animation="fadeIn" size={650} startFrame={10} />
        <AnimatedText
          text="Download Happie"
          fontSize={36}
          fontFamily="heading"
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

export const DataStory: React.FC<DataStoryProps> = ({
  bgPhoto,
  statNummer,
  statSuffix,
  statLabel,
  chartTitle,
  chartData,
  vergelijking,
  ctaPhoto,
  music,
}) => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <TransitionSeries>
        {/* Scene 1: Big stat with AnimatedCounter (120 frames) */}
        <TransitionSeries.Sequence durationInFrames={120}>
          <StatScene
            bgPhoto={bgPhoto}
            statNummer={statNummer}
            statSuffix={statSuffix}
            statLabel={statLabel}
          />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={wipe()}
          timing={springTiming({ config: { damping: 12 } })}
        />

        {/* Scene 2: Chart --- horizontal ProgressBars (240 frames) */}
        <TransitionSeries.Sequence durationInFrames={240}>
          <ChartScene chartData={chartData} chartTitle={chartTitle} />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: 15 })}
        />

        {/* Scene 3: Video break + reveal mask (120 frames) */}
        <TransitionSeries.Sequence durationInFrames={120}>
          <VideoBreakScene />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: 12 })}
        />

        {/* Scene 4: Comparison split screen (150 frames) */}
        <TransitionSeries.Sequence durationInFrames={150}>
          <CompareScene vergelijking={vergelijking} />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: 12 })}
        />

        {/* Scene 5: Conclusie (90 frames) */}
        <TransitionSeries.Sequence durationInFrames={90}>
          <ConclusieScene conclusie={vergelijking.conclusie} />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: 12 })}
        />

        {/* Scene 6: App demo with AnimatedAppUI (210 frames) */}
        <TransitionSeries.Sequence durationInFrames={210}>
          <AppDemoScene />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: 15 })}
        />

        {/* Scene 7: CTA (120 frames) */}
        <TransitionSeries.Sequence durationInFrames={120}>
          <CTAScene ctaPhoto={ctaPhoto} />
        </TransitionSeries.Sequence>
      </TransitionSeries>

      <BackgroundMusic src={music} />
    </AbsoluteFill>
  );
};
