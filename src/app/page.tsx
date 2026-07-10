"use client";

import { useEffect, useState, useCallback } from "react";
import type { Media } from "@/lib/types";
import Hero from "@/components/Hero";
import TagManager from "@/components/TagManager";
import MagazineGrid from "@/components/MagazineGrid";
import Skeleton from "@/components/Skeleton";
import UploadZone from "@/components/UploadZone";
import Lightbox from "@/components/Lightbox";
import BottomHero from "@/components/BottomHero";
import Footer from "@/components/Footer";
import BottomBar from "@/components/BottomBar";
import BulkToolbar from "@/components/BulkToolbar";
import Weather from "@/components/Weather";
import DarkModeToggle from "@/components/DarkModeToggle";
import { useToast } from "@/components/Toast";

export default function HomePage() {
  const [media, setMedia] = useState<Media[]>([]);
  const [filtered, setFiltered] = useState<Media[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectMode, setSelectMode] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [showDecorations, setShowDecorations] = useState(true);
  const { toast } = useToast();

  const fetchMedia = useCallback(async () => {
    try {
      const res = await fetch("/api/media?limit=500");
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setMedia(data);
    } catch {
      toast("加载失败");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const fetchTags = useCallback(async () => {
    try {
      const res = await fetch("/api/tags");
      if (res.ok) setTags(await res.json());
    } catch {}
  }, []);

  useEffect(() => {
    fetchMedia();
    fetchTags();
  }, [fetchMedia, fetchTags]);

  // Apply filters
  useEffect(() => {
    let result = [...media];
    if (activeTag) result = result.filter((m) => m.tags.includes(activeTag));
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (m) =>
          m.filename.toLowerCase().includes(q) ||
          m.caption?.toLowerCase().includes(q) ||
          m.tags.some((t) => t.toLowerCase().includes(q))
      );
    }
    if (dateFrom) {
      const from = new Date(dateFrom);
      result = result.filter((m) => new Date(m.created_at) >= from);
    }
    if (dateTo) {
      const to = new Date(dateTo);
      to.setHours(23, 59, 59, 999);
      result = result.filter((m) => new Date(m.created_at) <= to);
    }
    setFiltered(result);
  }, [media, activeTag, searchQuery, dateFrom, dateTo]);

  const handleUpload = async (files: File[], tags: string[] = []) => {
    for (const file of files) {
      const fd = new FormData();
      fd.append("file", file);
      if (tags.length > 0) fd.append("tags", JSON.stringify(tags));
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "上传失败" }));
        toast(err.error ?? "上传失败");
        continue;
      }
      toast(`已上传 ${file.name}`);
    }
    fetchMedia();
    fetchTags();
  };

  const handleDeleteSelected = async () => {
    if (!confirm(`确认删除 ${selectedIds.size} 项？`)) return;
    for (const id of selectedIds) {
      await fetch(`/api/media/${id}`, { method: "DELETE" });
    }
    toast(`已删除 ${selectedIds.size} 项`);
    setSelectedIds(new Set());
    setSelectMode(false);
    fetchMedia();
  };

  const handleBulkTagAdd = async (tag: string) => {
    const ids = Array.from(selectedIds);
    try {
      const res = await fetch("/api/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "addToMedia", tag, mediaIds: ids }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      toast(`已为 ${data.affected} 项添加标签「${tag}」`);
      fetchMedia();
      fetchTags();
    } catch {
      toast("操作失败");
    }
  };

  const handleBulkTagRemove = async (tag: string) => {
    const ids = Array.from(selectedIds);
    try {
      const res = await fetch("/api/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "removeFromMedia", tag, mediaIds: ids }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      toast(`已从 ${data.affected} 项移除标签「${tag}」`);
      fetchMedia();
      fetchTags();
    } catch {
      toast("操作失败");
    }
  };

  const handleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectAll = () => setSelectedIds(new Set(filtered.map((m) => m.id)));
  const handleInvert = () => {
    setSelectedIds((prev) => {
      const next = new Set<string>();
      filtered.forEach((m) => { if (!prev.has(m.id)) next.add(m.id); });
      return next;
    });
  };

  return (
    <div className="app-layout">
      {/* Header */}
      <header className="header">
        <div className="header-left">
          <span style={{ fontSize: 18 }}>📸</span>
          <span className="header-title">妞妞画廊</span>
        </div>
        <div className="header-right">
          <Weather />
          <DarkModeToggle />
        </div>
      </header>

      <main className="main-content">
        <Hero />

        {/* Section Header with Search */}
        <div className="section-header">
          <h2 className="section-title">精选照片</h2>
          <div className="section-controls">
            <div className="search-input-wrap">
              <span className="search-icon">🔍</span>
              <input
                className="search-input"
                placeholder="搜索..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button className="search-clear" onClick={() => setSearchQuery("")}>✕</button>
              )}
            </div>
            <div className="search-dates">
              <input
                type="date"
                className="input search-date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
              <span className="search-date-sep">至</span>
              <input
                type="date"
                className="input search-date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Tags */}
        <TagManager
          tags={tags}
          activeTag={activeTag}
          onSelect={setActiveTag}
          onRefresh={() => { fetchMedia(); fetchTags(); }}
        />

        {/* Upload Zone */}
        {showUpload && <UploadZone onUpload={handleUpload} />}

        {/* Magazine Grid */}
        {loading ? (
          <Skeleton count={8} />
        ) : (
          <MagazineGrid
            media={filtered}
            selectable={selectMode}
            selectedIds={selectedIds}
            onSelect={handleSelect}
            showDecorations={showDecorations}
          />
        )}

        {/* Bottom Hero */}
        {!loading && filtered.length > 0 && <BottomHero />}
      </main>

      <Footer />

      {/* Lightbox */}
      {lightboxIdx !== null && (
        <Lightbox
          media={filtered}
          index={lightboxIdx}
          onClose={() => setLightboxIdx(null)}
          onNavigate={setLightboxIdx}
        />
      )}

      {/* Bottom Bar */}
      <BottomBar
        onUpload={() => setShowUpload(!showUpload)}
        onSelectMode={() => {
          setSelectMode(!selectMode);
          if (selectMode) setSelectedIds(new Set());
        }}
        selectMode={selectMode}
      />

      {/* Bulk Toolbar */}
      <BulkToolbar
        count={selectedIds.size}
        total={filtered.length}
        allTags={tags}
        onDelete={handleDeleteSelected}
        onClear={() => setSelectedIds(new Set())}
        onSelectAll={handleSelectAll}
        onInvert={handleInvert}
        onBulkTagAdd={handleBulkTagAdd}
        onBulkTagRemove={handleBulkTagRemove}
      />
    </div>
  );
}
