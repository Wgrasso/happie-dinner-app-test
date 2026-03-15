import React from "react";
import { useCurrentFrame, interpolate } from "remotion";
import { fonts } from "../../theme/fonts";

interface AnimatedCounterProps {
  from: number;
  to: number;
  startFrame: number;
  durationFrames?: number;
  prefix?: string;
  suffix?: string;
  fontSize?: number;
  color?: string;
  showUnderline?: boolean;
  underlineColor?: string;
}

export const AnimatedCounter: React.FC<AnimatedCounterProps> = ({
  from,
  to,
  startFrame,
  durationFrames = 60,
  prefix = "",
  suffix = "",
  fontSize = 72,
  color = "#FFFFFF",
  showUnderline = false,
  underlineColor,
}) => {
  const frame = useCurrentFrame();
  const localFrame = frame - startFrame;

  // Ease out cubic for premium feel
  const rawProgress = interpolate(localFrame, [0, durationFrames], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const eased = 1 - Math.pow(1 - rawProgress, 3);

  const currentValue = Math.round(from + (to - from) * eased);

  // Underline draws after count completes
  const underlineProgress = interpolate(
    localFrame,
    [durationFrames, durationFrames + 20],
    [0, 1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }
  );

  const displayText = `${prefix}${currentValue}${suffix}`;
  const underlineWidth = displayText.length * fontSize * 0.55;
  const finalUnderlineColor = underlineColor || color;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 8,
      }}
    >
      <span
        style={{
          fontFamily: fonts.heading,
          fontSize,
          fontWeight: 700,
          color,
          lineHeight: 1.1,
          textShadow: "0 4px 30px rgba(0,0,0,0.5)",
        }}
      >
        {displayText}
      </span>
      {showUnderline && (
        <svg
          width={underlineWidth}
          height={8}
          viewBox={`0 0 ${underlineWidth} 8`}
        >
          <line
            x1={0}
            y1={4}
            x2={underlineWidth}
            y2={4}
            stroke={finalUnderlineColor}
            strokeWidth={3}
            strokeLinecap="round"
            strokeDasharray={underlineWidth}
            strokeDashoffset={underlineWidth * (1 - underlineProgress)}
          />
        </svg>
      )}
    </div>
  );
};
