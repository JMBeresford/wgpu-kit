"use client";

import { useLayoutEffect, useRef } from "react";
import { runExample } from "./main";

export function Example(): JSX.Element {
  const ref = useRef<HTMLCanvasElement>(null);

  useLayoutEffect(() => {
    if (!ref.current) return;

    void runExample(ref.current);
  }, []);

  return <canvas ref={ref} />;
}
