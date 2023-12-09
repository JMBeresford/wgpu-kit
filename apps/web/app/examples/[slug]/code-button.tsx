"use client";

import { Button } from "ui/button";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";
import styles from "./styles.module.scss";

export function CodeButton(): JSX.Element {
  const router = useRouter();
  const params = useSearchParams();
  const pathname = usePathname();
  const showingCode = useMemo(
    () => params.get("showCode") === "true",
    [params],
  );

  const handleClick = useCallback(() => {
    const newParams = new URLSearchParams(params);

    newParams.set("showCode", `${!showingCode}`);
    router.push(`${pathname}?${newParams.toString()}`, { scroll: false });
  }, [params, router, pathname, showingCode]);

  return (
    <div className={styles["code-btn"]}>
      <div className={showingCode ? "" : styles.show}>
        <Button onClick={handleClick} primary>
          Show Code
        </Button>
      </div>

      <div className={showingCode ? styles.show : ""}>
        <Button onClick={handleClick}>Hide Code</Button>
      </div>
    </div>
  );
}
