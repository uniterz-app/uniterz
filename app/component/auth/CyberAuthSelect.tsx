"use client";

import React from "react";
import { ChevronDown } from "lucide-react";
import styles from "./cyberAuthField.module.css";

type Props = {
  /** 角ばり（border-radius なし） */
  angular?: boolean;
  selectProps: React.SelectHTMLAttributes<HTMLSelectElement>;
  children: React.ReactNode;
};

/** ログインの入力と同系のコニック発光枠付き select */
export default function CyberAuthSelect({
  angular = false,
  selectProps,
  children,
}: Props) {
  const { className, ...rest } = selectProps;

  return (
    <div className={styles.fieldMain}>
      <div
        className={[styles.fieldPoda, angular ? styles.angular : ""]
          .filter(Boolean)
          .join(" ")}
      >
        <div className={styles.glow} aria-hidden />
        <div className={styles.darkBorderBg} aria-hidden />
        <div className={styles.border} aria-hidden />
        <div className={styles.white} aria-hidden />
        <select
          {...rest}
          className={[styles.selectEl, className].filter(Boolean).join(" ")}
        >
          {children}
        </select>
        <span className={styles.selectChevron} aria-hidden>
          <ChevronDown className="h-4 w-4" strokeWidth={2.2} />
        </span>
      </div>
    </div>
  );
}
