"use client";

import BackgroundMusic from "./BackgroundMusic";

interface BottomBarProps {
  onUpload?: () => void;
  onSelectMode?: () => void;
  selectMode?: boolean;
}

export default function BottomBar({ onUpload, onSelectMode, selectMode }: BottomBarProps) {
  return (
    <div className="bottom-bar">
      <div className="bottom-bar-left">
        {onUpload && (
          <button className="bottom-bar-btn" onClick={onUpload}>
            📤 上传
          </button>
        )}
        {onSelectMode && (
          <button
            className={`bottom-bar-btn ${selectMode ? "active" : ""}`}
            onClick={onSelectMode}
          >
            ☑️ 选择
          </button>
        )}
      </div>
      <div className="bottom-bar-right">
        <BackgroundMusic />
      </div>
    </div>
  );
}
