"use client";

interface BulkToolbarProps {
  count: number;
  onDelete: () => void;
  onTag: () => void;
  onClear: () => void;
}

export default function BulkToolbar({ count, onDelete, onTag, onClear }: BulkToolbarProps) {
  if (count === 0) return null;

  return (
    <div className="bulk-toolbar">
      <span className="bulk-count">已选 {count} 项</span>
      <button className="btn btn-ghost btn-sm" onClick={onTag}>
        🏷️ 改标签
      </button>
      <button className="btn btn-danger btn-sm" onClick={onDelete}>
        🗑️ 删除
      </button>
      <button className="btn btn-ghost btn-sm" onClick={onClear}>
        取消选择
      </button>
    </div>
  );
}
