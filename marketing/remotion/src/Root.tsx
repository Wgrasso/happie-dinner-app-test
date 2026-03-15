import React from "react";
import { Composition } from "remotion";
import { AppDemo } from "./templates/AppDemo";
import { StatReel } from "./templates/StatReel";
import { SwipeTinder } from "./templates/SwipeTinder";
import { TekstStory } from "./templates/TekstStory";
import { colors } from "./theme/colors";
import { fonts } from "./theme/fonts";

const Placeholder: React.FC = () => (
  <div style={{ flex: 1, background: colors.background, display: "flex", alignItems: "center", justifyContent: "center" }}>
    <h1 style={{ fontFamily: fonts.heading, color: colors.accent }}>Studenten Happie</h1>
    <p style={{ fontFamily: fonts.body, color: colors.textMuted }}>Videos coming soon</p>
  </div>
);

export const RemotionRoot: React.FC = () => (
  <>
    <Composition
      id="Placeholder"
      component={Placeholder}
      width={1080}
      height={1920}
      fps={30}
      durationInFrames={300}
    />

    <Composition
      id="SwipeTinder"
      component={SwipeTinder as unknown as React.ComponentType<Record<string, unknown>>}
      width={1080}
      height={1920}
      fps={30}
      durationInFrames={300}
      defaultProps={{
        hookText: "POV: Tinder maar dan voor eten 🍝",
        meals: [
          { naam: "Nasi Goreng", foto: "test.jpg", liked: false },
          { naam: "Shoarma Bowl", foto: "test.jpg", liked: false },
          { naam: "Pasta Carbonara", foto: "test.jpg", liked: true },
        ],
        matchMeal: "Pasta Carbonara",
        ctaText: "Download gratis",
        music: "",
        durationInSeconds: 10,
      }}
    />
    <Composition
      id="TekstStory"
      component={TekstStory as unknown as React.ComponentType<Record<string, unknown>>}
      width={1080}
      height={1920}
      fps={30}
      calculateMetadata={({ props }: { props: Record<string, unknown> }) => ({
        durationInFrames: (props.durationInSeconds as number) * 30,
        props,
      })}
      defaultProps={{
        hookText: "Je hebt €3 voor avondeten",
        antwoord: "Happie zegt: Pasta Aglio e Olio — €2,80 • 15 min",
        tagline: "Swipe je avondeten bij Happie",
        mode: "dark" as const,
        music: "",
        durationInSeconds: 8,
      }}
    />
    <Composition
      id="StatReel"
      component={StatReel as unknown as React.ComponentType<Record<string, unknown>>}
      width={1080}
      height={1920}
      fps={30}
      calculateMetadata={({ props }: { props: Record<string, unknown> }) => ({
        durationInFrames: (props.durationInSeconds as number) * 30,
        props,
      })}
      defaultProps={{
        statNummer: 87,
        statSuffix: "%",
        statLabel: "van studenten kookt max 2x per week",
        chartData: [
          { label: "bezorgen", value: 60 },
          { label: "zelf", value: 40 },
          { label: "afhaal", value: 50 },
          { label: "happie", value: 85, highlight: true },
        ],
        vergelijking: {
          linksLabel: "Thuisbezorgd",
          linksWaarde: "€12",
          rechtsLabel: "Happie",
          rechtsWaarde: "€3",
          conclusie: "Bespaar €270/maand",
        },
        music: "",
        durationInSeconds: 10,
      }}
    />
    <Composition
      id="AppDemo"
      component={AppDemo as unknown as React.ComponentType<Record<string, unknown>>}
      width={1080}
      height={1920}
      fps={30}
      calculateMetadata={({ props }: { props: Record<string, unknown> }) => ({
        durationInFrames: (props.durationInSeconds as number) * 30,
        props,
      })}
      defaultProps={{
        probleem: "Wat eten we vanavond?",
        schermen: ["home", "swipe", "result"] as const,
        features: ["Gratis", "Budget recepten", "Met je huisgenoten"],
        music: "",
        durationInSeconds: 13,
      }}
    />
  </>
);
