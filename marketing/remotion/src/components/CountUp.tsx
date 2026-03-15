import { interpolate, useCurrentFrame } from "remotion";
import { colors } from "../theme/colors";
import { fonts } from "../theme/fonts";

interface CountUpProps {
  target: number;
  suffix?: string;
  startFrame?: number;
  durationFrames?: number;
  color?: string;
  fontSize?: number;
}

export const CountUp: React.FC<CountUpProps> = ({
  target,
  suffix = "",
  startFrame = 0,
  durationFrames = 60,
  color = colors.accent,
  fontSize = 120,
}) => {
  const frame = useCurrentFrame();

  const animatedValue = interpolate(
    frame,
    [startFrame, startFrame + durationFrames],
    [0, target],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }
  );

  const displayValue = Math.round(animatedValue);

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        width: "100%",
        height: "100%",
      }}
    >
      <span
        style={{
          fontFamily: fonts.heading,
          fontWeight: "bold",
          fontSize,
          color,
          lineHeight: 1,
        }}
      >
        {displayValue}
        {suffix}
      </span>
    </div>
  );
};
