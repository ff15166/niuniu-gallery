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
  const [renaming, setRenaming] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAdd = async () => {
    const name = newTag.trim();
    if (!name) return;
    if (tags.includes(name)) {
      alert("标签已存在");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create", name }),
      });
      if (!res.ok) throw new Error("Failed");
      setNewTag("");
      setShowAdd(false);
      onRefresh();
    } catch {
      alert("创建失败");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTag = async (tag: string) => {
    if (!confirm(`删除标签「${tag}」？\n这会从所有使用该标签的媒体中移除。`)) return;
    setDeleting(tag);
    try {
      const res = await fetch("/api/tags", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: tag }),
      });
      if (!res.ok) throw new Error("Failed");
      if (activeTag === tag) onSelect(null);
      onRefresh();
    } catch {
      alert("删除失败");
    } finally {
      setDeleting(null);
    }
  };

  const handleRenameStart = (tag: string) => {
    setRenaming(tag);
    setRenameValue(tag);
  };

  const handleRenameSubmit = async () => {
    if (!renaming) return;
    const newName = renameValue.trim();
    if (!newName || newName === renaming) {
      setRenaming(null);
      return;
    }
    if (tags.includes(newName)) {
      alert("目标标签名已存在");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/tags", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "rename", name: renaming, newName }),
      });
      if (!res.ok) throw new Error("Failed");
      if (activeTag === renaming) onSelect(newName);
      setRenaming(null);
      onRefresh();
    } catch {
      alert("重命名失败");
    } finally {
      setLoading(false);
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
            {renaming === tag ? (
              <input
                className="tag-rename-input"
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleRenameSubmit();
                  if (e.key === "Escape") setRenaming(null);
                }}
                onBlur={handleRenameSubmit}
                autoFocus
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <>
                {tag}
                {managing && (
                  <span className="tag-actions">
                    <span
                      className="tag-action"
                      title="重命名"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRenameStart(tag);
                      }}
                    >
                      ✏️
                    </span>
                    <span
                      className="tag-action"
                      title="删除"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteTag(tag);
                      }}
                    >
                      {deleting === tag ? "..." : "✕"}
                    </span>
                  </span>
                )}
              </>
            )}
          </button>
        ))}
        <button className="tag-btn tag-btn-add" onClick={() => setShowAdd(true)}>
          ＋
        </button>
        <button
          className={`tag-btn tag-btn-manage ${managing ? "active" : ""}`}
          onClick={() => {
            setManaging(!managing);
            setRenaming(null);
          }}
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
            <div className="modal-actions">
              <button className="btn btn-ghost btn-sm" onClick={() => setShowAdd(false)}>
                取消
              </button>
              <button
                className="btn btn-primary btn-sm"
                onClick={handleAdd}
                disabled={loading || !newTag.trim()}
              >
                {loading ? "创建中..." : "创建"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
