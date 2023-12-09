import type { ForwardedRef } from "react";
import { forwardRef } from "react";
import styles from "./styles.module.scss";

type ButtonProps = { primary?: boolean; small?: boolean, bare?: boolean } & JSX.IntrinsicElements["button"];

function ButtonImpl(
  { children, primary, small, bare, className, ...props }: ButtonProps,
  ref: ForwardedRef<HTMLButtonElement>,
): JSX.Element {

  let classes = styles.button;
  if (primary) {
    classes += ` ${styles.primary}`;
  }
  if (small) {
    classes += ` ${styles.small}`;
  }
  if (bare) {
    classes += ` ${styles.bare}`;
  }

  return (
    <button
      className={`${classes} ${className}`}
      ref={ref}
      type="button"
      {...props}
    >
      {children}
    </button>
  );
}

function Group(
  { children, className, ...props }: JSX.IntrinsicElements["div"],
  ref: ForwardedRef<HTMLDivElement>,
): JSX.Element {
  return (
    <div className={`${styles.buttongroup} ${className}`} ref={ref} {...props}>
      {children}
    </div>
  );
}

export const Button = forwardRef(ButtonImpl);
export const ButtonGroup = forwardRef(Group);
