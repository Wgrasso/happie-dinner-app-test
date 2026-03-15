import React from "react";
import {
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { fonts } from "../theme/fonts";

interface NotificationBubbleProps {
  text: string;
  appName?: string; // "WhatsApp" or "Happie"
  startFrame: number;
  icon?: "whatsapp" | "happie";
}

export const NotificationBubble: React.FC<NotificationBubbleProps> = ({
  text,
  appName = "WhatsApp",
  startFrame,
  icon = "whatsapp",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const relFrame = frame - startFrame;

  // Don't render before startFrame or after auto-hide
  if (relFrame < 0 || relFrame > 80) return null;

  // Slide down from top with spring
  const slideIn = spring({
    frame: Math.max(0, relFrame),
    fps,
    config: { damping: 14, stiffness: 160 },
  });
  const slideOut = interpolate(relFrame, [55, 70], [0, -120], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const fadeOut = interpolate(relFrame, [55, 70], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const translateY = interpolate(slideIn, [0, 1], [-120, 20]) + slideOut;

  const iconColor = icon === "whatsapp" ? "#25D366" : "#F4845F";
  const iconLetter = icon === "whatsapp" ? "W" : "H";

  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: "50%",
        transform: `translateX(-50%) translateY(${translateY}px)`,
        opacity: fadeOut,
        zIndex: 100,
        width: 900,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 16,
          padding: "18px 24px",
          borderRadius: 20,
          backgroundColor: "rgba(30, 30, 30, 0.92)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          border: "1px solid rgba(255,255,255,0.1)",
          boxShadow: "0 10px 40px rgba(0,0,0,0.5)",
        }}
      >
        {/* App icon */}
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 10,
            backgroundColor: iconColor,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <span
            style={{
              fontFamily: fonts.heading,
              fontSize: 22,
              fontWeight: 700,
              color: "#FFFFFF",
            }}
          >
            {iconLetter}
          </span>
        </div>

        {/* Text content */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 2,
            flex: 1,
            minWidth: 0,
          }}
        >
          <span
            style={{
              fontFamily: fonts.body,
              fontSize: 16,
              fontWeight: 600,
              color: "rgba(255,255,255,0.6)",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            {appName}
          </span>
          <span
            style={{
              fontFamily: fonts.body,
              fontSize: 22,
              fontWeight: 500,
              color: "#FFFFFF",
              lineHeight: 1.3,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {text}
          </span>
        </div>

        {/* Time indicator */}
        <span
          style={{
            fontFamily: fonts.body,
            fontSize: 14,
            color: "rgba(255,255,255,0.4)",
            flexShrink: 0,
          }}
        >
          nu
        </span>
      </div>
    </div>
  );
};
