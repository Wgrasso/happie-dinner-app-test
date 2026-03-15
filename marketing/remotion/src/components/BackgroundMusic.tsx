import { Audio, interpolate, useVideoConfig, staticFile } from "remotion";

interface BackgroundMusicProps {
  src: string; // Filename in public/music/ (e.g., "upbeat-1.mp3")
  fadeOutDurationFrames?: number; // default 30 (1 second at 30fps)
}

export const BackgroundMusic: React.FC<BackgroundMusicProps> = ({
  src,
  fadeOutDurationFrames = 30,
}) => {
  const { durationInFrames } = useVideoConfig();

  if (!src) return null;

  const fadeStartFrame = durationInFrames - fadeOutDurationFrames;

  const calculateVolume = (f: number): number => {
    return interpolate(f, [fadeStartFrame, durationInFrames], [1, 0], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
  };

  return (
    <Audio
      src={staticFile(`music/${src}`)}
      volume={(f) => calculateVolume(f)}
    />
  );
};
