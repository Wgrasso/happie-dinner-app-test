import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";

interface Notification {
  sender: string;
  message: string;
  color?: string;
}

interface NotificationStackProps {
  startFrame?: number;
  notifications?: Notification[];
  width?: number;
  staggerFrames?: number;
}

const DEFAULT_NOTIFICATIONS: Notification[] = [
  { sender: "Lisa", message: "Wat eten we vanavond? 🤷", color: "#25D366" },
  { sender: "Tom", message: "Geen idee… pizza misschien?", color: "#25D366" },
  { sender: "Sarah", message: "Pasta!! 🍝🍝🍝", color: "#25D366" },
  { sender: "Groep 💬", message: "Gebruik gewoon Happie 😂", color: "#4A90D9" },
];

export const NotificationStack: React.FC<NotificationStackProps> = ({
  startFrame = 0,
  notifications = DEFAULT_NOTIFICATIONS,
  width = 320,
  staggerFrames = 14,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const localFrame = frame - startFrame;

  const NOTIF_HEIGHT = 64;
  const NOTIF_GAP = 8;
  const AVATAR_SIZE = 36;
  const totalHeight = notifications.length * (NOTIF_HEIGHT + NOTIF_GAP) + 16;

  return (
    <svg
      width={width}
      height={totalHeight}
      viewBox={`0 0 ${width} ${totalHeight}`}
    >
      <defs>
        <filter id="notifShadow" x="-5%" y="-5%" width="110%" height="125%">
          <feDropShadow dx="0" dy="3" stdDeviation="6" floodColor="rgba(0,0,0,0.25)" />
        </filter>
      </defs>

      {notifications.map((notif, i) => {
        const notifFrame = localFrame - i * staggerFrames;

        // Slide in from top
        const slideY = spring({
          frame: Math.max(0, notifFrame),
          fps,
          config: { damping: 14, stiffness: 160, mass: 0.7 },
          from: -NOTIF_HEIGHT - 20,
          to: 0,
        });

        const opacity = interpolate(notifFrame, [0, 8], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });

        const y = i * (NOTIF_HEIGHT + NOTIF_GAP) + slideY + 8;
        const accentColor = notif.color ?? "#25D366";

        // Avatar initials
        const initials = notif.sender
          .split(" ")
          .map((w) => w[0])
          .join("")
          .substring(0, 2)
          .toUpperCase();

        // Slight scale pulse on latest notification
        const isLatest = i === notifications.length - 1;
        const pulseScale =
          isLatest && notifFrame > 0 && notifFrame < 20
            ? spring({
                frame: Math.max(0, notifFrame),
                fps,
                config: { damping: 6, stiffness: 300, mass: 0.4 },
                from: 1.04,
                to: 1,
              })
            : 1;

        return (
          <g
            key={i}
            opacity={notifFrame < 0 ? 0 : opacity}
            transform={`translate(0, ${notifFrame < 0 ? -NOTIF_HEIGHT - 20 : y}) scale(${pulseScale})`}
            style={{ transformOrigin: `${width / 2}px ${NOTIF_HEIGHT / 2}px` }}
            filter="url(#notifShadow)"
          >
            {/* Background pill */}
            <rect
              x={0}
              y={0}
              width={width}
              height={NOTIF_HEIGHT}
              rx={14}
              fill="rgba(30, 30, 35, 0.95)"
            />

            {/* Left accent bar */}
            <rect
              x={0}
              y={0}
              width={4}
              height={NOTIF_HEIGHT}
              rx={14}
              fill={accentColor}
            />

            {/* Avatar circle */}
            <circle
              cx={AVATAR_SIZE / 2 + 16}
              cy={NOTIF_HEIGHT / 2}
              r={AVATAR_SIZE / 2}
              fill={accentColor}
              opacity={0.9}
            />
            <text
              x={AVATAR_SIZE / 2 + 16}
              y={NOTIF_HEIGHT / 2 + 1}
              textAnchor="middle"
              dominantBaseline="middle"
              fontFamily="'Arial', sans-serif"
              fontWeight="700"
              fontSize={13}
              fill="white"
            >
              {initials}
            </text>

            {/* App label (top right) */}
            <text
              x={width - 12}
              y={15}
              textAnchor="end"
              fontFamily="'Arial', sans-serif"
              fontSize={9}
              fill={accentColor}
              opacity={0.8}
              fontWeight="600"
            >
              WhatsApp
            </text>

            {/* Sender name */}
            <text
              x={AVATAR_SIZE + 26}
              y={23}
              fontFamily="'Arial', sans-serif"
              fontWeight="700"
              fontSize={13}
              fill="white"
            >
              {notif.sender}
            </text>

            {/* Message */}
            <text
              x={AVATAR_SIZE + 26}
              y={43}
              fontFamily="'Arial', sans-serif"
              fontSize={12}
              fill="rgba(255,255,255,0.72)"
            >
              {notif.message.length > 34
                ? notif.message.substring(0, 31) + "…"
                : notif.message}
            </text>
          </g>
        );
      })}
    </svg>
  );
};
