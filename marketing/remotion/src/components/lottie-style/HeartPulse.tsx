import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";

interface HeartPulseProps {
  startFrame?: number;
  color?: string;
  size?: number;
  pulseRate?: number; // pulses per second
}

export const HeartPulse: React.FC<HeartPulseProps> = ({
  startFrame = 0,
  color = "#F4845F",
  size = 200,
  pulseRate = 1.2,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const localFrame = frame - startFrame;

  // Appear spring
  const appearScale = spring({
    frame: localFrame,
    fps,
    config: { damping: 10, stiffness: 180, mass: 0.7 },
    from: 0,
    to: 1,
  });

  // Pulse: sinusoidal scale between 1.0 and 1.22
  const pulsePhase = (localFrame / fps) * Math.PI * 2 * pulseRate;
  const pulseMagnitude = interpolate(localFrame, [0, 15], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const pulseScale = 1 + Math.max(0, Math.sin(pulsePhase)) * 0.22 * pulseMagnitude;

  const totalScale = appearScale * pulseScale;

  // Glow synced to pulse
  const glowIntensity = Math.max(0, Math.sin(pulsePhase)) * pulseMagnitude;
  const glowOpacity = interpolate(glowIntensity, [0, 1], [0.1, 0.5]);
  const glowBlur = interpolate(glowIntensity, [0, 1], [4, 10]);

  // Inner lighter color for highlight
  const highlightOpacity = interpolate(glowIntensity, [0, 1], [0.25, 0.45]);

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      style={{
        transform: `scale(${totalScale})`,
        transformOrigin: "center",
      }}
    >
      <defs>
        <filter id="heartGlow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation={glowBlur} result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <linearGradient id="heartGrad" x1="30%" y1="0%" x2="70%" y2="100%">
          <stop offset="0%" stopColor="#FF9E84" />
          <stop offset="100%" stopColor={color} />
        </linearGradient>
      </defs>

      {/* Outer glow */}
      <path
        d="M100,155 C100,155 30,110 30,68 C30,48 46,34 64,34 C78,34 90,42 100,54 C110,42 122,34 136,34 C154,34 170,48 170,68 C170,110 100,155 100,155 Z"
        fill={color}
        opacity={glowOpacity}
        filter="url(#heartGlow)"
      />

      {/* Heart body */}
      <path
        d="M100,155 C100,155 30,110 30,68 C30,48 46,34 64,34 C78,34 90,42 100,54 C110,42 122,34 136,34 C154,34 170,48 170,68 C170,110 100,155 100,155 Z"
        fill="url(#heartGrad)"
      />

      {/* Inner highlight */}
      <path
        d="M72,50 C64,50 56,56 56,66 C56,78 68,90 80,100"
        stroke="rgba(255,255,255,0.5)"
        strokeWidth={6}
        fill="none"
        strokeLinecap="round"
        opacity={highlightOpacity}
      />

      {/* Sparkle dots on pulse */}
      {[0, 1, 2, 3].map((i) => {
        const angle = (i / 4) * Math.PI * 2 - Math.PI / 4;
        const dist = 82 + glowIntensity * 10;
        const sparkX = 100 + Math.cos(angle) * dist;
        const sparkY = 92 + Math.sin(angle) * dist;
        const sparkOpacity = glowIntensity * 0.7;
        return (
          <circle
            key={i}
            cx={sparkX}
            cy={sparkY}
            r={3 + glowIntensity * 2}
            fill={color}
            opacity={sparkOpacity}
          />
        );
      })}
    </svg>
  );
};
