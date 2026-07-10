"use client";

import { useEffect, useState, useCallback } from "react";
import type { Media } from "@/lib/types";
import TagSidebar from "@/components/TagSidebar";
import Hero from "@/components/Hero";
import SearchBar from "@/components/SearchBar";
import PhotoGrid from "@/components/PhotoGrid";
import Skeleton from "@/components/Skeleton";
import UploadZone from "@/components/UploadZone";
import Lightbox from "@/components/Lightbox";
import BulkToolbar from "@/components/BulkToolbar";
import Weather from "@/components/Weather";
import BackgroundMusic from "@/components/BackgroundMusic";
import { useToast } from "@/components/Toast";

export default function HomePage() {
  const [media, setMedia] = useState<Media[]>([]);
  const [filtered, setFiltered] = useState<Media[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectMode, setSelectMode] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const { toast } = useToast();

  const fetchMedia = useCallback(async () => {
    try {
      const res = await fetch("/api/media?limit=500");
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setMedia(data);
      setFiltered(data);
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

  const handleSearch = useCallback(
    (query: string, dateFrom: string, dateTo: string) => {
      let result = [...media];

      if (query) {
        const q = query.toLowerCase();
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
    },
    [media]
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
        onDelete={handleDeleteSelected}
        onTag={() => toast("标签编辑功能开发中")}
        onClear={() => setSelectedIds(new Set())}
      />
    </div>
  );
}
