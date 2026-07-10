"use client";

interface BulkToolbarProps {
  count: number;
  total: number;
  onDelete: () => void;
  onTag: () => void;
  onClear: () => void;
  onSelectAll: () => void;
  onInvert: () => void;
}

export default function BulkToolbar({
  count,
  total,
  onDelete,
  onTag,
  onClear,
  onSelectAll,
  onInvert,
}: BulkToolbarProps) {
  if (count === 0) return null;

  return (
    <div className="bulk-toolbar">
      <span className="bulk-count">已选 {count} / {total} 项</span>
      <button className="btn btn-ghost btn-sm" onClick={onSelectAll}>
        ☑️ 全选
      </button>
      <button className="btn btn-ghost btn-sm" onClick={onInvert}>
        🔄 反选
      </button>
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
