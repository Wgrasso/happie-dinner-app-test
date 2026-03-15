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
import { CountUp } from "../components/CountUp";
import { Logo } from "../components/Logo";
import { PhotoBackground } from "../components/PhotoBackground";
import { ProgressBar } from "../components/ProgressBar";
import { SceneTransition } from "../components/SceneTransition";
import { VideoBackground } from "../components/VideoBackground";
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

// ─── Scene 1: BIG STAT (frames 0-120) ──────────────────────────────────────
// Dark bg with subtle photo parallax. Massive CountUp. Spring bounce.

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
        <div style={{ width: "100%", height: 220 }}>
          <CountUp
            target={statNummer}
            suffix={statSuffix}
            startFrame={5}
            durationFrames={80}
            color={colors.white}
            fontSize={180}
          />
        </div>
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

// ─── Scene 2: STAT LABEL (frames 120-180) ──────────────────────────────────
// Zoom blur transition feel

const TransitionScene: React.FC<{
  bgPhoto: string;
}> = ({ bgPhoto }) => {
  const frame = useCurrentFrame();

  const blurAmount = interpolate(frame, [120, 150, 180], [0, 8, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const scale = interpolate(frame, [120, 150, 180], [1, 1.1, 1], {
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
          startFrame={140}
          shadow
        />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ─── Scene 3: CHART — ProgressBar (frames 180-420) ─────────────────────────
// Horizontal bars, staggered fill, winner glows

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

  const titleOpacity = interpolate(frame, [180, 200], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const titleY = interpolate(frame, [180, 200], [20, 0], {
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
      <ProgressBar items={progressItems} startFrame={200} />
    </AbsoluteFill>
  );
};

// ─── Scene 4: VIDEO BREAK (frames 420-540) ──────────────────────────────────
// Cooking pasta close-up, slow-mo, warm. Just vibes then text.

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
          startFrame={480}
          shadow
        />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ─── Scene 5: COMPARISON — Split screen (frames 540-690) ────────────────────

const CompareScene: React.FC<{
  vergelijking: {
    linksLabel: string;
    linksWaarde: string;
    rechtsLabel: string;
    rechtsWaarde: string;
  };
}> = ({ vergelijking }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const relFrame = frame - 540;

  const linksOpacity = interpolate(relFrame, [0, 25], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const linksX = interpolate(relFrame, [0, 25], [-80, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const rechtsOpacity = interpolate(relFrame, [15, 40], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const rechtsX = interpolate(relFrame, [15, 40], [80, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Divider animation
  const dividerHeight = interpolate(relFrame, [5, 30], [0, 400], {
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

// ─── Scene 6: CONCLUSIE (frames 690-780) ────────────────────────────────────

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
        startFrame={700}
        shadow
        glow="rgba(244,132,95,0.3)"
        maxWidth={800}
      />
    </AbsoluteFill>
  );
};

// ─── Scene 7: CTA (frames 780-900) ──────────────────────────────────────────

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
        <Logo animation="fadeIn" size={650} startFrame={790} />
        <AnimatedText
          text="Download Happie"
          fontSize={36}
          fontFamily="heading"
          color={colors.white}
          animation="fadeUp"
          startFrame={820}
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
      {/* Scene 1: Big stat (0-120) */}
      <SceneTransition enterFrame={0} exitFrame={120} fadeFrames={12}>
        <StatScene
          bgPhoto={bgPhoto}
          statNummer={statNummer}
          statSuffix={statSuffix}
          statLabel={statLabel}
        />
      </SceneTransition>

      {/* Scene 2: Transition (120-180) */}
      <SceneTransition enterFrame={120} exitFrame={180} fadeFrames={10}>
        <TransitionScene bgPhoto={bgPhoto} />
      </SceneTransition>

      {/* Scene 3: Chart — horizontal ProgressBars (180-420) */}
      <SceneTransition enterFrame={180} exitFrame={420} fadeFrames={15}>
        <ChartScene chartData={chartData} chartTitle={chartTitle} />
      </SceneTransition>

      {/* Scene 4: Video break — cooking, slow-mo (420-540) */}
      <SceneTransition enterFrame={420} exitFrame={540} fadeFrames={15}>
        <VideoBreakScene />
      </SceneTransition>

      {/* Scene 5: Comparison split screen (540-690) */}
      <SceneTransition enterFrame={540} exitFrame={690} fadeFrames={12}>
        <CompareScene vergelijking={vergelijking} />
      </SceneTransition>

      {/* Scene 6: Conclusie (690-780) */}
      <SceneTransition enterFrame={690} exitFrame={780} fadeFrames={12}>
        <ConclusieScene conclusie={vergelijking.conclusie} />
      </SceneTransition>

      {/* Scene 7: CTA (780-900) */}
      <SceneTransition enterFrame={780} exitFrame={900} fadeFrames={15}>
        <CTAScene ctaPhoto={ctaPhoto} />
      </SceneTransition>

      <BackgroundMusic src={music} />
    </AbsoluteFill>
  );
};
