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
// Cards are separate positioned elements that MOVE with translateX + rotation.
// Next card scales up from 0.95 when the previous exits.

const SwipeThreeSequence: React.FC<{
  recipe: AnimatedAppUIProps["recipe"];
  swipeResults: ("like" | "dislike")[];
}> = ({ recipe, swipeResults }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const results = swipeResults.length >= 3 ? swipeResults : ["like", "dislike", "like"];

  // Tighter timing for faster pacing
  const swipeTimings = [
    { start: 20, end: 45 },
    { start: 55, end: 80 },
    { start: 90, end: 115 },
  ];

  const cardNames = [recipe.name, "Kip Teriyaki", "Shakshuka"];
  const cardColors = ["#E8D5C4", "#D4E8D4", "#E8D4D4"];

  return (
    <div style={{ position: "relative", width: SCREEN_WIDTH, height: SCREEN_HEIGHT }}>
      <VotingScreen
        recipe={{
          ...recipe,
          description: recipe.description || "",
          ingredients: recipe.ingredients || [],
        }}
      />

      {/* Render cards in reverse order (bottom card first) so z-order is correct */}
      {[...swipeTimings].reverse().map((timing, reverseI) => {
        const i = swipeTimings.length - 1 - reverseI;
        const localFrame = frame - timing.start;
        const isActive = localFrame >= 0;
        const direction = results[i] === "like" ? 1 : -1;

        // Card movement: translateX with rotation
        const translateX = isActive
          ? interpolate(localFrame, [0, 18], [0, direction * 420], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            })
          : 0;

        const rotation = isActive
          ? interpolate(localFrame, [0, 18], [0, direction * 20], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            })
          : 0;

        // Next card underneath scales up when this card exits
        const prevSwipeEnd = i > 0 ? swipeTimings[i - 1].start + 18 : 0;
        const scaleUp = i > 0
          ? interpolate(frame, [prevSwipeEnd, prevSwipeEnd + 8], [0.95, 1.0], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            })
          : 1;

        // Like/dislike overlay opacity
        const overlayOpacity = isActive
          ? interpolate(localFrame, [0, 10], [0, 0.9], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            })
          : 0;

        // Hide after swipe
        const cardOpacity = isActive
          ? interpolate(localFrame, [16, 20], [1, 0], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            })
          : i === 0
          ? 1
          : frame >= (i > 0 ? swipeTimings[i - 1].start + 16 : 0) ? 1 : 0;

        const isLike = results[i] === "like";
        const labelText = isLike ? "HAPPIE!" : "NEE!";
        const overlayColor = isLike
          ? "rgba(76,175,80,0.9)"
          : "rgba(204,68,68,0.9)";

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
              backgroundColor: cardColors[i],
              transform: `translateX(${translateX}px) rotate(${rotation}deg) scale(${scaleUp})`,
              opacity: cardOpacity,
              zIndex: 10 + (3 - i),
              overflow: "hidden",
              boxShadow: "0 8px 30px rgba(0,0,0,0.3)",
            }}
          >
            {/* Card content */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                height: "100%",
                padding: 16,
              }}
            >
              <span
                style={{
                  fontFamily: fonts.heading,
                  fontSize: 22,
                  fontWeight: 700,
                  color: "#2D2D2D",
                  textAlign: "center",
                }}
              >
                {cardNames[i]}
              </span>
              <span
                style={{
                  fontFamily: fonts.body,
                  fontSize: 14,
                  color: "#8B8885",
                  marginTop: 8,
                }}
              >
                {recipe.cookingTime} min
              </span>
            </div>

            {/* Swipe overlay */}
            {isActive && overlayOpacity > 0 && (
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

      {/* Match result overlay */}
      {frame >= 120 && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.75)",
            borderRadius: 30,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 16,
            opacity: interpolate(frame, [120, 132], [0, 1], {
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
              transform: `scale(${spring({
                frame: Math.max(0, frame - 125),
                fps: 30,
                config: { damping: 8, stiffness: 200 },
              })})`,
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
// Progress bars FILL from 0% to final width. Gold badge has shine sweep.

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

  const maxVotes = Math.max(...results.map((r) => r.votes));

  return (
    <div style={{ position: "relative", width: SCREEN_WIDTH, height: SCREEN_HEIGHT }}>
      <ResultsScreen
        recipe={{
          ...recipe,
          description: recipe.description || "",
          ingredients: recipe.ingredients || [],
        }}
      />

      {/* Animated progress bars and badges */}
      {results.slice(0, 3).map((item, i) => {
        const barStart = 15 + i * 20;
        const barProgress = spring({
          frame: Math.max(0, frame - barStart),
          fps,
          config: { damping: 14, stiffness: 80 },
        });

        const barWidth = barProgress * (item.votes / maxVotes) * 100;
        const isWinner = i === 0;

        // Gold badge shine sweep for winner
        const shineX = isWinner
          ? interpolate(frame, [60, 90], [-100, 200], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            })
          : -100;

        return (
          <div
            key={i}
            style={{
              position: "absolute",
              top: 80 + i * 170,
              left: 16,
              right: 16,
              zIndex: 5,
              pointerEvents: "none",
            }}
          >
            {/* Bar container */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 6,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span
                  style={{
                    fontFamily: fonts.body,
                    fontSize: 14,
                    fontWeight: isWinner ? 700 : 500,
                    color: isWinner ? "#8B7355" : "#8B8885",
                  }}
                >
                  {item.name}
                </span>
                <span
                  style={{
                    fontFamily: fonts.body,
                    fontSize: 14,
                    fontWeight: 700,
                    color: isWinner ? colors.logoCoral : "#8B8885",
                    opacity: barProgress,
                  }}
                >
                  {item.votes} stemmen
                </span>
              </div>
              <div
                style={{
                  width: "100%",
                  height: 12,
                  borderRadius: 6,
                  backgroundColor: "rgba(139,115,85,0.1)",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${barWidth}%`,
                    height: "100%",
                    borderRadius: 6,
                    backgroundColor: isWinner ? colors.logoCoral : "#C4B8A8",
                    position: "relative",
                    overflow: "hidden",
                  }}
                >
                  {/* Shine sweep */}
                  {isWinner && (
                    <div
                      style={{
                        position: "absolute",
                        top: 0,
                        left: `${shineX}%`,
                        width: 40,
                        height: "100%",
                        background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent)",
                      }}
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Gold badge for winner */}
            {isWinner && frame >= 50 && (
              <div
                style={{
                  position: "absolute",
                  top: -10,
                  right: 0,
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  backgroundColor: "#FFD700",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 2px 10px rgba(255,215,0,0.5)",
                  transform: `scale(${spring({
                    frame: Math.max(0, frame - 50),
                    fps,
                    config: { damping: 8, stiffness: 300 },
                  })})`,
                  overflow: "hidden",
                }}
              >
                <span style={{ fontSize: 14 }}>🏆</span>
                {/* Shine sweep on badge */}
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    left: `${shineX}%`,
                    width: 15,
                    height: "100%",
                    background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.7), transparent)",
                  }}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

// ── Wie Eet Mee Sequence ─────────────────────────────────────────────────────
// YES toggle visually CLICKS (scale 0.95 -> 1.0 + color change).
// Member count ticks up frame by frame.

const WieEetMeeSequence: React.FC<{
  recipe: AnimatedAppUIProps["recipe"];
  membersEating: number;
  totalMembers: number;
}> = ({ recipe, membersEating, totalMembers }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Toggle click at frame 15: scale down then back up
  const toggleClickScale = frame >= 15 && frame < 25
    ? interpolate(frame, [15, 18, 25], [1, 0.92, 1.0], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      })
    : frame >= 25
    ? 1
    : 1;

  // Color transition from gray to green
  const toggleColorProgress = interpolate(frame, [15, 22], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const toggleBg = toggleColorProgress > 0.5 ? "#4CAF50" : "#E8E2DA";
  const toggleText = toggleColorProgress > 0.5 ? colors.white : "#8B8885";
  const toggleLabel = toggleColorProgress > 0.5 ? "Ja, ik eet mee!" : "Nee";

  // Counter ticks up one by one (not smooth)
  const counterValue = Math.min(
    membersEating,
    Math.max(0, Math.floor(
      interpolate(frame, [28, 28 + membersEating * 5], [0, membersEating], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      })
    ))
  );

  // Each tick triggers a micro-bounce on the counter
  const lastTickFrame = 28 + counterValue * 5;
  const tickBounce = frame >= 28
    ? spring({
        frame: Math.max(0, frame - lastTickFrame),
        fps,
        config: { damping: 6, stiffness: 400, mass: 0.3 },
      })
    : 1;
  const counterScale = frame >= 28
    ? interpolate(tickBounce, [0, 0.5, 1], [1, 1.15, 1])
    : 0;

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
          top: 95,
          left: "50%",
          transform: `translateX(-50%) scale(${toggleClickScale})`,
          zIndex: 10,
        }}
      >
        <div
          style={{
            backgroundColor: toggleBg,
            borderRadius: 14,
            padding: "10px 28px",
            transition: "none",
            boxShadow: toggleColorProgress > 0.5
              ? "0 2px 12px rgba(76,175,80,0.4)"
              : "none",
          }}
        >
          <span
            style={{
              fontFamily: fonts.body,
              fontSize: 14,
              fontWeight: 600,
              color: toggleText,
            }}
          >
            {toggleLabel}
          </span>
        </div>
      </div>

      {/* Animated counter overlay */}
      <div
        style={{
          position: "absolute",
          top: 150,
          left: "50%",
          transform: `translateX(-50%) scale(${counterScale})`,
          zIndex: 10,
          pointerEvents: "none",
        }}
      >
        <span
          style={{
            fontFamily: fonts.heading,
            fontSize: 32,
            fontWeight: 700,
            color: "#8B7355",
            opacity: frame > 28 ? 1 : 0,
          }}
        >
          {counterValue}
        </span>
        <span
          style={{
            fontFamily: fonts.body,
            fontSize: 14,
            fontWeight: 500,
            color: "#8B8885",
            marginLeft: 4,
            opacity: frame > 28 ? 1 : 0,
          }}
        >
          van {totalMembers} eten mee
        </span>
      </div>

      {/* Member avatars pop in */}
      {Array.from({ length: Math.min(counterValue, 8) }).map((_, i) => {
        const popStart = 30 + i * 5;
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
              backgroundColor: `hsl(${i * 45 + 20}, 40%, 65%)`,
              transform: `scale(${popScale})`,
              zIndex: 10,
              pointerEvents: "none",
              boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
            }}
          />
        );
      })}
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
