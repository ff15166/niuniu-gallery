import { execSync } from "child_process";
import { existsSync, readFileSync, mkdirSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || process.env.DEEPSEEK_API_KEY || "sk-958fd0f73789424086fd4af7f015c48c";
const OPENAI_BASE_URL = process.env.OPENAI_BASE_URL || "https://api.deepseek.com";

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
 * Generate a caption for an image.
 * First tries AI vision API, falls back to filename-based caption.
 */
export async function generateCaption(
  imageSource: string,
  isLocalPath: boolean = false
): Promise<string | null> {
  // Try AI vision first
  const aiCaption = await tryAICaption(imageSource, isLocalPath);
  if (aiCaption) return aiCaption;

  // Fallback: generate from filename
  if (isLocalPath) {
    return captionFromFilename(imageSource);
  }
  return null;
}

/**
 * Try to generate caption using AI vision API.
 * Supports OpenAI, DeepSeek, or any OpenAI-compatible API with vision.
 */
async function tryAICaption(
  imageSource: string,
  isLocalPath: boolean
): Promise<string | null> {
  try {
    let imageUrl: string;

    if (isLocalPath) {
      const buffer = readFileSync(imageSource);
      const ext = imageSource.split(".").pop()?.toLowerCase() || "jpg";
      const mime = ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : "image/jpeg";
      imageUrl = `data:${mime};base64,${buffer.toString("base64")}`;
    } else {
      imageUrl = imageSource;
    }

    // Try vision-capable models in order
    const models = ["gpt-4o-mini", "gpt-4o", "deepseek-v4-pro"];
    
    for (const model of models) {
      try {
        const res = await fetch(`${OPENAI_BASE_URL}/v1/chat/completions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${OPENAI_API_KEY}`,
          },
          body: JSON.stringify({
            model,
            messages: [
              {
                role: "user",
                content: [
                  {
                    type: "text",
                    text: "请用中文为这张图片写一句简短的描述（15-30字），作为图片简介。只输出描述文字，不要加引号或其他符号。",
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

        if (res.ok) {
          const data = await res.json();
          const caption = data.choices?.[0]?.message?.content?.trim();
          if (caption) return caption;
        }
      } catch {
        // Try next model
      }
    }
  } catch (err) {
    console.error("AI caption failed:", err);
  }
  return null;
}

/**
 * Generate a simple caption from the filename.
 */
function captionFromFilename(filePath: string): string {
  const filename = filePath.split(/[/\\]/).pop() || filePath;
  // Remove extension and timestamp prefix
  const clean = filename
    .replace(/\.\w+$/, "")
    .replace(/^\d{13}-\w{11}/, "")
    .replace(/[-_]/g, " ")
    .trim();

  if (clean.length > 2) {
    return `拍摄于${new Date().toLocaleDateString("zh-CN")}`;
  }
  return `拍摄于${new Date().toLocaleDateString("zh-CN")}`;
}
