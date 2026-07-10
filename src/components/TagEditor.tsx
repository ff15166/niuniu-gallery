"use client";

import { useState, useRef, useEffect } from "react";

interface TagEditorProps {
  tags: string[];
  allTags: string[];
  onChange: (tags: string[]) => void;
  compact?: boolean;
}

export default function TagEditor({ tags, allTags, onChange, compact }: TagEditorProps) {
  const [input, setInput] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [highlightIdx, setHighlightIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const filtered = input.trim()
    ? allTags.filter(
        (t) =>
          t.toLowerCase().includes(input.toLowerCase()) &&
          !tags.includes(t)
      )
    : allTags.filter((t) => !tags.includes(t));

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const addTag = (tag: string) => {
    const t = tag.trim();
    if (t && !tags.includes(t)) {
      onChange([...tags, t]);
    }
    setInput("");
    setShowDropdown(false);
    setHighlightIdx(0);
  };

  const removeTag = (tag: string) => {
    onChange(tags.filter((t) => t !== tag));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (highlightIdx >= 0 && highlightIdx < filtered.length) {
        addTag(filtered[highlightIdx]);
      } else if (input.trim()) {
        addTag(input.trim());
      }
    } else if (e.key === "Backspace" && !input && tags.length > 0) {
      removeTag(tags[tags.length - 1]);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightIdx((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === "Escape") {
      setShowDropdown(false);
    }
  };

  return (
    <div className={`tag-editor ${compact ? "tag-editor-compact" : ""}`}>
      <div className="tag-editor-tags">
        {tags.map((tag) => (
          <span key={tag} className="tag-editor-tag">
            {tag}
            <span className="tag-editor-remove" onClick={() => removeTag(tag)}>
              ✕
            </span>
          </span>
        ))}
        <div className="tag-editor-input-wrap">
          <input
            ref={inputRef}
            className="tag-editor-input"
            placeholder={tags.length === 0 ? "添加标签..." : ""}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              setShowDropdown(true);
              setHighlightIdx(0);
            }}
            onFocus={() => setShowDropdown(true)}
            onKeyDown={handleKeyDown}
          />
          {showDropdown && filtered.length > 0 && (
            <div className="tag-editor-dropdown" ref={dropdownRef}>
              {filtered.map((tag, i) => (
                <div
                  key={tag}
                  className={`tag-editor-option ${
                    i === highlightIdx ? "active" : ""
                  }`}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    addTag(tag);
                  }}
                  onMouseEnter={() => setHighlightIdx(i)}
                >
                  🏷️ {tag}
                </div>
              ))}
              {input.trim() && !allTags.includes(input.trim()) && (
                <div
                  className={`tag-editor-option tag-editor-option-new ${
                    highlightIdx === filtered.length ? "active" : ""
                  }`}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    addTag(input.trim());
                  }}
                  onMouseEnter={() => setHighlightIdx(filtered.length)}
                >
                  ＋ 创建「{input.trim()}」
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
