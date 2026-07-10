"use client";

import type { Media } from "@/lib/types";
import MediaCard from "./MediaCard";

interface PhotoGridProps {
  media: Media[];
  selectable?: boolean;
  selectedIds?: Set<string>;
  onSelect?: (id: string) => void;
}

// 12-size cycle: grid-column span patterns for magazine layout
// Each group of 12 items gets a repeating decoration pattern
const SIZE_CYCLE = [
  { colSpan: 2, rowSpan: 2 }, // 1: large
  { colSpan: 1, rowSpan: 1 }, // 2: small
  { colSpan: 1, rowSpan: 1 }, // 3: small
  { colSpan: 1, rowSpan: 2 }, // 4: tall
  { colSpan: 2, rowSpan: 1 }, // 5: wide
  { colSpan: 1, rowSpan: 1 }, // 6: small
  { colSpan: 1, rowSpan: 1 }, // 7: small
  { colSpan: 2, rowSpan: 2 }, // 8: large
  { colSpan: 1, rowSpan: 1 }, // 9: small
  { colSpan: 1, rowSpan: 2 }, // 10: tall
  { colSpan: 1, rowSpan: 1 }, // 11: small
  { colSpan: 1, rowSpan: 1 }, // 12: small
];

// Decorations to apply every 4 cards
const DECORATIONS = [
  "deco-polaroid",
  "deco-collage",
  "deco-filmstrip",
  "deco-art-border",
];

function getSizeForIndex(index: number) {
  return SIZE_CYCLE[index % 12];
}

function getDecoForIndex(index: number) {
  return DECORATIONS[Math.floor(index / 4) % DECORATIONS.length];
}

export default function PhotoGrid({
  media,
  selectable,
  selectedIds,
  onSelect,
}: PhotoGridProps) {
  if (media.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-icon">📷</div>
        <h3>还没有照片</h3>
        <p>上传第一张照片开始吧！</p>
      </div>
    );
  }

  return (
    <div className="photo-grid-magazine">
      {media.map((m, i) => {
        const size = getSizeForIndex(i);
        const deco = getDecoForIndex(i);
        return (
          <div
            key={m.id}
            className={`grid-item grid-col-${size.colSpan} grid-row-${size.rowSpan}`}
          >
            <MediaCard
              media={m}
              decoration={deco}
              selectable={selectable}
              selected={selectedIds?.has(m.id)}
              onSelect={onSelect}
            />
          </div>
        );
      })}
    </div>
  );
}
