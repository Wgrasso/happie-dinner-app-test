import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";

interface ScreenTransitionProps {
  startFrame: number;
  durationFrames?: number;
  color?: string;
  style: "swipeRight" | "circleExpand" | "diagonalWipe" | "blinds";
}

export const ScreenTransition: React.FC<ScreenTransitionProps> = ({
  startFrame,
  durationFrames = 15,
  color = "#F4845F",
  style: transitionStyle,
}) => {
  const frame = useCurrentFrame();
  const localFrame = frame - startFrame;

  const progress = interpolate(localFrame, [0, durationFrames], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  if (progress <= 0 || progress >= 1) return null;

  // Ease in-out for enter/exit
  const enterExit =
    progress < 0.5
      ? interpolate(progress, [0, 0.5], [0, 1])
      : interpolate(progress, [0.5, 1], [1, 0]);

  if (transitionStyle === "swipeRight") {
    const x = interpolate(progress, [0, 1], [-110, 110]);
    return (
      <AbsoluteFill style={{ overflow: "hidden", pointerEvents: "none" }}>
        <div
          style={{
            position: "absolute",
            top: 0,
            left: `${x}%`,
            width: "120%",
            height: "100%",
            backgroundColor: color,
          }}
        />
      </AbsoluteFill>
    );
  }

  if (transitionStyle === "circleExpand") {
    const radius = enterExit * 150;
    return (
      <AbsoluteFill
        style={{
          clipPath: `circle(${radius}% at 50% 50%)`,
          backgroundColor: color,
          pointerEvents: "none",
        }}
      />
    );
  }

  if (transitionStyle === "diagonalWipe") {
    const offset = interpolate(progress, [0, 1], [-200, 200]);
    return (
      <AbsoluteFill style={{ overflow: "hidden", pointerEvents: "none" }}>
        <div
          style={{
            position: "absolute",
            top: "-50%",
            left: `${offset}%`,
            width: "100%",
            height: "200%",
            backgroundColor: color,
            transform: "rotate(25deg)",
            transformOrigin: "center",
          }}
        />
      </AbsoluteFill>
    );
  }

  if (transitionStyle === "blinds") {
    const BLIND_COUNT = 8;
    return (
      <AbsoluteFill style={{ overflow: "hidden", pointerEvents: "none" }}>
        {Array.from({ length: BLIND_COUNT }).map((_, i) => {
          const blindDelay = i * 0.05;
          const blindProgress = interpolate(
            progress,
            [blindDelay, blindDelay + 0.5, 0.5 + blindDelay, 1],
            [0, 1, 1, 0],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
          );
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                top: `${(i / BLIND_COUNT) * 100}%`,
                left: 0,
                width: "100%",
                height: `${100 / BLIND_COUNT + 0.5}%`,
                backgroundColor: color,
                transform: `scaleY(${blindProgress})`,
                transformOrigin: "center",
              }}
            />
          );
        })}
      </AbsoluteFill>
    );
  }

  return null;
};
