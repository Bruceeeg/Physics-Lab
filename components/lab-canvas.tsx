"use client";

import { Canvas } from "@react-three/fiber";
import { Component, type ReactNode } from "react";

class SceneErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    if (this.state.failed) {
      return (
        <div className="flex h-full w-full items-center justify-center bg-[#cbd5e1] text-xs text-navy">
          三维场景无法显示
        </div>
      );
    }
    return this.props.children;
  }
}

export default function LabCanvas({
  camera = [5, 3.2, 6],
  fov = 45,
  children,
}: {
  camera?: [number, number, number];
  fov?: number;
  children: ReactNode;
}) {
  return (
    <SceneErrorBoundary>
      <div className="h-full min-h-[280px] w-full">
        <Canvas
          className="h-full w-full"
          style={{ width: "100%", height: "100%", display: "block" }}
          resize={{ offsetSize: true }}
          camera={{ position: camera, fov, near: 0.05, far: 2000 }}
          gl={{ antialias: true, alpha: false }}
        >
          {children}
        </Canvas>
      </div>
    </SceneErrorBoundary>
  );
}
