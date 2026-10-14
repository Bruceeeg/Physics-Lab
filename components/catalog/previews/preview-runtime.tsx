"use client";

import { createContext, useContext } from "react";

export type PreviewRuntime = {
  mounted: boolean;
  scrolling: boolean;
};

export const PreviewRuntimeContext = createContext<PreviewRuntime>({
  mounted: false,
  scrolling: false,
});

export function useCatalogPreviewRuntime() {
  return useContext(PreviewRuntimeContext);
}
