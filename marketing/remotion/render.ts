import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";
import path from "path";

const render = async () => {
  const idFlag = process.argv.find((a) => a.startsWith("--id="));
  const targetId = idFlag?.split("=")[1];

  const batchFlag = process.argv.find((a) => a.startsWith("--batch="));
  const batchId = batchFlag?.split("=")[1] || "1";

  const outdirFlag = process.argv.find((a) => a.startsWith("--outdir="));
  const outDir = outdirFlag
    ? path.resolve(__dirname, outdirFlag.split("=")[1])
    : path.resolve(__dirname, "./out");

  // Dynamic import based on batch flag
  let allVideos;
  if (batchId === "3") {
    const configModule = await import("./src/data/video-configs-batch3");
    allVideos = configModule.videosBatch3;
  } else if (batchId === "2") {
    const configModule = await import("./src/data/video-configs-batch2");
    allVideos = configModule.videosBatch2;
  } else {
    const configModule = await import("./src/data/video-configs");
    allVideos = configModule.videos;
  }

  const configsToRender = targetId
    ? allVideos.filter((v) => v.id === targetId)
    : allVideos;

  if (configsToRender.length === 0) {
    console.error(`No video found with id: ${targetId}`);
    process.exit(1);
  }

  console.log(
    `Bundling Remotion project... (batch ${batchId}, output: ${outDir})`,
  );
  const bundleLocation = await bundle({
    entryPoint: path.resolve(__dirname, "./src/index.ts"),
  });

  for (const config of configsToRender) {
    console.log(`\n[${config.id}] Rendering ${config.template}...`);
    try {
      const composition = await selectComposition({
        serveUrl: bundleLocation,
        id: config.template,
        inputProps: {
          ...config.props,
          music: config.music,
          durationInSeconds: config.durationInSeconds,
        },
      });

      await renderMedia({
        composition,
        serveUrl: bundleLocation,
        codec: "h264",
        outputLocation: path.join(outDir, `${config.id}.mp4`),
        inputProps: {
          ...config.props,
          music: config.music,
          durationInSeconds: config.durationInSeconds,
        },
        jpegQuality: 100,
        crf: 15,
      });

      console.log(`[${config.id}] Done → ${outDir}/${config.id}.mp4`);
    } catch (err) {
      console.error(`[${config.id}] Error: ${(err as Error).message}`);
    }
  }

  console.log(`\nBatch complete. ${configsToRender.length} videos processed.`);
};

render().catch(console.error);
