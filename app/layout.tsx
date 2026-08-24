import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Physics Lab",
  description: "Uniformly accelerated motion visualization built with Next.js.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
