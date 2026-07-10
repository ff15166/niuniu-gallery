"use client";

import { useRef, useState } from "react";

export default function BackgroundMusic() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);

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
      <audio ref={audioRef} src="/bgm.mp3" loop preload="none" />
      <button
        className="btn btn-ghost"
        onClick={toggle}
        title={playing ? "暂停音乐" : "播放音乐"}
      >
        {playing ? "🔊" : "🔇"}
      </button>
    </>
  );
}
