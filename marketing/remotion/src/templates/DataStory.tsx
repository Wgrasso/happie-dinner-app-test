import React from "react";
import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
} from "remotion";
import { AnimatedText } from "../components/AnimatedText";
import { BackgroundMusic } from "../components/BackgroundMusic";
import { Logo } from "../components/Logo";
import { PhotoBackground } from "../components/PhotoBackground";
import { ProgressBar } from "../components/ProgressBar";
import { VideoBackground } from "../components/VideoBackground";
import {
  AnimatedCounter,
  AnimatedUnderline,
  GradientBackground,
  RevealMask,
  AnimatedAppUI,
} from "../components/motion";
import { colors } from "../theme/colors";
import { fonts } from "../theme/fonts";

export interface DataStoryProps {
  bgPhoto: string;
  statNummer: number;
  statSuffix: string;
  statLabel: string;
  chartTitle?: string;
  chartData: { label: string; value: number; highlight?: boolean }[];
  ctaPhoto: string;
  music: string;
  durationInSeconds: number;
}

// --- DataStory PERSONALITY: Clean, precise. White space. Geometric shapes.
// Story-first: data + food visuals 80%, app peek 20%.
// No more vergelijking/Thuisbezorgd comparison scenes.

const SLATE_BG = "#1e293b";
const SLATE_DARK = "#0f172a";

const StatScene: React.FC<{
  bgPhoto: string;
  statNummer: number;
  statSuffix: string;
  statLabel: string;
}> = ({ bgPhoto, statNummer, statSuffix, statLabel }) => {
  const frame = useCurrentFrame();
  const lineWidth = interpolate(frame, [0, 40], [0, 100], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ backgroundColor: SLATE_DARK }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0.15,
          overflow: "hidden",
        }}
      >
        <PhotoBackground
          src={bgPhoto}
          overlay="rgba(0,0,0,0)"
          blur={20}
          kenBurns={false}
        />
      </div>
      <div
        style={{
          position: "absolute",
          top: 350,
          left: "10%",
          width: `${lineWidth}%`,
          height: 1,
          backgroundColor: "rgba(244,132,95,0.2)",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: 500,
          right: "10%",
          width: `${lineWidth * 0.6}%`,
          height: 1,
          backgroundColor: "rgba(244,132,95,0.15)",
        }}
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
        <AnimatedCounter
          from={0}
          to={statNummer}
          startFrame={5}
          durationFrames={50}
          suffix={` ${statSuffix}`}
          fontSize={80}
          color={colors.logoCoral}
          showUnderline
          underlineColor={colors.logoCoral}
        />
        <AnimatedText
          text={statLabel}
          fontSize={30}
          fontFamily="body"
          color="rgba(255,255,255,0.75)"
          animation="fadeUp"
          startFrame={50}
          shadow
          maxWidth={800}
        />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const ChartScene: React.FC<{
  chartData: { label: string; value: number; highlight?: boolean }[];
  chartTitle?: string;
}> = ({ chartData, chartTitle }) => {
  const frame = useCurrentFrame();
  const titleOpacity = interpolate(frame, [0, 15], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ backgroundColor: SLATE_BG }}>
      {[0.25, 0.5, 0.75].map((pos, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            left: `${80 + pos * (1080 - 160)}px`,
            width: 1,
            backgroundColor: "rgba(255,255,255,0.04)",
          }}
        />
      ))}
      <AbsoluteFill
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 28,
        }}
      >
        {chartTitle && (
          <div style={{ opacity: titleOpacity }}>
            <span
              style={{
                fontFamily: fonts.body,
                fontSize: 32,
                fontWeight: 700,
                color: "rgba(255,255,255,0.9)",
                textShadow: "0 2px 10px rgba(0,0,0,0.5)",
                textAlign: "center",
                letterSpacing: "-0.02em",
              }}
            >
              {chartTitle}
            </span>
          </div>
        )}
        <ProgressBar
          items={chartData.map((d) => ({
            label: d.label,
            percentage: d.value,
            color: d.highlight ? colors.logoCoral : undefined,
          }))}
          startFrame={15}
        />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const VideoBreakScene: React.FC = () => (
  <AbsoluteFill>
    <PhotoBackground
      src="illustrations/phone-swipe-concept.png"
      overlay="rgba(15,23,42,0.45)"
      kenBurns
      kenBurnsScale={[1, 1.1]}
    />
    <AbsoluteFill
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <RevealMask startFrame={5} durationFrames={20} shape="diagonal">
        <AbsoluteFill
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <AnimatedText
            text="Lekker. En makkelijk."
            fontSize={48}
            fontFamily="body"
            color={colors.white}
            animation="letterStagger"
            startFrame={20}
            shadow
          />
        </AbsoluteFill>
      </RevealMask>
    </AbsoluteFill>
  </AbsoluteFill>
);

const FoodShowcaseScene: React.FC<{ ctaPhoto: string }> = ({ ctaPhoto }) => (
  <AbsoluteFill>
    <PhotoBackground
      src={ctaPhoto}
      overlay="rgba(15,23,42,0.25)"
      kenBurns
      kenBurnsScale={[1, 1.12]}
      warmth={0.4}
    />
    <AbsoluteFill
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-end",
        paddingBottom: 300,
      }}
    >
      <AnimatedText
        text="60+ recepten onder \u20AC5"
        fontSize={40}
        fontFamily="heading"
        color={colors.white}
        animation="fadeUp"
        startFrame={15}
        shadow
      />
    </AbsoluteFill>
  </AbsoluteFill>
);

const AppDemoScene: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: SLATE_DARK }}>
    {[0.2, 0.4, 0.6, 0.8].map((pos, i) => (
      <div
        key={i}
        style={{
          position: "absolute",
          top: 0,
          bottom: 0,
          left: `${pos * 100}%`,
          width: 1,
          backgroundColor: "rgba(255,255,255,0.03)",
        }}
      />
    ))}
    <AbsoluteFill
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 16,
      }}
    >
      <AnimatedText
        text="Zo werkt Happie"
        fontSize={32}
        fontFamily="body"
        color="rgba(255,255,255,0.9)"
        animation="fadeUp"
        startFrame={3}
        shadow
      />
      <AnimatedAppUI
        startFrame={10}
        sequence="swipe-three"
        recipe={{
          name: "Pasta Carbonara",
          image: "carbonara.jpg",
          cookingTime: 25,
          description: "Romige klassieker.",
          ingredients: ["Spaghetti", "Pancetta", "Eieren", "Parmezaan", "Peper"],
        }}
        swipeResults={["like", "dislike", "like"]}
      />
    </AbsoluteFill>
  </AbsoluteFill>
);

const CTAScene: React.FC = () => {
  const frame = useCurrentFrame();
  const fadeOut = interpolate(frame, [75, 90], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ backgroundColor: SLATE_DARK }}>
      <AbsoluteFill
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 30,
        }}
      >
        <Logo animation="fadeIn" size={650} startFrame={5} />
        <AnimatedText
          text="Download Happie"
          fontSize={32}
          fontFamily="body"
          color={colors.white}
          animation="fadeUp"
          startFrame={25}
          shadow
        />
      </AbsoluteFill>
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundColor: "#000",
          opacity: fadeOut,
          zIndex: 100,
        }}
      />
    </AbsoluteFill>
  );
};

// --- Main Template: frame-based cuts ---
export const DataStory: React.FC<DataStoryProps> = ({
  bgPhoto,
  statNummer,
  statSuffix,
  statLabel,
  chartTitle,
  chartData,
  ctaPhoto,
  music,
}) => {
  const frame = useCurrentFrame();

  // Story-first: data + food visuals 80%, app 20%
  // Total 900 frames = 30s
  // Story: Stat(120) + Chart(150) + VideoBreak(120) + FoodShowcase(120) = 510 (17s)
  // + more story = 120 (4s) => 630 (21s)
  // App: AppDemo(150) + CTA(120) = 270 (9s) => ~70/30 split
  const sceneDurations = [120, 150, 120, 120, 120, 150, 120];

  let accumulated = 0;
  let sceneIndex = 0;
  for (let i = 0; i < sceneDurations.length; i++) {
    if (frame < accumulated + sceneDurations[i]) {
      sceneIndex = i;
      break;
    }
    accumulated += sceneDurations[i];
    if (i === sceneDurations.length - 1) sceneIndex = i;
  }

  return (
    <AbsoluteFill style={{ backgroundColor: SLATE_DARK }}>
      {sceneIndex === 0 && (
        <StatScene
          bgPhoto={bgPhoto}
          statNummer={statNummer}
          statSuffix={statSuffix}
          statLabel={statLabel}
        />
      )}
      {sceneIndex === 1 && <ChartScene chartData={chartData} chartTitle={chartTitle} />}
      {sceneIndex === 2 && <VideoBreakScene />}
      {sceneIndex === 3 && <FoodShowcaseScene ctaPhoto={ctaPhoto} />}
      {sceneIndex === 4 && (
        <AbsoluteFill>
          <PhotoBackground
            src={bgPhoto}
            overlay="rgba(15,23,42,0.3)"
            kenBurns
            kenBurnsScale={[1.05, 1]}
            warmth={0.3}
          />
          <AbsoluteFill
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 14,
            }}
          >
            <AnimatedText
              text="Samen koken. Samen besparen."
              fontSize={44}
              fontFamily="heading"
              color={colors.white}
              animation="fadeUp"
              startFrame={10}
              shadow
              maxWidth={800}
            />
            <AnimatedUnderline startFrame={30} width={400} color={colors.logoCoral} strokeWidth={3} />
          </AbsoluteFill>
        </AbsoluteFill>
      )}
      {sceneIndex === 5 && <AppDemoScene />}
      {sceneIndex === 6 && <CTAScene />}
      <BackgroundMusic src={music} />
    </AbsoluteFill>
  );
};
