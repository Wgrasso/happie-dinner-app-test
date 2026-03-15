import React from "react";
import {
  Img,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

interface PhotoBackgroundProps {
  src: string; // filename in public/meals/ OR full path like "illustrations/foo.png"
  overlay?: string; // CSS color overlay, default "rgba(0,0,0,0.4)"
  blur?: number; // backdrop blur in px, default 0
  kenBurns?: boolean; // slow zoom effect, default true
  kenBurnsScale?: [number, number]; // start/end scale, default [1, 1.15]
  warmth?: number; // 0-1, adds warm amber overlay
  desaturate?: number; // 0-1, desaturate via CSS filter
}

export const PhotoBackground: React.FC<PhotoBackgroundProps> = ({
  src,
  overlay = "rgba(0,0,0,0.4)",
  blur = 0,
  kenBurns = true,
  kenBurnsScale = [1, 1.15],
  warmth = 0,
  desaturate = 0,
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const scale = kenBurns
    ? interpolate(frame, [0, durationInFrames], kenBurnsScale, {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      })
    : 1;

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        width: 1080,
        height: 1920,
      }}
    >
      {/* Photo */}
      <Img
        src={staticFile(src.includes("/") ? src : `meals/${src}`)}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          transform: `scale(${scale})`,
          filter: [
            blur > 0 ? `blur(${blur}px)` : "",
            desaturate > 0 ? `saturate(${1 - desaturate})` : "",
          ].filter(Boolean).join(" ") || undefined,
        }}
      />

      {/* Dark overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundColor: overlay,
        }}
      />

      {/* Warm amber overlay */}
      {warmth > 0 && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundColor: `rgba(255, 165, 0, ${warmth * 0.15})`,
          }}
        />
      )}
    </div>
  );
};
