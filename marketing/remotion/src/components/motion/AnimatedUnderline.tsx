import React from "react";
import { useCurrentFrame, interpolate } from "remotion";
import { colors } from "../../theme/colors";

interface AnimatedUnderlineProps {
  startFrame: number;
  width: number;
  color?: string;
  strokeWidth?: number;
  y?: number;
}

export const AnimatedUnderline: React.FC<AnimatedUnderlineProps> = ({
  startFrame,
  width,
  color = colors.logoCoral,
  strokeWidth = 4,
  y = 0,
}) => {
  const frame = useCurrentFrame();
  const localFrame = frame - startFrame;

  const progress = interpolate(localFrame, [0, 20], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Ease out cubic
  const eased = 1 - Math.pow(1 - progress, 3);

  // Slightly wavy path
  const pathHeight = 8;
  const svgWidth = width + 8;
  const svgHeight = pathHeight + strokeWidth * 2;

  // Create a subtle wave path
  const waveAmplitude = 3;
  const segments = 4;
  const segWidth = width / segments;

  let d = `M 4 ${svgHeight / 2}`;
  for (let i = 0; i < segments; i++) {
    const x1 = 4 + i * segWidth + segWidth * 0.5;
    const y1 = svgHeight / 2 + (i % 2 === 0 ? waveAmplitude : -waveAmplitude);
    const x2 = 4 + (i + 1) * segWidth;
    const y2 = svgHeight / 2;
    d += ` Q ${x1} ${y1} ${x2} ${y2}`;
  }

  // Approximate path length
  const pathLength = width * 1.05;
  const dashOffset = pathLength * (1 - eased);

  return (
    <svg
      width={svgWidth}
      height={svgHeight}
      style={{
        position: y !== 0 ? "absolute" : "relative",
        top: y !== 0 ? y : undefined,
        overflow: "visible",
      }}
    >
      <path
        d={d}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={pathLength}
        strokeDashoffset={dashOffset}
      />
    </svg>
  );
};
