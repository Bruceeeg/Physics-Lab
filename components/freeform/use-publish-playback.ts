"use client";

import { useEffect, useRef } from "react";

import { registerPlayback, type PlaybackBridge } from "@/components/freeform/playback-bridge";

export function usePublishPlayback(bridge: PlaybackBridge) {
  const bridgeRef = useRef(bridge);
  bridgeRef.current = bridge;
  useEffect(() => {
    return registerPlayback({
      getTime: () => bridgeRef.current.getTime(),
      getPoint: () => bridgeRef.current.getPoint(),
      getVelocity: () => bridgeRef.current.getVelocity(),
      pause: () => bridgeRef.current.pause(),
      reset: () => bridgeRef.current.reset(),
    });
  }, []);
}
