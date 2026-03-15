import React from "react";
import {
  AbsoluteFill,
  OffthreadVideo,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

interface VideoBackgroundProps {
  src: string; // filename in public/videos/
  overlay?: string; // overlay color, default "rgba(0,0,0,0.5)"
  startFrom?: number; // trim start in seconds
  playbackRate?: number; // slow motion: 0.5, normal: 1
}

export const VideoBackground: React.FC<VideoBackgroundProps> = ({
  src,
  overlay = "rgba(0,0,0,0.5)",
  startFrom = 0,
  playbackRate = 1,
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  // Subtle warm gradient overlay for depth
  const warmOverlayOpacity = interpolate(frame, [0, durationInFrames], [0.05, 0.12], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <OffthreadVideo
        src={staticFile(`videos/${src}`)}
        startFrom={startFrom * 30}
        playbackRate={playbackRate}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: 1080,
          height: 1920,
          objectFit: "cover",
        }}
        muted
      />

      {/* Dark gradient overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `linear-gradient(180deg, ${overlay} 0%, rgba(0,0,0,0.3) 40%, ${overlay} 100%)`,
        }}
      />

      {/* Warm amber overlay for cohesion */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundColor: `rgba(255, 165, 0, ${warmOverlayOpacity})`,
        }}
      />
    </AbsoluteFill>
  );
};
