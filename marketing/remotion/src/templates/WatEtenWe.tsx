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
import { Logo } from "../components/Logo";
import { NotificationBubble } from "../components/NotificationBubble";
import { PhotoBackground } from "../components/PhotoBackground";
import { PhoneMockup } from "../components/PhoneMockup";
import { SceneTransition } from "../components/SceneTransition";
import { StoreBadges } from "../components/StoreBadges";
import { SwipeCard } from "../components/SwipeCard";
import { VideoBackground } from "../components/VideoBackground";
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

// ─── Scene 1: HOOK (frames 0-90) ────────────────────────────────────────────
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

// ─── Scene 2: PROBLEM (frames 90-150) ───────────────────────────────────────
// VideoBackground(empty-fridge.mp4), slow-mo

const ProblemScene: React.FC = () => {
  return (
    <AbsoluteFill>
      <VideoBackground
        src="empty-fridge.mp4"
        overlay="rgba(0,0,0,0.55)"
        playbackRate={0.5}
      />
      <AbsoluteFill
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <AnimatedText
          text="Lege koelkast."
          fontSize={64}
          fontFamily="heading"
          color={colors.white}
          animation="fadeUp"
          startFrame={100}
          shadow
        />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ─── Scene 3: PROBLEM ESCALATION (frames 150-210) ───────────────────────────
// Multiple NotificationBubbles stacking

const EscalationScene: React.FC = () => {
  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#0a0a0a",
      }}
    >
      <NotificationBubble
        text="Pasta vanavond?"
        appName="WhatsApp"
        startFrame={155}
        icon="whatsapp"
      />
      <NotificationBubble
        text="Nee! Te saai"
        appName="WhatsApp"
        startFrame={175}
        icon="whatsapp"
      />
      <NotificationBubble
        text="Pizza? Te duur..."
        appName="WhatsApp"
        startFrame={195}
        icon="whatsapp"
      />
      <AbsoluteFill
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <AnimatedText
          text="Elke. Avond. Hetzelfde."
          fontSize={48}
          fontFamily="heading"
          color={colors.logoCoral}
          animation="glitch"
          startFrame={160}
          shadow
        />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ─── Scene 4: APP INTRO (frames 210-330) ────────────────────────────────────
// Transition to warm. PhoneMockup slides in.

const AppIntroScene: React.FC<{
  solutionPhoto: string;
}> = ({ solutionPhoto }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const phoneScale = spring({
    frame: Math.max(0, frame - 230),
    fps,
    config: { damping: 14, stiffness: 120 },
  });

  return (
    <AbsoluteFill>
      <PhotoBackground
        src={solutionPhoto}
        overlay="rgba(0,0,0,0.35)"
        kenBurns
        kenBurnsScale={[1, 1.08]}
        warmth={0.4}
      />
      <AbsoluteFill
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 24,
        }}
      >
        <AnimatedText
          text="Swipe samen."
          fontSize={56}
          fontFamily="heading"
          color={colors.white}
          animation="highlight"
          highlightColor={colors.logoCoral}
          startFrame={215}
          shadow
        />
        <div
          style={{
            transform: `scale(${phoneScale}) rotate(-2deg)`,
          }}
        >
          <PhoneMockup scale={0.7}>
            <div
              style={{
                width: 300,
                height: 620,
                backgroundColor: colors.background,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <span
                style={{
                  fontFamily: fonts.heading,
                  fontSize: 28,
                  fontWeight: 700,
                  color: colors.logoCoral,
                  textAlign: "center",
                }}
              >
                Happie
              </span>
            </div>
          </PhoneMockup>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ─── Scene 5: SWIPE DEMO (frames 330-480) ───────────────────────────────────
// 3 SwipeCards animate through phone

const SwipeDemoScene: React.FC<{
  meals: { naam: string; foto: string; liked: boolean }[];
  solutionPhoto: string;
}> = ({ meals, solutionPhoto }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const swipeFrames = [350, 400, 440];

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
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ─── Scene 6: FOOD REVEAL (frames 480-600) ──────────────────────────────────
// PhotoBackground(winning recipe), Ken Burns, recipe name + time + price

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
        <AnimatedText
          text={recipeName}
          fontSize={60}
          fontFamily="heading"
          color={colors.white}
          animation="popIn"
          startFrame={490}
          shadow
          glow="rgba(255,255,255,0.2)"
        />
        <AnimatedText
          text={`${cookingTime} min \u2022 \u20AC${price.toFixed(2)}`}
          fontSize={28}
          fontFamily="body"
          color="rgba(255,255,255,0.85)"
          animation="fadeUp"
          startFrame={520}
          shadow
        />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ─── Scene 7: RESULT (frames 600-720) ───────────────────────────────────────
// VideoBackground(friends-eating). "Samen gekozen. Samen gegeten."

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
          startFrame={620}
          shadow
        />
        <AnimatedText
          text="Samen gegeten."
          fontSize={52}
          fontFamily="heading"
          color={colors.logoCoral}
          animation="popIn"
          startFrame={660}
          shadow
        />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ─── Scene 8: CTA (frames 720-900) ──────────────────────────────────────────
// Brand bg. Logo (transparent). "Download Happie". StoreBadges.

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
      {/* Scene 1: Hook (0-90) */}
      <SceneTransition enterFrame={0} exitFrame={90} fadeFrames={12}>
        <HookScene />
      </SceneTransition>

      {/* Scene 2: Problem — empty fridge video (90-150) */}
      <SceneTransition enterFrame={90} exitFrame={150} fadeFrames={12}>
        <ProblemScene />
      </SceneTransition>

      {/* Scene 3: Problem Escalation — notifications (150-210) */}
      <SceneTransition enterFrame={150} exitFrame={210} fadeFrames={10}>
        <EscalationScene />
      </SceneTransition>

      {/* Scene 4: App Intro (210-330) */}
      <SceneTransition enterFrame={210} exitFrame={330} fadeFrames={15}>
        <AppIntroScene solutionPhoto={solutionPhoto} />
      </SceneTransition>

      {/* Scene 5: Swipe Demo (330-480) */}
      <SceneTransition enterFrame={330} exitFrame={480} fadeFrames={15}>
        <SwipeDemoScene meals={meals} solutionPhoto={solutionPhoto} />
      </SceneTransition>

      {/* Scene 6: Food Reveal (480-600) */}
      <SceneTransition enterFrame={480} exitFrame={600} fadeFrames={15}>
        <FoodRevealScene
          resultPhoto={resultPhoto}
          recipeName={recipeName}
          cookingTime={cookingTime}
          price={price}
        />
      </SceneTransition>

      {/* Scene 7: Result — friends eating video (600-720) */}
      <SceneTransition enterFrame={600} exitFrame={720} fadeFrames={15}>
        <ResultScene />
      </SceneTransition>

      {/* Scene 8: CTA (720-900) */}
      <SceneTransition enterFrame={720} exitFrame={900} fadeFrames={15}>
        <CTAScene resultPhoto={resultPhoto} />
      </SceneTransition>

      <BackgroundMusic src={music} />
    </AbsoluteFill>
  );
};
