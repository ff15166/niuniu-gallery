import { execSync } from "child_process";
import { existsSync, readFileSync, unlinkSync, writeFileSync, mkdirSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || "sk-958fd0f73789424086fd4af7f015c48c";
const DEEPSEEK_BASE_URL = process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com";

/**
 * Extract a frame from a video file using ffmpeg.
 * Returns the path to the extracted JPEG frame, or null on failure.
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
 * Generate a caption for an image (local path or URL) using DeepSeek Vision API.
 */
export async function generateCaption(
  imageSource: string,
  isLocalPath: boolean = false
): Promise<string | null> {
  try {
    let imageUrl: string;

    if (isLocalPath) {
      // Convert local file to base64 data URL
      const buffer = readFileSync(imageSource);
      const ext = imageSource.split(".").pop()?.toLowerCase() || "jpg";
      const mime = ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : "image/jpeg";
      imageUrl = `data:${mime};base64,${buffer.toString("base64")}`;
    } else {
      imageUrl = imageSource;
    }

    const res = await fetch(`${DEEPSEEK_BASE_URL}/v1/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: '请用中文为这张图片写一句简短的描述（15-30字），作为图片简介。只输出描述文字，不要加引号或其他符号。',
              },
              {
                type: "image_url",
                image_url: { url: imageUrl },
              },
            ],
          },
        ],
        max_tokens: 100,
        temperature: 0.7,
      }),
    });

    if (!res.ok) {
      console.error("DeepSeek caption API error:", res.status);
      return null;
    }

    const data = await res.json();
    const caption = data.choices?.[0]?.message?.content?.trim();
    return caption || null;
  } catch (err) {
    console.error("generateCaption error:", err);
    return null;
  }
}

/**
 * Generate video thumbnail using ffmpeg.
 * Returns the thumbnail buffer, or null on failure.
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
