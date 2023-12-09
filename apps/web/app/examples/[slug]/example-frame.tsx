"use client";

import { useRef, useEffect, useMemo } from "react";
import { Examples } from "../../../examples";
import type { Example as ExampleData } from "../../../examples";

type Props = {
  title: ExampleData["title"];
};

export function ExampleFrame(props: Props): JSX.Element {
  const ref = useRef<HTMLCanvasElement>(null);
  const data = useMemo(
    () => Examples.find((example) => example.url === props.title),
    [props.title],
  );

  if (!data) {
    throw new Error(`No example found for slug: ${props.title}`);
  }

  useEffect(() => {
    async function runExample(): Promise<void> {
      if (ref.current && data) {
        await data.run(ref.current);
      }
    }

    runExample().catch((error) => {
      // eslint-disable-next-line no-console -- logging
      console.error(error);
    });
  }, [data]);

  return <canvas ref={ref} />;
}
