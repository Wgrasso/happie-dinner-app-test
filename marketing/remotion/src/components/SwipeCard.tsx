import React, { useState } from "react";
import { Img, staticFile } from "remotion";
import { colors } from "../theme/colors";
import { fonts } from "../theme/fonts";

interface SwipeCardProps {
  meal: { naam: string; foto: string };
  style?: React.CSSProperties;
}

export const SwipeCard: React.FC<SwipeCardProps> = ({ meal, style }) => {
  const [imgError, setImgError] = useState(false);

  return (
    <div
      style={{
        width: 340,
        height: 420,
        borderRadius: 20,
        background: colors.background,
        border: "1px solid rgba(139, 115, 85, 0.1)",
        boxShadow: "0 8px 20px rgba(139, 115, 85, 0.15)",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        ...style,
      }}
    >
      {/* Image area — 60% */}
      <div style={{ position: "relative", width: "100%", height: "60%" }}>
        {/* Fallback gradient behind the image */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: `linear-gradient(135deg, ${colors.logoCoral}, ${colors.accent})`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <span
            style={{
              fontFamily: fonts.heading,
              fontSize: 18,
              fontWeight: 700,
              color: colors.white,
              textAlign: "center",
              padding: "0 16px",
            }}
          >
            {meal.naam}
          </span>
        </div>

        {/* Actual image rendered on top; hidden once error fires */}
        {!imgError && (
          <Img
            src={staticFile(`meals/${meal.foto}`)}
            onError={() => setImgError(true)}
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
        )}
      </div>

      {/* Info area — 40% */}
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "0 20px",
        }}
      >
        <span
          style={{
            fontFamily: fonts.heading,
            fontSize: 22,
            fontWeight: 700,
            color: colors.text,
            textAlign: "center",
            lineHeight: 1.3,
          }}
        >
          {meal.naam}
        </span>
      </div>
    </div>
  );
};
