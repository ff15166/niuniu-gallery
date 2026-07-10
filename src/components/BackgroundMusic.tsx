"use client";

import { useRef, useState, useEffect } from "react";

export default function BackgroundMusic() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);

  // Auto-play on mount with 30% volume
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = 0.3;
    const tryPlay = async () => {
      try {
        await audio.play();
        setPlaying(true);
      } catch {
        // Autoplay blocked by browser; user needs to click
      }
    };
    tryPlay();
  }, []);

  const toggle = () => {
    if (!audioRef.current) return;
    if (playing) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(() => {});
    }
    setPlaying(!playing);
  };

  return (
    <>
      <audio ref={audioRef} src="/api/bgm" loop preload="auto" />
      <div className="music-controls">
        <button
          className={`music-btn ${playing ? "playing" : ""}`}
          onClick={toggle}
          title={playing ? "暂停" : "播放"}
        >
          {playing ? "⏸️" : "🎵"}
        </button>
      </div>
    </>
  );
}
