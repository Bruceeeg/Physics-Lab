import { SiteHeader } from "@/components/catalog/site-header";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "关于",
  description: "Physics Lab 是面向力学课堂的可交互实验台。",
};

export default function AboutPage() {
  return (
    <div className="min-h-[100dvh] bg-paper text-ink">
      <SiteHeader />
      <main className="mx-auto max-w-[720px] px-5 py-16 md:px-10">
        <h1 className="text-3xl font-medium tracking-tight">关于</h1>
        <p className="mt-4 text-sm leading-7 text-quiet">
          Physics Lab 按 AP Physics 1、Physics 2、C 力学和 C 电磁列出实验。已完成的实验可点进独立实验台改参数、看受力和运动；尚未开发的实验在首页用变暗的动态预览标成等待开发。
        </p>
      </main>
    </div>
  );
}
