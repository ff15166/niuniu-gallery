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

  return (
    <section className="hero">
      <div className="hero-content">
        <h1 className="hero-title">妞妞画廊</h1>
        <p className="hero-subtitle">记录生活中的每一个美好瞬间</p>
        <div className="hero-stats">
          <div className="hero-stat">
            <span className="hero-stat-number">{stats.photos}</span>
            <span className="hero-stat-label">照片</span>
          </div>
          <div className="hero-stat-divider" />
          <div className="hero-stat">
            <span className="hero-stat-number">{stats.videos}</span>
            <span className="hero-stat-label">视频</span>
          </div>
          <div className="hero-stat-divider" />
          <div className="hero-stat">
            <span className="hero-stat-number">{stats.tags}</span>
            <span className="hero-stat-label">标签</span>
          </div>
        </div>
      </div>
    </section>
  );
}
