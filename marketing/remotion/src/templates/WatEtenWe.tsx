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
import { Logo } from "../components/Logo";
import { PhotoBackground } from "../components/PhotoBackground";
import { PhoneMockup } from "../components/PhoneMockup";
import { SceneTransition } from "../components/SceneTransition";
import { StoreBadges } from "../components/StoreBadges";
import { SwipeCard } from "../components/SwipeCard";
import { VideoBackground } from "../components/VideoBackground";
import {
  NotificationStack,
  SwipeCards,
  Checkmark,
} from "../components/lottie-style";
import { colors } from "../theme/colors";
import { fonts } from "../theme/fonts";

export interface WatEtenWeProps {
  hookPhoto: string;
  solutionPhoto: string;
  resultPhoto: string;
  recipeName: string;
  cookingTime: number;
  price: number;
  meals: { naam: string; foto: string; liked: boolean }[];
  music: string;
  durationInSeconds: number;
}

// ─── Scene 1: HOOK ──────────────────────────────────────────────────────────
// Dark bg, bold text slams in. "Het is 17:00."

const HookScene: React.FC = () => {
  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#0a0a0a",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 20,
      }}
    >
      <AnimatedText
        text="Het is 17:00."
        fontSize={80}
        fontFamily="heading"
        color={colors.white}
        animation="slamIn"
        startFrame={5}
        shadow
      />
      <AnimatedText
        text="Niemand weet het."
        fontSize={40}
        fontFamily="body"
        color="rgba(255,255,255,0.6)"
        animation="fadeUp"
        startFrame={40}
        shadow
      />
    </AbsoluteFill>
  );
};

// ─── Scene 2: PROBLEM — NotificationStack with escalating messages ──────────

const ProblemScene: React.FC = () => {
  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#0a0a0a",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 30,
      }}
    >
      <NotificationStack
        startFrame={10}
        notifications={[
          { sender: "Lisa", message: "Wat eten we vanavond? 🍕", color: "#25D366" },
          { sender: "Tom", message: "Weet niet 🤷", color: "#25D366" },
          { sender: "Sarah", message: "NIET WEER PASTA", color: "#25D366" },
          { sender: "Groep 💬", message: "Elke. Avond. Hetzelfde.", color: "#E74C3C" },
        ]}
        width={380}
        staggerFrames={20}
      />
      <AnimatedText
        text="Elke. Avond. Hetzelfde."
        fontSize={48}
        fontFamily="heading"
        color={colors.logoCoral}
        animation="glitch"
        startFrame={90}
        shadow
      />
    </AbsoluteFill>
  );
};

// ─── Scene 3: SWIPE CARDS — standalone card swipe animation ─────────────────

const SwipeCardsScene: React.FC = () => {
  return (
    <AbsoluteFill
      style={{
        background: "linear-gradient(180deg, #1a1a2e 0%, #0d1117 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 30,
      }}
    >
      <AnimatedText
        text="Swipe samen."
        fontSize={56}
        fontFamily="heading"
        color={colors.white}
        animation="highlight"
        highlightColor={colors.logoCoral}
        startFrame={5}
        shadow
      />
      <SwipeCards startFrame={20} width={320} height={200} />
    </AbsoluteFill>
  );
};

// ─── Scene 4: APP — Phone mockup with swipe demo ───────────────────────────

const AppScene: React.FC<{
  solutionPhoto: string;
  meals: { naam: string; foto: string; liked: boolean }[];
}> = ({ solutionPhoto, meals }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const phoneScale = spring({
    frame: Math.max(0, frame - 10),
    fps,
    config: { damping: 14, stiffness: 120 },
  });

  const swipeFrames = [40, 90, 130];

  return (
    <AbsoluteFill>
      <PhotoBackground
        src={solutionPhoto}
        overlay="rgba(0,0,0,0.3)"
        kenBurns
        kenBurnsScale={[1.05, 1.12]}
        warmth={0.5}
      />
      <AbsoluteFill
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 20,
        }}
      >
        <div
          style={{
            transform: `scale(${phoneScale}) rotate(-2deg)`,
          }}
        >
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
                {meals.slice(0, 3).map((meal, i) => {
                  const swipeStart = swipeFrames[i];
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

                  const overlayOpacity = isSwiping
                    ? interpolate(localFrame, [0, 10], [0, 0.8], {
                        extrapolateLeft: "clamp",
                        extrapolateRight: "clamp",
                      })
                    : 0;

                  return (
                    <div
                      key={i}
                      style={{
                        position: "absolute",
                        zIndex: 3 - i,
                        transform: `translateX(${translateX}px) rotate(${rotation}deg) scale(${1 - i * 0.04})`,
                        top: i * 8,
                        left: 0,
                        width: 260,
                        height: 340,
                      }}
                    >
                      <SwipeCard
                        meal={meal}
                        style={{ width: 260, height: 340 }}
                      />
                      {isSwiping && (
                        <div
                          style={{
                            position: "absolute",
                            inset: 0,
                            borderRadius: 20,
                            backgroundColor: meal.liked
                              ? colors.likeGreen
                              : colors.dislikeRed,
                            opacity: overlayOpacity,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <span
                            style={{
                              fontFamily: fonts.heading,
                              fontSize: 36,
                              fontWeight: 700,
                              color: colors.white,
                              border: `4px solid ${colors.white}`,
                              padding: "6px 16px",
                              borderRadius: 8,
                              transform: `rotate(${meal.liked ? -12 : 12}deg)`,
                            }}
                          >
                            {meal.liked ? "HAPPIE!" : "NEE"}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </PhoneMockup>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ─── Scene 5: FOOD REVEAL — photo + Checkmark animation ────────────────────

const FoodRevealScene: React.FC<{
  resultPhoto: string;
  recipeName: string;
  cookingTime: number;
  price: number;
}> = ({ resultPhoto, recipeName, cookingTime, price }) => {
  return (
    <AbsoluteFill>
      <PhotoBackground
        src={resultPhoto}
        overlay="rgba(0,0,0,0.3)"
        kenBurns
        kenBurnsScale={[1, 1.15]}
        warmth={0.6}
      />
      <AbsoluteFill
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 20,
        }}
      >
        <div style={{ marginBottom: 10 }}>
          <Checkmark startFrame={5} color="#4CAF50" size={120} />
        </div>
        <AnimatedText
          text={recipeName}
          fontSize={60}
          fontFamily="heading"
          color={colors.white}
          animation="popIn"
          startFrame={30}
          shadow
          glow="rgba(255,255,255,0.2)"
        />
        <AnimatedText
          text={`${cookingTime} min \u2022 \u20AC${price.toFixed(2)}`}
          fontSize={28}
          fontFamily="body"
          color="rgba(255,255,255,0.85)"
          animation="fadeUp"
          startFrame={60}
          shadow
        />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ─── Scene 6: RESULT — friends eating ───────────────────────────────────────

const ResultScene: React.FC = () => {
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
          gap: 20,
        }}
      >
        <AnimatedText
          text="Samen gekozen."
          fontSize={48}
          fontFamily="heading"
          color={colors.white}
          animation="fadeUp"
          startFrame={20}
          shadow
        />
        <AnimatedText
          text="Samen gegeten."
          fontSize={52}
          fontFamily="heading"
          color={colors.logoCoral}
          animation="popIn"
          startFrame={60}
          shadow
        />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ─── Scene 7: CTA ───────────────────────────────────────────────────────────

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

export const WatEtenWe: React.FC<WatEtenWeProps> = ({
  hookPhoto,
  solutionPhoto,
  resultPhoto,
  recipeName,
  cookingTime,
  price,
  meals,
  music,
}) => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <TransitionSeries>
        {/* Scene 1: Hook — dark bg, bold text (90 frames) */}
        <TransitionSeries.Sequence durationInFrames={90}>
          <HookScene />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={wipe()}
          timing={springTiming({ config: { damping: 12 } })}
        />

        {/* Scene 2: Problem — NotificationStack with escalating messages (150 frames) */}
        <TransitionSeries.Sequence durationInFrames={150}>
          <ProblemScene />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={slide()}
          timing={springTiming({ config: { damping: 14 } })}
        />

        {/* Scene 3: SwipeCards standalone animation (100 frames) */}
        <TransitionSeries.Sequence durationInFrames={100}>
          <SwipeCardsScene />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={slide()}
          timing={springTiming({ config: { damping: 14 } })}
        />

        {/* Scene 4: App — Phone mockup + swipe demo (200 frames) */}
        <TransitionSeries.Sequence durationInFrames={200}>
          <AppScene solutionPhoto={solutionPhoto} meals={meals} />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: 15 })}
        />

        {/* Scene 5: Food Reveal — photo + Checkmark (120 frames) */}
        <TransitionSeries.Sequence durationInFrames={120}>
          <FoodRevealScene
            resultPhoto={resultPhoto}
            recipeName={recipeName}
            cookingTime={cookingTime}
            price={price}
          />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: 15 })}
        />

        {/* Scene 6: Result — friends eating (120 frames) */}
        <TransitionSeries.Sequence durationInFrames={120}>
          <ResultScene />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: 15 })}
        />

        {/* Scene 7: CTA (180 frames) */}
        <TransitionSeries.Sequence durationInFrames={180}>
          <CTAScene resultPhoto={resultPhoto} />
        </TransitionSeries.Sequence>
      </TransitionSeries>

      <BackgroundMusic src={music} />
    </AbsoluteFill>
  );
};
