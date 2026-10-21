"use client";

import type { ReactNode } from "react";

import { FreeformProvider, useFreeform } from "@/components/freeform/freeform-context";
import { SandboxBench } from "@/components/freeform/sandbox-bench";

export function FreeformLab({ slug, children }: { slug: string; children: ReactNode }) {
  return (
    <FreeformProvider slug={slug}>
      <Stage>{children}</Stage>
    </FreeformProvider>
  );
}

function Stage({ children }: { children: ReactNode }) {
  const freeform = useFreeform();
  return (
    <>
      <div key={freeform.epoch} className={freeform.diverged ? "hidden" : "contents"}>
        {children}
      </div>
      {freeform.diverged ? <SandboxBench /> : null}
    </>
  );
}
