import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate } from "remotion";

interface CookingPotProps {
  startFrame?: number;
  potColor?: string;
  steamColor?: string;
  size?: number;
}

export const CookingPot: React.FC<CookingPotProps> = ({
  startFrame = 0,
  potColor = "#E8734A",
  steamColor = "rgba(255,255,255,0.7)",
  size = 200,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const localFrame = frame - startFrame;

  const appearProgress = interpolate(localFrame, [0, 12], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Pot wobble: subtle left-right tilt
  const wobble = Math.sin((localFrame / fps) * Math.PI * 2 * 1.5) * 1.5;

  // 3 steam wisps, staggered
  const steamWisps = [
    { x: 80, delay: 0, freq: 1.2, amp: 6 },
    { x: 100, delay: 8, freq: 0.9, amp: 4 },
    { x: 120, delay: 16, freq: 1.5, amp: 8 },
  ];

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      style={{ opacity: appearProgress }}
    >
      <defs>
        <linearGradient id="potGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={potColor} />
          <stop offset="100%" stopColor="#C05020" />
        </linearGradient>
        <linearGradient id="lidGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#F09060" />
          <stop offset="100%" stopColor={potColor} />
        </linearGradient>
      </defs>

      <g transform={`translate(100, 100) rotate(${wobble}) translate(-100, -100)`}>
        {/* Pot body */}
        <rect x={52} y={118} width={96} height={62} rx={10} fill="url(#potGrad)" />
        {/* Pot body highlight */}
        <rect x={58} y={122} width={28} height={50} rx={6} fill="rgba(255,255,255,0.12)" />

        {/* Pot rim */}
        <rect x={46} y={110} width={108} height={14} rx={6} fill={potColor} />
        <rect x={46} y={110} width={108} height={7} rx={4} fill="rgba(255,255,255,0.2)" />

        {/* Lid */}
        <rect x={52} y={96} width={96} height={18} rx={6} fill="url(#lidGrad)" />
        <rect x={52} y={96} width={96} height={9} rx={5} fill="rgba(255,255,255,0.25)" />

        {/* Lid knob */}
        <rect x={90} y={86} width={20} height={14} rx={5} fill={potColor} />
        <rect x={92} y={87} width={8} height={6} rx={3} fill="rgba(255,255,255,0.3)" />

        {/* Left handle */}
        <rect x={28} y={116} width={26} height={12} rx={6} fill="#C05020" />
        <rect x={30} y={117} width={10} height={5} rx={3} fill="rgba(255,255,255,0.2)" />

        {/* Right handle */}
        <rect x={146} y={116} width={26} height={12} rx={6} fill="#C05020" />
        <rect x={148} y={117} width={10} height={5} rx={3} fill="rgba(255,255,255,0.2)" />

        {/* Bottom shadow */}
        <ellipse cx={100} cy={184} rx={48} ry={6} fill="rgba(0,0,0,0.15)" />
      </g>

      {/* Steam wisps */}
      {steamWisps.map((wisp, i) => {
        const wispFrame = localFrame - wisp.delay;
        const cycle = ((wispFrame / fps) * 2) % 2; // 0..2 cycle
        const riseProgress = Math.min(1, Math.max(0, cycle));
        const wispOpacity =
          riseProgress < 0.3
            ? interpolate(riseProgress, [0, 0.3], [0, 0.8])
            : riseProgress < 0.7
            ? 0.8
            : interpolate(riseProgress, [0.7, 1], [0.8, 0]);

        const wispY = interpolate(riseProgress, [0, 1], [88, 28]);
        const wispX =
          wisp.x + Math.sin((wispFrame / fps) * Math.PI * 2 * wisp.freq) * wisp.amp;

        const scaleY = interpolate(riseProgress, [0, 1], [0.4, 1]);

        return wispFrame >= 0 ? (
          <g key={i} opacity={wispOpacity}>
            <path
              d={`M ${wispX} ${wispY}
                  C ${wispX - 6} ${wispY - 10} ${wispX + 6} ${wispY - 20} ${wispX} ${wispY - 30}`}
              stroke={steamColor}
              strokeWidth={4}
              fill="none"
              strokeLinecap="round"
              transform={`scale(1, ${scaleY}) translate(0, ${wispY * (1 - scaleY)})`}
            />
          </g>
        ) : null;
      })}
    </svg>
  );
};
