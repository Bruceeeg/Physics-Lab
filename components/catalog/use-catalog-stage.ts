"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type TransitionEvent,
} from "react";

const WHEEL_ENTER = 240;
const WHEEL_LEAVE = 220;
const TOUCH_ENTER = 120;
const TOUCH_LEAVE = 110;
const ACCUM_RESET_MS = 160;
const TRANSITION_MS = 520;

type Stage = "hero" | "catalog";

function reducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function wheelDelta(event: WheelEvent) {
  if (event.deltaMode === 1) {
    return event.deltaY * 16;
  }
  if (event.deltaMode === 2) {
    return event.deltaY * window.innerHeight;
  }
  return event.deltaY;
}

function scrollableAncestor(target: EventTarget | null) {
  if (!(target instanceof Element)) {
    return null;
  }
  let node: Element | null = target;
  while (node && node !== document.documentElement) {
    const style = window.getComputedStyle(node);
    const overflowY = style.overflowY;
    if (
      (overflowY === "auto" || overflowY === "scroll") &&
      node.scrollHeight > node.clientHeight + 1
    ) {
      return node;
    }
    node = node.parentElement;
  }
  return null;
}

export function useCatalogStage() {
  const [stage, setStage] = useState<Stage>("hero");
  const [heroExiting, setHeroExiting] = useState(false);
  const [heroReturning, setHeroReturning] = useState(false);
  const stageRef = useRef(stage);
  const exitingRef = useRef(false);
  const returningRef = useRef(false);
  const accum = useRef(0);
  const resetTimer = useRef(0);
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    stageRef.current = stage;
  }, [stage]);

  const busy = useCallback(
    () => exitingRef.current || returningRef.current,
    [],
  );

  const bump = useCallback((delta: number, threshold: number, action: () => void) => {
    if (delta <= 0) {
      accum.current = 0;
      return;
    }
    accum.current += delta;
    window.clearTimeout(resetTimer.current);
    resetTimer.current = window.setTimeout(() => {
      accum.current = 0;
    }, ACCUM_RESET_MS);
    if (accum.current >= threshold) {
      accum.current = 0;
      action();
    }
  }, []);

  const finishEnter = useCallback(() => {
    if (!exitingRef.current) {
      return;
    }
    setStage("catalog");
    setHeroExiting(false);
    exitingRef.current = false;
    window.scrollTo(0, 0);
  }, []);

  const finishLeave = useCallback(() => {
    if (!returningRef.current) {
      return;
    }
    setStage("hero");
    setHeroReturning(false);
    returningRef.current = false;
    window.scrollTo(0, 0);
  }, []);

  const enter = useCallback(() => {
    if (stageRef.current === "catalog" || busy()) {
      return;
    }
    accum.current = 0;
    if (reducedMotion()) {
      setStage("catalog");
      setHeroExiting(false);
      exitingRef.current = false;
      window.scrollTo(0, 0);
      return;
    }
    exitingRef.current = true;
    setHeroExiting(true);
  }, [busy]);

  const leave = useCallback(() => {
    if (stageRef.current === "hero" || busy()) {
      return;
    }
    accum.current = 0;
    if (reducedMotion()) {
      setStage("hero");
      setHeroExiting(false);
      setHeroReturning(false);
      returningRef.current = false;
      window.scrollTo(0, 0);
      return;
    }
    returningRef.current = true;
    setHeroReturning(true);
  }, [busy]);

  const onHeroTransitionEnd = useCallback(
    (event: TransitionEvent<HTMLElement>) => {
      if (event.target !== event.currentTarget || event.propertyName !== "transform") {
        return;
      }
      if (exitingRef.current) {
        finishEnter();
        return;
      }
      if (returningRef.current) {
        finishLeave();
      }
    },
    [finishEnter, finishLeave],
  );

  useEffect(() => {
    if (!heroExiting) {
      return;
    }
    const timer = window.setTimeout(finishEnter, TRANSITION_MS + 80);
    return () => window.clearTimeout(timer);
  }, [finishEnter, heroExiting]);

  useEffect(() => {
    if (!heroReturning) {
      return;
    }
    const timer = window.setTimeout(finishLeave, TRANSITION_MS + 80);
    return () => window.clearTimeout(timer);
  }, [finishLeave, heroReturning]);

  useEffect(() => {
    const html = document.documentElement;
    html.classList.toggle("catalog-hero-lock", stage === "hero");
    html.classList.toggle("catalog-labs-open", stage === "catalog");
    if (stage === "catalog" && !heroReturning) {
      window.scrollTo(0, 0);
    }
    return () => {
      html.classList.remove("catalog-hero-lock");
      html.classList.remove("catalog-labs-open");
    };
  }, [heroReturning, stage]);

  useEffect(() => {
    if (stage !== "hero" || heroReturning) {
      return;
    }

    const onWheel = (event: WheelEvent) => {
      if (event.ctrlKey) {
        return;
      }
      const delta = wheelDelta(event);
      const box = scrollableAncestor(event.target);
      if (box && delta > 0) {
        const atEnd = box.scrollTop + box.clientHeight >= box.scrollHeight - 1;
        if (!atEnd) {
          accum.current = 0;
          return;
        }
      }
      if (delta > 0) {
        event.preventDefault();
        bump(delta, WHEEL_ENTER, enter);
      } else {
        accum.current = 0;
      }
    };

    const onTouchStart = (event: TouchEvent) => {
      const touch = event.touches[0];
      if (!touch) {
        return;
      }
      touchStart.current = { x: touch.clientX, y: touch.clientY };
    };

    const onTouchMove = (event: TouchEvent) => {
      const start = touchStart.current;
      const touch = event.touches[0];
      if (!start || !touch) {
        return;
      }
      const dy = start.y - touch.clientY;
      const dx = Math.abs(touch.clientX - start.x);
      if (dx > Math.abs(dy)) {
        return;
      }
      if (dy > 12) {
        event.preventDefault();
      }
      if (dy >= TOUCH_ENTER) {
        touchStart.current = null;
        enter();
      }
    };

    const onTouchEnd = () => {
      touchStart.current = null;
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) {
        return;
      }
      if (event.key !== "PageDown" && event.key !== "End") {
        return;
      }
      const target = event.target;
      if (target instanceof HTMLElement && target.closest("input, textarea, select")) {
        return;
      }
      event.preventDefault();
      enter();
    };

    window.addEventListener("wheel", onWheel, { passive: false, capture: true });
    window.addEventListener("touchstart", onTouchStart, { passive: true, capture: true });
    window.addEventListener("touchmove", onTouchMove, { passive: false, capture: true });
    window.addEventListener("touchend", onTouchEnd, { capture: true });
    window.addEventListener("touchcancel", onTouchEnd, { capture: true });
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("wheel", onWheel, { capture: true });
      window.removeEventListener("touchstart", onTouchStart, { capture: true });
      window.removeEventListener("touchmove", onTouchMove, { capture: true });
      window.removeEventListener("touchend", onTouchEnd, { capture: true });
      window.removeEventListener("touchcancel", onTouchEnd, { capture: true });
      window.removeEventListener("keydown", onKeyDown);
      window.clearTimeout(resetTimer.current);
    };
  }, [bump, enter, heroReturning, stage]);

  useEffect(() => {
    if (stage !== "catalog" || heroReturning) {
      return;
    }

    const onWheel = (event: WheelEvent) => {
      if (event.ctrlKey || window.scrollY > 2) {
        accum.current = 0;
        return;
      }
      const delta = wheelDelta(event);
      if (delta >= 0) {
        accum.current = 0;
        return;
      }
      const box = scrollableAncestor(event.target);
      if (box && box.scrollTop > 0) {
        accum.current = 0;
        return;
      }
      event.preventDefault();
      bump(-delta, WHEEL_LEAVE, leave);
    };

    const onTouchStart = (event: TouchEvent) => {
      const touch = event.touches[0];
      if (!touch || window.scrollY > 2) {
        touchStart.current = null;
        return;
      }
      touchStart.current = { x: touch.clientX, y: touch.clientY };
    };

    const onTouchMove = (event: TouchEvent) => {
      const start = touchStart.current;
      const touch = event.touches[0];
      if (!start || !touch || window.scrollY > 2) {
        return;
      }
      const dy = touch.clientY - start.y;
      const dx = Math.abs(touch.clientX - start.x);
      if (dx > Math.abs(dy)) {
        return;
      }
      if (dy > 12) {
        event.preventDefault();
      }
      if (dy >= TOUCH_LEAVE) {
        touchStart.current = null;
        leave();
      }
    };

    const onTouchEnd = () => {
      touchStart.current = null;
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) {
        return;
      }
      if (event.key !== "PageUp" && event.key !== "Home") {
        return;
      }
      if (window.scrollY > 2) {
        return;
      }
      const target = event.target;
      if (target instanceof HTMLElement && target.closest("input, textarea, select")) {
        return;
      }
      event.preventDefault();
      leave();
    };

    window.addEventListener("wheel", onWheel, { passive: false, capture: true });
    window.addEventListener("touchstart", onTouchStart, { passive: true, capture: true });
    window.addEventListener("touchmove", onTouchMove, { passive: false, capture: true });
    window.addEventListener("touchend", onTouchEnd, { capture: true });
    window.addEventListener("touchcancel", onTouchEnd, { capture: true });
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("wheel", onWheel, { capture: true });
      window.removeEventListener("touchstart", onTouchStart, { capture: true });
      window.removeEventListener("touchmove", onTouchMove, { capture: true });
      window.removeEventListener("touchend", onTouchEnd, { capture: true });
      window.removeEventListener("touchcancel", onTouchEnd, { capture: true });
      window.removeEventListener("keydown", onKeyDown);
      window.clearTimeout(resetTimer.current);
    };
  }, [bump, heroReturning, leave, stage]);

  return {
    stage,
    heroExiting,
    heroReturning,
    enter,
    leave,
    onHeroTransitionEnd,
  };
}
