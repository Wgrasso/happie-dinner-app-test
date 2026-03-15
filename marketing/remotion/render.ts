import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";
import path from "path";
import { videos } from "./src/data/video-configs";

const render = async () => {
  const idFlag = process.argv.find((a) => a.startsWith("--id="));
  const targetId = idFlag?.split("=")[1];

  const configsToRender = targetId
    ? videos.filter((v) => v.id === targetId)
    : videos;

  if (configsToRender.length === 0) {
    console.error(`No video found with id: ${targetId}`);
    process.exit(1);
  }

  console.log(`Bundling Remotion project...`);
  const bundleLocation = await bundle({
    entryPoint: path.resolve(__dirname, "./src/index.ts"),
  });

  const outDir = path.resolve(__dirname, "./out");

  for (const config of configsToRender) {
    console.log(`\n[${config.id}] Rendering ${config.template}...`);
    try {
      const composition = await selectComposition({
        serveUrl: bundleLocation,
        id: config.template,
        inputProps: { ...config.props, music: config.music, durationInSeconds: config.durationInSeconds },
      });

      await renderMedia({
        composition,
        serveUrl: bundleLocation,
        codec: "h264",
        outputLocation: path.join(outDir, `${config.id}.mp4`),
        inputProps: { ...config.props, music: config.music, durationInSeconds: config.durationInSeconds },
        jpegQuality: 100,
        crf: 15,
      });

      console.log(`[${config.id}] Done → out/${config.id}.mp4`);
    } catch (err) {
      console.error(`[${config.id}] Error: ${(err as Error).message}`);
    }
  }

  console.log(`\nBatch complete. ${configsToRender.length} videos processed.`);
};

render().catch(console.error);
