import React from "react";
import { colors } from "../theme/colors";
import { fonts } from "../theme/fonts";

const SCREEN_WIDTH = 300;
const SCREEN_HEIGHT = 580;

// ─── HomeScreen ──────────────────────────────────────────────────────────────

export const HomeScreen: React.FC = () => (
  <div
    style={{
      width: SCREEN_WIDTH,
      height: SCREEN_HEIGHT,
      backgroundColor: colors.background,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: 24,
      padding: "40px 24px",
      boxSizing: "border-box",
    }}
  >
    {/* Logo mark */}
    <div
      style={{
        width: 72,
        height: 72,
        borderRadius: "50%",
        backgroundColor: colors.logoCoral,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 36,
      }}
    >
      🍽️
    </div>

    {/* App name */}
    <div
      style={{
        fontFamily: fonts.heading,
        fontSize: 22,
        fontWeight: 700,
        color: colors.logoCoral,
        letterSpacing: "0.02em",
      }}
    >
      Studenten Happie
    </div>

    {/* Main question */}
    <div
      style={{
        fontFamily: fonts.heading,
        fontSize: 24,
        fontWeight: 700,
        color: colors.text,
        textAlign: "center",
        lineHeight: 1.3,
      }}
    >
      Wat eten we vanavond?
    </div>

    {/* Subtitle */}
    <div
      style={{
        fontFamily: fonts.body,
        fontSize: 14,
        color: colors.textMuted,
        textAlign: "center",
        lineHeight: 1.5,
        maxWidth: 220,
      }}
    >
      Swipe samen door recepten en ontdek wat iedereen lekker vindt.
    </div>

    {/* CTA button */}
    <div
      style={{
        marginTop: 16,
        backgroundColor: colors.accent,
        borderRadius: 50,
        paddingTop: 14,
        paddingBottom: 14,
        paddingLeft: 40,
        paddingRight: 40,
      }}
    >
      <span
        style={{
          fontFamily: fonts.body,
          fontSize: 16,
          fontWeight: 600,
          color: colors.white,
        }}
      >
        Begin met swipen →
      </span>
    </div>
  </div>
);

// ─── SwipeScreen ─────────────────────────────────────────────────────────────

export const SwipeScreen: React.FC = () => (
  <div
    style={{
      width: SCREEN_WIDTH,
      height: SCREEN_HEIGHT,
      backgroundColor: colors.background,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "28px 20px 24px",
      boxSizing: "border-box",
    }}
  >
    {/* Header */}
    <div
      style={{
        fontFamily: fonts.heading,
        fontSize: 18,
        fontWeight: 700,
        color: colors.text,
        textAlign: "center",
      }}
    >
      Wat vind jij lekker?
    </div>

    {/* Card stack */}
    <div
      style={{
        position: "relative",
        width: 240,
        height: 300,
      }}
    >
      {/* Back card (offset) */}
      <div
        style={{
          position: "absolute",
          top: 8,
          left: 8,
          width: 224,
          height: 280,
          borderRadius: 20,
          backgroundColor: colors.border,
          boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
          transform: "rotate(3deg)",
        }}
      />

      {/* Front card */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: 232,
          height: 288,
          borderRadius: 20,
          overflow: "hidden",
          boxShadow: "0 8px 24px rgba(0,0,0,0.14)",
        }}
      >
        {/* Food image placeholder — gradient fallback */}
        <div
          style={{
            width: "100%",
            height: "70%",
            background: `linear-gradient(135deg, #E8C99A 0%, #C4956A 50%, #A06840 100%)`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 52,
          }}
        >
          🍝
        </div>

        {/* Meal name */}
        <div
          style={{
            backgroundColor: colors.white,
            padding: "12px 16px",
            height: "30%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            boxSizing: "border-box",
          }}
        >
          <div
            style={{
              fontFamily: fonts.heading,
              fontSize: 16,
              fontWeight: 700,
              color: colors.text,
            }}
          >
            Pasta Carbonara
          </div>
          <div
            style={{
              fontFamily: fonts.body,
              fontSize: 12,
              color: colors.textMuted,
              marginTop: 2,
            }}
          >
            €2,80 · 20 min
          </div>
        </div>
      </div>
    </div>

    {/* Hint text */}
    <div
      style={{
        fontFamily: fonts.body,
        fontSize: 13,
        color: colors.textMuted,
        textAlign: "center",
      }}
    >
      Swipe rechts als je het lekker vindt
    </div>

    {/* Like / Dislike buttons */}
    <div
      style={{
        display: "flex",
        gap: 40,
        alignItems: "center",
      }}
    >
      {/* Dislike */}
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: "50%",
          backgroundColor: colors.dislikeRed,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 24,
          boxShadow: "0 4px 12px rgba(204,68,68,0.35)",
        }}
      >
        ✕
      </div>

      {/* Like */}
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: "50%",
          backgroundColor: colors.likeGreen,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 24,
          boxShadow: "0 4px 12px rgba(76,175,80,0.35)",
        }}
      >
        ♥
      </div>
    </div>
  </div>
);

// ─── ResultScreen ─────────────────────────────────────────────────────────────

export const ResultScreen: React.FC = () => (
  <div
    style={{
      width: SCREEN_WIDTH,
      height: SCREEN_HEIGHT,
      backgroundColor: colors.background,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: 20,
      padding: "40px 24px",
      boxSizing: "border-box",
    }}
  >
    {/* Celebration */}
    <div style={{ fontSize: 64 }}>🎉</div>

    {/* Header */}
    <div
      style={{
        fontFamily: fonts.heading,
        fontSize: 20,
        fontWeight: 700,
        color: colors.text,
        textAlign: "center",
      }}
    >
      Vanavond eten we:
    </div>

    {/* Meal name — large, accented */}
    <div
      style={{
        fontFamily: fonts.heading,
        fontSize: 28,
        fontWeight: 700,
        color: colors.accent,
        textAlign: "center",
        lineHeight: 1.2,
      }}
    >
      Pasta Carbonara
    </div>

    {/* Checkmark badge */}
    <div
      style={{
        width: 56,
        height: 56,
        borderRadius: "50%",
        backgroundColor: colors.likeGreen,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 28,
        color: colors.white,
        fontWeight: 700,
      }}
    >
      ✓
    </div>

    {/* Subtitle */}
    <div
      style={{
        fontFamily: fonts.body,
        fontSize: 15,
        color: colors.textMuted,
        textAlign: "center",
        fontStyle: "italic",
      }}
    >
      Iedereen is het eens!
    </div>

    {/* Divider */}
    <div
      style={{
        width: 60,
        height: 2,
        backgroundColor: colors.border,
        borderRadius: 2,
      }}
    />

    {/* Next step */}
    <div
      style={{
        fontFamily: fonts.body,
        fontSize: 13,
        color: colors.textMuted,
        textAlign: "center",
      }}
    >
      Bekijk de boodschappenlijst →
    </div>
  </div>
);

// ─── BoodschappenScreen ───────────────────────────────────────────────────────

const groceryItems: { label: string; checked: boolean }[] = [
  { label: "Spaghetti (500g)", checked: true },
  { label: "Pancetta (150g)", checked: true },
  { label: "Eieren (4x)", checked: false },
  { label: "Parmezaan (geraspt)", checked: false },
  { label: "Zwarte peper", checked: true },
];

export const BoodschappenScreen: React.FC = () => (
  <div
    style={{
      width: SCREEN_WIDTH,
      height: SCREEN_HEIGHT,
      backgroundColor: colors.background,
      display: "flex",
      flexDirection: "column",
      padding: "32px 24px",
      boxSizing: "border-box",
      gap: 20,
    }}
  >
    {/* Header */}
    <div
      style={{
        fontFamily: fonts.heading,
        fontSize: 22,
        fontWeight: 700,
        color: colors.text,
      }}
    >
      Boodschappenlijst
    </div>

    {/* Meal context */}
    <div
      style={{
        fontFamily: fonts.body,
        fontSize: 13,
        color: colors.textMuted,
      }}
    >
      voor Pasta Carbonara
    </div>

    {/* Items */}
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 12,
        flex: 1,
      }}
    >
      {groceryItems.map((item, i) => (
        <div
          key={i}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            paddingTop: 12,
            paddingBottom: 12,
            paddingLeft: 14,
            paddingRight: 14,
            backgroundColor: colors.white,
            borderRadius: 12,
            boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
          }}
        >
          {/* Checkbox */}
          <div
            style={{
              width: 22,
              height: 22,
              borderRadius: 6,
              border: `2px solid ${item.checked ? colors.likeGreen : colors.border}`,
              backgroundColor: item.checked ? colors.likeGreen : "transparent",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            {item.checked && (
              <span
                style={{
                  color: colors.white,
                  fontSize: 13,
                  fontWeight: 700,
                  lineHeight: 1,
                }}
              >
                ✓
              </span>
            )}
          </div>

          {/* Label */}
          <span
            style={{
              fontFamily: fonts.body,
              fontSize: 14,
              color: item.checked ? colors.textMuted : colors.text,
              textDecoration: item.checked ? "line-through" : "none",
            }}
          >
            {item.label}
          </span>
        </div>
      ))}
    </div>

    {/* Progress hint */}
    <div
      style={{
        fontFamily: fonts.body,
        fontSize: 13,
        color: colors.textMuted,
        textAlign: "center",
      }}
    >
      3 van 5 items gekocht
    </div>
  </div>
);
