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
import { PhotoBackground } from "../components/PhotoBackground";
import { PhoneMockup } from "../components/PhoneMockup";
import { SceneTransition } from "../components/SceneTransition";
import { StoreBadges } from "../components/StoreBadges";
import { SwipeCard } from "../components/SwipeCard";
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

// ─── Scene 1: HOOK + PROBLEM (frames 0-60) ─────────────────────────────────

const HookScene: React.FC<{
  hookPhoto: string;
}> = ({ hookPhoto }) => {
  return (
    <AbsoluteFill>
      <PhotoBackground
        src={hookPhoto}
        overlay="rgba(0,0,0,0.7)"
        kenBurns={false}
        blur={3}
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
          text="Het is 17:00"
          fontSize={72}
          fontFamily="heading"
          color={colors.white}
          animation="fadeUp"
          startFrame={0}
          shadow
        />
        <AnimatedText
          text="Je hebt \u20AC4"
          fontSize={80}
          fontFamily="heading"
          color={colors.logoCoral}
          animation="slamIn"
          startFrame={20}
          shadow
        />
        <AnimatedText
          text="Geen idee wat je moet koken"
          fontSize={36}
          fontFamily="body"
          color={colors.white}
          animation="fadeUp"
          startFrame={40}
          shadow
          maxWidth={800}
        />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ─── Scene 2: APP SOLUTION (frames 60-150) ──────────────────────────────────

const SolutionScene: React.FC<{
  solutionPhoto: string;
  meals: { naam: string; foto: string; liked: boolean }[];
  recipeName: string;
}> = ({ solutionPhoto, meals, recipeName }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const phoneScale = spring({
    frame: frame - 70,
    fps,
    config: { damping: 14, stiffness: 120 },
  });

  // Animate 2 swipes at frames 85 and 105
  const swipeFrames = [85, 105];

  const resultOpacity = interpolate(frame, [120, 135], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const resultY = interpolate(frame, [120, 135], [20, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill>
      <PhotoBackground
        src={solutionPhoto}
        overlay="rgba(0,0,0,0.3)"
        kenBurns
        kenBurnsScale={[1, 1.1]}
        warmth={0.3}
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
        {/* Phone mockup with swipe cards */}
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
              {/* Mini card stack */}
              <div style={{ position: "relative", width: 260, height: 340 }}>
                {meals.slice(0, 2).map((meal, i) => {
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
                        zIndex: 2 - i,
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

        {/* Result text */}
        <div
          style={{
            opacity: resultOpacity,
            transform: `translateY(${resultY}px)`,
            textAlign: "center",
          }}
        >
          <span
            style={{
              fontFamily: fonts.heading,
              fontSize: 36,
              fontWeight: 700,
              color: colors.white,
              textShadow: "0 2px 20px rgba(0,0,0,0.5)",
            }}
          >
            Vanavond: {recipeName}
          </span>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ─── Scene 3: FOOD REVEAL + CTA (frames 150-240) ───────────────────────────

const RevealScene: React.FC<{
  resultPhoto: string;
  recipeName: string;
  cookingTime: number;
  price: number;
}> = ({ resultPhoto, recipeName, cookingTime, price }) => {
  return (
    <AbsoluteFill>
      <PhotoBackground
        src={resultPhoto}
        overlay="rgba(0,0,0,0.35)"
        kenBurns
        kenBurnsScale={[1, 1.12]}
        warmth={0.6}
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
          text={recipeName}
          fontSize={56}
          fontFamily="heading"
          color={colors.white}
          animation="fadeUp"
          startFrame={150}
          shadow
        />
        <AnimatedText
          text={`${cookingTime} min \u2022 \u20AC${price.toFixed(2)}`}
          fontSize={28}
          fontFamily="body"
          color="rgba(255,255,255,0.85)"
          animation="fadeUp"
          startFrame={160}
          shadow
        />
        <AnimatedText
          text="Swipe je avondeten"
          fontSize={40}
          fontFamily="heading"
          color={colors.white}
          animation="popIn"
          startFrame={180}
          shadow
        />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ─── Scene 4: END CARD (frames 240-300) ─────────────────────────────────────

const EndScene: React.FC<{
  resultPhoto: string;
}> = ({ resultPhoto }) => {
  return (
    <AbsoluteFill>
      <PhotoBackground
        src={resultPhoto}
        overlay="rgba(0,0,0,0.6)"
        kenBurns={false}
        blur={8}
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
        <Logo animation="bounce" size={220} startFrame={240} />
        <AnimatedText
          text="Download gratis"
          fontSize={32}
          fontFamily="body"
          color={colors.white}
          animation="fadeUp"
          startFrame={255}
          shadow
        />
        <StoreBadges startFrame={265} />
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
      {/* Scene 1: Hook + Problem */}
      <SceneTransition enterFrame={0} exitFrame={50} fadeFrames={10}>
        <HookScene hookPhoto={hookPhoto} />
      </SceneTransition>

      {/* Scene 2: App Solution */}
      <SceneTransition enterFrame={50} exitFrame={140} fadeFrames={10}>
        <SolutionScene
          solutionPhoto={solutionPhoto}
          meals={meals}
          recipeName={recipeName}
        />
      </SceneTransition>

      {/* Scene 3: Food Reveal */}
      <SceneTransition enterFrame={140} exitFrame={230} fadeFrames={10}>
        <RevealScene
          resultPhoto={resultPhoto}
          recipeName={recipeName}
          cookingTime={cookingTime}
          price={price}
        />
      </SceneTransition>

      {/* Scene 4: End Card */}
      <SceneTransition enterFrame={230} exitFrame={300} fadeFrames={10}>
        <EndScene resultPhoto={resultPhoto} />
      </SceneTransition>

      <BackgroundMusic src={music} />
    </AbsoluteFill>
  );
};
