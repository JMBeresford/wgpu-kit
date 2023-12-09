import type { ForwardedRef } from "react";
import { forwardRef } from "react";
import styles from "./styles.module.scss";

function HeaderImpl(
  { children, className, ...props }: JSX.IntrinsicElements["div"],
  ref: ForwardedRef<HTMLDivElement>,
): JSX.Element {
  return (
    <header className={`${styles.header} ${className}`} ref={ref} {...props}>
      {children}
    </header>
  );
}

function Title(
  { children, className, ...props }: JSX.IntrinsicElements["h1"],
  ref: ForwardedRef<HTMLHeadingElement>,
): JSX.Element {
  return (
    <h1 className={`${styles.title} ${className}`} ref={ref} {...props}>
      {children}
    </h1>
  );
}

export const Header = forwardRef(HeaderImpl);
export const HeaderTitle = forwardRef(Title);
