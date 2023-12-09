"use client";

import { useEffect, useRef } from "react";
import styles from "./styles.module.scss";

export function Screen(): JSX.Element {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const listener: () => void = () => {
      if (!ref.current) return;
      const vh = window.innerHeight * 0.01;
      if (window.scrollY > 25 * vh) {
        ref.current.style.opacity = "1";
      } else {
        ref.current.style.opacity = "0";
      }
    };

    listener();
    window.addEventListener("scroll", listener);

    return () => {
      window.removeEventListener("scroll", listener);
    };
  }, []);

  return <div className={styles.screen} ref={ref} />;
}
