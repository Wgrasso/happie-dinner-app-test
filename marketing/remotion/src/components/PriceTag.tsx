import React from "react";
import {
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { colors } from "../theme/colors";
import { fonts } from "../theme/fonts";

interface PriceTagProps {
  price: string; // "€12,50"
  newPrice?: string; // "€3,20" (if showing discount)
  startFrame: number;
}

export const PriceTag: React.FC<PriceTagProps> = ({
  price,
  newPrice,
  startFrame,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const relFrame = Math.max(0, frame - startFrame);

  if (frame < startFrame) return null;

  // Original price fades in
  const priceOpacity = interpolate(relFrame, [0, 12], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Strikethrough line animates across
  const strikeWidth = newPrice
    ? interpolate(relFrame, [20, 35], [0, 110], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      })
    : 0;

  // New price pops in
  const newPriceScale = newPrice
    ? spring({
        frame: Math.max(0, relFrame - 30),
        fps,
        config: { damping: 10, stiffness: 180 },
      })
    : 0;

  // Savings calculation (try to parse numbers)
  const parsePrice = (p: string) => {
    const m = p.match(/[\d,\.]+/);
    return m ? parseFloat(m[0].replace(",", ".")) : 0;
  };

  const oldVal = parsePrice(price);
  const newVal = newPrice ? parsePrice(newPrice) : 0;
  const savings = oldVal - newVal;

  const savingsOpacity = newPrice
    ? interpolate(relFrame, [45, 55], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      })
    : 0;
  const savingsY = newPrice
    ? interpolate(relFrame, [45, 55], [15, 0], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      })
    : 0;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 16,
      }}
    >
      {/* Price row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 30,
        }}
      >
        {/* Original price with strikethrough */}
        <div
          style={{
            position: "relative",
            opacity: priceOpacity,
          }}
        >
          <span
            style={{
              fontFamily: fonts.heading,
              fontSize: 64,
              fontWeight: 700,
              color: newPrice ? "rgba(255,255,255,0.5)" : colors.white,
              textShadow: "0 4px 30px rgba(0,0,0,0.8), 0 2px 10px rgba(0,0,0,0.5)",
            }}
          >
            {price}
          </span>
          {/* Animated red strikethrough line */}
          {newPrice && (
            <div
              style={{
                position: "absolute",
                left: "-5%",
                top: "50%",
                width: `${strikeWidth}%`,
                height: 4,
                backgroundColor: colors.dislikeRed,
                transform: "translateY(-50%) rotate(-5deg)",
                borderRadius: 2,
                boxShadow: "0 0 10px rgba(204,68,68,0.5)",
              }}
            />
          )}
        </div>

        {/* New price */}
        {newPrice && (
          <span
            style={{
              fontFamily: fonts.heading,
              fontSize: 72,
              fontWeight: 700,
              color: colors.likeGreen,
              textShadow: "0 0 30px rgba(76,175,80,0.4), 0 4px 30px rgba(0,0,0,0.8)",
              transform: `scale(${newPriceScale})`,
              display: "inline-block",
            }}
          >
            {newPrice}
          </span>
        )}
      </div>

      {/* Savings amount */}
      {newPrice && savings > 0 && (
        <div
          style={{
            opacity: savingsOpacity,
            transform: `translateY(${savingsY}px)`,
          }}
        >
          <span
            style={{
              fontFamily: fonts.body,
              fontSize: 28,
              fontWeight: 600,
              color: colors.logoCoral,
              textShadow: "0 4px 30px rgba(0,0,0,0.8), 0 2px 10px rgba(0,0,0,0.5)",
            }}
          >
            Bespaar {"\u20AC"}
            {savings.toFixed(2).replace(".", ",")}
          </span>
        </div>
      )}
    </div>
  );
};
