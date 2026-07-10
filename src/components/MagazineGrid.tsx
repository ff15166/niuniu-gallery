"use client";

import { useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import type { Media } from "@/lib/types";

interface MagazineGridProps {
  media: Media[];
  selectable?: boolean;
  selectedIds?: Set<string>;
  onSelect?: (id: string) => void;
  showDecorations?: boolean;
}

// Layout patterns for magazine-style grid
// Each pattern is an array of cell sizes: [colSpan, rowSpan]
const PATTERNS: [number, number][][] = [
  [[2,2],[1,1],[1,1],[1,2],[1,1],[2,1],[1,1],[1,1]],
  [[1,2],[2,2],[1,1],[1,1],[1,1],[1,2],[2,1],[1,1]],
  [[1,1],[1,1],[2,2],[1,2],[2,1],[1,1],[1,1],[1,1]],
  [[2,1],[1,1],[1,2],[2,2],[1,1],[1,1],[1,1],[1,2]],
];

const DECORATIONS = ["quote", "date", "film", "geometric", "camera"] as const;

const QUOTES = [
  { text: "每一帧都值得被看见", author: "记录美好" },
  { text: "时光会走远，照片会留下", author: "珍惜当下" },
  { text: "镜头是心灵的窗口", author: "摄影艺术" },
  { text: "光影之间，是最真实的生活", author: "日常之美" },
  { text: "快门按下的那一刻，时间停止", author: "定格瞬间" },
];

function getDateInfo() {
  const now = new Date();
  const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  return {
    month: months[now.getMonth()],
    day: now.getDate(),
    year: now.getFullYear(),
  };
}

export default function MagazineGrid({
  media,
  selectable,
  selectedIds,
  onSelect,
  showDecorations = true,
}: MagazineGridProps) {
  const cells = useMemo(() => {
    if (media.length === 0) return [];

    const pattern = PATTERNS[media.length % PATTERNS.length];
    const result: (
      | { type: "photo"; media: Media; col: number; row: number }
      | { type: "deco"; deco: string; col: number; row: number }
    )[] = [];

    let mediaIdx = 0;
    let decoIdx = 0;
    const quoteIdx = Math.floor(Math.random() * QUOTES.length);
    const date = getDateInfo();

    for (const [col, row] of pattern) {
      if (mediaIdx >= media.length) break;

      // Insert decoration every 5th cell if enabled
      const shouldDeco = showDecorations && result.length > 0 && result.length % 5 === 4;

      if (shouldDeco) {
        const decoType = DECORATIONS[decoIdx % DECORATIONS.length];
        result.push({ type: "deco", deco: decoType, col, row });
        decoIdx++;
      }

      result.push({ type: "photo", media: media[mediaIdx], col, row });
      mediaIdx++;
    }

    // Fill remaining media without decorations
    while (mediaIdx < media.length) {
      const [col, row] = pattern[mediaIdx % pattern.length];
      result.push({ type: "photo", media: media[mediaIdx], col, row });
      mediaIdx++;
    }

    return result;
  }, [media, showDecorations]);

  if (media.length === 0) return null;

  const date = getDateInfo();
  const quote = QUOTES[Math.floor(Math.random() * QUOTES.length)];

  return (
    <div className="magazine-grid">
      {cells.map((cell, i) => {
        if (cell.type === "deco") {
          return (
            <div
              key={`deco-${i}`}
              className="grid-item"
              style={{ gridColumn: `span ${cell.col}`, gridRow: `span ${cell.row}` }}
            >
              {renderDecoration(cell.deco, date, quote)}
            </div>
          );
        }

        const m = cell.media;
        const isSelected = selectedIds?.has(m.id);

        return (
          <div
            key={m.id}
            className={`grid-item ${isSelected ? "selected" : ""}`}
            style={{ gridColumn: `span ${cell.col}`, gridRow: `span ${cell.row}` }}
            onClick={() => onSelect?.(m.id)}
          >
            {selectable && (
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => onSelect?.(m.id)}
                className="grid-checkbox"
                onClick={(e) => e.stopPropagation()}
                style={{
                  position: "absolute",
                  top: 8,
                  left: 8,
                  zIndex: 5,
                  width: 18,
                  height: 18,
                  cursor: "pointer",
                }}
              />
            )}
            <Link href={`/media/${m.id}`} className="grid-photo">
              {(m.thumbnail_url || m.original_url) ? (
                <img
                  src={m.thumbnail_url || m.original_url}
                  alt={m.caption ?? m.filename}
                  loading="lazy"
                />
              ) : (
                <div style={{
                  width: "100%",
                  height: "100%",
                  background: "var(--bg-secondary)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 32,
                }}>
                  📷
                </div>
              )}
              {m.type === "video" && <span className="video-badge">▶ 视频</span>}
              <div className="grid-photo-overlay">
                {m.caption && <div className="grid-photo-title">{m.caption}</div>}
                {m.tags.length > 0 && (
                  <div>
                    {m.tags.slice(0, 3).map((t) => (
                      <span key={t} className="grid-photo-tag">{t}</span>
                    ))}
                  </div>
                )}
              </div>
            </Link>
          </div>
        );
      })}
    </div>
  );
}

function renderDecoration(
  type: string,
  date: { month: string; day: number; year: number },
  quote: { text: string; author: string }
) {
  switch (type) {
    case "quote":
      return (
        <div className="deco-cell">
          <div>
            <div className="deco-quote">&ldquo;{quote.text}&rdquo;</div>
            <div className="deco-quote-author">— {quote.author}</div>
          </div>
        </div>
      );
    case "date":
      return (
        <div className="deco-cell">
          <div className="deco-date-stamp">
            <div className="deco-date-month">{date.month}</div>
            <div className="deco-date-day">{date.day}</div>
          </div>
        </div>
      );
    case "film":
      return <div className="deco-cell deco-film-strip" />;
    case "geometric":
      return <div className="deco-cell deco-geometric" />;
    case "camera":
      return (
        <div className="deco-cell deco-camera">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
            <circle cx="12" cy="13" r="4"/>
          </svg>
          <span className="deco-camera-text">Photography</span>
        </div>
      );
    default:
      return null;
  }
}
