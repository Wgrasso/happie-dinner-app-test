import React from "react";
import { useCurrentFrame, interpolate } from "remotion";

interface AnimatedCircleProps {
  startFrame: number;
  durationFrames?: number;
  cx: number;
  cy: number;
  r: number;
  color?: string;
  strokeWidth?: number;
  fill?: boolean;
}

export const AnimatedCircle: React.FC<AnimatedCircleProps> = ({
  startFrame,
  durationFrames = 30,
  cx,
  cy,
  r,
  color = "#FFFFFF",
  strokeWidth = 3,
  fill = false,
}) => {
  const frame = useCurrentFrame();
  const localFrame = frame - startFrame;

  const circumference = 2 * Math.PI * r;

  const drawProgress = interpolate(localFrame, [0, durationFrames], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const dashOffset = circumference * (1 - drawProgress);

  const fillOpacity = fill
    ? interpolate(
        localFrame,
        [durationFrames, durationFrames + 15],
        [0, 0.2],
        {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        }
      )
    : 0;

  const size = (r + strokeWidth) * 2 + 4;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`${cx - r - strokeWidth - 2} ${cy - r - strokeWidth - 2} ${size} ${size}`}
      style={{ overflow: "visible" }}
    >
      {/* Fill */}
      {fill && (
        <circle cx={cx} cy={cy} r={r} fill={color} opacity={fillOpacity} />
      )}
      {/* Stroke */}
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={dashOffset}
        transform={`rotate(-90 ${cx} ${cy})`}
      />
    </svg>
  );
};
