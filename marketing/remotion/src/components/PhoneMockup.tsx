interface PhoneMockupProps {
  children: React.ReactNode;
  scale?: number;
  tilt?: { x: number; y: number };
}

const BEZEL = 12;
const SCREEN_WIDTH = 300;
const SCREEN_HEIGHT = 620;
const FRAME_WIDTH = SCREEN_WIDTH + BEZEL * 2;
const FRAME_HEIGHT = SCREEN_HEIGHT + BEZEL * 2;

export const PhoneMockup: React.FC<PhoneMockupProps> = ({
  children,
  scale = 1,
  tilt,
}) => {
  const transformParts: string[] = [];

  if (tilt) {
    transformParts.push(`perspective(800px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`);
  }

  if (scale !== 1) {
    transformParts.push(`scale(${scale})`);
  }

  const transform = transformParts.length > 0 ? transformParts.join(" ") : undefined;

  return (
    <div
      style={{
        width: FRAME_WIDTH,
        height: FRAME_HEIGHT,
        backgroundColor: "#1A1A1A",
        borderRadius: 40,
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transform,
        boxSizing: "border-box",
        boxShadow: "0 20px 60px rgba(0,0,0,0.5), inset 0 0 0 1px rgba(255,255,255,0.08)",
      }}
    >
      {/* Notch */}
      <div
        style={{
          position: "absolute",
          top: BEZEL,
          left: "50%",
          transform: "translateX(-50%)",
          width: 120,
          height: 25,
          backgroundColor: "#1A1A1A",
          borderRadius: 100,
          zIndex: 10,
        }}
      />

      {/* Screen area */}
      <div
        style={{
          width: SCREEN_WIDTH,
          height: SCREEN_HEIGHT,
          overflow: "hidden",
          borderRadius: 28,
          position: "relative",
          backgroundColor: "#000000",
        }}
      >
        {children}
      </div>

      {/* Home indicator */}
      <div
        style={{
          position: "absolute",
          bottom: BEZEL - 4,
          left: "50%",
          transform: "translateX(-50%)",
          width: 100,
          height: 4,
          backgroundColor: "#4A4A4A",
          borderRadius: 100,
        }}
      />
    </div>
  );
};
