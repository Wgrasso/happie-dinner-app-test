import { Composition } from "remotion";
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
  </>
);
