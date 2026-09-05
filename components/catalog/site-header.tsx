"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function SiteHeader({
  previewPaused,
  onTogglePreview,
}: {
  previewPaused?: boolean;
  onTogglePreview?: () => void;
}) {
  const pathname = usePathname();

  return (
    <header className="flex h-14 items-center justify-between gap-4 border-b border-line bg-surface px-5 md:px-10">
      <Link
        href="/"
        className="shrink-0 text-sm font-medium text-navy focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy"
      >
        Physics Lab
      </Link>
      <div className="flex items-center gap-5">
        <nav className="flex items-center gap-5 text-sm" aria-label="站点">
          <Link
            href="/"
            className={`focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy ${
              pathname === "/" ? "font-medium text-ink" : "text-quiet hover:text-ink"
            }`}
            aria-current={pathname === "/" ? "page" : undefined}
          >
            实验
          </Link>
          <Link
            href="/about"
            className={`focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy ${
              pathname === "/about" ? "font-medium text-ink" : "text-quiet hover:text-ink"
            }`}
            aria-current={pathname === "/about" ? "page" : undefined}
          >
            关于
          </Link>
        </nav>
        {onTogglePreview ? (
          <button
            type="button"
            onClick={onTogglePreview}
            aria-pressed={previewPaused}
            className="h-8 min-w-11 cursor-pointer border border-line bg-surface px-3 text-xs text-ink hover:border-navy focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy"
          >
            {previewPaused ? "播放预览" : "暂停预览"}
          </button>
        ) : null}
      </div>
    </header>
  );
}
