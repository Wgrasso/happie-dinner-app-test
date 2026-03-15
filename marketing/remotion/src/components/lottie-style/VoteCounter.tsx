import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";

interface VoteCounterProps {
  startFrame?: number;
  current?: number;
  total?: number;
  label?: string;
  size?: number;
  accentColor?: string;
}

export const VoteCounter: React.FC<VoteCounterProps> = ({
  startFrame = 0,
  current = 6,
  total = 8,
  label = "stemmen",
  size = 200,
  accentColor = "#F4845F",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const localFrame = frame - startFrame;

  // Count animates from 0 → current over first 50 frames
  const countProgress = spring({
    frame: localFrame,
    fps,
    config: { damping: 16, stiffness: 80, mass: 1 },
    from: 0,
    to: 1,
  });

  const animatedCount = Math.round(interpolate(countProgress, [0, 1], [0, current]));

  // Ring fill: progress ring
  const ringProgress = interpolate(countProgress, [0, 1], [0, current / total]);
  const radius = size * 0.38;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - ringProgress);

  // Color transition as votes increase
  const colorProgress = current / total;
  // Low: blue → medium: orange → high: green
  const ringColor =
    colorProgress < 0.4
      ? "#4A90D9"
      : colorProgress < 0.75
      ? accentColor
      : "#4CAF50";

  // Number roll: vertical clip animation
  const digitFlipY = interpolate(
    (localFrame % 6),
    [0, 3, 6],
    [0, -8, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );
  const digitOpacity = interpolate(
    (localFrame % 6),
    [0, 1, 4, 6],
    [1, 0.7, 0.7, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );
  // Only flip while still counting
  const isStillCounting = animatedCount < current;

  // Overall appear
  const appear = interpolate(localFrame, [0, 10], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const cx = size / 2;
  const cy = size / 2;

  // Small checkmarks for each vote
  const checkmarkSpacing = (size * 0.7) / Math.max(total, 1);
  const checkmarkStartX = cx - (total - 1) * checkmarkSpacing * 0.5;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      style={{ opacity: appear }}
    >
      <defs>
        <filter id="ringGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <clipPath id="digitClip">
          <rect x={cx - 40} y={cy - 30} width={80} height={50} />
        </clipPath>
      </defs>

      {/* Background track ring */}
      <circle
        cx={cx}
        cy={cy}
        r={radius}
        fill="none"
        stroke="rgba(255,255,255,0.15)"
        strokeWidth={10}
      />

      {/* Progress ring */}
      <circle
        cx={cx}
        cy={cy}
        r={radius}
        fill="none"
        stroke={ringColor}
        strokeWidth={10}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={strokeDashoffset}
        transform={`rotate(-90 ${cx} ${cy})`}
        filter="url(#ringGlow)"
      />

      {/* Count number (rolling effect) */}
      <g clipPath="url(#digitClip)">
        <text
          x={cx}
          y={cy + (isStillCounting ? digitFlipY : 0) + 6}
          textAnchor="middle"
          dominantBaseline="middle"
          fontFamily="'Arial Black', 'Helvetica Neue', sans-serif"
          fontWeight="900"
          fontSize={size * 0.22}
          fill="white"
          opacity={isStillCounting ? digitOpacity : 1}
        >
          {animatedCount}
        </text>
      </g>

      {/* Slash and total */}
      <text
        x={cx + size * 0.14}
        y={cy + 4}
        textAnchor="middle"
        dominantBaseline="middle"
        fontFamily="'Arial', sans-serif"
        fontWeight="600"
        fontSize={size * 0.1}
        fill="rgba(255,255,255,0.5)"
      >
        /{total}
      </text>

      {/* Label below */}
      <text
        x={cx}
        y={cy + radius * 0.55}
        textAnchor="middle"
        fontFamily="'Arial', sans-serif"
        fontWeight="600"
        fontSize={size * 0.075}
        fill="rgba(255,255,255,0.75)"
        letterSpacing={1}
      >
        {label}
      </text>

      {/* Mini vote dots at bottom */}
      {Array.from({ length: total }).map((_, i) => {
        const dotX = checkmarkStartX + i * checkmarkSpacing;
        const dotY = cy + radius * 0.88;
        const voted = i < animatedCount;
        const dotScale = voted
          ? spring({
              frame: Math.max(0, localFrame - Math.round((i / current) * 40)),
              fps,
              config: { damping: 8, stiffness: 300 },
              from: 0.3,
              to: 1,
            })
          : 0.4;
        return (
          <circle
            key={i}
            cx={dotX}
            cy={dotY}
            r={4 * dotScale}
            fill={voted ? ringColor : "rgba(255,255,255,0.2)"}
          />
        );
      })}
    </svg>
  );
};
