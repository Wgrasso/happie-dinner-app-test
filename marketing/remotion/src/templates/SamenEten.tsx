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
import { VideoBackground } from "../components/VideoBackground";
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

// ─── Scene 1: HOOK (frames 0-60) ────────────────────────────────────────────

const HookScene: React.FC = () => {
  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#0a0a0a",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <AnimatedText
        text="Vanavond koken we samen."
        fontSize={52}
        fontFamily="heading"
        color={colors.white}
        animation="fadeUp"
        startFrame={5}
        shadow
        maxWidth={800}
      />
    </AbsoluteFill>
  );
};

// ─── Scene 2: PROBLEM — Chat bubbles (frames 60-210) ────────────────────────

const ProblemScene: React.FC<{
  chatMessages: { tekst: string; isReply: boolean }[];
}> = ({ chatMessages }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const TYPING_FRAMES = 18;
  const MSG_TOTAL = 30;

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
            textShadow: "0 4px 30px rgba(0,0,0,0.8), 0 2px 10px rgba(0,0,0,0.5)",
          }}
        >
          Groepsapp
        </span>
      </div>

      {chatMessages.map((msg, i) => {
        const msgStart = 70 + i * MSG_TOTAL;
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

// ─── Scene 3: TENSION BREAK (frames 210-270) ────────────────────────────────
// VideoBackground(empty-fridge). "Er is een betere manier."

const TensionBreakScene: React.FC = () => {
  return (
    <AbsoluteFill>
      <VideoBackground
        src="empty-fridge.mp4"
        overlay="rgba(0,0,0,0.55)"
        playbackRate={0.6}
      />
      <AbsoluteFill
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <AnimatedText
          text="Er is een betere manier."
          fontSize={44}
          fontFamily="heading"
          color={colors.white}
          animation="highlight"
          highlightColor={colors.logoCoral}
          startFrame={225}
          shadow
          maxWidth={700}
        />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ─── Scene 4: APP DEMO (frames 270-420) ─────────────────────────────────────
// Phone mockup, swipe sequence, vote count

const AppDemoScene: React.FC<{
  meals: { naam: string; foto: string; liked: boolean }[];
}> = ({ meals }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const phoneProgress = spring({
    frame: Math.max(0, frame - 280),
    fps,
    config: { damping: 14, stiffness: 100 },
  });
  const phoneY = interpolate(phoneProgress, [0, 1], [600, 0]);

  const swipeFrames = [320, 360, 400];

  // Background warm transition
  const warmth = interpolate(frame, [270, 400], [0, 0.6], {
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
          gap: 20,
        }}
      >
        <AnimatedText
          text="Swipe samen."
          fontSize={40}
          fontFamily="heading"
          color={colors.white}
          animation="fadeUp"
          startFrame={275}
          shadow
        />

        <div style={{ transform: `translateY(${phoneY}px)` }}>
          <PhoneMockup scale={0.85}>
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

              {/* Vote count overlay */}
              <div
                style={{
                  position: "absolute",
                  bottom: 20,
                  left: "50%",
                  transform: "translateX(-50%)",
                  backgroundColor: "rgba(139,115,85,0.9)",
                  borderRadius: 20,
                  padding: "6px 16px",
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
                  {Math.min(3, Math.max(0, Math.floor((frame - 280) / 40) + 1))}/6 gestemd
                </span>
              </div>
            </div>
          </PhoneMockup>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ─── Scene 5: MATCH (frames 420-510) ────────────────────────────────────────
// Screen flash. Confetti. Match result.

const MatchScene: React.FC<{
  matchMeal: string;
  resultPhoto: string;
}> = ({ matchMeal, resultPhoto }) => {
  const frame = useCurrentFrame();

  const flashOpacity = interpolate(frame, [420, 423, 430], [0, 0.8, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill>
      <PhotoBackground
        src={resultPhoto}
        overlay="rgba(0,0,0,0.35)"
        kenBurns
        kenBurnsScale={[1, 1.1]}
        warmth={0.5}
      />

      {/* Flash overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundColor: `rgba(255,255,255,${flashOpacity})`,
          zIndex: 5,
        }}
      />

      <AbsoluteFill
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 20,
          zIndex: 6,
        }}
      >
        <AnimatedText
          text={`${matchMeal} wint!`}
          fontSize={56}
          fontFamily="heading"
          color={colors.white}
          animation="popIn"
          startFrame={428}
          shadow
        />
      </AbsoluteFill>

      <Confetti startFrame={425} particleCount={60} />
    </AbsoluteFill>
  );
};

// ─── Scene 6: COOKING video (frames 510-600) ────────────────────────────────

const CookingScene: React.FC = () => {
  return (
    <AbsoluteFill>
      <VideoBackground
        src="boiling-water-pasta.mp4"
        overlay="rgba(0,0,0,0.3)"
        playbackRate={1}
      />
      <AbsoluteFill
        style={{
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "center",
          paddingBottom: 200,
        }}
      >
        <AnimatedText
          text="Samen koken."
          fontSize={44}
          fontFamily="heading"
          color={colors.white}
          animation="fadeUp"
          startFrame={540}
          shadow
        />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ─── Scene 7: THE FEELING (frames 600-720) ──────────────────────────────────
// Three lines staggered in

const FeelingScene: React.FC<{
  resultPhoto: string;
}> = ({ resultPhoto }) => {
  return (
    <AbsoluteFill>
      <VideoBackground
        src="friends-eating-dinner-table.mp4"
        overlay="rgba(0,0,0,0.4)"
        playbackRate={0.8}
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
          startFrame={620}
          shadow
        />
        <AnimatedText
          text="Samen koken."
          fontSize={52}
          fontFamily="heading"
          color={colors.white}
          animation="fadeUp"
          startFrame={660}
          shadow
        />
        <AnimatedText
          text="Samen eten."
          fontSize={64}
          fontFamily="heading"
          color={colors.logoCoral}
          animation="popIn"
          startFrame={700}
          shadow
        />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ─── Scene 8: CTA (frames 720-900) ──────────────────────────────────────────

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
        <Logo animation="bounce" size={650} startFrame={730} />
        <AnimatedText
          text="Download Happie"
          fontSize={36}
          fontFamily="heading"
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
      {/* Scene 1: Hook (0-60) */}
      <SceneTransition enterFrame={0} exitFrame={60} fadeFrames={10}>
        <HookScene />
      </SceneTransition>

      {/* Scene 2: Problem — chat bubbles (60-210) */}
      <SceneTransition enterFrame={60} exitFrame={210} fadeFrames={12}>
        <ProblemScene chatMessages={chatMessages} />
      </SceneTransition>

      {/* Scene 3: Tension break — video (210-270) */}
      <SceneTransition enterFrame={210} exitFrame={270} fadeFrames={12}>
        <TensionBreakScene />
      </SceneTransition>

      {/* Scene 4: App demo — swipe (270-420) */}
      <SceneTransition enterFrame={270} exitFrame={420} fadeFrames={15}>
        <AppDemoScene meals={meals} />
      </SceneTransition>

      {/* Scene 5: Match celebration (420-510) */}
      <SceneTransition enterFrame={420} exitFrame={510} fadeFrames={10}>
        <MatchScene matchMeal={matchMeal} resultPhoto={resultPhoto} />
      </SceneTransition>

      {/* Scene 6: Cooking video (510-600) */}
      <SceneTransition enterFrame={510} exitFrame={600} fadeFrames={12}>
        <CookingScene />
      </SceneTransition>

      {/* Scene 7: The feeling (600-720) */}
      <SceneTransition enterFrame={600} exitFrame={720} fadeFrames={15}>
        <FeelingScene resultPhoto={resultPhoto} />
      </SceneTransition>

      {/* Scene 8: CTA (720-900) */}
      <SceneTransition enterFrame={720} exitFrame={900} fadeFrames={15}>
        <CTAScene resultPhoto={resultPhoto} />
      </SceneTransition>

      <BackgroundMusic src={music} />
    </AbsoluteFill>
  );
};
