import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";

interface SwipeCardsProps {
  startFrame?: number;
  width?: number;
  height?: number;
  card1Color?: string;
  card2Color?: string;
  card3Color?: string;
  labelText?: string;
}

export const SwipeCards: React.FC<SwipeCardsProps> = ({
  startFrame = 0,
  width = 280,
  height = 180,
  card1Color = "#F4845F",
  card2Color = "#4A90D9",
  card3Color = "#7BC67E",
  labelText = "HAPPIE!",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const localFrame = frame - startFrame;

  // Animation phases:
  // 0-10: cards stack in
  // 12-40: top card swipes right
  // 40-55: "HAPPIE!" label fades
  // 55-70: reset / loop prep

  const stackIn = spring({
    frame: localFrame,
    fps,
    config: { damping: 12, stiffness: 150, mass: 0.8 },
    from: 0,
    to: 1,
  });

  // Top card swipe
  const swipeProgress = interpolate(localFrame, [12, 40], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const swipeSpring = spring({
    frame: Math.max(0, localFrame - 12),
    fps,
    config: { damping: 14, stiffness: 120, mass: 0.9 },
    from: 0,
    to: 1,
  });

  const card1X = interpolate(swipeSpring, [0, 1], [0, width * 1.4]);
  const card1Rotation = interpolate(swipeSpring, [0, 1], [0, 22]);
  const card1Opacity = interpolate(swipeProgress, [0.6, 1], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Card 2 rises to top position as card 1 leaves
  const card2Y = interpolate(swipeProgress, [0, 0.7], [8, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const card2Scale = interpolate(swipeProgress, [0, 0.7], [0.95, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Card 3 moves up slightly
  const card3Y = interpolate(swipeProgress, [0, 0.7], [16, 8], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const card3Scale = interpolate(swipeProgress, [0, 0.7], [0.9, 0.95], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // "HAPPIE!" label on card 1
  const labelOpacity = interpolate(localFrame, [18, 26, 44, 52], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const labelScale = spring({
    frame: Math.max(0, localFrame - 18),
    fps,
    config: { damping: 8, stiffness: 250, mass: 0.5 },
    from: 0.5,
    to: 1,
  });

  const cx = width / 2;
  const cy = height / 2;

  return (
    <svg
      width={width}
      height={height + 20}
      viewBox={`0 0 ${width} ${height + 20}`}
      style={{
        transform: `scaleY(${stackIn})`,
        transformOrigin: "bottom center",
      }}
    >
      <defs>
        <filter id="cardShadow" x="-10%" y="-10%" width="120%" height="130%">
          <feDropShadow dx="0" dy="4" stdDeviation="8" floodColor="rgba(0,0,0,0.2)" />
        </filter>
        <filter id="labelShadow">
          <feDropShadow dx="1" dy="1" stdDeviation="2" floodColor="rgba(0,0,0,0.3)" />
        </filter>
      </defs>

      {/* Card 3 (bottom) */}
      <g transform={`translate(${cx}, ${cy + card3Y}) scale(${card3Scale})`}>
        <rect
          x={-width / 2 + 4}
          y={-height / 2}
          width={width - 8}
          height={height}
          rx={16}
          fill={card3Color}
          filter="url(#cardShadow)"
          opacity={0.85}
        />
        {/* Card decorative lines */}
        <rect x={-width / 2 + 20} y={-height / 2 + 22} width={80} height={8} rx={4} fill="rgba(255,255,255,0.3)" />
        <rect x={-width / 2 + 20} y={-height / 2 + 38} width={50} height={6} rx={3} fill="rgba(255,255,255,0.2)" />
      </g>

      {/* Card 2 (middle) */}
      <g transform={`translate(${cx}, ${cy + card2Y}) scale(${card2Scale})`}>
        <rect
          x={-width / 2 + 2}
          y={-height / 2}
          width={width - 4}
          height={height}
          rx={16}
          fill={card2Color}
          filter="url(#cardShadow)"
          opacity={0.9}
        />
        <rect x={-width / 2 + 20} y={-height / 2 + 22} width={100} height={8} rx={4} fill="rgba(255,255,255,0.3)" />
        <rect x={-width / 2 + 20} y={-height / 2 + 38} width={70} height={6} rx={3} fill="rgba(255,255,255,0.2)" />
        <rect x={-width / 2 + 20} y={-height / 2 + 52} width={55} height={6} rx={3} fill="rgba(255,255,255,0.15)" />
      </g>

      {/* Card 1 (top — swipes right) */}
      <g
        transform={`translate(${cx + card1X}, ${cy}) rotate(${card1Rotation}, 0, ${height * 0.6})`}
        opacity={card1Opacity}
      >
        <rect
          x={-width / 2}
          y={-height / 2}
          width={width}
          height={height}
          rx={16}
          fill={card1Color}
          filter="url(#cardShadow)"
        />
        {/* Card content */}
        <rect x={-width / 2 + 20} y={-height / 2 + 22} width={120} height={9} rx={4.5} fill="rgba(255,255,255,0.4)" />
        <rect x={-width / 2 + 20} y={-height / 2 + 40} width={85} height={7} rx={3.5} fill="rgba(255,255,255,0.25)" />
        <rect x={-width / 2 + 20} y={-height / 2 + 55} width={100} height={7} rx={3.5} fill="rgba(255,255,255,0.2)" />

        {/* "HAPPIE!" stamp label */}
        <g
          opacity={labelOpacity}
          transform={`scale(${labelScale})`}
          filter="url(#labelShadow)"
        >
          <rect
            x={-68}
            y={-26}
            width={136}
            height={52}
            rx={8}
            fill="none"
            stroke="#4CAF50"
            strokeWidth={5}
            transform="rotate(-12)"
          />
          <text
            x={0}
            y={8}
            textAnchor="middle"
            fontFamily="'Arial Black', sans-serif"
            fontSize={28}
            fontWeight="900"
            fill="#4CAF50"
            transform="rotate(-12)"
            letterSpacing={2}
          >
            {labelText}
          </text>
        </g>
      </g>
    </svg>
  );
};
