"use client";

import { PrismAsync as SyntaxHighlighter } from "react-syntax-highlighter";
import { nord } from "react-syntax-highlighter/dist/esm/styles/prism";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button } from "ui/button";
import { useCallback, useMemo } from "react";
import type { Code } from "../../../examples";
import styles from "./styles.module.scss";

type Props = {
  code: Code;
  active: boolean;
};

function CodeBlock(props: Props): JSX.Element {
  return (
    <div
      className={`${styles["source-text"]} ${props.active ? styles.show : ""}`}
    >
      <SyntaxHighlighter
        customStyle={{ background: "rgba(255,255,255,0)", margin: 0 }}
        language={props.code.language}
        showLineNumbers
        style={nord as unknown}
      >
        {props.code.text}
      </SyntaxHighlighter>
    </div>
  );
}

export function CodeOverlay(props: { sources: Code[] }): JSX.Element {
  const params = useSearchParams();
  const file = params.get("showFile") ?? props.sources[0].filename;
  const show = params.get("showCode") === "true";
  const router = useRouter();
  const pathname = usePathname();

  const changeFile = useCallback(
    (filename: string) => {
      const newParams = new URLSearchParams(params);
      newParams.set("showFile", filename);

      router.push(`${pathname}?${newParams.toString()}`, { scroll: false });
    },
    [router, pathname, params],
  );

  const codeBlocks = useMemo(
    () =>
      props.sources.map((code) => (
        <CodeBlock
          active={show ? code.filename === file : false}
          code={code}
          key={code.text}
        />
      )),
    [file, props.sources, show],
  );

  return (
    <div className={`${styles["code-overlay"]} ${show ? styles.show : ""}`}>
      <div className={styles.tabs}>
        {props.sources.map((code) => (
          <Button
            bare
            className={file === code.filename ? styles.active : ""}
            key={code.filename}
            onClick={() => {
              changeFile(code.filename);
            }}
            small
          >
            {code.filename}
          </Button>
        ))}
      </div>

      <div className={`${styles.source} `}>{codeBlocks}</div>
    </div>
  );
}
