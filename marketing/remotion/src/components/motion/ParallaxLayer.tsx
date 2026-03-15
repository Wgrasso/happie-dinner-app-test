import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate } from "remotion";

interface ParallaxLayerProps {
  children: React.ReactNode;
  speed: number;
  direction?: "vertical" | "horizontal";
}

export const ParallaxLayer: React.FC<ParallaxLayerProps> = ({
  children,
  speed,
  direction = "vertical",
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const offset = interpolate(
    frame,
    [0, durationInFrames],
    [0, speed * 200],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }
  );

  const transform =
    direction === "vertical"
      ? `translateY(${offset}px)`
      : `translateX(${offset}px)`;

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        transform,
        willChange: "transform",
      }}
    >
      {children}
    </div>
  );
};
