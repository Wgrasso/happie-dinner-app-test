import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";

interface ScreenWipeProps {
  startFrame: number;
  durationFrames?: number;
  color: string;
  direction: "left" | "right" | "up" | "down";
}

export const ScreenWipe: React.FC<ScreenWipeProps> = ({
  startFrame,
  durationFrames = 20,
  color,
  direction,
}) => {
  const frame = useCurrentFrame();
  const localFrame = frame - startFrame;

  const progress = interpolate(localFrame, [0, durationFrames], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  if (progress <= 0 || progress >= 1) return null;

  // Wipe in first half, wipe out second half
  const enterExit =
    progress < 0.5
      ? interpolate(progress, [0, 0.5], [0, 1])
      : interpolate(progress, [0.5, 1], [1, 0]);

  // Ease in-out cubic
  const eased = enterExit < 0.5
    ? 4 * enterExit * enterExit * enterExit
    : 1 - Math.pow(-2 * enterExit + 2, 3) / 2;

  let style: React.CSSProperties;

  switch (direction) {
    case "right":
      style = {
        position: "absolute",
        top: 0,
        left: 0,
        width: `${eased * 100}%`,
        height: "100%",
        backgroundColor: color,
      };
      break;
    case "left":
      style = {
        position: "absolute",
        top: 0,
        right: 0,
        width: `${eased * 100}%`,
        height: "100%",
        backgroundColor: color,
      };
      break;
    case "down":
      style = {
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: `${eased * 100}%`,
        backgroundColor: color,
      };
      break;
    case "up":
      style = {
        position: "absolute",
        bottom: 0,
        left: 0,
        width: "100%",
        height: `${eased * 100}%`,
        backgroundColor: color,
      };
      break;
  }

  return (
    <AbsoluteFill style={{ overflow: "hidden", pointerEvents: "none", zIndex: 50 }}>
      <div style={style} />
    </AbsoluteFill>
  );
};
