import React from "react";
import { interpolate, useCurrentFrame } from "remotion";

interface SceneTransitionProps {
  children: React.ReactNode;
  enterFrame: number; // when to start fading in
  exitFrame: number; // when to start fading out
  fadeFrames?: number; // duration of fade, default 10
}

export const SceneTransition: React.FC<SceneTransitionProps> = ({
  children,
  enterFrame,
  exitFrame,
  fadeFrames = 10,
}) => {
  const frame = useCurrentFrame();

  // Don't render if we're completely outside the visible range
  if (frame < enterFrame || frame > exitFrame + fadeFrames) {
    return null;
  }

  const enterOpacity = interpolate(
    frame,
    [enterFrame, enterFrame + fadeFrames],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  const exitOpacity = interpolate(
    frame,
    [exitFrame, exitFrame + fadeFrames],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  const opacity = Math.min(enterOpacity, exitOpacity);

  return (
    <div style={{ position: "absolute", inset: 0, opacity }}>
      {children}
    </div>
  );
};
