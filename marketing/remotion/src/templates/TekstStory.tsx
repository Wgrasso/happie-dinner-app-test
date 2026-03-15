import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { BackgroundMusic } from "../components/BackgroundMusic";
import { Logo } from "../components/Logo";
import { colors } from "../theme/colors";
import { fonts } from "../theme/fonts";

interface TekstStoryProps {
  hookText: string;
  antwoord: string;
  tagline?: string;
  mode?: "dark" | "light";
  music: string;
  durationInSeconds: number;
}

// ─── Scene 1: HOOK (frames 0–90) ────────────────────────────────────────────

const HookScene: React.FC<{ hookText: string; mode: "dark" | "light" }> = ({
  hookText,
  mode,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const words = hookText.split(" ");

  const bgColor = mode === "dark" ? "#2D2D2D" : "#F8F6F3";
  const textColor = mode === "dark" ? colors.white : "#2D2D2D";

  return (
    <AbsoluteFill
      style={{
        backgroundColor: bgColor,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 16,
        padding: "0 80px",
      }}
    >
      {words.map((word, i) => {
        const delay = i * 6;
        const scale = spring({
          frame: frame - delay,
          fps,
          config: { damping: 14, stiffness: 200 },
        });

        return (
          <span
            key={i}
            style={{
              fontFamily: fonts.heading,
              fontSize: 60,
              fontWeight: 700,
              color: textColor,
              lineHeight: 1.2,
              transform: `scale(${scale})`,
              display: "inline-block",
            }}
          >
            {word}
          </span>
        );
      })}
    </AbsoluteFill>
  );
};

// ─── Scene 2: ANSWER (frames 90–180) ────────────────────────────────────────

const AnswerScene: React.FC<{ antwoord: string; mode: "dark" | "light" }> = ({
  antwoord,
  mode,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Background flips from hook: dark → light, light → dark
  const bgColor = mode === "dark" ? "#F8F6F3" : "#2D2D2D";

  const translateY = interpolate(
    spring({
      frame: frame - 90,
      fps,
      config: { damping: 16, stiffness: 220 },
    }),
    [0, 1],
    [100, 0]
  );

  return (
    <AbsoluteFill
      style={{
        backgroundColor: bgColor,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "0 80px",
      }}
    >
      <span
        style={{
          fontFamily: fonts.heading,
          fontSize: 40,
          fontWeight: 700,
          color: colors.accent,
          lineHeight: 1.3,
          textAlign: "center",
          transform: `translateY(${translateY}px)`,
          display: "block",
        }}
      >
        {antwoord}
      </span>
    </AbsoluteFill>
  );
};

// ─── Scene 3: CTA (frames 180–240) ──────────────────────────────────────────

const CTAScene: React.FC<{
  tagline: string;
  mode: "dark" | "light";
}> = ({ tagline, mode }) => {
  const frame = useCurrentFrame();

  const bgColor = mode === "dark" ? "#2D2D2D" : "#F8F6F3";

  const taglineOpacity = interpolate(frame, [195, 215], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: bgColor,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        gap: 36,
      }}
    >
      {/* Logo fades in at frame 180 */}
      <Logo animation="fadeIn" size={200} startFrame={180} />

      {/* Tagline */}
      <span
        style={{
          fontFamily: fonts.body,
          fontSize: 32,
          fontWeight: 400,
          color: colors.textMuted,
          textAlign: "center",
          opacity: taglineOpacity,
          padding: "0 80px",
          lineHeight: 1.4,
        }}
      >
        {tagline}
      </span>
    </AbsoluteFill>
  );
};

// ─── Main Template ───────────────────────────────────────────────────────────

export const TekstStory: React.FC<TekstStoryProps> = ({
  hookText,
  antwoord,
  tagline = "Swipe je avondeten bij Happie",
  mode = "dark",
  music,
}) => {
  const frame = useCurrentFrame();

  const showHook   = frame < 90;
  const showAnswer = frame >= 90 && frame < 180;
  const showCTA    = frame >= 180;

  return (
    <AbsoluteFill>
      {showHook   && <HookScene   hookText={hookText} mode={mode} />}
      {showAnswer && <AnswerScene antwoord={antwoord} mode={mode} />}
      {showCTA    && <CTAScene    tagline={tagline}   mode={mode} />}

      {/* Background music wraps the entire template */}
      <BackgroundMusic src={music} />
    </AbsoluteFill>
  );
};
