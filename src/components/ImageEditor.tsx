"use client";

import { useRef, useState, useEffect, useCallback, type ChangeEvent } from "react";

interface ImageEditorProps {
  src: string;
  onSave: (dataUrl: string) => void;
  onClose: () => void;
}

interface Filters {
  brightness: number; // 0-200, default 100
  contrast: number;   // 0-200, default 100
  saturate: number;   // 0-200, default 100
  blur: number;       // 0-10, default 0
  grayscale: number;  // 0-100, default 0
  sepia: number;      // 0-100, default 0
  hueRotate: number;  // 0-360, default 0
}

const DEFAULT_FILTERS: Filters = {
  brightness: 100,
  contrast: 100,
  saturate: 100,
  blur: 0,
  grayscale: 0,
  sepia: 0,
  hueRotate: 0,
};

const PRESETS: Record<string, Partial<Filters>> = {
  原图: {},
  复古: { sepia: 60, contrast: 110, brightness: 95 },
  黑白: { grayscale: 100, contrast: 110 },
  暖色: { saturate: 130, brightness: 105, hueRotate: 10 },
  冷色: { saturate: 90, hueRotate: 200, brightness: 100 },
  高对比: { contrast: 150, brightness: 95 },
  柔和: { blur: 1, brightness: 110, contrast: 90 },
};

export default function ImageEditor({ src, onSave, onClose }: ImageEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [filters, setFilters] = useState<Filters>({ ...DEFAULT_FILTERS });
  const [rotation, setRotation] = useState(0);
  const [cropMode, setCropMode] = useState(false);
  const [cropStart, setCropStart] = useState<{ x: number; y: number } | null>(null);
  const [cropEnd, setCropEnd] = useState<{ x: number; y: number } | null>(null);
  const [imgLoaded, setImgLoaded] = useState(false);

  // Load image
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      imgRef.current = img;
      setImgLoaded(true);
    };
    img.src = src;
  }, [src]);

  // Render to canvas
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;

    const ctx = canvas.getContext("2d")!;
    const rad = (rotation * Math.PI) / 180;
    const sin = Math.abs(Math.sin(rad));
    const cos = Math.abs(Math.cos(rad));
    const w = img.width;
    const h = img.height;

    canvas.width = Math.ceil(w * cos + h * sin);
    canvas.height = Math.ceil(w * sin + h * cos);

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate(rad);

    // Apply CSS filters
    const f = filters;
    ctx.filter = [
      `brightness(${f.brightness}%)`,
      `contrast(${f.contrast}%)`,
      `saturate(${f.saturate}%)`,
      `blur(${f.blur}px)`,
      `grayscale(${f.grayscale}%)`,
      `sepia(${f.sepia}%)`,
      `hue-rotate(${f.hueRotate}deg)`,
    ].join(" ");

    ctx.drawImage(img, -w / 2, -h / 2);
    ctx.restore();
  }, [filters, rotation]);

  useEffect(() => {
    if (imgLoaded) render();
  }, [imgLoaded, render]);

  const updateFilter = (key: keyof Filters, value: number) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const applyPreset = (name: string) => {
    setFilters({ ...DEFAULT_FILTERS, ...PRESETS[name] });
  };

  const handleRotateLeft = () => setRotation((r) => r - 90);
  const handleRotateRight = () => setRotation((r) => r + 90);

  // Crop handling
  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!cropMode) return;
    const rect = canvasRef.current!.getBoundingClientRect();
    const scaleX = canvasRef.current!.width / rect.width;
    const scaleY = canvasRef.current!.height / rect.height;
    setCropStart({
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    });
    setCropEnd(null);
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!cropMode || !cropStart) return;
    const rect = canvasRef.current!.getBoundingClientRect();
    const scaleX = canvasRef.current!.width / rect.width;
    const scaleY = canvasRef.current!.height / rect.height;
    setCropEnd({
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    });
  };

  const handleCanvasMouseUp = () => {
    if (!cropMode || !cropStart || !cropEnd) return;
    // Apply crop
    const canvas = canvasRef.current!;
    const x = Math.min(cropStart.x, cropEnd.x);
    const y = Math.min(cropStart.y, cropEnd.y);
    const w = Math.abs(cropEnd.x - cropStart.x);
    const h = Math.abs(cropEnd.y - cropStart.y);

    if (w < 10 || h < 10) return;

    const cropped = canvas.getContext("2d")!.getImageData(x, y, w, h);
    canvas.width = w;
    canvas.height = h;
    canvas.getContext("2d")!.putImageData(cropped, 0, 0);

    setCropMode(false);
    setCropStart(null);
    setCropEnd(null);

    // Update imgRef to cropped version
    const img = new Image();
    img.onload = () => {
      imgRef.current = img;
      setRotation(0);
      setFilters({ ...DEFAULT_FILTERS });
    };
    img.src = canvas.toDataURL("image/png");
  };

  const handleSave = () => {
    render(); // ensure latest
    const canvas = canvasRef.current;
    if (!canvas) return;
    onSave(canvas.toDataURL("image/jpeg", 0.92));
  };

  const handleReset = () => {
    setFilters({ ...DEFAULT_FILTERS });
    setRotation(0);
    setCropMode(false);
    setCropStart(null);
    setCropEnd(null);
    // Reload original
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      imgRef.current = img;
      setImgLoaded(true);
    };
    img.src = src;
  };

  // Draw crop overlay
  useEffect(() => {
    if (!cropMode || !cropStart || !cropEnd || !canvasRef.current) return;
    render();
    const ctx = canvasRef.current.getContext("2d")!;
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 4]);
    const x = Math.min(cropStart.x, cropEnd.x);
    const y = Math.min(cropStart.y, cropEnd.y);
    const w = Math.abs(cropEnd.x - cropStart.x);
    const h = Math.abs(cropEnd.y - cropStart.y);
    ctx.strokeRect(x, y, w, h);
    // Dim outside
    ctx.fillStyle = "rgba(0,0,0,0.4)";
    ctx.fillRect(0, 0, canvasRef.current.width, y);
    ctx.fillRect(0, y, x, h);
    ctx.fillRect(x + w, y, canvasRef.current.width - x - w, h);
    ctx.fillRect(0, y + h, canvasRef.current.width, canvasRef.current.height - y - h);
  }, [cropMode, cropStart, cropEnd, render]);

  return (
    <div className="editor-overlay" onClick={onClose}>
      <div className="editor-panel" onClick={(e) => e.stopPropagation()}>
        <div className="editor-header">
          <h3>🖼️ 图片编辑器</h3>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>

        <div className="editor-canvas-wrap">
          <canvas
            ref={canvasRef}
            className="editor-canvas"
            onMouseDown={handleCanvasMouseDown}
            onMouseMove={handleCanvasMouseMove}
            onMouseUp={handleCanvasMouseUp}
            style={{ cursor: cropMode ? "crosshair" : "default" }}
          />
        </div>

        <div className="editor-controls">
          {/* Presets */}
          <div className="editor-section">
            <label className="editor-label">预设</label>
            <div className="editor-presets">
              {Object.keys(PRESETS).map((name) => (
                <button
                  key={name}
                  className="btn btn-ghost btn-sm"
                  onClick={() => applyPreset(name)}
                >
                  {name}
                </button>
              ))}
            </div>
          </div>

          {/* Sliders */}
          <div className="editor-section">
            <Slider label="亮度" value={filters.brightness} min={0} max={200} onChange={(v) => updateFilter("brightness", v)} />
            <Slider label="对比度" value={filters.contrast} min={0} max={200} onChange={(v) => updateFilter("contrast", v)} />
            <Slider label="饱和度" value={filters.saturate} min={0} max={200} onChange={(v) => updateFilter("saturate", v)} />
            <Slider label="模糊" value={filters.blur} min={0} max={10} step={0.5} onChange={(v) => updateFilter("blur", v)} />
            <Slider label="灰度" value={filters.grayscale} min={0} max={100} onChange={(v) => updateFilter("grayscale", v)} />
            <Slider label="复古" value={filters.sepia} min={0} max={100} onChange={(v) => updateFilter("sepia", v)} />
            <Slider label="色调" value={filters.hueRotate} min={0} max={360} onChange={(v) => updateFilter("hueRotate", v)} />
          </div>

          {/* Actions */}
          <div className="editor-section editor-actions">
            <button className="btn btn-ghost btn-sm" onClick={handleRotateLeft}>↺ 左转</button>
            <button className="btn btn-ghost btn-sm" onClick={handleRotateRight}>↻ 右转</button>
            <button
              className={`btn btn-sm ${cropMode ? "btn-primary" : "btn-ghost"}`}
              onClick={() => setCropMode(!cropMode)}
            >
              ✂️ 裁剪
            </button>
            <button className="btn btn-ghost btn-sm" onClick={handleReset}>↩️ 重置</button>
            <div style={{ flex: 1 }} />
            <button className="btn btn-primary btn-sm" onClick={handleSave}>💾 保存</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Slider({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="editor-slider">
      <span className="editor-slider-label">{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(Number(e.target.value))}
        className="editor-slider-input"
      />
      <span className="editor-slider-value">{value}</span>
    </div>
  );
}
