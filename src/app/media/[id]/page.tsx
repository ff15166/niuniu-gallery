"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import type { Media } from "@/lib/types";
import DarkModeToggle from "@/components/DarkModeToggle";
import ImageEditor from "@/components/ImageEditor";
import TagEditor from "@/components/TagEditor";
import { useToast } from "@/components/Toast";

export default function MediaDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();
  const [media, setMedia] = useState<Media | null>(null);
  const [loading, setLoading] = useState(true);
  const [showEditor, setShowEditor] = useState(false);
  const [caption, setCaption] = useState("");
  const [editTags, setEditTags] = useState<string[]>([]);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [editingCaption, setEditingCaption] = useState(false);
  const [dirty, setDirty] = useState(false);

  const fetchMedia = useCallback(async () => {
    try {
      const res = await fetch(`/api/media/${id}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setMedia(data);
      setCaption(data.caption ?? "");
      setEditTags(data.tags ?? []);
      setDirty(false);
    } catch {
      toast("加载失败");
    } finally {
      setLoading(false);
    }
  }, [id, toast]);

  const fetchAllTags = useCallback(async () => {
    try {
      const res = await fetch("/api/tags");
      if (res.ok) setAllTags(await res.json());
    } catch {}
  }, []);

  useEffect(() => {
    fetchMedia();
    fetchAllTags();
  }, [fetchMedia, fetchAllTags]);

  // Track dirty state for tags
  const handleTagsChange = (newTags: string[]) => {
    setEditTags(newTags);
    setDirty(true);
  };

  const handleSave = async () => {
    const res = await fetch(`/api/media/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ caption, tags: editTags }),
    });
    if (res.ok) {
      // Sync new tags to tags table
      for (const tag of editTags) {
        await fetch("/api/tags", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "create", name: tag }),
        }).catch(() => {});
      }
      toast("已保存");
      setEditingCaption(false);
      setDirty(false);
      fetchMedia();
      fetchAllTags();
    } else {
      toast("保存失败");
    }
  };

  const handleCancel = () => {
    if (!media) return;
    setEditTags(media.tags ?? []);
    setCaption(media.caption ?? "");
    setEditingCaption(false);
    setDirty(false);
  };

  const handleDelete = async () => {
    if (!confirm("确认删除？")) return;
    const res = await fetch(`/api/media/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast("已删除");
      router.push("/");
    } else {
      toast("删除失败");
    }
  };

  if (loading) return <div className="empty-state">加载中...</div>;
  if (!media) return <div className="empty-state">未找到</div>;

  return (
    <div className="app-layout">
      <header className="header">
        <div className="header-left">
          <Link href="/" className="btn btn-ghost">← 返回</Link>
          <span className="header-title">{media.filename}</span>
        </div>
        <div className="header-right">
          {dirty && (
            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn btn-primary btn-sm" onClick={handleSave}>
                💾 保存
              </button>
              <button className="btn btn-ghost btn-sm" onClick={handleCancel}>
                取消
              </button>
            </div>
          )}
          <DarkModeToggle />
        </div>
      </header>

      <main className="main-content">
        <div className="detail-page">
          <div className="detail-image-container card">
            {media.type === "video" ? (
              <video
                src={media.original_url}
                controls
                style={{ width: "100%", maxHeight: "70vh" }}
              />
            ) : (
              <Image
                src={media.original_url}
                alt={media.caption ?? media.filename}
                width={media.width ?? 800}
                height={media.height ?? 600}
                style={{ width: "100%", height: "auto", objectFit: "contain" }}
              />
            )}
          </div>

          <div className="detail-meta">
            <span>📁 {media.filename}</span>
            <span>📏 {formatSize(media.size)}</span>
            {media.width && media.height && (
              <span>📐 {media.width} × {media.height}</span>
            )}
            <span>📅 {new Date(media.created_at).toLocaleString("zh-CN")}</span>
            <span>{media.type === "video" ? "🎬 视频" : "📷 图片"}</span>
          </div>

          {/* Caption */}
          {editingCaption ? (
            <div style={{ marginBottom: 16 }}>
              <input
                className="input"
                placeholder="输入描述..."
                value={caption}
                onChange={(e) => {
                  setCaption(e.target.value);
                  setDirty(true);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSave();
                  if (e.key === "Escape") handleCancel();
                }}
                autoFocus
              />
            </div>
          ) : (
            <p
              className="detail-caption"
              onClick={() => setEditingCaption(true)}
              style={{ cursor: "pointer", minHeight: 24 }}
              title="点击编辑描述"
            >
              {media.caption || <span style={{ color: "var(--text-secondary)", opacity: 0.5 }}>点击添加描述...</span>}
            </p>
          )}

          {/* Tags - always editable */}
          <div style={{ marginBottom: 20 }}>
            <TagEditor
              tags={editTags}
              allTags={allTags}
              onChange={handleTagsChange}
            />
          </div>

          <div className="detail-actions">
            {media.type === "photo" && (
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => setShowEditor(true)}
              >
                🖼️ 编辑图片
              </button>
            )}
            <button className="btn btn-danger btn-sm" onClick={handleDelete}>
              🗑️ 删除
            </button>
            <a
              className="btn btn-ghost btn-sm"
              href={media.original_url}
              target="_blank"
              rel="noopener noreferrer"
            >
              ⬇️ 下载
            </a>
          </div>
        </div>
      </main>

      {showEditor && media.type === "photo" && (
        <ImageEditor
          src={media.original_url}
          onSave={async (dataUrl) => {
            const res = await fetch(dataUrl);
            const blob = await res.blob();
            const file = new File([blob], "edited.jpg", { type: "image/jpeg" });
            const fd = new FormData();
            fd.append("file", file);
            fd.append("caption", media.caption ?? "");
            fd.append("tags", JSON.stringify(media.tags));
            const uploadRes = await fetch("/api/upload", { method: "POST", body: fd });
            if (uploadRes.ok) {
              toast("已保存编辑");
              setShowEditor(false);
              const newMedia = await uploadRes.json();
              router.push(`/media/${newMedia.id}`);
            } else {
              toast("保存失败");
            }
          }}
          onClose={() => setShowEditor(false)}
        />
      )}
    </div>
  );
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}
