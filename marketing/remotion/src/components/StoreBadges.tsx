import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { colors } from "../theme/colors";
import { fonts } from "../theme/fonts";

interface StoreBadgesProps {
  startFrame?: number;
  fadeInDuration?: number;
}

const AppleIcon: React.FC = () => (
  <svg
    width="22"
    height="22"
    viewBox="0 0 22 22"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{ flexShrink: 0 }}
  >
    {/* Simplified Apple logo shape using CSS/SVG paths */}
    <path
      d="M15.5 11.2c0-2.6 2.1-3.8 2.2-3.9-1.2-1.7-3-2-3.7-2-1.6-.2-3 .9-3.8.9-.8 0-2-.9-3.3-.9C5.3 5.3 3.5 6.4 2.5 8.2c-2 3.5-.5 8.7 1.5 11.5.9 1.4 2.1 2.9 3.6 2.8 1.4-.1 2-.9 3.7-.9s2.2.9 3.7.8c1.5 0 2.6-1.4 3.5-2.7.7-1 1.2-2 1.5-3.1-3.2-1.2-3-5.4 0-7.4z"
      fill={colors.white}
    />
    <path
      d="M13.1 3.5c.8-1 1.4-2.4 1.2-3.5-1.2.1-2.6.8-3.4 1.8-.7.9-1.4 2.3-1.2 3.4 1.3.1 2.6-.6 3.4-1.7z"
      fill={colors.white}
    />
  </svg>
);

const PlayIcon: React.FC = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 20 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{ flexShrink: 0 }}
  >
    {/* Simplified Google Play triangle */}
    <path d="M3 2L17 10L3 18V2Z" fill={colors.white} />
  </svg>
);

interface BadgeProps {
  store: "apple" | "google";
}

const Badge: React.FC<BadgeProps> = ({ store }) => {
  const isApple = store === "apple";

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        width: 160,
        height: 50,
        backgroundColor: "#1A1A1A",
        borderRadius: 10,
        border: `1.5px solid rgba(255,255,255,0.18)`,
        padding: "0 16px",
        boxSizing: "border-box",
        cursor: "pointer",
      }}
    >
      {isApple ? <AppleIcon /> : <PlayIcon />}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          lineHeight: 1.15,
        }}
      >
        <span
          style={{
            fontFamily: fonts.body,
            fontSize: 10,
            color: "rgba(255,255,255,0.75)",
            letterSpacing: "0.04em",
            textTransform: "uppercase",
            fontWeight: 400,
          }}
        >
          {isApple ? "Download on the" : "Get it on"}
        </span>
        <span
          style={{
            fontFamily: fonts.body,
            fontSize: 16,
            color: colors.white,
            fontWeight: 600,
            letterSpacing: "-0.01em",
            marginTop: 1,
          }}
        >
          {isApple ? "App Store" : "Google Play"}
        </span>
      </div>
    </div>
  );
};

export const StoreBadges: React.FC<StoreBadgesProps> = ({
  startFrame = 0,
  fadeInDuration = 15,
}) => {
  const frame = useCurrentFrame();

  const opacity = interpolate(
    frame,
    [startFrame, startFrame + fadeInDuration],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  const translateY = interpolate(
    frame,
    [startFrame, startFrame + fadeInDuration],
    [12, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
        opacity,
        transform: `translateY(${translateY}px)`,
      }}
    >
      <Badge store="apple" />
      <Badge store="google" />
    </div>
  );
};
