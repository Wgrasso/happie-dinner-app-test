interface PhoneMockupProps {
  children: React.ReactNode;
  scale?: number;
  tilt?: { x: number; y: number };
}

const BEZEL = 6;
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
        borderRadius: 36,
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transform,
        boxSizing: "border-box",
        boxShadow: "0 20px 60px rgba(0,0,0,0.5), inset 0 0 0 1px rgba(255,255,255,0.08)",
      }}
    >
      {/* Dynamic Island */}
      <div
        style={{
          position: "absolute",
          top: BEZEL + 8,
          left: "50%",
          transform: "translateX(-50%)",
          width: 90,
          height: 22,
          backgroundColor: "#000000",
          borderRadius: 100,
          zIndex: 20,
        }}
      />

      {/* Screen area */}
      <div
        style={{
          width: SCREEN_WIDTH,
          height: SCREEN_HEIGHT,
          overflow: "hidden",
          borderRadius: 30,
          position: "relative",
          backgroundColor: "#000000",
        }}
      >
        {/* Status bar */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 44,
            zIndex: 15,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 20px",
            boxSizing: "border-box",
          }}
        >
          {/* Time */}
          <span
            style={{
              fontFamily:
                '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", sans-serif',
              fontSize: 14,
              fontWeight: 600,
              color: "#2D2D2D",
              letterSpacing: "0.02em",
            }}
          >
            21:07
          </span>

          {/* Right icons: signal, wifi, battery */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
            }}
          >
            {/* Signal bars */}
            <svg width="16" height="12" viewBox="0 0 16 12">
              <rect x="0" y="8" width="3" height="4" rx="0.5" fill="#2D2D2D" />
              <rect x="4" y="5" width="3" height="7" rx="0.5" fill="#2D2D2D" />
              <rect x="8" y="2" width="3" height="10" rx="0.5" fill="#2D2D2D" />
              <rect x="12" y="0" width="3" height="12" rx="0.5" fill="#2D2D2D" />
            </svg>
            {/* WiFi */}
            <svg width="14" height="12" viewBox="0 0 14 12">
              <path
                d="M7 10.5a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4zM7 7c1.8 0 3.4.8 4.5 2l-1.3 1.3A4.2 4.2 0 007 8.8a4.2 4.2 0 00-3.2 1.5L2.5 9A5.8 5.8 0 017 7zm0-3.5c2.8 0 5.3 1.2 7 3l-1.3 1.3A7.7 7.7 0 007 5a7.7 7.7 0 00-5.7 2.8L0 6.5a9.3 9.3 0 017-3z"
                fill="#2D2D2D"
                transform="translate(0, -1)"
              />
            </svg>
            {/* Battery */}
            <svg width="24" height="12" viewBox="0 0 24 12">
              <rect
                x="0"
                y="1"
                width="20"
                height="10"
                rx="2"
                stroke="#2D2D2D"
                strokeWidth="1"
                fill="none"
              />
              <rect x="2" y="3" width="14" height="6" rx="1" fill="#2D2D2D" />
              <rect x="21" y="4" width="2" height="4" rx="1" fill="#2D2D2D" />
            </svg>
          </div>
        </div>

        {/* App content */}
        {children}
      </div>

      {/* Home indicator */}
      <div
        style={{
          position: "absolute",
          bottom: BEZEL,
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
