import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";

interface CheckmarkProps {
  startFrame?: number;
  color?: string;
  size?: number;
}

export const Checkmark: React.FC<CheckmarkProps> = ({
  startFrame = 0,
  color = "#4CAF50",
  size = 200,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const localFrame = frame - startFrame;

  // Circle draw progress
  const circleProgress = interpolate(localFrame, [0, 30], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Checkmark draw progress (starts after circle is ~70% done)
  const checkProgress = interpolate(localFrame, [20, 45], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Spring bounce scale on completion
  const bounceScale =
    localFrame >= 40
      ? spring({
          frame: localFrame - 40,
          fps,
          config: { damping: 8, stiffness: 200, mass: 0.6 },
          from: 0.85,
          to: 1,
        })
      : interpolate(localFrame, [0, 40], [0.6, 0.85], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });

  // Circle circumference for a radius-70 circle: 2π*70 ≈ 439.8
  const circumference = 2 * Math.PI * 70;
  const strokeDashoffset = circumference * (1 - circleProgress);

  // Fill opacity fades in after circle completes
  const fillOpacity = interpolate(localFrame, [28, 45], [0, 0.15], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Checkmark path: from (55,100) → (82,127) → (145,65)
  // Total path length ≈ 96
  const checkLength = 96;
  const checkDashoffset = checkLength * (1 - checkProgress);

  const glowOpacity = interpolate(localFrame, [40, 50, 70], [0, 0.6, 0.3], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      style={{
        transform: `scale(${bounceScale})`,
        transformOrigin: "center",
      }}
    >
      <defs>
        <filter id="checkGlow">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Background glow */}
      <circle
        cx={100}
        cy={100}
        r={72}
        fill={color}
        opacity={glowOpacity * 0.3}
        filter="url(#checkGlow)"
      />

      {/* Circle fill */}
      <circle cx={100} cy={100} r={70} fill={color} opacity={fillOpacity} />

      {/* Animating circle stroke */}
      <circle
        cx={100}
        cy={100}
        r={70}
        fill="none"
        stroke={color}
        strokeWidth={8}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={strokeDashoffset}
        transform="rotate(-90 100 100)"
        filter={glowOpacity > 0.1 ? "url(#checkGlow)" : undefined}
      />

      {/* Checkmark */}
      <path
        d="M 55 100 L 82 127 L 145 65"
        fill="none"
        stroke={color}
        strokeWidth={9}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={checkLength}
        strokeDashoffset={checkDashoffset}
        filter={checkProgress > 0.5 ? "url(#checkGlow)" : undefined}
      />
    </svg>
  );
};
