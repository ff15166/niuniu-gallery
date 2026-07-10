"use client";

import type { Media } from "@/lib/types";
import MediaCard from "./MediaCard";

interface PhotoGridProps {
  media: Media[];
  selectable?: boolean;
  selectedIds?: Set<string>;
  onSelect?: (id: string) => void;
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
    <div className="photo-grid grid-container">
      {media.map((m) => (
        <MediaCard
          key={m.id}
          media={m}
          selectable={selectable}
          selected={selectedIds?.has(m.id)}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}
