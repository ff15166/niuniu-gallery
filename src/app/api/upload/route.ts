import { NextResponse } from "next/server";
import { ensureDb } from "@/lib/ensure-db";
import { createMedia } from "@/lib/media-data";

export async function POST(request: Request) {
  try {
    await ensureDb();
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const caption = (formData.get("caption") as string) ?? undefined;
    const tagsRaw = formData.get("tags") as string | null;
    let tags: string[] = [];
    if (tagsRaw) {
      try {
        tags = JSON.parse(tagsRaw);
      } catch {
        // Fallback: comma-separated string
        tags = tagsRaw.split(",").map((t) => t.trim()).filter(Boolean);
      }
    }

    if (!file) {
      return NextResponse.json({ error: "No file" }, { status: 400 });
    }

    const isVideo = file.type.startsWith("video/");
    const maxSize = isVideo ? 200 * 1024 * 1024 : 20 * 1024 * 1024;

    if (file.size > maxSize) {
      return NextResponse.json(
        { error: `文件过大，限制 ${isVideo ? "200MB" : "20MB"}` },
        { status: 413 }
      );
    }

    // For local dev: save to public/uploads/
    // For production: use Vercel Blob
    let originalUrl: string;
    let thumbnailUrl: string | undefined;
    let width: number | undefined;
    let height: number | undefined;

    if (process.env.BLOB_READ_WRITE_TOKEN) {
      // Production: Vercel Blob
      const { put } = await import("@vercel/blob");
      const ext = file.name.split(".").pop() ?? "bin";
      const blobPath = `gallery/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const blob = await put(blobPath, file, { access: "public" });
      originalUrl = blob.url;

      if (!isVideo) {
        const sharp = (await import("sharp")).default;
        const buffer = Buffer.from(await file.arrayBuffer());
        const metadata = await sharp(buffer).metadata();
        width = metadata.width;
        height = metadata.height;

        const thumbBuffer = await sharp(buffer)
          .resize(400, 400, { fit: "cover" })
          .webp({ quality: 80 })
          .toBuffer();

        const thumbBlob = await put(
          `gallery/thumbs/${Date.now()}-${Math.random().toString(36).slice(2)}.webp`,
          thumbBuffer,
          { access: "public", contentType: "image/webp" }
        );
        thumbnailUrl = thumbBlob.url;
      }
    } else {
      // Local dev: save to public/uploads/
      const { mkdirSync, writeFileSync, existsSync } = await import("fs");
      const { join } = await import("path");
      const uploadsDir = join(process.cwd(), "public", "uploads");
      if (!existsSync(uploadsDir)) mkdirSync(uploadsDir, { recursive: true });

      const ext = file.name.split(".").pop() ?? "bin";
      const safeName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const buffer = Buffer.from(await file.arrayBuffer());
      writeFileSync(join(uploadsDir, safeName), buffer);
      originalUrl = `/uploads/${safeName}`;

      if (!isVideo) {
        try {
          const sharp = (await import("sharp")).default;
          const metadata = await sharp(buffer).metadata();
          width = metadata.width;
          height = metadata.height;

          const thumbName = `thumb-${safeName.replace(/\.\w+$/, ".webp")}`;
          const thumbBuffer = await sharp(buffer)
            .resize(400, 400, { fit: "cover" })
            .webp({ quality: 80 })
            .toBuffer();
          writeFileSync(join(uploadsDir, thumbName), thumbBuffer);
          thumbnailUrl = `/uploads/${thumbName}`;
        } catch {
          // sharp might not be available, skip thumbnail
        }
      }
    }

    const media = await createMedia({
      filename: file.name,
      original_url: originalUrl,
      thumbnail_url: thumbnailUrl,
      type: isVideo ? "video" : "photo",
      size: file.size,
      width,
      height,
      caption,
      tags,
    });

    return NextResponse.json(media, { status: 201 });
  } catch (err) {
    console.error("POST /api/upload error:", err);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
