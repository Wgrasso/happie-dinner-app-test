import React from "react";
import { useCurrentFrame, interpolate } from "remotion";

interface RevealMaskProps {
  children: React.ReactNode;
  startFrame: number;
  durationFrames?: number;
  shape: "circle" | "rectangle" | "diagonal";
  origin?: { x: string; y: string };
}

export const RevealMask: React.FC<RevealMaskProps> = ({
  children,
  startFrame,
  durationFrames = 30,
  shape,
  origin = { x: "50%", y: "50%" },
}) => {
  const frame = useCurrentFrame();
  const localFrame = frame - startFrame;

  const progress = interpolate(localFrame, [0, durationFrames], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Ease out cubic for smooth reveal
  const eased = 1 - Math.pow(1 - progress, 3);

  let clipPath: string;

  if (shape === "circle") {
    const radius = eased * 150; // 150% to cover corners
    clipPath = `circle(${radius}% at ${origin.x} ${origin.y})`;
  } else if (shape === "diagonal") {
    clipPath = `polygon(0 0, ${eased * 200}% 0, ${eased * 200 - 100}% 100%, 0 100%)`;
  } else {
    const inset = (1 - eased) * 50;
    clipPath = `inset(${inset}%)`;
  }

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        clipPath,
        WebkitClipPath: clipPath,
      }}
    >
      {children}
    </div>
  );
};
