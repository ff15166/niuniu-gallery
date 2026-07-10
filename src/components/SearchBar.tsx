"use client";

import { useState, useCallback, useEffect } from "react";

interface SearchBarProps {
  onSearch: (query: string, dateFrom: string, dateTo: string) => void;
}

export default function SearchBar({ onSearch }: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [showDates, setShowDates] = useState(false);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      onSearch(query, dateFrom, dateTo);
    }, 300);
    return () => clearTimeout(timer);
  }, [query, dateFrom, dateTo, onSearch]);

  const handleClear = useCallback(() => {
    setQuery("");
    setDateFrom("");
    setDateTo("");
  }, []);

  return (
    <div className="search-bar">
      <div className="search-input-wrap">
        <span className="search-icon">🔍</span>
        <input
          type="text"
          className="search-input"
          placeholder="搜索照片、视频、标签..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {query && (
          <button className="search-clear" onClick={handleClear}>✕</button>
        )}
      </div>

      <button
        className={`btn btn-ghost btn-sm ${showDates ? "active" : ""}`}
        onClick={() => setShowDates(!showDates)}
      >
        📅 日期
      </button>

      {showDates && (
        <div className="search-dates">
          <input
            type="date"
            className="input search-date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            placeholder="开始日期"
          />
          <span className="search-date-sep">~</span>
          <input
            type="date"
            className="input search-date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            placeholder="结束日期"
          />
        </div>
      )}
    </div>
  );
}
