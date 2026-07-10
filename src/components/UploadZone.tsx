"use client";

import { useRef, useState, useEffect, type DragEvent } from "react";
import TagEditor from "./TagEditor";

interface UploadZoneProps {
  onUpload: (files: File[], tags: string[]) => Promise<void>;
}

export default function UploadZone({ onUpload }: UploadZoneProps) {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [showConfirm, setShowConfirm] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/tags")
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setAllTags(data); })
      .catch(() => {});
  }, []);

  const handleFiles = (files: FileList | null) => {
    if (!files?.length) return;
    setPendingFiles(Array.from(files));
    setShowConfirm(true);
  };

  const doUpload = async () => {
    setShowConfirm(false);
    setUploading(true);
    setProgress(0);
    try {
      for (let i = 0; i < pendingFiles.length; i++) {
        await onUpload([pendingFiles[i]], selectedTags);
        setProgress(Math.round(((i + 1) / pendingFiles.length) * 100));
      }
    } finally {
      setUploading(false);
      setProgress(0);
      setPendingFiles([]);
    }
  };

  const cancelUpload = () => {
    setShowConfirm(false);
    setPendingFiles([]);
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  if (showConfirm) {
    return (
      <div className="upload-zone" style={{ cursor: "default" }}>
        <div className="upload-icon">📁</div>
        <p className="upload-text">
          已选择 <strong>{pendingFiles.length}</strong> 个文件
        </p>
        <div style={{ margin: "16px 0", maxWidth: 400, width: "100%" }}>
          <label className="editor-label">选择标签（可选）</label>
          <TagEditor
            tags={selectedTags}
            allTags={allTags}
            onChange={setSelectedTags}
          />
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
          <button className="btn btn-primary btn-sm" onClick={doUpload}>
            📤 确认上传
          </button>
          <button className="btn btn-ghost btn-sm" onClick={cancelUpload}>
            取消
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`upload-zone ${dragging ? "dragging" : ""}`}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
      onClick={() => inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*,video/*"
        multiple
        hidden
        onChange={(e) => handleFiles(e.target.files)}
      />

      {uploading ? (
        <div className="upload-progress">
          <div className="upload-progress-bar" style={{ width: `${progress}%` }} />
          <span>{progress}%</span>
        </div>
      ) : (
        <>
          <div className="upload-icon">📤</div>
          <p className="upload-text">
            拖拽文件到这里，或 <span className="upload-link">点击选择</span>
          </p>
          <p className="upload-hint">图片 ≤20MB · 视频 ≤200MB</p>
        </>
      )}
    </div>
  );
}
