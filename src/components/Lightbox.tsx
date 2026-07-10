"use client";

import Image from "next/image";
import { useEffect, useState, useCallback } from "react";
import type { Media } from "@/lib/types";

interface LightboxProps {
  media: Media[];
  index: number;
  onClose: () => void;
  onNavigate: (index: number) => void;
}

export default function Lightbox({ media, index, onClose, onNavigate }: LightboxProps) {
  const [imgError, setImgError] = useState(false);
  const current = media[index];

  const goNext = useCallback(() => {
    if (index < media.length - 1) onNavigate(index + 1);
  }, [index, media.length, onNavigate]);

  const goPrev = useCallback(() => {
    if (index > 0) onNavigate(index - 1);
  }, [index, onNavigate]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft") goPrev();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose, goNext, goPrev]);

  if (!current) return null;

  const src = imgError ? "/placeholder.svg" : current.original_url;

  return (
    <div className="lightbox-overlay" onClick={onClose}>
      <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
        <button className="lightbox-close" onClick={onClose}>✕</button>

        {index > 0 && (
          <button className="lightbox-prev" onClick={goPrev}>‹</button>
        )}

        <div className="lightbox-media">
          {current.type === "video" ? (
            <video
              src={current.original_url}
              controls
              autoPlay
              className="lightbox-video"
            />
          ) : (
            <Image
              src={src}
              alt={current.caption ?? current.filename}
              fill
              style={{ objectFit: "contain" }}
              onError={() => setImgError(true)}
              priority
            />
          )}
        </div>

        {index < media.length - 1 && (
          <button className="lightbox-next" onClick={goNext}>›</button>
        )}

        <div className="lightbox-info">
          {current.caption && <p>{current.caption}</p>}
          <span className="lightbox-counter">
            {index + 1} / {media.length}
          </span>
        </div>
      </div>
    </div>
  );
}
