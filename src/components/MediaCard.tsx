"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import type { Media } from "@/lib/types";

interface MediaCardProps {
  media: Media;
  decoration?: string;
  selectable?: boolean;
  selected?: boolean;
  onSelect?: (id: string) => void;
}

const DECORATIONS = [
  "deco-polaroid",
  "deco-collage",
  "deco-filmstrip",
  "deco-art-border",
  "deco-torn",
  "deco-offset-shadow",
];

function pickDecoration(index: number): string {
  return DECORATIONS[index % DECORATIONS.length];
}

export default function MediaCard({
  media,
  decoration,
  selectable,
  selected,
  onSelect,
}: MediaCardProps) {
  const [imgError, setImgError] = useState(false);
  const deco = decoration ?? pickDecoration(Math.abs(hashCode(media.id)));

  const src = imgError
    ? "/placeholder.svg"
    : media.thumbnail_url || media.original_url;

  return (
    <div
      className={`media-card card ${deco} ${selected ? "selected" : ""}`}
      onClick={() => onSelect?.(media.id)}
    >
      {selectable && (
        <input
          type="checkbox"
          checked={selected}
          onChange={() => onSelect?.(media.id)}
          className="media-card-checkbox"
          onClick={(e) => e.stopPropagation()}
        />
      )}

      <Link href={`/media/${media.id}`} className="media-card-link">
        <div className="media-card-image">
          {media.type === "video" ? (
            <div className="video-thumb">
              <Image
                src={src}
                alt={media.caption ?? media.filename}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                style={{ objectFit: "cover" }}
                onError={() => setImgError(true)}
              />
              <span className="video-play-icon">▶</span>
            </div>
          ) : (
            <Image
              src={src}
              alt={media.caption ?? media.filename}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              style={{ objectFit: "cover" }}
              onError={() => setImgError(true)}
            />
          )}
        </div>

        <div className="media-card-info">
          {media.caption && (
            <p className="media-card-caption">{media.caption}</p>
          )}
          {media.tags.length > 0 && (
            <div className="media-card-tags">
              {media.tags.slice(0, 3).map((t) => (
                <span key={t} className="tag">{t}</span>
              ))}
            </div>
          )}
        </div>
      </Link>
    </div>
  );
}

function hashCode(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  }
  return h;
}
