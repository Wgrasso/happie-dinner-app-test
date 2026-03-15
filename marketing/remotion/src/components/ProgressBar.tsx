import React from "react";
import {
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { colors } from "../theme/colors";
import { fonts } from "../theme/fonts";

interface ProgressBarProps {
  items: { label: string; percentage: number; color?: string }[];
  startFrame: number;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  items,
  startFrame,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  if (frame < startFrame) return null;

  const maxPercentage = Math.max(...items.map((i) => i.percentage));

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 24,
        width: "100%",
        padding: "0 80px",
      }}
    >
      {items.map((item, i) => {
        const relFrame = Math.max(0, frame - startFrame - i * 12);
        const isWinner = item.percentage === maxPercentage;

        // Bar fill animation
        const fillProgress = spring({
          frame: relFrame,
          fps,
          config: { damping: 16, stiffness: 80 },
        });
        const barWidth = fillProgress * item.percentage;

        // Label fade in
        const labelOpacity = interpolate(relFrame, [0, 10], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });

        // Percentage number
        const percentOpacity = interpolate(relFrame, [15, 25], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });

        // Winner glow pulse
        const glowIntensity = isWinner
          ? interpolate(
              Math.sin(relFrame * 0.15),
              [-1, 1],
              [0.3, 0.7],
            )
          : 0;

        const barColor = item.color || (isWinner ? colors.logoCoral : "rgba(255,255,255,0.25)");

        return (
          <div
            key={i}
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}
          >
            {/* Label row */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                opacity: labelOpacity,
              }}
            >
              <span
                style={{
                  fontFamily: fonts.body,
                  fontSize: 24,
                  fontWeight: isWinner ? 700 : 500,
                  color: isWinner ? colors.white : "rgba(255,255,255,0.7)",
                  textShadow: "0 4px 30px rgba(0,0,0,0.8), 0 2px 10px rgba(0,0,0,0.5)",
                }}
              >
                {item.label}
              </span>
              <span
                style={{
                  fontFamily: fonts.body,
                  fontSize: 24,
                  fontWeight: 700,
                  color: isWinner ? colors.logoCoral : "rgba(255,255,255,0.5)",
                  textShadow: "0 4px 30px rgba(0,0,0,0.8), 0 2px 10px rgba(0,0,0,0.5)",
                  opacity: percentOpacity,
                }}
              >
                {item.percentage}%
              </span>
            </div>

            {/* Bar track */}
            <div
              style={{
                width: "100%",
                height: 16,
                borderRadius: 8,
                backgroundColor: "rgba(255,255,255,0.08)",
                overflow: "hidden",
                position: "relative",
              }}
            >
              {/* Bar fill */}
              <div
                style={{
                  width: `${barWidth}%`,
                  height: "100%",
                  borderRadius: 8,
                  background: isWinner
                    ? `linear-gradient(90deg, ${colors.logoCoral} 0%, ${colors.accent} 100%)`
                    : barColor,
                  boxShadow: isWinner
                    ? `0 0 ${20 * glowIntensity}px rgba(244,132,95,${glowIntensity}), 0 0 ${40 * glowIntensity}px rgba(244,132,95,${glowIntensity * 0.5})`
                    : undefined,
                  transition: "box-shadow 0.1s",
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};
