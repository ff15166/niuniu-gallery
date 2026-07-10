"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import DarkModeToggle from "./DarkModeToggle";

interface TagSidebarProps {
  tags: string[];
}

export default function TagSidebar({ tags }: TagSidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <Link href="/" className="sidebar-logo">
          📸 妞妞画廊
        </Link>
        <DarkModeToggle />
      </div>

      <nav className="sidebar-nav">
        <Link
          href="/"
          className={`sidebar-link ${pathname === "/" ? "active" : ""}`}
        >
          🏠 全部
        </Link>

        <div className="sidebar-divider" />

        <div className="sidebar-section-title">标签</div>
        {tags.length === 0 ? (
          <div className="sidebar-empty">暂无标签</div>
        ) : (
          tags.map((tag) => (
            <Link
              key={tag}
              href={`/tags/${encodeURIComponent(tag)}`}
              className={`sidebar-link ${
                pathname === `/tags/${encodeURIComponent(tag)}` ? "active" : ""
              }`}
            >
              🏷️ {tag}
            </Link>
          ))
        )}
      </nav>
    </aside>
  );
}
