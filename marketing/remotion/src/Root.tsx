import { Composition } from "remotion";

const Placeholder: React.FC = () => (
  <div style={{ flex: 1, background: "#F8F6F3", display: "flex", alignItems: "center", justifyContent: "center" }}>
    <h1 style={{ fontFamily: "sans-serif", color: "#8B7355" }}>Studenten Happie</h1>
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
