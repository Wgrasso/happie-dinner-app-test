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
  animation?: "fadeUp" | "popIn" | "typewriter" | "slamIn" | "countUp" | "splitReveal" | "glitch" | "highlight" | "shake";
  startFrame?: number;
  shadow?: boolean; // text shadow for readability
  glow?: string; // glow color
  highlightColor?: string; // highlight bar color for "highlight" animation
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
  highlightColor = "#F4845F",
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
    case "countUp": {
      // Parse number from text: supports €80, 60+, 22, 270%, etc.
      const match = text.match(/^([^\d]*)(\d+(?:[.,]\d+)?)(.*)$/);
      if (match) {
        const prefix = match[1]; // e.g. "€"
        const targetNum = parseFloat(match[2].replace(",", "."));
        const suffix = match[3]; // e.g. "+", "%", "/maand"

        const countDuration = 30; // frames to count up
        const progress = interpolate(relFrame, [0, countDuration], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        const currentVal = Math.round(progress * targetNum);

        // Subtle scale bounce when reaching the target
        const bounceScale = relFrame >= countDuration
          ? interpolate(relFrame, [countDuration, countDuration + 6, countDuration + 10], [1, 1.08, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            })
          : 1;

        opacity = interpolate(relFrame, [0, 5], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        transform = `scale(${bounceScale})`;
        displayText = `${prefix}${currentVal}${suffix}`;
      }
      break;
    }
    case "splitReveal": {
      // Text splits: left half from left, right half from right, meet in center
      const midPoint = Math.ceil(text.length / 2);
      const leftPart = text.slice(0, midPoint);
      const rightPart = text.slice(midPoint);

      const slideProgress = interpolate(relFrame, [0, 18], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      });
      const leftX = interpolate(slideProgress, [0, 1], [-200, 0]);
      const rightX = interpolate(slideProgress, [0, 1], [200, 0]);

      opacity = interpolate(relFrame, [0, 8], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      });

      // Flash effect when halves meet
      const flashOpacity = interpolate(relFrame, [16, 18, 22], [0, 0.6, 0], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      });

      displayText = (
        <>
          <span style={{ display: "inline-block", transform: `translateX(${leftX}px)` }}>
            {leftPart}
          </span>
          <span style={{ display: "inline-block", transform: `translateX(${rightX}px)` }}>
            {rightPart}
          </span>
          {flashOpacity > 0 && (
            <span
              style={{
                position: "absolute",
                inset: 0,
                background: `radial-gradient(circle, rgba(255,255,255,${flashOpacity}) 0%, transparent 70%)`,
                pointerEvents: "none",
              }}
            />
          )}
        </>
      );
      break;
    }
    case "glitch": {
      // Text flickers/shifts RGB channels for 10 frames, then stabilizes
      const isGlitching = relFrame < 10;
      opacity = interpolate(relFrame, [0, 3], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      });

      if (isGlitching) {
        const glitchX = Math.sin(relFrame * 7) * 3;
        const glitchY = Math.cos(relFrame * 5) * 2;
        const rgbShift = Math.sin(relFrame * 4) * 4;

        displayText = (
          <span style={{ position: "relative", display: "inline-block" }}>
            {/* Red channel offset */}
            <span
              style={{
                position: "absolute",
                left: rgbShift,
                top: 0,
                color: "rgba(255,0,0,0.5)",
                mixBlendMode: "screen" as const,
              }}
            >
              {text}
            </span>
            {/* Blue channel offset */}
            <span
              style={{
                position: "absolute",
                left: -rgbShift,
                top: 0,
                color: "rgba(0,100,255,0.5)",
                mixBlendMode: "screen" as const,
              }}
            >
              {text}
            </span>
            {/* Main text */}
            <span style={{ position: "relative" }}>{text}</span>
          </span>
        );
        transform = `translate(${glitchX}px, ${glitchY}px)`;
      }
      break;
    }
    case "highlight": {
      // Text appears, then a colored bar sweeps behind it
      opacity = interpolate(relFrame, [0, 10], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      });
      const barWidth = interpolate(relFrame, [8, 25], [0, 105], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      });

      displayText = (
        <span style={{ position: "relative", display: "inline-block" }}>
          {/* Highlight bar behind text */}
          <span
            style={{
              position: "absolute",
              left: "-3%",
              bottom: "0%",
              width: `${barWidth}%`,
              height: "35%",
              backgroundColor: highlightColor,
              opacity: 0.6,
              borderRadius: 4,
              zIndex: -1,
            }}
          />
          <span style={{ position: "relative", zIndex: 1 }}>{text}</span>
        </span>
      );
      break;
    }
    case "shake": {
      // Text shakes rapidly for emphasis (8 frames), then stabilizes
      opacity = interpolate(relFrame, [0, 3], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      });

      if (relFrame < 8) {
        const shakeX = Math.sin(relFrame * 12) * 3;
        transform = `translateX(${shakeX}px)`;
      }
      break;
    }
  }

  const textShadow = shadow
    ? "0 4px 30px rgba(0,0,0,0.8), 0 2px 10px rgba(0,0,0,0.5)"
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
