import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";

interface GradientWaveProps {
  colors: [string, string, string];
  speed?: number;
  direction?: "horizontal" | "vertical" | "diagonal";
  opacity?: number;
}

export const GradientWave: React.FC<GradientWaveProps> = ({
  colors: gradientColors,
  speed = 2,
  direction = "diagonal",
  opacity = 1,
}) => {
  const frame = useCurrentFrame();

  const offset = frame * speed;

  const gradientAngle =
    direction === "horizontal"
      ? "90deg"
      : direction === "vertical"
      ? "180deg"
      : "135deg";

  const backgroundSize =
    direction === "horizontal"
      ? "400% 100%"
      : direction === "vertical"
      ? "100% 400%"
      : "400% 400%";

  const posX =
    direction === "vertical" ? "0%" : `${offset % 400}%`;
  const posY =
    direction === "horizontal" ? "0%" : `${offset % 400}%`;

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(${gradientAngle}, ${gradientColors[0]}, ${gradientColors[1]}, ${gradientColors[2]}, ${gradientColors[1]}, ${gradientColors[0]})`,
        backgroundSize,
        backgroundPosition: `${posX} ${posY}`,
        opacity,
      }}
    />
  );
};
