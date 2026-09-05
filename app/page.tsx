import { CatalogHome } from "@/components/catalog/catalog-home";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "实验",
  description: "按 AP Physics 1、2、C 浏览实验。已开放的卡片进入实验台，其余等待开发。",
};

export default function Home() {
  return <CatalogHome />;
}
