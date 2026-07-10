"use client";

import { useState } from "react";

interface TagManagerProps {
  tags: string[];
  activeTag: string | null;
  onSelect: (tag: string | null) => void;
  onRefresh: () => void;
}

export default function TagManager({ tags, activeTag, onSelect, onRefresh }: TagManagerProps) {
  const [managing, setManaging] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [newTag, setNewTag] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);

  const handleAdd = async () => {
    const name = newTag.trim();
    if (!name) return;
    // Tags are stored on media items, so "adding" a tag means it'll appear when a media uses it
    // For now just close the dialog - user assigns tags during upload/edit
    setNewTag("");
    setShowAdd(false);
  };

  const handleDeleteTag = async (tag: string) => {
    if (!confirm(`删除标签「${tag}」？这会从所有使用该标签的媒体中移除。`)) return;
    setDeleting(tag);
    try {
      // Fetch all media, remove the tag from those that have it
      const res = await fetch("/api/media?limit=500");
      const media = await res.json();
      const affected = media.filter((m: { tags: string[] }) => m.tags.includes(tag));
      for (const m of affected) {
        await fetch(`/api/media/${m.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tags: m.tags.filter((t: string) => t !== tag) }),
        });
      }
      onRefresh();
    } catch {
      // ignore
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="tag-manager">
      <div className="tag-nav">
        <button
          className={`tag-btn ${activeTag === null ? "active" : ""}`}
          onClick={() => onSelect(null)}
        >
          全部
        </button>
        {tags.map((tag) => (
          <button
            key={tag}
            className={`tag-btn ${activeTag === tag ? "active" : ""}`}
            onClick={() => managing ? undefined : onSelect(tag === activeTag ? null : tag)}
          >
            {tag}
            {managing && (
              <span
                className="tag-delete"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteTag(tag);
                }}
              >
                {deleting === tag ? "..." : "✕"}
              </span>
            )}
          </button>
        ))}
        <button className="tag-btn tag-btn-add" onClick={() => setShowAdd(true)}>
          ＋
        </button>
        <button
          className={`tag-btn tag-btn-manage ${managing ? "active" : ""}`}
          onClick={() => setManaging(!managing)}
        >
          {managing ? "完成" : "管理"}
        </button>
      </div>

      {showAdd && (
        <div className="modal-overlay" onClick={() => setShowAdd(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">添加标签</h3>
            <input
              className="input"
              placeholder="新标签名称"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              autoFocus
            />
            <p style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 8 }}>
              提示：标签会在上传或编辑媒体时自动创建
            </p>
            <div className="modal-actions">
              <button className="btn btn-ghost btn-sm" onClick={() => setShowAdd(false)}>
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
