/**
 * fetch-pexels-videos.ts
 * Downloads stock food/cooking video clips for use in Remotion TikTok videos.
 *
 * Two modes:
 *   1. API mode  — if PEXELS_API_KEY is set in .env.txt, searches Pexels for
 *                  portrait (9:16) food videos and downloads the HD versions.
 *   2. Fallback  — uses a curated list of known Pexels video IDs that are
 *                  publicly accessible via the Pexels CDN.
 *
 * Run: npx ts-node fetch-pexels-videos.ts
 */

import * as fs from "fs";
import * as path from "path";
import * as https from "https";
import * as http from "http";

// ─── Config ───────────────────────────────────────────────────────────────────

const VIDEOS_DIR = path.join(__dirname, "public", "videos");

/** Curated list of Pexels video IDs covering food / cooking / student-life scenes. */
const STOCK_VIDEOS: StockVideoEntry[] = [
  // Cooking scenes
  { id: "cooking-pasta",        query: "cooking pasta",             pexelsId: 3195394 },
  { id: "chopping-vegetables",  query: "chopping vegetables",       pexelsId: 3190830 },
  { id: "plating-food",         query: "plating food",              pexelsId: 3298175 },
  { id: "steam-food",           query: "steam food close up",       pexelsId: 5737245 },
  { id: "dinner-table",         query: "friends dinner table",      pexelsId: 6004988 },
  // Student life
  { id: "students-eating",      query: "students eating together",  pexelsId: 7991584 },
  { id: "kitchen-cooking",      query: "kitchen cooking",           pexelsId: 4253312 },
  { id: "grocery-shopping",     query: "grocery shopping",          pexelsId: 5661484 },
  // Food close-ups
  { id: "food-closeup",         query: "food close up appetizing",  pexelsId: 1640770 },
  { id: "pouring-sauce",        query: "pouring sauce food",        pexelsId: 5495849 },
];

/** Search queries used when running in API mode. */
const API_SEARCH_QUERIES = [
  "cooking pasta close up",
  "food preparation kitchen",
  "friends eating dinner table",
  "grocery store shopping",
  "empty fridge",
  "food plating restaurant",
  "cooking stir fry",
  "boiling water pasta",
  "cutting vegetables",
  "serving food plate",
];

// ─── Types ────────────────────────────────────────────────────────────────────

interface StockVideoEntry {
  id: string;
  query: string;
  pexelsId: number;
}

interface PexelsVideoFile {
  id: number;
  quality: string;
  width: number;
  height: number;
  link: string;
}

interface PexelsVideo {
  id: number;
  video_files: PexelsVideoFile[];
}

interface PexelsSearchResponse {
  videos: PexelsVideo[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Read a key=value .env-style file and return the parsed pairs. */
function readEnvFile(filePath: string): Record<string, string> {
  const result: Record<string, string> = {};
  if (!fs.existsSync(filePath)) return result;
  const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim();
    result[key] = val;
  }
  return result;
}

/** Follow redirects and download URL to destPath. */
function downloadFile(url: string, destPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith("https") ? https : http;
    const file = fs.createWriteStream(destPath);

    const request = protocol.get(url, (response) => {
      if (
        (response.statusCode === 301 ||
          response.statusCode === 302 ||
          response.statusCode === 307 ||
          response.statusCode === 308) &&
        response.headers.location
      ) {
        file.close();
        fs.unlinkSync(destPath);
        downloadFile(response.headers.location, destPath)
          .then(resolve)
          .catch(reject);
        return;
      }
      if (response.statusCode !== 200) {
        file.close();
        fs.unlinkSync(destPath);
        reject(new Error(`HTTP ${response.statusCode} for ${url}`));
        return;
      }
      response.pipe(file);
      file.on("finish", () => {
        file.close();
        resolve();
      });
    });

    request.on("error", (err) => {
      fs.unlink(destPath, () => {});
      reject(err);
    });
  });
}

/** Fetch JSON from a URL with optional Authorization header. */
function fetchJson<T>(url: string, apiKey?: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const options: https.RequestOptions = {
      hostname: parsedUrl.hostname,
      path: parsedUrl.pathname + parsedUrl.search,
      method: "GET",
      headers: {
        ...(apiKey ? { Authorization: apiKey } : {}),
        "User-Agent": "HappieRemotionBot/1.0",
      },
    };

    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode}: ${data.slice(0, 200)}`));
          return;
        }
        try {
          resolve(JSON.parse(data) as T);
        } catch (e) {
          reject(new Error(`JSON parse error: ${(e as Error).message}`));
        }
      });
    });

    req.on("error", reject);
    req.end();
  });
}

/**
 * Pick the best video file from a Pexels video entry.
 * Preference order:
 *   1. Portrait HD  (height > width, quality === "hd")
 *   2. Portrait SD  (height > width, any quality)
 *   3. Landscape HD (quality === "hd")
 *   4. Any available file
 */
function pickBestFile(
  files: PexelsVideoFile[]
): PexelsVideoFile | undefined {
  const portrait = files.filter((f) => f.height > f.width);
  const portraitHd = portrait.filter((f) => f.quality === "hd");
  if (portraitHd.length > 0) return portraitHd[0];
  if (portrait.length > 0) return portrait[0];

  const landscapeHd = files.filter((f) => f.quality === "hd");
  if (landscapeHd.length > 0) return landscapeHd[0];

  return files[0];
}

// ─── API mode ─────────────────────────────────────────────────────────────────

async function downloadViaApi(apiKey: string): Promise<void> {
  console.log("Pexels API key found — running in API mode.");
  console.log(`Searching ${API_SEARCH_QUERIES.length} queries...\n`);

  let downloaded = 0;
  let skipped = 0;
  let failed = 0;

  for (const query of API_SEARCH_QUERIES) {
    const safeId = query.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9\-]/g, "");
    const destPath = path.join(VIDEOS_DIR, `${safeId}.mp4`);

    if (fs.existsSync(destPath)) {
      console.log(`  SKIP  ${safeId}.mp4 (already exists)`);
      skipped++;
      continue;
    }

    const searchUrl =
      `https://api.pexels.com/videos/search` +
      `?query=${encodeURIComponent(query)}&per_page=5&orientation=portrait`;

    try {
      const data = await fetchJson<PexelsSearchResponse>(searchUrl, apiKey);

      if (!data.videos || data.videos.length === 0) {
        console.log(`  NONE  "${query}" — no results`);
        continue;
      }

      const video = data.videos[0];
      const file = pickBestFile(video.video_files);
      if (!file) {
        console.log(`  NONE  "${query}" — no usable video file`);
        continue;
      }

      console.log(
        `  DL    ${safeId}.mp4  (${file.width}×${file.height}, ${file.quality}, id=${video.id})`
      );
      await downloadFile(file.link, destPath);
      downloaded++;
    } catch (err) {
      console.log(`  FAIL  "${query}" — ${(err as Error).message}`);
      failed++;
    }

    // Respect Pexels rate limit (~1 req/sec to be safe)
    await new Promise((r) => setTimeout(r, 1100));
  }

  console.log(
    `\nAPI mode done: ${downloaded} downloaded, ${skipped} skipped, ${failed} failed.`
  );
}

// ─── Fallback mode ────────────────────────────────────────────────────────────

/**
 * Attempt to resolve a direct CDN download URL for a Pexels video ID via their
 * public API endpoint (no key required for the video metadata page scrape).
 * Falls back to the /video/{id}/download redirect as a last resort.
 */
async function resolvePexelsCdnUrl(pexelsId: number): Promise<string> {
  // Pexels exposes a JSON endpoint at /video/{id} that doesn't need auth.
  // In practice the unauthenticated endpoint is not guaranteed, so we use the
  // download redirect URL which browsers can follow. The Node https module
  // follows redirects in downloadFile().
  return `https://www.pexels.com/video/${pexelsId}/download/`;
}

async function downloadViaFallback(): Promise<void> {
  console.log("No Pexels API key found — running in fallback (curated list) mode.");
  console.log(`Downloading ${STOCK_VIDEOS.length} curated clips...\n`);

  let downloaded = 0;
  let skipped = 0;
  let failed = 0;

  for (let i = 0; i < STOCK_VIDEOS.length; i++) {
    const entry = STOCK_VIDEOS[i];
    const destPath = path.join(VIDEOS_DIR, `${entry.id}.mp4`);

    if (fs.existsSync(destPath)) {
      console.log(`  SKIP  ${entry.id}.mp4 (already exists)`);
      skipped++;
      continue;
    }

    const downloadUrl = await resolvePexelsCdnUrl(entry.pexelsId);

    try {
      process.stdout.write(
        `  DL    [${i + 1}/${STOCK_VIDEOS.length}] ${entry.id}.mp4 ...`
      );
      await downloadFile(downloadUrl, destPath);
      const sizeKb = Math.round(fs.statSync(destPath).size / 1024);
      console.log(` ${sizeKb} KB`);
      downloaded++;
    } catch (err) {
      console.log(` FAILED: ${(err as Error).message}`);
      // Remove zero-byte or partial file if it exists
      if (fs.existsSync(destPath)) {
        try { fs.unlinkSync(destPath); } catch { /* ignore */ }
      }
      failed++;
    }

    // Small delay between requests to avoid hammering the CDN
    await new Promise((r) => setTimeout(r, 500));
  }

  console.log(
    `\nFallback mode done: ${downloaded} downloaded, ${skipped} skipped, ${failed} failed.`
  );

  if (failed > 0) {
    console.log(
      "\nTip: Some direct downloads may fail without an API key. " +
        "Add PEXELS_API_KEY=<your_key> to .env.txt to use the official API.\n" +
        "Get a free key at https://www.pexels.com/api/"
    );
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  // Ensure output directory exists
  if (!fs.existsSync(VIDEOS_DIR)) {
    fs.mkdirSync(VIDEOS_DIR, { recursive: true });
  }
  console.log(`Output directory: ${VIDEOS_DIR}\n`);

  // Read API key from .env.txt
  const envPath = path.join(__dirname, ".env.txt");
  const env = readEnvFile(envPath);
  const pexelsKey =
    env["PEXELS_API_KEY"] ??
    process.env["PEXELS_API_KEY"] ??
    "";

  if (pexelsKey) {
    await downloadViaApi(pexelsKey);
  } else {
    await downloadViaFallback();
  }

  // Summary of what's in public/videos/
  const files = fs.readdirSync(VIDEOS_DIR).filter((f) => f.endsWith(".mp4"));
  console.log(`\npublic/videos/ — ${files.length} MP4 file(s):`);
  for (const f of files) {
    const sizeKb = Math.round(fs.statSync(path.join(VIDEOS_DIR, f)).size / 1024);
    console.log(`  ${f.padEnd(36)} ${sizeKb} KB`);
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
