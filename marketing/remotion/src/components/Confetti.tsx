import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";

interface ConfettiProps {
  startFrame?: number;
  particleCount?: number;
}

const BRAND_COLORS = ["#8B7355", "#F4845F", "#4CAF50", "#CC4444", "#E8E2DA"];

const seededRandom = (seed: number) => {
  const x = Math.sin(seed * 9999) * 10000;
  return x - Math.floor(x);
};

export const Confetti: React.FC<ConfettiProps> = ({
  startFrame = 0,
  particleCount = 30,
}) => {
  const frame = useCurrentFrame();

  const particles = Array.from({ length: particleCount }, (_, i) => {
    const r0 = seededRandom(i * 5 + 0);
    const r1 = seededRandom(i * 5 + 1);
    const r2 = seededRandom(i * 5 + 2);
    const r3 = seededRandom(i * 5 + 3);
    const r4 = seededRandom(i * 5 + 4);

    const x = r0 * 1080;
    const width = 8 + r1 * 8;       // 8–16px
    const height = 6 + r2 * 6;      // 6–12px
    const fallSpeed = 0.8 + r3 * 0.4; // multiplier for fall duration variety
    const maxRotation = r4 * 720;
    const color = BRAND_COLORS[Math.floor(r0 * BRAND_COLORS.length)];

    const fallDuration = 45 * fallSpeed;
    const localFrame = frame - startFrame;

    const y = interpolate(
      localFrame,
      [0, fallDuration],
      [-50, 2000],
      { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
    );

    const rotation = interpolate(
      localFrame,
      [0, fallDuration],
      [0, maxRotation],
      { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
    );

    const opacity = interpolate(
      localFrame,
      [fallDuration - 15, fallDuration],
      [1, 0],
      { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
    );

    return { x, y, width, height, rotation, opacity, color };
  });

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <svg
        width={1080}
        height={1920}
        viewBox="0 0 1080 1920"
        style={{ position: "absolute", top: 0, left: 0 }}
      >
        {particles.map((p, i) => (
          <rect
            key={i}
            x={p.x - p.width / 2}
            y={p.y - p.height / 2}
            width={p.width}
            height={p.height}
            fill={p.color}
            opacity={p.opacity}
            transform={`rotate(${p.rotation}, ${p.x}, ${p.y})`}
          />
        ))}
      </svg>
    </AbsoluteFill>
  );
};
