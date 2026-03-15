import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { TransitionSeries } from "@remotion/transitions";
import { slide } from "@remotion/transitions/slide";
import { wipe } from "@remotion/transitions/wipe";
import { fade } from "@remotion/transitions/fade";
import { springTiming, linearTiming } from "@remotion/transitions";
import { AnimatedText } from "../components/AnimatedText";
import { BackgroundMusic } from "../components/BackgroundMusic";
import { Confetti } from "../components/Confetti";
import { Logo } from "../components/Logo";
import { PhoneMockup } from "../components/PhoneMockup";
import { PhotoBackground } from "../components/PhotoBackground";
import { StoreBadges } from "../components/StoreBadges";
import { SwipeCard } from "../components/SwipeCard";
import { VideoBackground } from "../components/VideoBackground";
import {
  NotificationStack,
  SwipeGesture,
  HeartPulse,
} from "../components/lottie-style";
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

// ─── Scene 1: HOOK ──────────────────────────────────────────────────────────

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

// ─── Scene 2: PROBLEM — NotificationStack replaces manual chat bubbles ──────

const ProblemScene: React.FC<{
  chatMessages: { tekst: string; isReply: boolean }[];
}> = ({ chatMessages }) => {
  // Convert chatMessages to NotificationStack format
  const notifications = chatMessages.slice(0, 5).map((msg, i) => ({
    sender: msg.isReply ? "Jij" : i === 0 ? "Lisa" : i === 2 ? "Tom" : "Sarah",
    message: msg.tekst,
    color: msg.isReply ? "#4A90D9" : "#25D366",
  }));

  return (
    <AbsoluteFill
      style={{
        background: "linear-gradient(180deg, #1a1a2e 0%, #0d1117 100%)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        gap: 20,
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

      <NotificationStack
        startFrame={10}
        notifications={notifications}
        width={420}
        staggerFrames={18}
      />
    </AbsoluteFill>
  );
};

// ─── Scene 3: TENSION BREAK ────────────────────────────────────────────────

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
          startFrame={15}
          shadow
          maxWidth={700}
        />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ─── Scene 4: APP DEMO — swipe + SwipeGesture overlay ──────────────────────

const AppDemoScene: React.FC<{
  meals: { naam: string; foto: string; liked: boolean }[];
}> = ({ meals }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const phoneProgress = spring({
    frame: Math.max(0, frame - 10),
    fps,
    config: { damping: 14, stiffness: 100 },
  });
  const phoneY = interpolate(phoneProgress, [0, 1], [600, 0]);

  const swipeFrames = [50, 90, 130];

  // Background warm transition
  const warmth = interpolate(frame, [0, 130], [0, 0.6], {
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
          startFrame={5}
          shadow
        />

        <div style={{ transform: `translateY(${phoneY}px)`, position: "relative" }}>
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
                  {Math.min(3, Math.max(0, Math.floor((frame - 10) / 40) + 1))}/6 gestemd
                </span>
              </div>
            </div>
          </PhoneMockup>

          {/* SwipeGesture overlay next to phone */}
          <div
            style={{
              position: "absolute",
              bottom: 180,
              right: -100,
            }}
          >
            <SwipeGesture startFrame={30} size={120} color="rgba(255,255,255,0.8)" />
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ─── Scene 5: MATCH — HeartPulse celebration ────────────────────────────────

const MatchScene: React.FC<{
  matchMeal: string;
  resultPhoto: string;
}> = ({ matchMeal, resultPhoto }) => {
  const frame = useCurrentFrame();

  const flashOpacity = interpolate(frame, [0, 3, 10], [0, 0.8, 0], {
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
        {/* HeartPulse during match celebration */}
        <HeartPulse startFrame={5} color={colors.logoCoral} size={100} />
        <AnimatedText
          text={`${matchMeal} wint!`}
          fontSize={56}
          fontFamily="heading"
          color={colors.white}
          animation="popIn"
          startFrame={8}
          shadow
        />
      </AbsoluteFill>

      <Confetti startFrame={5} particleCount={60} />
    </AbsoluteFill>
  );
};

// ─── Scene 6: COOKING video ─────────────────────────────────────────────────

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
          startFrame={20}
          shadow
        />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ─── Scene 7: THE FEELING ───────────────────────────────────────────────────

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
          startFrame={20}
          shadow
        />
        <AnimatedText
          text="Samen koken."
          fontSize={52}
          fontFamily="heading"
          color={colors.white}
          animation="fadeUp"
          startFrame={60}
          shadow
        />
        <AnimatedText
          text="Samen eten."
          fontSize={64}
          fontFamily="heading"
          color={colors.logoCoral}
          animation="popIn"
          startFrame={100}
          shadow
        />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ─── Scene 8: CTA ───────────────────────────────────────────────────────────

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
        <Logo animation="bounce" size={650} startFrame={10} />
        <AnimatedText
          text="Download Happie"
          fontSize={36}
          fontFamily="heading"
          color={colors.white}
          animation="fadeUp"
          startFrame={40}
          shadow
        />
        <StoreBadges startFrame={60} />
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
      <TransitionSeries>
        {/* Scene 1: Hook (60 frames) */}
        <TransitionSeries.Sequence durationInFrames={60}>
          <HookScene />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={slide()}
          timing={springTiming({ config: { damping: 14 } })}
        />

        {/* Scene 2: Problem — NotificationStack (150 frames) */}
        <TransitionSeries.Sequence durationInFrames={150}>
          <ProblemScene chatMessages={chatMessages} />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={slide()}
          timing={springTiming({ config: { damping: 12 } })}
        />

        {/* Scene 3: Tension break — video (60 frames) */}
        <TransitionSeries.Sequence durationInFrames={60}>
          <TensionBreakScene />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={slide()}
          timing={springTiming({ config: { damping: 14 } })}
        />

        {/* Scene 4: App demo — swipe + SwipeGesture (150 frames) */}
        <TransitionSeries.Sequence durationInFrames={150}>
          <AppDemoScene meals={meals} />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: 12 })}
        />

        {/* Scene 5: Match celebration — HeartPulse (90 frames) */}
        <TransitionSeries.Sequence durationInFrames={90}>
          <MatchScene matchMeal={matchMeal} resultPhoto={resultPhoto} />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={wipe()}
          timing={springTiming({ config: { damping: 12 } })}
        />

        {/* Scene 6: Cooking video (90 frames) */}
        <TransitionSeries.Sequence durationInFrames={90}>
          <CookingScene />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: 15 })}
        />

        {/* Scene 7: The feeling (120 frames) */}
        <TransitionSeries.Sequence durationInFrames={120}>
          <FeelingScene resultPhoto={resultPhoto} />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: 15 })}
        />

        {/* Scene 8: CTA (120 frames) */}
        <TransitionSeries.Sequence durationInFrames={120}>
          <CTAScene resultPhoto={resultPhoto} />
        </TransitionSeries.Sequence>
      </TransitionSeries>

      <BackgroundMusic src={music} />
    </AbsoluteFill>
  );
};
