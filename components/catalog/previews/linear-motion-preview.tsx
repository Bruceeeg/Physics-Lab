export function LinearMotionPreview({ running }: { running: boolean }) {
  return (
    <svg
      viewBox="0 0 160 100"
      className={`catalog-preview h-full w-full bg-muted text-navy ${
        running ? "" : "catalog-preview--paused"
      }`}
      aria-hidden="true"
    >
      <line x1="16" y1="50" x2="144" y2="50" stroke="#cbd5e1" strokeWidth="1.2" />
      <rect width="14" height="14" fill="#1e3a5f" className="catalog-preview__linear-cart" />
    </svg>
  );
}
