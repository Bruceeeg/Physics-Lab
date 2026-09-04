import type { Metadata } from "next";
import { IBM_Plex_Mono, IBM_Plex_Sans, Noto_Sans_SC } from "next/font/google";
import "./globals.css";

const plexSans = IBM_Plex_Sans({
  subsets: ["latin", "latin-ext"],
  display: "swap",
  variable: "--font-plex-sans",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
  variable: "--font-plex-mono",
});

const notoSansSC = Noto_Sans_SC({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
  variable: "--font-noto",
});

export const metadata: Metadata = {
  title: "匀变速直线运动 | Physics Lab",
  description: "匀变速直线运动实验台：由初值积分得到 x(t) 与 v(t)，并按真实时间推进。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="zh-CN"
      className={`${plexSans.variable} ${plexMono.variable} ${notoSansSC.variable}`}
    >
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
