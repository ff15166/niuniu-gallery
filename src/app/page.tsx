"use client";

import { useEffect, useState, useCallback } from "react";
import type { Media } from "@/lib/types";
import TagSidebar from "@/components/TagSidebar";
import Hero from "@/components/Hero";
import SearchBar from "@/components/SearchBar";
import TagManager from "@/components/TagManager";
import PhotoGrid from "@/components/PhotoGrid";
import Skeleton from "@/components/Skeleton";
import UploadZone from "@/components/UploadZone";
import Lightbox from "@/components/Lightbox";
import BottomHero from "@/components/BottomHero";
import BulkToolbar from "@/components/BulkToolbar";
import Weather from "@/components/Weather";
import BackgroundMusic from "@/components/BackgroundMusic";
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

  // Apply filters whenever media, activeTag, search, or dates change
  useEffect(() => {
    let result = [...media];

    if (activeTag) {
      result = result.filter((m) => m.tags.includes(activeTag));
    }

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

  const handleSearch = useCallback(
    (query: string, from: string, to: string) => {
      setSearchQuery(query);
      setDateFrom(from);
      setDateTo(to);
    },
    []
  );

  const handleUpload = async (files: File[]) => {
    for (const file of files) {
      const fd = new FormData();
      fd.append("file", file);
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

  const handleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectAll = () => {
    setSelectedIds(new Set(filtered.map((m) => m.id)));
  };

  const handleInvert = () => {
    setSelectedIds((prev) => {
      const next = new Set<string>();
      filtered.forEach((m) => {
        if (!prev.has(m.id)) next.add(m.id);
      });
      return next;
    });
  };

  return (
    <div className="app-layout">
      <TagSidebar tags={tags} />

      <header className="header">
        <div className="header-left">
          <button className="btn btn-ghost" onClick={() => setShowUpload(!showUpload)}>
            📤 上传
          </button>
          <button
            className={`btn btn-ghost ${selectMode ? "active" : ""}`}
            onClick={() => {
              setSelectMode(!selectMode);
              if (selectMode) setSelectedIds(new Set());
            }}
          >
            ☑️ 选择
          </button>
        </div>
        <div className="header-right">
          <Weather />
          <BackgroundMusic />
        </div>
      </header>

      <main className="main-content">
        <Hero />
        <SearchBar onSearch={handleSearch} />
        <TagManager
          tags={tags}
          activeTag={activeTag}
          onSelect={setActiveTag}
          onRefresh={() => {
            fetchMedia();
            fetchTags();
          }}
        />

        {showUpload && <UploadZone onUpload={handleUpload} />}

        {loading ? (
          <Skeleton count={8} />
        ) : (
          <PhotoGrid
            media={filtered}
            selectable={selectMode}
            selectedIds={selectedIds}
            onSelect={handleSelect}
          />
        )}

        {!loading && filtered.length > 0 && <BottomHero />}
      </main>

      {lightboxIdx !== null && (
        <Lightbox
          media={filtered}
          index={lightboxIdx}
          onClose={() => setLightboxIdx(null)}
          onNavigate={setLightboxIdx}
        />
      )}

      <BulkToolbar
        count={selectedIds.size}
        total={filtered.length}
        onDelete={handleDeleteSelected}
        onTag={() => toast("标签编辑功能开发中")}
        onClear={() => setSelectedIds(new Set())}
        onSelectAll={handleSelectAll}
        onInvert={handleInvert}
      />
    </div>
  );
}
