import { Img, spring, useCurrentFrame, useVideoConfig, interpolate, staticFile } from "remotion";

interface LogoProps {
  animation?: "bounce" | "fadeIn" | "none";
  size?: number; // width in px, default 300
  startFrame?: number; // frame to start animation, default 0
}

export const Logo: React.FC<LogoProps> = ({
  animation = "none",
  size = 300,
  startFrame = 0,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const relativeFrame = Math.max(0, frame - startFrame);

  let scale = 1;
  let opacity = 1;

  if (animation === "bounce") {
    scale = spring({
      frame: relativeFrame,
      fps,
      config: { damping: 12 },
    });
  } else if (animation === "fadeIn") {
    opacity = interpolate(relativeFrame, [0, 15], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
  }

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Img
        src={staticFile("logo-transparent.png")}
        style={{
          width: size,
          height: "auto",
          transform: `scale(${scale})`,
          opacity,
        }}
      />
    </div>
  );
};
