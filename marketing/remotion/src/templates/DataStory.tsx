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
import { CountUp } from "../components/CountUp";
import { Logo } from "../components/Logo";
import { PhotoBackground } from "../components/PhotoBackground";
import { ProgressBar } from "../components/ProgressBar";
import { VideoBackground } from "../components/VideoBackground";
import { VoteCounter, FoodEmoji } from "../components/lottie-style";
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

// ─── Scene 1: BIG STAT — VoteCounter with progress ring ─────────────────────

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
        {/* VoteCounter as the main stat display */}
        <VoteCounter
          startFrame={5}
          current={statNummer}
          total={Math.ceil(statNummer * 1.25)}
          label={statSuffix}
          size={260}
          accentColor={colors.logoCoral}
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

// ─── Scene 2: STAT LABEL — zoom blur transition ────────────────────────────

const TransitionScene: React.FC<{
  bgPhoto: string;
}> = ({ bgPhoto }) => {
  const frame = useCurrentFrame();

  const blurAmount = interpolate(frame, [0, 30, 60], [0, 8, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const scale = interpolate(frame, [0, 30, 60], [1, 1.1, 1], {
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
          filter: `blur(${blurAmount}px)`,
          transform: `scale(${scale})`,
        }}
      >
        <PhotoBackground
          src={bgPhoto}
          overlay="rgba(0,0,0,0.7)"
          kenBurns={false}
          blur={5}
        />
      </div>
      <AbsoluteFill
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <AnimatedText
          text="De cijfers spreken."
          fontSize={48}
          fontFamily="heading"
          color={colors.logoCoral}
          animation="highlight"
          highlightColor="rgba(244,132,95,0.3)"
          startFrame={20}
          shadow
        />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ─── Scene 3: CHART — ProgressBar ──────────────────────────────────────────

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
    <AbsoluteFill
      style={{
        background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
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
  );
};

// ─── Scene 4: VIDEO BREAK + FoodEmoji ───────────────────────────────────────

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
        <AnimatedText
          text="Lekker. En goedkoop."
          fontSize={48}
          fontFamily="heading"
          color={colors.white}
          animation="fadeUp"
          startFrame={30}
          shadow
        />
        <FoodEmoji
          startFrame={50}
          emojis={["🍝", "🥘", "🍲", "🥗"]}
          size={280}
          emojiSize={42}
        />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ─── Scene 5: COMPARISON — Split screen ─────────────────────────────────────

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

  // Divider animation
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

// ─── Scene 6: CONCLUSIE ─────────────────────────────────────────────────────

const ConclusieScene: React.FC<{
  conclusie: string;
}> = ({ conclusie }) => {
  return (
    <AbsoluteFill
      style={{
        background: "linear-gradient(180deg, #0f3460 0%, #1a1a2e 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
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
    </AbsoluteFill>
  );
};

// ─── Scene 7: CTA ───────────────────────────────────────────────────────────

const CTAScene: React.FC<{
  ctaPhoto: string;
}> = ({ ctaPhoto }) => {
  return (
    <AbsoluteFill>
      <PhotoBackground
        src={ctaPhoto}
        overlay="rgba(0,0,0,0.5)"
        kenBurns
        kenBurnsScale={[1, 1.08]}
        warmth={0.5}
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

// ─── Main Template ──────────────────────────────────────────────────────────

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
        {/* Scene 1: Big stat with VoteCounter (120 frames) */}
        <TransitionSeries.Sequence durationInFrames={120}>
          <StatScene
            bgPhoto={bgPhoto}
            statNummer={statNummer}
            statSuffix={statSuffix}
            statLabel={statLabel}
          />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: 15 })}
        />

        {/* Scene 2: Transition text (60 frames) */}
        <TransitionSeries.Sequence durationInFrames={60}>
          <TransitionScene bgPhoto={bgPhoto} />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={wipe()}
          timing={springTiming({ config: { damping: 12 } })}
        />

        {/* Scene 3: Chart — horizontal ProgressBars (240 frames) */}
        <TransitionSeries.Sequence durationInFrames={240}>
          <ChartScene chartData={chartData} chartTitle={chartTitle} />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: 15 })}
        />

        {/* Scene 4: Video break + FoodEmoji (120 frames) */}
        <TransitionSeries.Sequence durationInFrames={120}>
          <VideoBreakScene />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: 12 })}
        />

        {/* Scene 5: Comparison split screen (150 frames) */}
        <TransitionSeries.Sequence durationInFrames={150}>
          <CompareScene vergelijking={vergelijking} />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: 12 })}
        />

        {/* Scene 6: Conclusie (90 frames) */}
        <TransitionSeries.Sequence durationInFrames={90}>
          <ConclusieScene conclusie={vergelijking.conclusie} />
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
