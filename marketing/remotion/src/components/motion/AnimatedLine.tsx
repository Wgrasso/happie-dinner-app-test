import React from "react";
import { useCurrentFrame, interpolate } from "remotion";

interface AnimatedLineProps {
  startFrame: number;
  durationFrames?: number;
  color?: string;
  width?: number;
  from: { x: number; y: number };
  to: { x: number; y: number };
}

export const AnimatedLine: React.FC<AnimatedLineProps> = ({
  startFrame,
  durationFrames = 20,
  color = "#FFFFFF",
  width = 3,
  from,
  to,
}) => {
  const frame = useCurrentFrame();
  const localFrame = frame - startFrame;

  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const lineLength = Math.sqrt(dx * dx + dy * dy);

  const progress = interpolate(localFrame, [0, durationFrames], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const dashOffset = lineLength * (1 - progress);

  const svgWidth = Math.abs(dx) + width * 4;
  const svgHeight = Math.abs(dy) + width * 4;
  const offsetX = width * 2;
  const offsetY = width * 2;

  return (
    <svg
      width={svgWidth}
      height={svgHeight}
      style={{
        overflow: "visible",
        position: "absolute",
        left: Math.min(from.x, to.x) - width * 2,
        top: Math.min(from.y, to.y) - width * 2,
      }}
    >
      <line
        x1={from.x - Math.min(from.x, to.x) + offsetX}
        y1={from.y - Math.min(from.y, to.y) + offsetY}
        x2={to.x - Math.min(from.x, to.x) + offsetX}
        y2={to.y - Math.min(from.y, to.y) + offsetY}
        stroke={color}
        strokeWidth={width}
        strokeLinecap="round"
        strokeDasharray={lineLength}
        strokeDashoffset={dashOffset}
      />
    </svg>
  );
};
