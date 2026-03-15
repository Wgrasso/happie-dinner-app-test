import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { BackgroundMusic } from "../components/BackgroundMusic";
import { CountUp } from "../components/CountUp";
import { Logo } from "../components/Logo";
import { colors } from "../theme/colors";
import { fonts } from "../theme/fonts";

interface StatReelProps {
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
  music: string;
  durationInSeconds: number;
}

// ─── Scene 1: STAT (frames 0–90) ────────────────────────────────────────────

const StatScene: React.FC<{
  statNummer: number;
  statSuffix: string;
  statLabel: string;
}> = ({ statNummer, statSuffix, statLabel }) => {
  const frame = useCurrentFrame();

  const labelOpacity = interpolate(frame, [30, 55], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const labelTranslateY = interpolate(frame, [30, 55], [20, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: colors.background,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        gap: 24,
      }}
    >
      {/* CountUp number */}
      <div style={{ width: "100%", height: 160 }}>
        <CountUp
          target={statNummer}
          suffix={statSuffix}
          startFrame={0}
          durationFrames={70}
          color={colors.accent}
          fontSize={120}
        />
      </div>

      {/* Stat label */}
      <span
        style={{
          fontFamily: fonts.body,
          fontSize: 24,
          color: colors.text,
          textAlign: "center",
          padding: "0 80px",
          lineHeight: 1.4,
          opacity: labelOpacity,
          transform: `translateY(${labelTranslateY}px)`,
          display: "block",
        }}
      >
        {statLabel}
      </span>
    </AbsoluteFill>
  );
};

// ─── Scene 2: CHART (frames 90–210) ─────────────────────────────────────────

const ChartScene: React.FC<{
  chartData: { label: string; value: number; highlight?: boolean }[];
}> = ({ chartData }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const BAR_WIDTH = 80;
  const BAR_GAP = 20;
  const MAX_BAR_HEIGHT = 400;
  const STAGGER = 10;
  const SCENE_START = 90;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: colors.background,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
      }}
    >
      {/* Chart container */}
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "flex-end",
          justifyContent: "center",
          gap: BAR_GAP,
          height: MAX_BAR_HEIGHT + 40,
        }}
      >
        {chartData.map((item, i) => {
          const relFrame = frame - SCENE_START - i * STAGGER;
          const growProgress = spring({
            frame: relFrame,
            fps,
            config: { damping: 14, stiffness: 140 },
          });

          const barHeight = (item.value / 100) * MAX_BAR_HEIGHT * growProgress;
          const barColor = item.highlight ? colors.accent : colors.border;

          const labelOpacity = interpolate(relFrame, [10, 25], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });

          return (
            <div
              key={i}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "flex-end",
                width: BAR_WIDTH,
                height: MAX_BAR_HEIGHT + 40,
              }}
            >
              {/* Value label above bar */}
              <span
                style={{
                  fontFamily: fonts.body,
                  fontSize: 16,
                  fontWeight: 600,
                  color: item.highlight ? colors.accent : colors.textMuted,
                  marginBottom: 6,
                  opacity: labelOpacity,
                }}
              >
                {item.value}%
              </span>

              {/* Bar */}
              <div
                style={{
                  width: BAR_WIDTH,
                  height: barHeight,
                  backgroundColor: barColor,
                  borderRadius: "6px 6px 0 0",
                  flexShrink: 0,
                }}
              />

              {/* Label below bar */}
              <span
                style={{
                  fontFamily: fonts.body,
                  fontSize: 14,
                  color: colors.textMuted,
                  marginTop: 8,
                  textAlign: "center",
                  opacity: labelOpacity,
                }}
              >
                {item.label}
              </span>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// ─── Scene 3: VERGELIJKING (frames 210–300) ──────────────────────────────────

const VergelijkingScene: React.FC<{
  vergelijking: {
    linksLabel: string;
    linksWaarde: string;
    rechtsLabel: string;
    rechtsWaarde: string;
    conclusie: string;
  };
}> = ({ vergelijking }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const SCENE_START = 210;
  const relFrame = frame - SCENE_START;

  // Left column fade in
  const linksOpacity = interpolate(relFrame, [0, 20], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const linksTranslateX = interpolate(relFrame, [0, 20], [-40, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Right column fade in (slight delay)
  const rechtsOpacity = interpolate(relFrame, [10, 30], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const rechtsTranslateX = interpolate(relFrame, [10, 30], [40, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // "vs" fade in
  const vsOpacity = interpolate(relFrame, [15, 30], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Conclusie bounce in
  const conclusieScale = spring({
    frame: relFrame - 30,
    fps,
    config: { damping: 12, stiffness: 160 },
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: colors.background,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        gap: 60,
      }}
    >
      {/* Two-column comparison */}
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 48,
        }}
      >
        {/* Left column */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 12,
            opacity: linksOpacity,
            transform: `translateX(${linksTranslateX}px)`,
          }}
        >
          <span
            style={{
              fontFamily: fonts.heading,
              fontSize: 48,
              fontWeight: 700,
              color: colors.dislikeRed,
              lineHeight: 1,
            }}
          >
            {vergelijking.linksWaarde}
          </span>
          <span
            style={{
              fontFamily: fonts.body,
              fontSize: 16,
              color: colors.textMuted,
              textAlign: "center",
            }}
          >
            {vergelijking.linksLabel}
          </span>
        </div>

        {/* VS divider */}
        <span
          style={{
            fontFamily: fonts.body,
            fontSize: 24,
            color: colors.textMuted,
            opacity: vsOpacity,
          }}
        >
          vs
        </span>

        {/* Right column */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 12,
            opacity: rechtsOpacity,
            transform: `translateX(${rechtsTranslateX}px)`,
          }}
        >
          <span
            style={{
              fontFamily: fonts.heading,
              fontSize: 48,
              fontWeight: 700,
              color: colors.accent,
              lineHeight: 1,
            }}
          >
            {vergelijking.rechtsWaarde}
          </span>
          <span
            style={{
              fontFamily: fonts.body,
              fontSize: 16,
              color: colors.textMuted,
              textAlign: "center",
            }}
          >
            {vergelijking.rechtsLabel}
          </span>
        </div>
      </div>

      {/* Conclusie */}
      <span
        style={{
          fontFamily: fonts.body,
          fontSize: 28,
          fontWeight: 700,
          color: colors.accent,
          textAlign: "center",
          padding: "0 80px",
          transform: `scale(${conclusieScale})`,
          display: "block",
        }}
      >
        {vergelijking.conclusie}
      </span>

      {/* Logo */}
      <Logo animation="fadeIn" size={180} startFrame={270} />
    </AbsoluteFill>
  );
};

// ─── Main Template ───────────────────────────────────────────────────────────

export const StatReel: React.FC<StatReelProps> = ({
  statNummer,
  statSuffix,
  statLabel,
  chartData,
  vergelijking,
  music,
}) => {
  const frame = useCurrentFrame();

  const showStat        = frame < 90;
  const showChart       = frame >= 90 && frame < 210;
  const showVergelijking = frame >= 210;

  return (
    <AbsoluteFill>
      {showStat && (
        <StatScene
          statNummer={statNummer}
          statSuffix={statSuffix}
          statLabel={statLabel}
        />
      )}
      {showChart && <ChartScene chartData={chartData} />}
      {showVergelijking && <VergelijkingScene vergelijking={vergelijking} />}

      <BackgroundMusic src={music} />
    </AbsoluteFill>
  );
};
