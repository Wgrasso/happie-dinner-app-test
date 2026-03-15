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
import { SceneTransition } from "../components/SceneTransition";
import { colors } from "../theme/colors";
import { fonts } from "../theme/fonts";

export interface DataStoryProps {
  bgPhoto: string;
  statNummer: number;
  statSuffix: string;
  statLabel: string;
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

// ─── Scene 1: BIG STAT (frames 0-90) ───────────────────────────────────────

const StatScene: React.FC<{
  bgPhoto: string;
  statNummer: number;
  statSuffix: string;
  statLabel: string;
}> = ({ bgPhoto, statNummer, statSuffix, statLabel }) => {
  const frame = useCurrentFrame();

  // Subtle parallax: background moves slightly
  const parallaxY = interpolate(frame, [0, 90], [0, -20], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const labelOpacity = interpolate(frame, [40, 60], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const labelY = interpolate(frame, [40, 60], [20, 0], {
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
          overlay="rgba(0,0,0,0.7)"
          blur={10}
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
            durationFrames={60}
            color={colors.white}
            fontSize={180}
          />
        </div>
        <div
          style={{
            opacity: labelOpacity,
            transform: `translateY(${labelY}px)`,
            textAlign: "center",
            padding: "0 80px",
          }}
        >
          <span
            style={{
              fontFamily: fonts.body,
              fontSize: 32,
              color: "rgba(255,255,255,0.8)",
              textShadow: "0 2px 20px rgba(0,0,0,0.5)",
            }}
          >
            {statLabel}
          </span>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ─── Scene 2: ANIMATED CHART (frames 90-210) ───────────────────────────────

const ChartScene: React.FC<{
  bgPhoto: string;
  chartData: { label: string; value: number; highlight?: boolean }[];
}> = ({ bgPhoto, chartData }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const BAR_WIDTH = 100;
  const BAR_GAP = 24;
  const MAX_BAR_HEIGHT = 500;
  const STAGGER = 12;
  const SCENE_START = 90;

  return (
    <AbsoluteFill>
      <PhotoBackground
        src={bgPhoto}
        overlay="rgba(0,0,0,0.8)"
        blur={15}
        kenBurns={false}
      />
      <AbsoluteFill
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "flex-end",
            justifyContent: "center",
            gap: BAR_GAP,
            height: MAX_BAR_HEIGHT + 80,
          }}
        >
          {chartData.map((item, i) => {
            const relFrame = frame - SCENE_START - i * STAGGER;
            const growProgress = spring({
              frame: Math.max(0, relFrame),
              fps,
              config: { damping: 14, stiffness: 100 },
            });

            const barHeight = (item.value / 100) * MAX_BAR_HEIGHT * growProgress;
            const isHighlight = item.highlight;

            const labelOpacity = interpolate(
              Math.max(0, relFrame),
              [15, 30],
              [0, 1],
              { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
            );

            // Glow effect for highlighted bar when fully grown
            const glowOpacity = isHighlight
              ? interpolate(
                  Math.max(0, relFrame),
                  [30, 50],
                  [0, 1],
                  { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
                )
              : 0;

            return (
              <div
                key={i}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "flex-end",
                  width: BAR_WIDTH,
                  height: MAX_BAR_HEIGHT + 80,
                }}
              >
                {/* Value above bar */}
                <span
                  style={{
                    fontFamily: fonts.body,
                    fontSize: 22,
                    fontWeight: 700,
                    color: isHighlight ? colors.logoCoral : "rgba(255,255,255,0.6)",
                    marginBottom: 8,
                    opacity: labelOpacity,
                    textShadow: "0 2px 10px rgba(0,0,0,0.4)",
                  }}
                >
                  {item.value}%
                </span>

                {/* Bar with gradient */}
                <div
                  style={{
                    width: BAR_WIDTH,
                    height: barHeight,
                    background: isHighlight
                      ? `linear-gradient(180deg, ${colors.logoCoral} 0%, ${colors.accent} 100%)`
                      : "linear-gradient(180deg, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0.1) 100%)",
                    borderRadius: "8px 8px 0 0",
                    flexShrink: 0,
                    boxShadow: isHighlight
                      ? `0 0 ${30 * glowOpacity}px rgba(244,132,95,${0.5 * glowOpacity})`
                      : undefined,
                    position: "relative",
                  }}
                />

                {/* Label below bar */}
                <span
                  style={{
                    fontFamily: fonts.body,
                    fontSize: 18,
                    color: "rgba(255,255,255,0.6)",
                    marginTop: 12,
                    textAlign: "center",
                    opacity: labelOpacity,
                    textShadow: "0 2px 10px rgba(0,0,0,0.4)",
                  }}
                >
                  {item.label}
                </span>
              </div>
            );
          })}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ─── Scene 3: VERGELIJKING + CTA (frames 210-300/360) ───────────────────────

const CompareCtaScene: React.FC<{
  ctaPhoto: string;
  vergelijking: {
    linksLabel: string;
    linksWaarde: string;
    rechtsLabel: string;
    rechtsWaarde: string;
    conclusie: string;
  };
}> = ({ ctaPhoto, vergelijking }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const SCENE_START = 210;
  const relFrame = frame - SCENE_START;

  const linksOpacity = interpolate(relFrame, [0, 20], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const linksX = interpolate(relFrame, [0, 20], [-60, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const rechtsOpacity = interpolate(relFrame, [10, 30], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const rechtsX = interpolate(relFrame, [10, 30], [60, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const conclusieScale = spring({
    frame: Math.max(0, relFrame - 35),
    fps,
    config: { damping: 10, stiffness: 160 },
  });

  return (
    <AbsoluteFill>
      <PhotoBackground
        src={ctaPhoto}
        overlay="rgba(0,0,0,0.55)"
        kenBurns
        kenBurnsScale={[1, 1.08]}
        warmth={0.4}
      />
      <AbsoluteFill
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 50,
        }}
      >
        {/* Comparison row */}
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 60,
          }}
        >
          {/* Left */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 12,
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
                textShadow: "0 2px 20px rgba(0,0,0,0.5)",
              }}
            >
              {vergelijking.linksWaarde}
            </span>
            <span
              style={{
                fontFamily: fonts.body,
                fontSize: 20,
                color: "rgba(255,255,255,0.7)",
                textShadow: "0 2px 10px rgba(0,0,0,0.4)",
              }}
            >
              {vergelijking.linksLabel}
            </span>
          </div>

          {/* VS */}
          <span
            style={{
              fontFamily: fonts.body,
              fontSize: 28,
              color: "rgba(255,255,255,0.5)",
              textShadow: "0 2px 10px rgba(0,0,0,0.4)",
            }}
          >
            vs
          </span>

          {/* Right */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 12,
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
                textShadow: "0 0 30px rgba(76,175,80,0.3), 0 2px 20px rgba(0,0,0,0.5)",
              }}
            >
              {vergelijking.rechtsWaarde}
            </span>
            <span
              style={{
                fontFamily: fonts.body,
                fontSize: 20,
                color: "rgba(255,255,255,0.7)",
                textShadow: "0 2px 10px rgba(0,0,0,0.4)",
              }}
            >
              {vergelijking.rechtsLabel}
            </span>
          </div>
        </div>

        {/* Conclusie */}
        <div
          style={{
            transform: `scale(${conclusieScale})`,
            textAlign: "center",
            padding: "0 60px",
          }}
        >
          <span
            style={{
              fontFamily: fonts.heading,
              fontSize: 36,
              fontWeight: 700,
              color: colors.logoCoral,
              textShadow: "0 2px 20px rgba(0,0,0,0.5)",
            }}
          >
            {vergelijking.conclusie}
          </span>
        </div>

        {/* Logo */}
        <Logo animation="fadeIn" size={180} startFrame={SCENE_START + 55} />
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
  chartData,
  vergelijking,
  ctaPhoto,
  music,
}) => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <SceneTransition enterFrame={0} exitFrame={80} fadeFrames={10}>
        <StatScene
          bgPhoto={bgPhoto}
          statNummer={statNummer}
          statSuffix={statSuffix}
          statLabel={statLabel}
        />
      </SceneTransition>

      <SceneTransition enterFrame={80} exitFrame={200} fadeFrames={10}>
        <ChartScene bgPhoto={bgPhoto} chartData={chartData} />
      </SceneTransition>

      <SceneTransition enterFrame={200} exitFrame={360} fadeFrames={10}>
        <CompareCtaScene ctaPhoto={ctaPhoto} vergelijking={vergelijking} />
      </SceneTransition>

      <BackgroundMusic src={music} />
    </AbsoluteFill>
  );
};
