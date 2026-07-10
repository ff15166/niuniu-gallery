"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useParams } from "next/navigation";
import type { Media } from "@/lib/types";
import TagSidebar from "@/components/TagSidebar";
import PhotoGrid from "@/components/PhotoGrid";
import DarkModeToggle from "@/components/DarkModeToggle";
import { useToast } from "@/components/Toast";

export default function TagDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const tag = decodeURIComponent(slug);
  const { toast } = useToast();
  const [media, setMedia] = useState<Media[]>([]);
  const [allMedia, setAllMedia] = useState<Media[]>([]);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const tagCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const m of allMedia) {
      for (const t of m.tags) {
        counts[t] = (counts[t] || 0) + 1;
      }
    }
    return counts;
  }, [allMedia]);

  const fetchData = useCallback(async () => {
    try {
      const [mediaRes, tagsRes] = await Promise.all([
        fetch(`/api/media?limit=200`),
        fetch("/api/tags"),
      ]);
      if (mediaRes.ok) {
        const all: Media[] = await mediaRes.json();
        setAllMedia(all);
        setMedia(all.filter((m) => m.tags.includes(tag)));
      }
      if (tagsRes.ok) setAllTags(await tagsRes.json());
    } catch {
      toast("加载失败");
    } finally {
      setLoading(false);
    }
  }, [tag, toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div className="app-layout">
      <TagSidebar tags={allTags} tagCounts={tagCounts} />

      <header className="header">
        <div className="header-left">
          <span className="header-title">🏷️ {tag}</span>
        </div>
        <div className="header-right">
          <DarkModeToggle />
        </div>
      </header>

      <main className="main-content">
        {loading ? (
          <div className="empty-state">加载中...</div>
        ) : media.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🏷️</div>
            <h3>没有「{tag}」的照片</h3>
          </div>
        ) : (
          <PhotoGrid media={media} />
        )}
      </main>
    </div>
  );
}
