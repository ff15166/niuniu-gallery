"use client";

import { useRef, useState, type DragEvent } from "react";

interface UploadZoneProps {
  onUpload: (files: File[]) => Promise<void>;
}

export default function UploadZone({ onUpload }: UploadZoneProps) {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    const arr = Array.from(files);
    setUploading(true);
    setProgress(0);
    try {
      for (let i = 0; i < arr.length; i++) {
        await onUpload([arr[i]]);
        setProgress(Math.round(((i + 1) / arr.length) * 100));
      }
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragging(false);
    handleFiles(e.dataTransfer.files);
  };

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
