import type { ForwardedRef } from "react";
import { forwardRef } from "react";
import styles from "./styles.module.scss";

function NavImpl(
  { children, className, ...props }: JSX.IntrinsicElements["nav"],
  ref: ForwardedRef<HTMLDivElement>,
): JSX.Element {
  return (
    <nav className={`${styles.nav} ${className}`} ref={ref} {...props}>
      {children}
    </nav>
  );
}

export const Nav = forwardRef(NavImpl);
