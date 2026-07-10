import { execSync } from "child_process";
import { existsSync, readFileSync, mkdirSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";

/**
 * Extract a frame from a video file using ffmpeg.
 */
export function extractVideoFrame(videoPath: string): string | null {
  try {
    const tmpDir = join(tmpdir(), "niuniu-frames");
    if (!existsSync(tmpDir)) mkdirSync(tmpDir, { recursive: true });
    const framePath = join(tmpDir, `frame-${Date.now()}.jpg`);
    execSync(
      `ffmpeg -y -ss 1 -i "${videoPath}" -frames:v 1 -q:v 2 "${framePath}"`,
      { stdio: "pipe", timeout: 15000 }
    );
    return existsSync(framePath) ? framePath : null;
  } catch {
    return null;
  }
}

/**
 * Generate video thumbnail using ffmpeg.
 */
export function generateVideoThumbnail(
  videoPath: string,
  thumbPath: string
): boolean {
  try {
    execSync(
      `ffmpeg -y -ss 1 -i "${videoPath}" -frames:v 1 -vf "scale=400:-1" -q:v 5 "${thumbPath}"`,
      { stdio: "pipe", timeout: 15000 }
    );
    return existsSync(thumbPath);
  } catch {
    return false;
  }
}

/**
 * Generate a caption for an image using Google Gemini Vision API.
 * Falls back to date-based caption if API fails.
 */
export async function generateCaption(
  imageSource: string,
  isLocalPath: boolean = false
): Promise<string | null> {
  try {
    let imageBase64: string;
    let mimeType: string;

    if (isLocalPath) {
      const buffer = readFileSync(imageSource);
      const ext = imageSource.split(".").pop()?.toLowerCase() || "jpg";
      mimeType = ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : "image/jpeg";
      imageBase64 = buffer.toString("base64");
    } else {
      // Fetch remote image and convert to base64
      const res = await fetch(imageSource);
      if (!res.ok) return fallbackCaption();
      const buffer = Buffer.from(await res.arrayBuffer());
      mimeType = res.headers.get("content-type") || "image/jpeg";
      imageBase64 = buffer.toString("base64");
    }

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: "请用中文为这张图片写一句简短的描述（15-30字），作为图片简介。只输出描述文字，不要加引号、句号或其他符号。",
                },
                {
                  inline_data: {
                    mime_type: mimeType,
                    data: imageBase64,
                  },
                },
              ],
            },
          ],
          generationConfig: {
            maxOutputTokens: 100,
            temperature: 0.7,
          },
        }),
      }
    );

    if (!res.ok) {
      console.error("Gemini API error:", res.status);
      return fallbackCaption();
    }

    const data = await res.json();
    const caption =
      data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    return caption || fallbackCaption();
  } catch (err) {
    console.error("generateCaption error:", err);
    return fallbackCaption();
  }
}

/**
 * Fallback caption based on current date.
 */
function fallbackCaption(): string {
  return `拍摄于${new Date().toLocaleDateString("zh-CN")}`;
}
