"use client";

import { createElement, useEffect, useState, type ComponentType } from "react";

const pending = new Map<string, Promise<ComponentType<never>>>();
const ready = new Map<string, ComponentType<never>>();

function loadPart<P extends object>(name: string, load: () => Promise<ComponentType<P>>) {
  const cached = ready.get(name) as ComponentType<P> | undefined;
  if (cached) {
    return Promise.resolve(cached);
  }
  let job = pending.get(name) as Promise<ComponentType<P>> | undefined;
  if (!job) {
    job = load()
      .then((component) => {
        ready.set(name, component as ComponentType<never>);
        return component;
      })
      .catch((error: unknown) => {
        pending.delete(name);
        throw error;
      });
    pending.set(name, job as Promise<ComponentType<never>>);
  }
  return job;
}

export function useLazyScene<P extends object>(
  name: string,
  load: () => Promise<ComponentType<P>>,
): ComponentType<P> | null {
  const [Comp, setComp] = useState<ComponentType<P> | null>(
    () => (ready.get(name) as ComponentType<P> | undefined) ?? null,
  );

  useEffect(() => {
    let live = true;
    loadPart(name, load).then(
      (component) => {
        if (live) {
          setComp(() => component);
        }
      },
      () => {
        if (live) {
          setComp(null);
        }
      },
    );
    return () => {
      live = false;
    };
  }, [name, load]);

  return Comp;
}

export function LazyScene<P extends object>({
  name,
  load,
  ...props
}: {
  name: string;
  load: () => Promise<ComponentType<P>>;
} & P) {
  const Loaded = useLazyScene(name, load);
  if (!Loaded) {
    return null;
  }
  return createElement(Loaded, props as P);
}
