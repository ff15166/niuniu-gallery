"use client";

import { useState } from "react";
import TagEditor from "./TagEditor";

interface BulkToolbarProps {
  count: number;
  total: number;
  allTags: string[];
  onDelete: () => void;
  onClear: () => void;
  onSelectAll: () => void;
  onInvert: () => void;
  onBulkTagAdd: (tag: string) => void;
  onBulkTagRemove: (tag: string) => void;
}

export default function BulkToolbar({
  count,
  total,
  allTags,
  onDelete,
  onClear,
  onSelectAll,
  onInvert,
  onBulkTagAdd,
  onBulkTagRemove,
}: BulkToolbarProps) {
  const [showTagPanel, setShowTagPanel] = useState(false);
  const [addTag, setAddTag] = useState("");
  const [removeTag, setRemoveTag] = useState("");

  if (count === 0) return null;

  return (
    <>
      <div className="bulk-toolbar">
        <span className="bulk-count">已选 {count} / {total} 项</span>
        <button className="btn btn-ghost btn-sm" onClick={onSelectAll}>
          ☑️ 全选
        </button>
        <button className="btn btn-ghost btn-sm" onClick={onInvert}>
          🔄 反选
        </button>
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => setShowTagPanel(!showTagPanel)}
        >
          🏷️ 改标签
        </button>
        <button className="btn btn-danger btn-sm" onClick={onDelete}>
          🗑️ 删除
        </button>
        <button className="btn btn-ghost btn-sm" onClick={onClear}>
          取消选择
        </button>
      </div>

      {showTagPanel && (
        <div className="modal-overlay" onClick={() => setShowTagPanel(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">🏷️ 批量编辑标签（已选 {count} 项）</h3>

            <div style={{ marginBottom: 16 }}>
              <label className="editor-label">添加标签</label>
              <div style={{ display: "flex", gap: 8 }}>
                <div style={{ flex: 1 }}>
                  <TagEditor
                    tags={addTag ? [addTag] : []}
                    allTags={allTags}
                    onChange={(tags) => setAddTag(tags[0] ?? "")}
                    compact
                  />
                </div>
                <button
                  className="btn btn-primary btn-sm"
                  disabled={!addTag}
                  onClick={() => {
                    onBulkTagAdd(addTag);
                    setAddTag("");
                  }}
                >
                  添加
                </button>
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label className="editor-label">移除标签</label>
              <div style={{ display: "flex", gap: 8 }}>
                <div style={{ flex: 1 }}>
                  <TagEditor
                    tags={removeTag ? [removeTag] : []}
                    allTags={allTags}
                    onChange={(tags) => setRemoveTag(tags[0] ?? "")}
                    compact
                  />
                </div>
                <button
                  className="btn btn-danger btn-sm"
                  disabled={!removeTag}
                  onClick={() => {
                    onBulkTagRemove(removeTag);
                    setRemoveTag("");
                  }}
                >
                  移除
                </button>
              </div>
            </div>

            <div className="modal-actions">
              <button className="btn btn-ghost btn-sm" onClick={() => setShowTagPanel(false)}>
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
