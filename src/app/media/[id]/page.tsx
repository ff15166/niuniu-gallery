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
  const [editing, setEditing] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [caption, setCaption] = useState("");
  const [editTags, setEditTags] = useState<string[]>([]);
  const [allTags, setAllTags] = useState<string[]>([]);

  const fetchMedia = useCallback(async () => {
    try {
      const res = await fetch(`/api/media/${id}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setMedia(data);
      setCaption(data.caption ?? "");
      setEditTags(data.tags ?? []);
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

  const handleSave = async () => {
    const res = await fetch(`/api/media/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ caption, tags: editTags }),
    });
    if (res.ok) {
      toast("已保存");
      setEditing(false);
      fetchMedia();
      fetchAllTags();
    } else {
      toast("保存失败");
    }
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

          {editing ? (
            <div style={{ marginBottom: 16 }}>
              <input
                className="input"
                placeholder="描述"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                style={{ marginBottom: 12 }}
              />
              <div style={{ marginBottom: 12 }}>
                <label className="editor-label">标签</label>
                <TagEditor
                  tags={editTags}
                  allTags={allTags}
                  onChange={setEditTags}
                />
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button className="btn btn-primary btn-sm" onClick={handleSave}>
                  保存
                </button>
                <button className="btn btn-ghost btn-sm" onClick={() => {
                  setEditing(false);
                  setEditTags(media.tags ?? []);
                  setCaption(media.caption ?? "");
                }}>
                  取消
                </button>
              </div>
            </div>
          ) : (
            <>
              {media.caption && <p className="detail-caption">{media.caption}</p>}
              {media.tags.length > 0 && (
                <div className="detail-tags">
                  {media.tags.map((t) => (
                    <Link key={t} href={`/tags/${encodeURIComponent(t)}`} className="tag">
                      {t}
                    </Link>
                  ))}
                </div>
              )}
            </>
          )}

          <div className="detail-actions">
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => {
                setEditTags(media.tags ?? []);
                setCaption(media.caption ?? "");
                setEditing(!editing);
              }}
            >
              ✏️ 编辑信息
            </button>
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
