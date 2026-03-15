import React from "react";
import {
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from "remotion";
import { PhoneMockup } from "../PhoneMockup";
import {
  VotingScreen,
  WieEetErMeeScreen,
  ResultsScreen,
  RecipeDetailScreen,
} from "../AppScreens";
import { colors } from "../../theme/colors";
import { fonts } from "../../theme/fonts";

interface AnimatedAppUIProps {
  startFrame: number;
  sequence: "swipe-three" | "vote-result" | "wie-eet-mee" | "recipe-detail";
  recipe: {
    name: string;
    image: string;
    cookingTime: number;
    description?: string;
    ingredients?: string[];
  };
  swipeResults?: ("like" | "dislike")[];
  topThree?: { name: string; votes: number }[];
  membersEating?: number;
  totalMembers?: number;
}

const SCREEN_WIDTH = 300;
const SCREEN_HEIGHT = 620;

// ── Swipe Three Sequence ─────────────────────────────────────────────────────

const SwipeThreeSequence: React.FC<{
  recipe: AnimatedAppUIProps["recipe"];
  swipeResults: ("like" | "dislike")[];
}> = ({ recipe, swipeResults }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const results = swipeResults.length >= 3 ? swipeResults : ["like", "dislike", "like"];

  // Card timing: [0-30 static] [30-60 swipe1] [70-100 swipe2] [110-140 swipe3] [140-180 result]
  const swipeTimings = [
    { start: 30, end: 60 },
    { start: 70, end: 100 },
    { start: 110, end: 140 },
  ];

  return (
    <div style={{ position: "relative", width: SCREEN_WIDTH, height: SCREEN_HEIGHT }}>
      <VotingScreen
        recipe={{
          ...recipe,
          description: recipe.description || "",
          ingredients: recipe.ingredients || [],
        }}
      />

      {/* Swipe card overlays */}
      {swipeTimings.map((timing, i) => {
        const localFrame = frame - timing.start;
        const isActive = localFrame >= 0;
        const direction = results[i] === "like" ? 1 : -1;

        const translateX = isActive
          ? interpolate(localFrame, [0, 20], [0, direction * 400], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            })
          : 0;

        const rotation = isActive
          ? interpolate(localFrame, [0, 20], [0, direction * 15], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            })
          : 0;

        const overlayOpacity = isActive
          ? interpolate(localFrame, [0, 12], [0, 0.85], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            })
          : 0;

        // Hide after swipe completes
        const cardOpacity = isActive
          ? interpolate(localFrame, [18, 22], [1, 0], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            })
          : i === 0
          ? 1
          : 0;

        // Show this card only before its predecessor finishes swiping
        const showCard = i === 0 || frame >= swipeTimings[i - 1].start + 18;
        if (!showCard && !isActive) return null;

        const isLike = results[i] === "like";
        const labelText = isLike ? "HAPPIE!" : "NEE!";
        const overlayColor = isLike
          ? "rgba(76,175,80,0.85)"
          : "rgba(204,68,68,0.85)";

        return (
          <div
            key={i}
            style={{
              position: "absolute",
              top: 80,
              left: 24,
              width: SCREEN_WIDTH - 48,
              height: 380,
              borderRadius: 20,
              transform: `translateX(${translateX}px) rotate(${rotation}deg)`,
              opacity: cardOpacity,
              zIndex: 10 + (3 - i),
              overflow: "hidden",
            }}
          >
            {/* Swipe overlay */}
            {isActive && (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  backgroundColor: overlayColor,
                  borderRadius: 20,
                  opacity: overlayOpacity,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  zIndex: 20,
                }}
              >
                <span
                  style={{
                    fontFamily: fonts.heading,
                    fontSize: 36,
                    fontWeight: 700,
                    color: colors.white,
                    border: `4px solid ${colors.white}`,
                    padding: "8px 20px",
                    borderRadius: 8,
                    transform: `rotate(${isLike ? -12 : 12}deg)`,
                  }}
                >
                  {labelText}
                </span>
              </div>
            )}
          </div>
        );
      })}

      {/* Match result overlay at the end */}
      {frame >= 140 && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.7)",
            borderRadius: 30,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 16,
            opacity: interpolate(frame, [140, 155], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
            zIndex: 30,
          }}
        >
          <span
            style={{
              fontFamily: fonts.heading,
              fontSize: 28,
              fontWeight: 700,
              color: colors.likeGreen,
              textShadow: "0 2px 10px rgba(0,0,0,0.5)",
            }}
          >
            Match gevonden!
          </span>
          <span
            style={{
              fontFamily: fonts.heading,
              fontSize: 22,
              fontWeight: 700,
              color: colors.white,
            }}
          >
            {recipe.name}
          </span>
        </div>
      )}
    </div>
  );
};

// ── Vote Result Sequence ─────────────────────────────────────────────────────

const VoteResultSequence: React.FC<{
  recipe: AnimatedAppUIProps["recipe"];
  topThree?: { name: string; votes: number }[];
}> = ({ recipe, topThree }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const results = topThree || [
    { name: recipe.name, votes: 5 },
    { name: "Kip Teriyaki", votes: 4 },
    { name: "Shakshuka", votes: 3 },
  ];

  return (
    <div style={{ position: "relative", width: SCREEN_WIDTH, height: SCREEN_HEIGHT }}>
      <ResultsScreen
        recipe={{
          ...recipe,
          description: recipe.description || "",
          ingredients: recipe.ingredients || [],
        }}
      />

      {/* Animated card slide-ins */}
      {results.slice(0, 3).map((item, i) => {
        const slideStart = 10 + i * 25;
        const slideProgress = spring({
          frame: Math.max(0, frame - slideStart),
          fps,
          config: { damping: 12, stiffness: 120, mass: 0.8 },
          from: 0,
          to: 1,
        });

        const translateY = interpolate(slideProgress, [0, 1], [100, 0]);
        const opacity = interpolate(slideProgress, [0, 1], [0, 1]);

        // Winner glow for first place
        const glowOpacity =
          i === 0
            ? interpolate(
                Math.sin(frame * 0.1),
                [-1, 1],
                [0.05, 0.15],
              )
            : 0;

        return (
          <div
            key={i}
            style={{
              position: "absolute",
              top: 50 + i * 190,
              left: 16,
              right: 16,
              height: 170,
              transform: `translateY(${translateY}px)`,
              opacity,
              zIndex: 5,
              pointerEvents: "none",
            }}
          >
            {i === 0 && (
              <div
                style={{
                  position: "absolute",
                  inset: -4,
                  borderRadius: 24,
                  boxShadow: `0 0 30px rgba(255,215,0,${glowOpacity})`,
                  pointerEvents: "none",
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};

// ── Wie Eet Mee Sequence ─────────────────────────────────────────────────────

const WieEetMeeSequence: React.FC<{
  recipe: AnimatedAppUIProps["recipe"];
  membersEating: number;
  totalMembers: number;
}> = ({ recipe, membersEating, totalMembers }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Toggle animation at frame 15
  const toggleProgress = spring({
    frame: Math.max(0, frame - 15),
    fps,
    config: { damping: 10, stiffness: 200, mass: 0.6 },
    from: 0,
    to: 1,
  });

  // Counter ticks up
  const counterValue = Math.round(
    interpolate(frame, [25, 60], [0, membersEating], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    })
  );

  return (
    <div style={{ position: "relative", width: SCREEN_WIDTH, height: SCREEN_HEIGHT }}>
      <WieEetErMeeScreen
        recipe={{
          ...recipe,
          description: recipe.description || "",
          ingredients: recipe.ingredients || [],
        }}
        membersEating={membersEating}
        totalMembers={totalMembers}
      />

      {/* Animated toggle overlay */}
      <div
        style={{
          position: "absolute",
          top: 100,
          left: "50%",
          transform: `translateX(-50%) scale(${0.9 + toggleProgress * 0.1})`,
          zIndex: 10,
          pointerEvents: "none",
        }}
      >
        {/* Toggle slides from Nee to Ja */}
        <div
          style={{
            backgroundColor: interpolate(toggleProgress, [0, 1], [0, 1]) > 0.5
              ? "#4CAF50"
              : "#E8E2DA",
            borderRadius: 14,
            padding: "10px 28px",
            opacity: 0, // invisible overlay, the real one is rendered by WieEetErMeeScreen
          }}
        />
      </div>

      {/* Member avatars pop in */}
      {Array.from({ length: Math.min(membersEating, 8) }).map((_, i) => {
        const popStart = 30 + i * 7;
        const popScale = spring({
          frame: Math.max(0, frame - popStart),
          fps,
          config: { damping: 8, stiffness: 300, mass: 0.4 },
          from: 0,
          to: 1,
        });

        return (
          <div
            key={i}
            style={{
              position: "absolute",
              top: 195 + i * 48,
              left: 24,
              width: 36,
              height: 36,
              borderRadius: "50%",
              transform: `scale(${popScale})`,
              zIndex: 10,
              pointerEvents: "none",
            }}
          />
        );
      })}

      {/* Animated counter overlay */}
      <div
        style={{
          position: "absolute",
          top: 155,
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 10,
          pointerEvents: "none",
        }}
      >
        <span
          style={{
            fontFamily: fonts.body,
            fontSize: 15,
            fontWeight: 500,
            color: "#8B7355",
            opacity: frame > 25 ? 1 : 0,
          }}
        >
          {counterValue} van {totalMembers} eten mee
        </span>
      </div>
    </div>
  );
};

// ── Recipe Detail Sequence ───────────────────────────────────────────────────

const RecipeDetailSequence: React.FC<{
  recipe: AnimatedAppUIProps["recipe"];
}> = ({ recipe }) => {
  const frame = useCurrentFrame();

  // Slow scroll down
  const scrollY = interpolate(frame, [10, 120], [0, -150], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Step numbers pop in
  const stepPopFrames = [30, 50, 70, 90];

  return (
    <div
      style={{
        position: "relative",
        width: SCREEN_WIDTH,
        height: SCREEN_HEIGHT,
        overflow: "hidden",
      }}
    >
      <div style={{ transform: `translateY(${scrollY}px)` }}>
        <RecipeDetailScreen
          recipe={{
            ...recipe,
            description: recipe.description || "",
            ingredients: recipe.ingredients || [],
          }}
        />
      </div>

      {/* Step number pop-in overlays */}
      {stepPopFrames.map((popFrame, i) => {
        const popProgress = interpolate(frame, [popFrame, popFrame + 10], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });

        return (
          <div
            key={i}
            style={{
              position: "absolute",
              top: 380 + i * 44 + scrollY,
              left: 20,
              width: 24,
              height: 24,
              borderRadius: "50%",
              backgroundColor: "#8B7355",
              transform: `scale(${popProgress})`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 15,
              opacity: popProgress,
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
        );
      })}
    </div>
  );
};

// ── Main Component ───────────────────────────────────────────────────────────

export const AnimatedAppUI: React.FC<AnimatedAppUIProps> = ({
  startFrame,
  sequence,
  recipe,
  swipeResults = ["like", "dislike", "like"],
  topThree,
  membersEating = 6,
  totalMembers = 8,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const localFrame = frame - startFrame;

  // Phone entrance animation
  const phoneScale = spring({
    frame: Math.max(0, localFrame),
    fps,
    config: { damping: 14, stiffness: 120 },
    from: 0,
    to: 1,
  });

  const phoneY = interpolate(phoneScale, [0, 1], [80, 0]);

  let content: React.ReactNode;

  switch (sequence) {
    case "swipe-three":
      content = <SwipeThreeSequence recipe={recipe} swipeResults={swipeResults} />;
      break;
    case "vote-result":
      content = <VoteResultSequence recipe={recipe} topThree={topThree} />;
      break;
    case "wie-eet-mee":
      content = (
        <WieEetMeeSequence
          recipe={recipe}
          membersEating={membersEating}
          totalMembers={totalMembers}
        />
      );
      break;
    case "recipe-detail":
      content = <RecipeDetailSequence recipe={recipe} />;
      break;
  }

  return (
    <div
      style={{
        transform: `scale(${phoneScale}) translateY(${phoneY}px)`,
        transformOrigin: "center center",
      }}
    >
      <PhoneMockup scale={0.85}>
        {content}
      </PhoneMockup>
    </div>
  );
};
