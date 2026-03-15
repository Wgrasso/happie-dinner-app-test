import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";

interface GradientBackgroundProps {
  colors: string[];
  animate?: boolean;
  angle?: number;
}

export const GradientBackground: React.FC<GradientBackgroundProps> = ({
  colors: gradientColors,
  animate = false,
  angle = 135,
}) => {
  const frame = useCurrentFrame();

  const currentAngle = animate
    ? angle + interpolate(frame, [0, 300], [0, 30], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      })
    : angle;

  const colorStops = gradientColors.join(", ");

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(${currentAngle}deg, ${colorStops})`,
      }}
    />
  );
};
