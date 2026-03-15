import React from "react";
import {
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { fonts } from "../theme/fonts";

interface AnimatedTextProps {
  text: string;
  fontSize?: number;
  fontFamily?: "heading" | "body";
  color?: string;
  animation?: "fadeUp" | "popIn" | "typewriter" | "slamIn";
  startFrame?: number;
  shadow?: boolean; // text shadow for readability
  glow?: string; // glow color
  maxWidth?: number; // text wrapping width
}

export const AnimatedText: React.FC<AnimatedTextProps> = ({
  text,
  fontSize = 48,
  fontFamily = "heading",
  color = "#FFFFFF",
  animation = "fadeUp",
  startFrame = 0,
  shadow = true,
  glow,
  maxWidth,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const relFrame = Math.max(0, frame - startFrame);

  let opacity = 1;
  let transform = "";
  let displayText: string | React.ReactNode = text;

  switch (animation) {
    case "fadeUp": {
      opacity = interpolate(relFrame, [0, 15], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      });
      const translateY = interpolate(relFrame, [0, 15], [30, 0], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      });
      transform = `translateY(${translateY}px)`;
      break;
    }
    case "popIn": {
      const scaleValue = spring({
        frame: relFrame,
        fps,
        config: { damping: 12, stiffness: 200 },
      });
      opacity = interpolate(relFrame, [0, 8], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      });
      transform = `scale(${scaleValue})`;
      break;
    }
    case "typewriter": {
      const charsToShow = Math.floor(relFrame / 2);
      const visibleText = text.slice(0, charsToShow);
      opacity = 1;
      displayText = (
        <>
          {visibleText}
          {charsToShow < text.length && (
            <span style={{ opacity: relFrame % 4 < 2 ? 1 : 0 }}>|</span>
          )}
        </>
      );
      break;
    }
    case "slamIn": {
      const scaleValue = interpolate(relFrame, [0, 5, 8], [2, 0.95, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      });
      opacity = interpolate(relFrame, [0, 3], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      });
      transform = `scale(${scaleValue})`;
      break;
    }
  }

  const textShadow = shadow
    ? "0 2px 20px rgba(0,0,0,0.5)"
    : undefined;

  const glowShadow = glow
    ? `0 0 40px ${glow}, 0 0 80px ${glow}`
    : undefined;

  const combinedShadow = [textShadow, glowShadow].filter(Boolean).join(", ");

  if (frame < startFrame) return null;

  return (
    <div
      style={{
        opacity,
        transform,
        textAlign: "center",
        maxWidth: maxWidth || undefined,
        padding: maxWidth ? "0 60px" : undefined,
      }}
    >
      <span
        style={{
          fontFamily: fonts[fontFamily],
          fontSize,
          fontWeight: 700,
          color,
          lineHeight: 1.2,
          textShadow: combinedShadow || undefined,
          display: "inline-block",
        }}
      >
        {displayText}
      </span>
    </div>
  );
};
