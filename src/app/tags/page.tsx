"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import TagSidebar from "@/components/TagSidebar";
import DarkModeToggle from "@/components/DarkModeToggle";

export default function TagsPage() {
  const [tags, setTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTags = useCallback(async () => {
    try {
      const res = await fetch("/api/tags");
      if (res.ok) setTags(await res.json());
    } catch {} finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTags();
  }, [fetchTags]);

  return (
    <div className="app-layout">
      <TagSidebar tags={tags} />

      <header className="header">
        <div className="header-left">
          <span className="header-title">所有标签</span>
        </div>
        <div className="header-right">
          <DarkModeToggle />
        </div>
      </header>

      <main className="main-content">
        {loading ? (
          <div className="empty-state">加载中...</div>
        ) : tags.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🏷️</div>
            <h3>暂无标签</h3>
            <p>上传照片时添加标签</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
            {tags.map((tag) => (
              <Link
                key={tag}
                href={`/tags/${encodeURIComponent(tag)}`}
                className="tag"
                style={{ fontSize: 16, padding: "8px 16px" }}
              >
                🏷️ {tag}
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
