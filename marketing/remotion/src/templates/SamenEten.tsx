import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { AnimatedText } from "../components/AnimatedText";
import { BackgroundMusic } from "../components/BackgroundMusic";
import { Confetti } from "../components/Confetti";
import { Logo } from "../components/Logo";
import { PhoneMockup } from "../components/PhoneMockup";
import { PhotoBackground } from "../components/PhotoBackground";
import { SceneTransition } from "../components/SceneTransition";
import { StoreBadges } from "../components/StoreBadges";
import { SwipeCard } from "../components/SwipeCard";
import { colors } from "../theme/colors";
import { fonts } from "../theme/fonts";

export interface SamenEtenProps {
  chatMessages: { tekst: string; isReply: boolean }[];
  meals: { naam: string; foto: string; liked: boolean }[];
  matchMeal: string;
  resultPhoto: string;
  music: string;
  durationInSeconds: number;
}

// ─── Typing indicator dots ──────────────────────────────────────────────────

const TypingDots: React.FC<{ frame: number }> = ({ frame }) => {
  const dots = [0, 1, 2].map((i) => {
    const opacity = interpolate(
      Math.sin(((frame - i * 4) / 8) * Math.PI),
      [-1, 1],
      [0.2, 1]
    );
    return (
      <div
        key={i}
        style={{
          width: 10,
          height: 10,
          borderRadius: "50%",
          backgroundColor: "rgba(255,255,255,0.7)",
          opacity,
        }}
      />
    );
  });

  return (
    <div
      style={{
        display: "flex",
        gap: 6,
        backgroundColor: "rgba(255,255,255,0.15)",
        borderRadius: "20px 20px 20px 4px",
        padding: "12px 20px",
      }}
    >
      {dots}
    </div>
  );
};

// ─── Scene 1: THE PROBLEM (frames 0-210) ───────────────────────────────────

const ProblemScene: React.FC<{
  chatMessages: { tekst: string; isReply: boolean }[];
}> = ({ chatMessages }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const TYPING_FRAMES = 20;
  const MSG_TOTAL = 35;

  return (
    <AbsoluteFill
      style={{
        background: "linear-gradient(180deg, #1a1a2e 0%, #0d1117 100%)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "200px 60px",
        gap: 12,
      }}
    >
      {/* Chat header */}
      <div
        style={{
          position: "absolute",
          top: 120,
          left: 0,
          right: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <span
          style={{
            fontFamily: fonts.body,
            fontSize: 28,
            fontWeight: 700,
            color: "rgba(255,255,255,0.5)",
            textShadow: "0 2px 10px rgba(0,0,0,0.3)",
          }}
        >
          Groepsapp
        </span>
      </div>

      {chatMessages.map((msg, i) => {
        const msgStart = i * MSG_TOTAL;
        const typingEnd = msgStart + TYPING_FRAMES;
        const isShowingTyping = frame >= msgStart && frame < typingEnd;
        const isShowingBubble = frame >= typingEnd;

        if (frame < msgStart) return null;

        const bubbleProgress = spring({
          frame: Math.max(0, frame - typingEnd),
          fps,
          config: { damping: 16, stiffness: 220 },
        });
        const bubbleY = interpolate(bubbleProgress, [0, 1], [30, 0]);
        const bubbleOpacity = interpolate(bubbleProgress, [0, 1], [0, 1]);

        const isReply = msg.isReply;

        return (
          <div
            key={i}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: isReply ? "flex-end" : "flex-start",
            }}
          >
            {isShowingTyping && <TypingDots frame={frame - msgStart} />}

            {isShowingBubble && (
              <div
                style={{
                  maxWidth: "80%",
                  backgroundColor: isReply
                    ? colors.accent
                    : "rgba(255,255,255,0.12)",
                  borderRadius: isReply
                    ? "24px 24px 4px 24px"
                    : "24px 24px 24px 4px",
                  padding: "16px 24px",
                  transform: `translateY(${bubbleY}px)`,
                  opacity: bubbleOpacity,
                }}
              >
                <span
                  style={{
                    fontFamily: fonts.body,
                    fontSize: 26,
                    fontWeight: 400,
                    color: colors.white,
                    lineHeight: 1.4,
                  }}
                >
                  {msg.tekst}
                </span>
              </div>
            )}
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

// ─── Scene 2: THE SOLUTION (frames 210-480) ────────────────────────────────

const SolutionScene: React.FC<{
  meals: { naam: string; foto: string; liked: boolean }[];
  matchMeal: string;
}> = ({ meals, matchMeal }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Phone slides in
  const phoneProgress = spring({
    frame: Math.max(0, frame - 220),
    fps,
    config: { damping: 14, stiffness: 100 },
  });
  const phoneY = interpolate(phoneProgress, [0, 1], [600, 0]);

  // Swipe animations at frames 280, 330, 380
  const swipeFrames = [280, 330, 380];

  // Match happens at ~400
  const matchFrame = 400;
  const showConfetti = frame >= matchFrame;

  const matchTextOpacity = interpolate(frame, [matchFrame + 5, matchFrame + 25], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Background transition: dark to warm
  const warmth = interpolate(frame, [210, 400], [0, 0.6], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(180deg,
          rgba(26,26,46,${1 - warmth}) 0%,
          rgba(${Math.round(139 * warmth)},${Math.round(115 * warmth)},${Math.round(85 * warmth)},${warmth * 0.3}) 100%)`,
      }}
    >
      <AbsoluteFill
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 30,
        }}
      >
        <div style={{ transform: `translateY(${phoneY}px)` }}>
          <PhoneMockup scale={0.9}>
            <div
              style={{
                width: 300,
                height: 620,
                backgroundColor: colors.background,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                position: "relative",
                overflow: "hidden",
              }}
            >
              {/* Mini swipe cards inside phone */}
              <div style={{ position: "relative", width: 260, height: 340 }}>
                {meals.map((meal, i) => {
                  const swipeStart = swipeFrames[i];
                  if (!swipeStart) return null;
                  const localFrame = frame - swipeStart;
                  const isSwiping = localFrame >= 0;
                  const direction = meal.liked ? 1 : -1;

                  const translateX = isSwiping
                    ? interpolate(localFrame, [0, 15], [0, direction * 400], {
                        extrapolateLeft: "clamp",
                        extrapolateRight: "clamp",
                      })
                    : 0;

                  const rotation = isSwiping
                    ? interpolate(localFrame, [0, 15], [0, direction * 12], {
                        extrapolateLeft: "clamp",
                        extrapolateRight: "clamp",
                      })
                    : 0;

                  return (
                    <div
                      key={i}
                      style={{
                        position: "absolute",
                        zIndex: meals.length - i,
                        transform: `translateX(${translateX}px) rotate(${rotation}deg) scale(${1 - i * 0.04})`,
                        top: i * 6,
                        left: 0,
                        width: 260,
                        height: 340,
                      }}
                    >
                      <SwipeCard
                        meal={meal}
                        style={{ width: 260, height: 340 }}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          </PhoneMockup>
        </div>

        {/* Match text */}
        {frame >= matchFrame && (
          <div style={{ opacity: matchTextOpacity, textAlign: "center" }}>
            <span
              style={{
                fontFamily: fonts.heading,
                fontSize: 40,
                fontWeight: 700,
                color: colors.white,
                textShadow: "0 2px 20px rgba(0,0,0,0.5)",
              }}
            >
              {matchMeal}!
            </span>
          </div>
        )}
      </AbsoluteFill>

      {/* Confetti on match */}
      {showConfetti && <Confetti startFrame={matchFrame} particleCount={50} />}
    </AbsoluteFill>
  );
};

// ─── Scene 3: THE FEELING (frames 480-720) ─────────────────────────────────

const FeelingScene: React.FC<{
  resultPhoto: string;
}> = ({ resultPhoto }) => {
  return (
    <AbsoluteFill>
      <PhotoBackground
        src={resultPhoto}
        overlay="rgba(0,0,0,0.4)"
        kenBurns
        kenBurnsScale={[1, 1.12]}
        warmth={0.7}
      />
      <AbsoluteFill
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 30,
        }}
      >
        <AnimatedText
          text="Samen kiezen."
          fontSize={52}
          fontFamily="heading"
          color={colors.white}
          animation="fadeUp"
          startFrame={500}
          shadow
        />
        <AnimatedText
          text="Samen koken."
          fontSize={52}
          fontFamily="heading"
          color={colors.white}
          animation="fadeUp"
          startFrame={550}
          shadow
        />
        <AnimatedText
          text="Samen eten."
          fontSize={64}
          fontFamily="heading"
          color={colors.logoCoral}
          animation="popIn"
          startFrame={610}
          shadow
        />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ─── Scene 4: CTA (frames 720-900) ─────────────────────────────────────────

const CTAScene: React.FC<{
  resultPhoto: string;
}> = ({ resultPhoto }) => {
  return (
    <AbsoluteFill>
      <PhotoBackground
        src={resultPhoto}
        overlay="rgba(0,0,0,0.6)"
        blur={8}
        kenBurns={false}
        warmth={0.3}
      />
      <AbsoluteFill
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 36,
        }}
      >
        <Logo animation="bounce" size={220} startFrame={730} />
        <AnimatedText
          text="Download gratis"
          fontSize={32}
          fontFamily="body"
          color={colors.white}
          animation="fadeUp"
          startFrame={760}
          shadow
        />
        <StoreBadges startFrame={780} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ─── Main Template ──────────────────────────────────────────────────────────

export const SamenEten: React.FC<SamenEtenProps> = ({
  chatMessages,
  meals,
  matchMeal,
  resultPhoto,
  music,
}) => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#0d1117" }}>
      <SceneTransition enterFrame={0} exitFrame={210} fadeFrames={15}>
        <ProblemScene chatMessages={chatMessages} />
      </SceneTransition>

      <SceneTransition enterFrame={210} exitFrame={480} fadeFrames={15}>
        <SolutionScene meals={meals} matchMeal={matchMeal} />
      </SceneTransition>

      <SceneTransition enterFrame={480} exitFrame={720} fadeFrames={15}>
        <FeelingScene resultPhoto={resultPhoto} />
      </SceneTransition>

      <SceneTransition enterFrame={720} exitFrame={900} fadeFrames={15}>
        <CTAScene resultPhoto={resultPhoto} />
      </SceneTransition>

      <BackgroundMusic src={music} />
    </AbsoluteFill>
  );
};
