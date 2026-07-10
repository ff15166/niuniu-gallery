"use client";

import { useEffect, useState } from "react";

interface Stats {
  photos: number;
  videos: number;
  tags: number;
}

export default function Hero() {
  const [stats, setStats] = useState<Stats>({ photos: 0, videos: 0, tags: 0 });

  useEffect(() => {
    fetch("/api/media?limit=500")
      .then((r) => r.json())
      .then((data) => {
        const photos = data.filter((m: { type: string }) => m.type === "photo").length;
        const videos = data.filter((m: { type: string }) => m.type === "video").length;
        const tagSet = new Set<string>();
        data.forEach((m: { tags: string[] }) => m.tags.forEach((t: string) => tagSet.add(t)));
        setStats({ photos, videos, tags: tagSet.size });
      })
      .catch(() => {});
  }, []);

  const today = new Date();
  const dateStr = `${today.getFullYear()}年${today.getMonth() + 1}月${today.getDate()}日`;

  return (
    <section className="hero">
      <div className="hero-image-wrap">
        <div className="hero-image-placeholder">
          <span>📸</span>
        </div>
      </div>
      <div className="hero-content">
        <div className="hero-deco">
          <div className="hero-camera-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
              <circle cx="12" cy="13" r="4"/>
            </svg>
          </div>
          <div className="hero-stamp">
            <div className="hero-stamp-month">{today.getMonth() + 1}月</div>
            <div className="hero-stamp-day">{today.getDate()}</div>
          </div>
        </div>
        <h1 className="hero-title">妞妞画廊</h1>
        <p className="hero-subtitle">记录生活中的每一个美好瞬间</p>
        <div className="hero-date">{dateStr}</div>
        <p className="hero-desc">
          每一张照片都是一段故事，每一个视频都是一份回忆。
          在这里，时光被温柔收藏。
        </p>
        <div className="hero-stats">
          <span className="hero-stat">{stats.photos} 张照片</span>
          <span className="hero-stat-sep">·</span>
          <span className="hero-stat">{stats.videos} 个视频</span>
          <span className="hero-stat-sep">·</span>
          <span className="hero-stat">{stats.tags} 个标签</span>
        </div>
      </div>
    </section>
  );
}
