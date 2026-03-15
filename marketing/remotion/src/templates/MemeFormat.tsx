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

// ─── Types ───────────────────────────────────────────────────────────────────

export type MemeFormatProps = {
  music: string;
  durationInSeconds: number;
} & (
  | {
      variant: "split";
      links: { tekst: string; emoji: string };
      rechts: { tekst: string; emoji: string };
    }
  | {
      variant: "tierlist";
      items: { tier: "S" | "A" | "B" | "F"; label: string }[];
    }
  | {
      variant: "chat";
      berichten: { tekst: string; isReply: boolean }[];
      punchline: string;
    }
);

// ─── Logo + CTA footer (last 60 frames) ─────────────────────────────────────

const LogoCTA: React.FC<{ totalFrames: number }> = ({ totalFrames }) => {
  const frame = useCurrentFrame();
  const startFrame = totalFrames - 60;

  const opacity = interpolate(frame, [startFrame, startFrame + 20], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  if (frame < startFrame) return null;

  return (
    <div
      style={{
        position: "absolute",
        bottom: 80,
        left: 0,
        right: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 16,
        opacity,
      }}
    >
      <Logo animation="none" size={160} />
      <span
        style={{
          fontFamily: fonts.body,
          fontSize: 28,
          fontWeight: 700,
          color: colors.accent,
          letterSpacing: 1,
        }}
      >
        Download gratis
      </span>
    </div>
  );
};

// ─── Variant: SPLIT ───────────────────────────────────────────────────────────

const SplitVariant: React.FC<{
  links: { tekst: string; emoji: string };
  rechts: { tekst: string; emoji: string };
  totalFrames: number;
}> = ({ links, rechts, totalFrames }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const leftProgress = spring({
    frame,
    fps,
    config: { damping: 16, stiffness: 180 },
    durationInFrames: 30,
  });

  const rightProgress = spring({
    frame: Math.max(0, frame - 10),
    fps,
    config: { damping: 16, stiffness: 180 },
    durationInFrames: 30,
  });

  const leftX = interpolate(leftProgress, [0, 1], [-540, 0]);
  const rightX = interpolate(rightProgress, [0, 1], [540, 0]);

  return (
    <AbsoluteFill style={{ backgroundColor: colors.background }}>
      {/* Left panel */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "50%",
          height: "100%",
          backgroundColor: colors.border,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 32,
          transform: `translateX(${leftX}px)`,
        }}
      >
        <span style={{ fontSize: 80, lineHeight: 1 }}>{links.emoji}</span>
        <span
          style={{
            fontFamily: fonts.body,
            fontSize: 28,
            fontWeight: 700,
            color: colors.text,
            textAlign: "center",
            padding: "0 40px",
            lineHeight: 1.3,
          }}
        >
          {links.tekst}
        </span>
      </div>

      {/* Right panel */}
      <div
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          width: "50%",
          height: "100%",
          backgroundColor: colors.background,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 32,
          transform: `translateX(${rightX}px)`,
        }}
      >
        <span style={{ fontSize: 80, lineHeight: 1 }}>{rechts.emoji}</span>
        <span
          style={{
            fontFamily: fonts.body,
            fontSize: 28,
            fontWeight: 700,
            color: colors.text,
            textAlign: "center",
            padding: "0 40px",
            lineHeight: 1.3,
          }}
        >
          {rechts.tekst}
        </span>
      </div>

      {/* Center divider */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: "50%",
          width: 2,
          height: "100%",
          backgroundColor: colors.accent,
          transform: "translateX(-50%)",
        }}
      />

      <LogoCTA totalFrames={totalFrames} />
    </AbsoluteFill>
  );
};

// ─── Variant: TIERLIST ────────────────────────────────────────────────────────

const tierBadgeColors: Record<
  "S" | "A" | "B" | "F",
  { bg: string; text: string }
> = {
  S: { bg: colors.accent, text: colors.white },
  A: { bg: colors.logoCoral, text: colors.white },
  B: { bg: colors.border, text: colors.text },
  F: { bg: colors.dislikeRed, text: colors.white },
};

const TierlistVariant: React.FC<{
  items: { tier: "S" | "A" | "B" | "F"; label: string }[];
  totalFrames: number;
}> = ({ items, totalFrames }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleOpacity = interpolate(frame, [0, 20], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: colors.background,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 32,
        padding: "0 80px",
      }}
    >
      {/* Title */}
      <span
        style={{
          fontFamily: fonts.heading,
          fontSize: 36,
          fontWeight: 700,
          color: colors.text,
          opacity: titleOpacity,
          textAlign: "center",
          marginBottom: 16,
        }}
      >
        Tier List: Hoe eet jij?
      </span>

      {/* Tier rows */}
      {items.map((item, i) => {
        const delay = 20 + i * 15;
        const progress = spring({
          frame: Math.max(0, frame - delay),
          fps,
          config: { damping: 16, stiffness: 200 },
          durationInFrames: 20,
        });
        const translateX = interpolate(progress, [0, 1], [540, 0]);
        const badgeColors = tierBadgeColors[item.tier];

        return (
          <div
            key={i}
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              gap: 24,
              width: "100%",
              transform: `translateX(${translateX}px)`,
            }}
          >
            {/* Tier badge */}
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: 12,
                backgroundColor: badgeColors.bg,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <span
                style={{
                  fontFamily: fonts.body,
                  fontSize: 28,
                  fontWeight: 700,
                  color: badgeColors.text,
                }}
              >
                {item.tier}
              </span>
            </div>

            {/* Label */}
            <span
              style={{
                fontFamily: fonts.body,
                fontSize: 24,
                fontWeight: 500,
                color: colors.text,
                lineHeight: 1.3,
              }}
            >
              {item.label}
            </span>
          </div>
        );
      })}

      <LogoCTA totalFrames={totalFrames} />
    </AbsoluteFill>
  );
};

// ─── Variant: CHAT ────────────────────────────────────────────────────────────

const TYPING_DURATION = 15;
const BUBBLE_DURATION = 25;
const MESSAGE_TOTAL = TYPING_DURATION + BUBBLE_DURATION; // 40 frames per message

const ChatVariant: React.FC<{
  berichten: { tekst: string; isReply: boolean }[];
  punchline: string;
  totalFrames: number;
}> = ({ berichten, punchline, totalFrames }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const allMessages = [...berichten, { tekst: punchline, isReply: false }];

  return (
    <AbsoluteFill style={{ backgroundColor: colors.backgroundAlt }}>
      {/* Chat header */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 100,
          backgroundColor: colors.background,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderBottom: `1px solid ${colors.border}`,
        }}
      >
        <span
          style={{
            fontFamily: fonts.body,
            fontSize: 28,
            fontWeight: 700,
            color: colors.text,
          }}
        >
          Groepsapp 🏠
        </span>
      </div>

      {/* Messages */}
      <div
        style={{
          position: "absolute",
          top: 100,
          bottom: 180,
          left: 0,
          right: 0,
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          padding: "24px 48px",
          gap: 16,
          overflow: "hidden",
        }}
      >
        {allMessages.map((msg, i) => {
          const msgStartFrame = i * MESSAGE_TOTAL;
          const typingEnd = msgStartFrame + TYPING_DURATION;
          const bubbleStart = typingEnd;
          const isPunchline = i === allMessages.length - 1;

          const isShowingTyping =
            frame >= msgStartFrame && frame < typingEnd;
          const isShowingBubble = frame >= bubbleStart;

          if (frame < msgStartFrame) return null;

          const bubbleProgress = spring({
            frame: Math.max(0, frame - bubbleStart),
            fps,
            config: { damping: 16, stiffness: 220 },
            durationInFrames: 20,
          });

          const bubbleY = interpolate(bubbleProgress, [0, 1], [40, 0]);
          const bubbleOpacity = interpolate(bubbleProgress, [0, 1], [0, 1]);

          const punchlineScale = isPunchline
            ? spring({
                frame: Math.max(0, frame - bubbleStart - 10),
                fps,
                config: { damping: 10, stiffness: 160 },
                durationInFrames: 20,
              })
            : 1;

          const isReply = msg.isReply;
          const bubbleBg = isReply ? colors.accent : colors.border;
          const bubbleTextColor = isReply ? colors.white : colors.text;

          return (
            <div
              key={i}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: isReply ? "flex-end" : "flex-start",
              }}
            >
              {/* Typing indicator */}
              {isShowingTyping && (
                <TypingIndicator isReply={isReply} frame={frame} msgStartFrame={msgStartFrame} />
              )}

              {/* Message bubble */}
              {isShowingBubble && (
                <div
                  style={{
                    maxWidth: "75%",
                    backgroundColor: bubbleBg,
                    borderRadius: isReply
                      ? "24px 24px 4px 24px"
                      : "24px 24px 24px 4px",
                    padding: "20px 28px",
                    transform: `translateY(${bubbleY}px) scale(${punchlineScale})`,
                    opacity: bubbleOpacity,
                  }}
                >
                  <span
                    style={{
                      fontFamily: fonts.body,
                      fontSize: isPunchline ? 26 : 22,
                      fontWeight: isPunchline ? 700 : 400,
                      color: bubbleTextColor,
                      lineHeight: 1.4,
                    }}
                  >
                    {msg.tekst}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <LogoCTA totalFrames={totalFrames} />
    </AbsoluteFill>
  );
};

const TypingIndicator: React.FC<{
  isReply: boolean;
  frame: number;
  msgStartFrame: number;
}> = ({ isReply, frame, msgStartFrame }) => {
  const relFrame = frame - msgStartFrame;

  const dot1Opacity = interpolate(
    Math.sin((relFrame / 8) * Math.PI),
    [-1, 1],
    [0.2, 1]
  );
  const dot2Opacity = interpolate(
    Math.sin(((relFrame - 4) / 8) * Math.PI),
    [-1, 1],
    [0.2, 1]
  );
  const dot3Opacity = interpolate(
    Math.sin(((relFrame - 8) / 8) * Math.PI),
    [-1, 1],
    [0.2, 1]
  );

  const bg = isReply ? colors.accent : colors.border;
  const dotColor = isReply ? colors.white : colors.textMuted;

  return (
    <div
      style={{
        backgroundColor: bg,
        borderRadius: isReply ? "24px 24px 4px 24px" : "24px 24px 24px 4px",
        padding: "16px 24px",
        display: "flex",
        flexDirection: "row",
        gap: 8,
        alignItems: "center",
      }}
    >
      {[dot1Opacity, dot2Opacity, dot3Opacity].map((op, idx) => (
        <div
          key={idx}
          style={{
            width: 10,
            height: 10,
            borderRadius: "50%",
            backgroundColor: dotColor,
            opacity: op,
          }}
        />
      ))}
    </div>
  );
};

// ─── Main Template ───────────────────────────────────────────────────────────

export const MemeFormat: React.FC<MemeFormatProps> = (props) => {
  const { durationInFrames } = useVideoConfig();

  return (
    <AbsoluteFill>
      {props.variant === "split" && (
        <SplitVariant
          links={props.links}
          rechts={props.rechts}
          totalFrames={durationInFrames}
        />
      )}
      {props.variant === "tierlist" && (
        <TierlistVariant
          items={props.items}
          totalFrames={durationInFrames}
        />
      )}
      {props.variant === "chat" && (
        <ChatVariant
          berichten={props.berichten}
          punchline={props.punchline}
          totalFrames={durationInFrames}
        />
      )}

      <BackgroundMusic src={props.music} />
    </AbsoluteFill>
  );
};
