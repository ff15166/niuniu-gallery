"use client";

import { useRef, useEffect, useState } from "react";

interface VideoThumbnailProps {
  src: string;
  alt: string;
}

export default function VideoThumbnail({ src, alt }: VideoThumbnailProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [thumbUrl, setThumbUrl] = useState<string | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    video.addEventListener("loadeddata", () => {
      // Seek to 0.5s to avoid black first frame
      video.currentTime = 0.5;
    });

    video.addEventListener("seeked", () => {
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0);
      setThumbUrl(canvas.toDataURL("image/jpeg", 0.7));
    });

    video.load();
  }, [src]);

  if (thumbUrl) {
    return <img src={thumbUrl} alt={alt} style={{ width: "100%", height: "100%", objectFit: "cover" }} />;
  }

  return (
    <>
      <video
        ref={videoRef}
        src={src}
        muted
        preload="metadata"
        style={{ display: "none" }}
      />
      <canvas ref={canvasRef} style={{ display: "none" }} />
      <div className="video-thumb-placeholder">
        <span>🎬</span>
      </div>
    </>
  );
}
