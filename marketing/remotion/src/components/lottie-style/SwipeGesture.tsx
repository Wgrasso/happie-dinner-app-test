import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";

interface SwipeGestureProps {
  startFrame?: number;
  color?: string;
  size?: number;
}

export const SwipeGesture: React.FC<SwipeGestureProps> = ({
  startFrame = 0,
  color = "#FFFFFF",
  size = 200,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const localFrame = frame - startFrame;

  // Total animation: 60 frames (1s at 60fps, or ~1.5s at 40fps)
  const swipeProgress = interpolate(localFrame, [0, 8, 40, 48, 60], [0, 0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const opacity = interpolate(localFrame, [0, 8, 40, 50, 60], [0, 1, 1, 0.6, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Finger moves from left (20%) to right (75%)
  const fingerX = interpolate(swipeProgress, [0, 1], [size * 0.18, size * 0.72]);
  const fingerY = size * 0.5;

  // Trail opacity and width
  const trailOpacity = interpolate(swipeProgress, [0, 0.1, 0.8, 1], [0, 0.6, 0.4, 0]);
  const trailWidth = fingerX - size * 0.18;

  // Slight squeeze on finger during swipe
  const fingerScaleX = interpolate(swipeProgress, [0, 0.2, 0.8, 1], [1, 0.88, 0.92, 1]);
  const fingerScaleY = interpolate(swipeProgress, [0, 0.2, 0.8, 1], [1, 1.08, 1.04, 1]);

  const r = size / 200; // scale ratio

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      style={{ opacity }}
    >
      {/* Trail streak */}
      <g opacity={trailOpacity}>
        <rect
          x={size * 0.18 / r}
          y={fingerY / r - 6}
          width={trailWidth / r}
          height={12}
          rx={6}
          fill={`url(#trailGrad)`}
        />
      </g>

      <defs>
        <linearGradient id="trailGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={color} stopOpacity="0" />
          <stop offset="100%" stopColor={color} stopOpacity="0.7" />
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Pointing finger / hand */}
      <g
        transform={`translate(${fingerX / r}, ${fingerY / r}) scale(${fingerScaleX}, ${fingerScaleY})`}
        filter="url(#glow)"
      >
        {/* Palm base */}
        <ellipse cx={0} cy={14} rx={14} ry={12} fill={color} opacity={0.9} />
        {/* Index finger */}
        <rect x={-7} y={-22} width={14} height={28} rx={7} fill={color} />
        {/* Finger tip highlight */}
        <ellipse cx={0} cy={-22} rx={7} ry={7} fill={color} />
        {/* Thumb suggestion */}
        <ellipse cx={14} cy={8} rx={7} ry={5} fill={color} opacity={0.7} transform="rotate(-20, 14, 8)" />
        {/* Center dot (fingernail highlight) */}
        <ellipse cx={0} cy={-20} rx={3} ry={2} fill="rgba(255,255,255,0.5)" />
      </g>

      {/* Motion dots ahead of finger */}
      {[1, 2, 3].map((i) => (
        <circle
          key={i}
          cx={fingerX / r + 12 + i * 10}
          cy={fingerY / r}
          r={2.5 - i * 0.5}
          fill={color}
          opacity={interpolate(swipeProgress, [0.3, 0.5, 0.9, 1], [0, 0.6 - i * 0.1, 0.4 - i * 0.1, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          })}
        />
      ))}
    </svg>
  );
};
