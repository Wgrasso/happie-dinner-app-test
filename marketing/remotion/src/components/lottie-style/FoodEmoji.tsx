import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";

interface FoodEmojiProps {
  startFrame?: number;
  emojis?: string[];
  size?: number;
  emojiSize?: number;
  staggerFrames?: number;
}

export const FoodEmoji: React.FC<FoodEmojiProps> = ({
  startFrame = 0,
  emojis = ["🍝", "🍕", "🌮", "🍜"],
  size = 260,
  emojiSize = 48,
  staggerFrames = 8,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const localFrame = frame - startFrame;

  const count = emojis.length;
  const spacing = size / (count + 0.5);
  const startX = spacing * 0.75;

  return (
    <svg width={size} height={size * 0.45} viewBox={`0 0 ${size} ${size * 0.45}`}>
      {emojis.map((emoji, i) => {
        const emojiFrame = localFrame - i * staggerFrames;

        const scale = spring({
          frame: Math.max(0, emojiFrame),
          fps,
          config: { damping: 7, stiffness: 280, mass: 0.5 },
          from: 0,
          to: 1,
        });

        // Gentle continuous float
        const floatY =
          emojiFrame > 0
            ? Math.sin((emojiFrame / fps) * Math.PI * 2 * 0.8 + i * 0.9) * 4
            : 0;

        const opacity = interpolate(emojiFrame, [0, 6], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });

        const cx = startX + i * spacing;
        const cy = size * 0.45 * 0.5;

        // Shadow
        const shadowOpacity = scale * 0.25;

        return (
          <g key={i} opacity={opacity}>
            {/* Drop shadow ellipse */}
            <ellipse
              cx={cx}
              cy={cy + emojiSize * 0.52 + floatY * 0.3}
              rx={emojiSize * 0.38 * scale}
              ry={emojiSize * 0.1 * scale}
              fill="rgba(0,0,0,0.2)"
              opacity={shadowOpacity}
            />

            {/* Emoji text */}
            <text
              x={cx}
              y={cy + floatY}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize={emojiSize * scale}
              style={{ userSelect: "none" }}
            >
              {emoji}
            </text>

            {/* Arrival sparkle burst (short lived) */}
            {emojiFrame >= 0 && emojiFrame < 12 &&
              [0, 1, 2, 3, 4].map((j) => {
                const angle = (j / 5) * Math.PI * 2;
                const dist = interpolate(emojiFrame, [0, 12], [0, emojiSize * 0.8]);
                const sparkOpacity = interpolate(emojiFrame, [0, 6, 12], [0, 0.9, 0]);
                return (
                  <circle
                    key={j}
                    cx={cx + Math.cos(angle) * dist}
                    cy={cy + Math.sin(angle) * dist}
                    r={3}
                    fill="#FFD700"
                    opacity={sparkOpacity}
                  />
                );
              })}
          </g>
        );
      })}
    </svg>
  );
};
