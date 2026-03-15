import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { loadFont as loadPlayfair } from "@remotion/google-fonts/PlayfairDisplay";

const inter = loadInter();
const playfair = loadPlayfair();

export const fonts = {
  heading: playfair.fontFamily,
  body: inter.fontFamily,
} as const;
