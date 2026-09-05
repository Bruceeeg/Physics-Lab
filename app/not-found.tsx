import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-paper px-6 text-ink">
      <h1 className="text-2xl font-medium">未找到该实验</h1>
      <p className="mt-2 text-sm text-quiet">目录里目前只有已上线的实验。</p>
      <Link
        href="/"
        className="mt-6 h-8 border border-navy bg-navy px-4 text-sm leading-8 text-white hover:opacity-90"
      >
        返回目录
      </Link>
    </div>
  );
}
