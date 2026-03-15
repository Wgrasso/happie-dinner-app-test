import OpenAI from "openai";
import * as fs from "fs";
import * as path from "path";
import * as https from "https";

const openai = new OpenAI({
  apiKey: process.env.OPEN_AI_API_KEY,
});

const OUTPUT_DIR = path.join(__dirname, "public", "illustrations");

const illustrations = [
  {
    filename: "students-cooking-together.png",
    prompt:
      "Warm illustration of diverse students cooking together in a modern kitchen, modern flat design style, warm browns and corals (#8B7355, #F4845F), clean minimalist, friendly atmosphere, portrait orientation, no text",
  },
  {
    filename: "empty-fridge-sad.png",
    prompt:
      "Humorous illustration of an empty fridge with a subtle sad expression on its door, warm color palette with browns and corals (#8B7355, #F4845F), modern flat design, minimalist, portrait orientation, no text",
  },
  {
    filename: "happy-dinner-table.png",
    prompt:
      "Warm illustration of young students sitting around a dinner table eating together, warm lighting, modern flat design, warm browns and corals (#8B7355, #F4845F), cozy atmosphere, portrait orientation, no text",
  },
  {
    filename: "phone-swipe-concept.png",
    prompt:
      "Abstract illustration of food recipe cards being swiped on a smartphone, modern flat design, warm browns and corals (#8B7355, #F4845F), clean minimalist, portrait orientation, no text",
  },
  {
    filename: "grocery-list-check.png",
    prompt:
      "Illustration of a grocery shopping list with satisfying checkmarks being ticked off, warm browns and corals (#8B7355, #F4845F), modern flat design, feeling of completion and satisfaction, portrait orientation, no text",
  },
];

async function downloadImage(url: string, filepath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filepath);
    https
      .get(url, (response) => {
        // Handle redirects
        if (response.statusCode === 301 || response.statusCode === 302) {
          const redirectUrl = response.headers.location;
          if (redirectUrl) {
            https
              .get(redirectUrl, (redirectResponse) => {
                redirectResponse.pipe(file);
                file.on("finish", () => {
                  file.close();
                  resolve();
                });
              })
              .on("error", reject);
            return;
          }
        }
        response.pipe(file);
        file.on("finish", () => {
          file.close();
          resolve();
        });
      })
      .on("error", (err) => {
        fs.unlink(filepath, () => {});
        reject(err);
      });
  });
}

async function generateIllustration(
  name: string,
  prompt: string,
  filename: string
): Promise<void> {
  console.log(`Generating: ${name}...`);

  try {
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt,
      n: 1,
      size: "1024x1792",
      quality: "hd",
    });

    const imageUrl = response.data[0]?.url;
    if (!imageUrl) {
      console.error(`  No URL returned for ${name}`);
      return;
    }

    const filepath = path.join(OUTPUT_DIR, filename);
    await downloadImage(imageUrl, filepath);
    console.log(`  Saved: ${filepath}`);
  } catch (error: any) {
    console.error(`  Error generating ${name}:`, error.message || error);
  }
}

async function main() {
  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  console.log("Generating DALL-E illustrations for Happie TikTok videos...\n");

  for (const illust of illustrations) {
    await generateIllustration(
      illust.filename.replace(".png", ""),
      illust.prompt,
      illust.filename
    );
  }

  console.log("\nDone! Illustrations saved to public/illustrations/");
}

main().catch(console.error);
