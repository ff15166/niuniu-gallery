"use client";

import { useEffect, useState, useRef } from "react";

export default function Hero() {
  const [heroImage, setHeroImage] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("heroImage");
      if (saved) setHeroImage(saved);
    } catch {}
  }, []);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setHeroImage(dataUrl);
      try { localStorage.setItem("heroImage", dataUrl); } catch {}
    };
    reader.readAsDataURL(file);
  };

  return (
    <section className="hero">
      <div
        className="hero-image-wrap"
        onClick={() => fileRef.current?.click()}
        title="点击更换封面图"
      >
        {heroImage ? (
          <img src={heroImage} alt="封面" className="hero-image" />
        ) : (
          <div className="hero-image-placeholder">
            <span>📸</span>
            <span className="hero-image-hint">点击更换封面图</span>
          </div>
        )}
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          hidden
          onChange={handleImageChange}
        />
      </div>
      <div className="hero-content">
        <div className="hero-subtitle">Photo Gallery</div>
        <h1 className="hero-title">
          用镜头记录<br /><span className="hero-highlight">妞妞</span>生活的美好
        </h1>
        <div className="hero-title-line">
          <div className="hero-title-dot"></div>
          <div className="hero-title-rule"></div>
        </div>
        <p className="hero-desc">
          每一张照片都是一个故事，每一个瞬间都值得被珍藏。在这里，每一帧都值得被看见。
        </p>
      </div>
    </section>
  );
}
