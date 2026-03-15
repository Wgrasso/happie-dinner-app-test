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

// --- DataStory PERSONALITY: Clean, precise. White space. Geometric shapes.
// Sharp lines. Infographic aesthetic. Cool precision.
// Colors: slate #1e293b backgrounds, crisp white text.

const SLATE_BG = "#1e293b";
const SLATE_DARK = "#0f172a";
const SLATE_MID = "#334155";

// --- Scene 1: BIG STAT (90 frames) ---

const StatScene: React.FC<{
  bgPhoto: string;
  statNummer: number;
  statSuffix: string;
  statLabel: string;
}> = ({ bgPhoto, statNummer, statSuffix, statLabel }) => {
  const frame = useCurrentFrame();

  // Geometric lines
  const lineWidth = interpolate(frame, [0, 40], [0, 100], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ backgroundColor: SLATE_DARK }}>
      {/* Subtle blurred photo underneath */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0.15,
          overflow: "hidden",
        }}
      >
        <PhotoBackground
          src={bgPhoto}
          overlay="rgba(0,0,0,0)"
          blur={20}
          kenBurns={false}
        />
      </div>

      {/* Geometric accent lines */}
      <div
        style={{
          position: "absolute",
          top: 350,
          left: "10%",
          width: `${lineWidth}%`,
          height: 1,
          backgroundColor: "rgba(244,132,95,0.2)",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: 500,
          right: "10%",
          width: `${lineWidth * 0.6}%`,
          height: 1,
          backgroundColor: "rgba(244,132,95,0.15)",
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
        <AnimatedCounter
          from={0}
          to={statNummer}
          startFrame={5}
          durationFrames={50}
          suffix={` ${statSuffix}`}
          fontSize={80}
          color={colors.logoCoral}
          showUnderline
          underlineColor={colors.logoCoral}
        />
        <AnimatedText
          text={statLabel}
          fontSize={30}
          fontFamily="body"
          color="rgba(255,255,255,0.75)"
          animation="fadeUp"
          startFrame={50}
          shadow
          maxWidth={800}
        />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// --- Scene 2: CHART (120 frames) ---

const ChartScene: React.FC<{
  chartData: { label: string; value: number; highlight?: boolean }[];
  chartTitle?: string;
}> = ({ chartData, chartTitle }) => {
  const frame = useCurrentFrame();

  const titleOpacity = interpolate(frame, [0, 15], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ backgroundColor: SLATE_BG }}>
      <ScreenWipe startFrame={0} durationFrames={14} color={colors.logoCoral} direction="right" />

      {/* Grid lines for infographic feel */}
      {[0.25, 0.5, 0.75].map((pos, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            left: `${80 + pos * (1080 - 160)}px`,
            width: 1,
            backgroundColor: "rgba(255,255,255,0.04)",
          }}
        />
      ))}

      <AbsoluteFill
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 28,
        }}
      >
        {chartTitle && (
          <div style={{ opacity: titleOpacity }}>
            <span
              style={{
                fontFamily: fonts.body,
                fontSize: 32,
                fontWeight: 700,
                color: "rgba(255,255,255,0.9)",
                textShadow: "0 2px 10px rgba(0,0,0,0.5)",
                textAlign: "center",
                letterSpacing: "-0.02em",
              }}
            >
              {chartTitle}
            </span>
          </div>
        )}
        <ProgressBar items={chartData.map((d) => ({
          label: d.label,
          percentage: d.value,
          color: d.highlight ? colors.logoCoral : undefined,
        }))} startFrame={15} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// --- Scene 3: VIDEO BREAK (90 frames) --- illustration instead of just video ---

const VideoBreakScene: React.FC = () => {
  return (
    <AbsoluteFill>
      <PhotoBackground
        src="illustrations/phone-swipe-concept.png"
        overlay="rgba(15,23,42,0.45)"
        kenBurns
        kenBurnsScale={[1, 1.1]}
      />
      <AbsoluteFill
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <RevealMask startFrame={5} durationFrames={20} shape="diagonal">
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
              fontFamily="body"
              color={colors.white}
              animation="letterStagger"
              startFrame={20}
              shadow
            />
          </AbsoluteFill>
        </RevealMask>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// --- Scene 4: COMPARISON (90 frames) --- Split screen ---

const CompareScene: React.FC<{
  vergelijking: {
    linksLabel: string;
    linksWaarde: string;
    rechtsLabel: string;
    rechtsWaarde: string;
  };
}> = ({ vergelijking }) => {
  const frame = useCurrentFrame();

  const linksOpacity = interpolate(frame, [0, 20], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const linksX = interpolate(frame, [0, 20], [-60, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const rechtsOpacity = interpolate(frame, [12, 32], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const rechtsX = interpolate(frame, [12, 32], [60, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const dividerHeight = interpolate(frame, [5, 25], [0, 400], {
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
      {/* Left: slate + red */}
      <div
        style={{
          flex: 1,
          backgroundColor: SLATE_DARK,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 14,
          opacity: linksOpacity,
          transform: `translateX(${linksX}px)`,
        }}
      >
        <span
          style={{
            fontFamily: fonts.body,
            fontSize: 56,
            fontWeight: 700,
            color: colors.dislikeRed,
            textShadow: "0 2px 15px rgba(0,0,0,0.5)",
          }}
        >
          {vergelijking.linksWaarde}
        </span>
        <span
          style={{
            fontFamily: fonts.body,
            fontSize: 20,
            color: "rgba(255,255,255,0.45)",
            textShadow: "0 2px 10px rgba(0,0,0,0.5)",
          }}
        >
          {vergelijking.linksLabel}
        </span>
      </div>

      {/* Divider */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          transform: "translate(-50%, -50%)",
          width: 2,
          height: dividerHeight,
          background: `linear-gradient(180deg, transparent, rgba(255,255,255,0.3), transparent)`,
          zIndex: 10,
        }}
      />

      {/* Right: slate + green */}
      <div
        style={{
          flex: 1,
          backgroundColor: SLATE_BG,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 14,
          opacity: rechtsOpacity,
          transform: `translateX(${rechtsX}px)`,
        }}
      >
        <span
          style={{
            fontFamily: fonts.body,
            fontSize: 56,
            fontWeight: 700,
            color: colors.likeGreen,
            textShadow: "0 0 20px rgba(76,175,80,0.3)",
          }}
        >
          {vergelijking.rechtsWaarde}
        </span>
        <span
          style={{
            fontFamily: fonts.body,
            fontSize: 20,
            color: "rgba(255,255,255,0.45)",
            textShadow: "0 2px 10px rgba(0,0,0,0.5)",
          }}
        >
          {vergelijking.rechtsLabel}
        </span>
      </div>
    </AbsoluteFill>
  );
};

// --- Scene 5: CONCLUSIE (75 frames) ---

const ConclusieScene: React.FC<{
  conclusie: string;
}> = ({ conclusie }) => {
  return (
    <AbsoluteFill style={{ backgroundColor: SLATE_DARK }}>
      {/* Geometric accent */}
      <div
        style={{
          position: "absolute",
          top: "40%",
          left: "5%",
          width: 120,
          height: 120,
          border: "1px solid rgba(244,132,95,0.15)",
          borderRadius: 4,
          transform: "rotate(45deg)",
        }}
      />
      <AbsoluteFill
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 14,
        }}
      >
        <AnimatedText
          text={conclusie}
          fontSize={48}
          fontFamily="body"
          color={colors.logoCoral}
          animation="slamIn"
          startFrame={5}
          shadow
          glow="rgba(244,132,95,0.2)"
          maxWidth={800}
        />
        <AnimatedUnderline startFrame={20} width={350} color={colors.logoCoral} strokeWidth={3} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// --- Scene 6: APP DEMO (120 frames) ---

const AppDemoScene: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: SLATE_DARK }}>
      {/* Vertical grid lines */}
      {[0.2, 0.4, 0.6, 0.8].map((pos, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            left: `${pos * 100}%`,
            width: 1,
            backgroundColor: "rgba(255,255,255,0.03)",
          }}
        />
      ))}
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
          text="Zo werkt Happie"
          fontSize={32}
          fontFamily="body"
          color="rgba(255,255,255,0.9)"
          animation="fadeUp"
          startFrame={3}
          shadow
        />
        <AnimatedAppUI
          startFrame={10}
          sequence="swipe-three"
          recipe={{
            name: "Pasta Carbonara",
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

// --- Scene 7: CTA (90 frames) --- ends with number for loop ---

const CTAScene: React.FC<{
  statNummer: number;
  statSuffix: string;
}> = ({ statNummer, statSuffix }) => {
  const frame = useCurrentFrame();

  // Fade to black in last 15 frames
  const fadeOut = interpolate(frame, [75, 90], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ backgroundColor: SLATE_DARK }}>
      <AbsoluteFill
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 30,
        }}
      >
        <Logo animation="fadeIn" size={650} startFrame={5} />
        <AnimatedText
          text="Download Happie"
          fontSize={32}
          fontFamily="body"
          color={colors.white}
          animation="fadeUp"
          startFrame={25}
          shadow
        />
      </AbsoluteFill>
      {/* Fade to black, loops to opening stat */}
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
    <AbsoluteFill style={{ backgroundColor: SLATE_DARK }}>
      <TransitionSeries>
        {/* Scene 1: Big stat (90 frames) */}
        <TransitionSeries.Sequence durationInFrames={90}>
          <StatScene
            bgPhoto={bgPhoto}
            statNummer={statNummer}
            statSuffix={statSuffix}
            statLabel={statLabel}
          />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={wipe()}
          timing={springTiming({ config: { damping: 14 } })}
        />

        {/* Scene 2: Chart (120 frames) */}
        <TransitionSeries.Sequence durationInFrames={120}>
          <ChartScene chartData={chartData} chartTitle={chartTitle} />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: 12 })}
        />

        {/* Scene 3: Video break with illustration (90 frames) */}
        <TransitionSeries.Sequence durationInFrames={90}>
          <VideoBreakScene />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: 12 })}
        />

        {/* Scene 4: Comparison (90 frames) */}
        <TransitionSeries.Sequence durationInFrames={90}>
          <CompareScene vergelijking={vergelijking} />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: 10 })}
        />

        {/* Scene 5: Conclusie (75 frames) */}
        <TransitionSeries.Sequence durationInFrames={75}>
          <ConclusieScene conclusie={vergelijking.conclusie} />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: 10 })}
        />

        {/* Scene 6: App demo (120 frames) */}
        <TransitionSeries.Sequence durationInFrames={120}>
          <AppDemoScene />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: 12 })}
        />

        {/* Scene 7: CTA (90 frames) */}
        <TransitionSeries.Sequence durationInFrames={90}>
          <CTAScene statNummer={statNummer} statSuffix={statSuffix} />
        </TransitionSeries.Sequence>
      </TransitionSeries>

      <BackgroundMusic src={music} />
    </AbsoluteFill>
  );
};
