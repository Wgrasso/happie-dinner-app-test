import React from "react";
import { Img, staticFile } from "remotion";
import { colors } from "../theme/colors";
import { fonts } from "../theme/fonts";

// ─── Shared types ────────────────────────────────────────────────────────────

export interface AppScreenProps {
  recipe: {
    name: string;
    image: string; // local filename in public/meals/
    cookingTime: number;
    description: string;
    ingredients: string[];
  };
  groupName?: string;
  membersEating?: number;
  totalMembers?: number;
}

const SCREEN_WIDTH = 300;
const SCREEN_HEIGHT = 620;

// ─── VotingScreen (swipe screen) ─────────────────────────────────────────────

export const VotingScreen: React.FC<AppScreenProps> = ({
  recipe,
  groupName = "Huishouden",
}) => {
  const cardWidth = SCREEN_WIDTH - 48;
  const cardHeight = 380;

  return (
    <div
      style={{
        width: SCREEN_WIDTH,
        height: SCREEN_HEIGHT,
        backgroundColor: colors.background,
        display: "flex",
        flexDirection: "column",
        padding: "16px 0 20px",
        boxSizing: "border-box",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 8,
          padding: "0 24px 12px",
        }}
      >
        <span
          style={{
            fontFamily: fonts.heading,
            fontSize: 16,
            fontWeight: 700,
            color: colors.text,
          }}
        >
          {groupName}
        </span>
        {/* Progress bar */}
        <div
          style={{
            width: 120,
            height: 4,
            backgroundColor: colors.border,
            borderRadius: 2,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: "40%",
              height: "100%",
              backgroundColor: "#8B7355",
              borderRadius: 2,
            }}
          />
        </div>
      </div>

      {/* Card stack area */}
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          padding: "0 24px",
        }}
      >
        {/* Back card */}
        <div
          style={{
            position: "absolute",
            width: cardWidth,
            height: cardHeight,
            borderRadius: 20,
            backgroundColor: colors.background,
            boxShadow: "0 8px 20px rgba(139,115,85,0.1)",
            transform: "scale(0.90)",
            top: "calc(50% - 178px)",
            marginTop: 12,
            opacity: 0.4,
          }}
        />
        {/* Middle card */}
        <div
          style={{
            position: "absolute",
            width: cardWidth,
            height: cardHeight,
            borderRadius: 20,
            backgroundColor: colors.background,
            boxShadow: "0 8px 20px rgba(139,115,85,0.12)",
            transform: "scale(0.95)",
            top: "calc(50% - 178px)",
            marginTop: 6,
            opacity: 0.7,
          }}
        />
        {/* Front card */}
        <div
          style={{
            position: "relative",
            width: cardWidth,
            height: cardHeight,
            borderRadius: 20,
            backgroundColor: colors.background,
            boxShadow: "0 8px 20px rgba(139,115,85,0.15)",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Photo top 60% */}
          <div
            style={{
              width: "100%",
              height: "60%",
              position: "relative",
              overflow: "hidden",
              borderRadius: "20px 20px 0 0",
            }}
          >
            <Img
              src={staticFile(`meals/${recipe.image}`)}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            />
          </div>
          {/* Info bottom 40% */}
          <div
            style={{
              flex: 1,
              padding: "14px 18px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              gap: 4,
            }}
          >
            <span
              style={{
                fontFamily: fonts.heading,
                fontSize: 22,
                fontWeight: 700,
                color: "#2D2D2D",
                lineHeight: 1.2,
              }}
            >
              {recipe.name}
            </span>
            <span
              style={{
                fontFamily: fonts.body,
                fontSize: 14,
                fontWeight: 500,
                color: "#8B7355",
              }}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" style={{ display: "inline-block", verticalAlign: "middle", marginRight: 4 }}>
                <circle cx="7" cy="7" r="6" stroke="#8B7355" strokeWidth="1.5" fill="none" />
                <line x1="7" y1="3" x2="7" y2="7" stroke="#8B7355" strokeWidth="1.5" strokeLinecap="round" />
                <line x1="7" y1="7" x2="10" y2="7" stroke="#8B7355" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              {recipe.cookingTime} min
            </span>
            <span
              style={{
                fontFamily: fonts.body,
                fontSize: 14,
                fontWeight: 400,
                color: "#6B6B6B",
                lineHeight: 1.4,
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {recipe.description}
            </span>
          </div>
        </div>
      </div>

      {/* Bottom buttons */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: 24,
          padding: "12px 24px 0",
        }}
      >
        <div
          style={{
            backgroundColor: "#CC4444",
            borderRadius: 12,
            padding: "16px 32px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <span
            style={{
              fontFamily: fonts.body,
              fontSize: 16,
              fontWeight: 700,
              color: colors.white,
            }}
          >
            Nee
          </span>
        </div>
        <div
          style={{
            backgroundColor: "#8B7355",
            borderRadius: 12,
            padding: "16px 32px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <span
            style={{
              fontFamily: fonts.body,
              fontSize: 16,
              fontWeight: 700,
              color: colors.white,
            }}
          >
            Ja!
          </span>
        </div>
      </div>
    </div>
  );
};

// ─── VotingScreenWithOverlay (swipe in progress) ─────────────────────────────

export const VotingScreenLiked: React.FC<AppScreenProps> = (props) => {
  return (
    <div style={{ position: "relative", width: SCREEN_WIDTH, height: SCREEN_HEIGHT }}>
      <VotingScreen {...props} />
      {/* Right swipe overlay */}
      <div
        style={{
          position: "absolute",
          top: 80,
          left: 24,
          width: SCREEN_WIDTH - 48,
          height: 380,
          borderRadius: 20,
          backgroundColor: "rgba(76,175,80,0.85)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <span
          style={{
            fontFamily: fonts.body,
            fontSize: 42,
            fontWeight: 700,
            color: colors.white,
            transform: "rotate(-12deg)",
          }}
        >
          HAPPIE!
        </span>
      </div>
    </div>
  );
};

export const VotingScreenDisliked: React.FC<AppScreenProps> = (props) => {
  return (
    <div style={{ position: "relative", width: SCREEN_WIDTH, height: SCREEN_HEIGHT }}>
      <VotingScreen {...props} />
      {/* Left swipe overlay */}
      <div
        style={{
          position: "absolute",
          top: 80,
          left: 24,
          width: SCREEN_WIDTH - 48,
          height: 380,
          borderRadius: 20,
          backgroundColor: "rgba(244,67,54,0.85)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <span
          style={{
            fontFamily: fonts.body,
            fontSize: 42,
            fontWeight: 700,
            color: colors.white,
            transform: "rotate(12deg)",
          }}
        >
          NEE!
        </span>
      </div>
    </div>
  );
};

// ─── WieEetErMeeScreen ───────────────────────────────────────────────────────

const memberData = [
  { initials: "WG", color: "#8B7355" },
  { initials: "SJ", color: "#4CAF50" },
  { initials: "MK", color: "#F4845F" },
  { initials: "RV", color: "#5C6BC0" },
  { initials: "JD", color: "#FF9800" },
  { initials: "LP", color: "#26A69A" },
  { initials: "TB", color: "#AB47BC" },
  { initials: "AH", color: "#EF5350" },
];

export const WieEetErMeeScreen: React.FC<AppScreenProps> = ({
  membersEating = 6,
  totalMembers = 8,
}) => {
  return (
    <div
      style={{
        width: SCREEN_WIDTH,
        height: SCREEN_HEIGHT,
        backgroundColor: colors.background,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "40px 24px",
        boxSizing: "border-box",
        gap: 28,
      }}
    >
      {/* Title */}
      <span
        style={{
          fontFamily: fonts.heading,
          fontSize: 24,
          fontWeight: 700,
          color: colors.text,
          textAlign: "center",
        }}
      >
        Eet je vanavond mee?
      </span>

      {/* YES/NO toggle */}
      <div
        style={{
          backgroundColor: "#F0EDE8",
          borderRadius: 14,
          padding: 3,
          display: "flex",
          gap: 0,
        }}
      >
        <div
          style={{
            backgroundColor: "transparent",
            borderRadius: 11,
            padding: "10px 28px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <span
            style={{
              fontFamily: fonts.body,
              fontSize: 14,
              fontWeight: 600,
              color: "#8B8885",
            }}
          >
            Nee
          </span>
        </div>
        <div
          style={{
            backgroundColor: "#4CAF50",
            borderRadius: 11,
            padding: "10px 28px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <span
            style={{
              fontFamily: fonts.body,
              fontSize: 14,
              fontWeight: 600,
              color: colors.white,
            }}
          >
            Ja!
          </span>
        </div>
      </div>

      {/* Subtitle */}
      <span
        style={{
          fontFamily: fonts.body,
          fontSize: 15,
          fontWeight: 500,
          color: "#8B7355",
        }}
      >
        {membersEating} van {totalMembers} eten mee
      </span>

      {/* Member list */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 12,
          width: "100%",
        }}
      >
        {memberData.map((member, i) => {
          const isEating = i < membersEating;
          return (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "8px 14px",
                backgroundColor: colors.white,
                borderRadius: 12,
                boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
              }}
            >
              {/* Avatar */}
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  backgroundColor: member.color,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <span
                  style={{
                    fontFamily: fonts.body,
                    fontSize: 13,
                    fontWeight: 700,
                    color: colors.white,
                  }}
                >
                  {member.initials}
                </span>
              </div>
              <span
                style={{
                  fontFamily: fonts.body,
                  fontSize: 14,
                  fontWeight: 500,
                  color: isEating ? colors.text : "#8B8885",
                  flex: 1,
                }}
              >
                {member.initials}
              </span>
              <span
                style={{
                  fontFamily: fonts.body,
                  fontSize: 13,
                  fontWeight: 600,
                  color: isEating ? "#4CAF50" : "#FF9800",
                }}
              >
                {isEating ? "Eet mee" : "Niet"}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ─── ResultsScreen (top 3 winners) ───────────────────────────────────────────

interface ResultRecipe {
  name: string;
  image: string;
  likes: number;
  dislikes: number;
}

const defaultResults: ResultRecipe[] = [
  { name: "Pasta Carbonara", image: "carbonara.jpg", likes: 5, dislikes: 1 },
  { name: "Kip Teriyaki", image: "teriyaki.jpg", likes: 4, dislikes: 2 },
  { name: "Shakshuka", image: "shakshuka.jpg", likes: 3, dislikes: 3 },
];

const rankColors = ["#FFD700", "#C0C0C0", "#CD7F32"];
const rankLabels = ["1e plaats", "2e plaats", "3e plaats"];

export const ResultsScreen: React.FC<
  AppScreenProps & { results?: ResultRecipe[] }
> = ({ recipe, results }) => {
  const items = results || [
    { name: recipe.name, image: recipe.image, likes: 5, dislikes: 1 },
    ...defaultResults.slice(1),
  ];

  return (
    <div
      style={{
        width: SCREEN_WIDTH,
        height: SCREEN_HEIGHT,
        backgroundColor: colors.background,
        display: "flex",
        flexDirection: "column",
        padding: "24px 16px",
        boxSizing: "border-box",
        gap: 14,
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <span
        style={{
          fontFamily: fonts.heading,
          fontSize: 20,
          fontWeight: 700,
          color: colors.text,
          textAlign: "center",
        }}
      >
        Resultaten
      </span>

      {/* Result cards */}
      {items.slice(0, 3).map((item, i) => {
        const total = item.likes + item.dislikes;
        const likePercent = total > 0 ? (item.likes / total) * 100 : 50;

        return (
          <div
            key={i}
            style={{
              backgroundColor: colors.background,
              borderRadius: 20,
              boxShadow: "0 8px 20px rgba(139,115,85,0.15)",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              flex: 1,
              minHeight: 0,
            }}
          >
            {/* Meal image */}
            <div
              style={{
                height: 100,
                position: "relative",
                overflow: "hidden",
              }}
            >
              <Img
                src={staticFile(`meals/${item.image}`)}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
              />
              {/* Rank badge */}
              <div
                style={{
                  position: "absolute",
                  top: 8,
                  left: 8,
                  backgroundColor: rankColors[i],
                  borderRadius: 8,
                  padding: "4px 10px",
                }}
              >
                <span
                  style={{
                    fontFamily: fonts.body,
                    fontSize: 11,
                    fontWeight: 700,
                    color: i === 0 ? "#5D4E00" : colors.white,
                  }}
                >
                  {rankLabels[i]}
                </span>
              </div>
            </div>
            {/* Info */}
            <div
              style={{
                padding: "10px 14px",
                display: "flex",
                flexDirection: "column",
                gap: 6,
              }}
            >
              <span
                style={{
                  fontFamily: fonts.heading,
                  fontSize: 16,
                  fontWeight: 700,
                  color: colors.text,
                }}
              >
                {item.name}
              </span>
              {/* Vote stats */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <span
                  style={{
                    fontFamily: fonts.body,
                    fontSize: 12,
                    color: "#4CAF50",
                    fontWeight: 600,
                  }}
                >
                  {item.likes}
                </span>
                {/* Progress bar */}
                <div
                  style={{
                    flex: 1,
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: "#CC4444",
                    overflow: "hidden",
                    display: "flex",
                  }}
                >
                  <div
                    style={{
                      width: `${likePercent}%`,
                      height: "100%",
                      backgroundColor: "#8B7355",
                      borderRadius: 3,
                    }}
                  />
                </div>
                <span
                  style={{
                    fontFamily: fonts.body,
                    fontSize: 12,
                    color: "#CC4444",
                    fontWeight: 600,
                  }}
                >
                  {item.dislikes}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ─── RecipeDetailScreen ──────────────────────────────────────────────────────

export const RecipeDetailScreen: React.FC<AppScreenProps> = ({ recipe }) => {
  const steps = [
    "Kook de pasta volgens de verpakking.",
    "Bak de pancetta knapperig in een pan.",
    "Klop eieren met geraspte parmezaan.",
    "Meng de hete pasta met het eiermengsel.",
    "Voeg de pancetta toe en serveer direct.",
  ];

  return (
    <div
      style={{
        width: SCREEN_WIDTH,
        height: SCREEN_HEIGHT,
        backgroundColor: colors.background,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* Hero image */}
      <div style={{ width: "100%", height: 200, position: "relative" }}>
        <Img
          src={staticFile(`meals/${recipe.image}`)}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />
      </div>

      {/* Content */}
      <div
        style={{
          flex: 1,
          padding: "20px 20px 16px",
          display: "flex",
          flexDirection: "column",
          gap: 16,
          overflow: "hidden",
        }}
      >
        {/* Title */}
        <span
          style={{
            fontFamily: fonts.heading,
            fontSize: 26,
            fontWeight: 700,
            color: colors.text,
          }}
        >
          {recipe.name}
        </span>

        {/* Ingredients section */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <span
            style={{
              fontFamily: fonts.body,
              fontSize: 12,
              fontWeight: 400,
              color: "#8B7355",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
            }}
          >
            Ingredi&euml;nten
          </span>
          {recipe.ingredients.slice(0, 5).map((item, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                paddingBottom: 4,
                borderBottom: "1px solid rgba(139,115,85,0.1)",
              }}
            >
              <div
                style={{
                  width: 4,
                  height: 4,
                  borderRadius: "50%",
                  backgroundColor: "#8B7355",
                  flexShrink: 0,
                }}
              />
              <span
                style={{
                  fontFamily: fonts.body,
                  fontSize: 13,
                  color: colors.text,
                }}
              >
                {item}
              </span>
            </div>
          ))}
        </div>

        {/* Steps section */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <span
            style={{
              fontFamily: fonts.body,
              fontSize: 12,
              fontWeight: 400,
              color: "#8B7355",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
            }}
          >
            Bereidingswijze
          </span>
          {steps.slice(0, 4).map((step, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 10,
              }}
            >
              {/* Step number circle */}
              <div
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: "50%",
                  backgroundColor: "#8B7355",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <span
                  style={{
                    fontFamily: fonts.body,
                    fontSize: 12,
                    fontWeight: 700,
                    color: colors.white,
                  }}
                >
                  {i + 1}
                </span>
              </div>
              <span
                style={{
                  fontFamily: fonts.body,
                  fontSize: 13,
                  color: colors.text,
                  lineHeight: 1.5,
                  flex: 1,
                }}
              >
                {step}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
