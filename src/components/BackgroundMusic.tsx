"use client";

import { useRef, useState } from "react";

export default function BackgroundMusic() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [showPanel, setShowPanel] = useState(false);

  const toggle = () => {
    if (!audioRef.current) return;
    if (playing) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(() => {});
    }
    setPlaying(!playing);
  };

  const handleUploadMusic = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !audioRef.current) return;
    const url = URL.createObjectURL(file);
    audioRef.current.src = url;
    audioRef.current.play().catch(() => {});
    setPlaying(true);
    // Save to localStorage
    const reader = new FileReader();
    reader.onload = () => {
      try { localStorage.setItem("bgm", reader.result as string); } catch {}
    };
    reader.readAsDataURL(file);
    setShowPanel(false);
  };

  // Load saved music on mount
  const savedBgm = typeof window !== "undefined" ? localStorage.getItem("bgm") : null;

  return (
    <>
      <audio ref={audioRef} src={savedBgm || "/bgm.mp3"} loop preload="none" />
      <div className="music-controls">
        <button
          className={`music-btn ${playing ? "playing" : ""}`}
          onClick={toggle}
          title={playing ? "暂停" : "播放"}
        >
          {playing ? "⏸️" : "🎵"}
        </button>
        <button
          className="music-btn"
          onClick={() => setShowPanel(!showPanel)}
          title="设置音乐"
        >
          ⚙️
        </button>
      </div>

      {showPanel && (
        <div className="modal-overlay" onClick={() => setShowPanel(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">🎵 背景音乐</h3>
            <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 12 }}>
              上传自定义音乐文件（MP3/WAV），刷新后仍会保留。
            </p>
            <label className="btn btn-primary btn-sm" style={{ cursor: "pointer" }}>
              📁 选择音乐文件
              <input
                type="file"
                accept="audio/*"
                hidden
                onChange={handleUploadMusic}
              />
            </label>
            <div className="modal-actions">
              <button className="btn btn-ghost btn-sm" onClick={() => setShowPanel(false)}>
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
