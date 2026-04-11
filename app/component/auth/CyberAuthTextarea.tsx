"use client";

import React from "react";
import styles from "./cyberAuthField.module.css";

type Props = {
  textareaProps: React.TextareaHTMLAttributes<HTMLTextAreaElement>;
};

/** ログインの CyberAuthField と同系のコニック発光枠付きテキストエリア */
export default function CyberAuthTextarea({ textareaProps }: Props) {
  const { className, ...rest } = textareaProps;

  return (
    <div className={styles.fieldMain}>
      <div className={`${styles.fieldPoda} ${styles.fieldPodaMultiline}`}>
        <div className={styles.glow} aria-hidden />
        <div className={styles.darkBorderBg} aria-hidden />
        <div className={styles.border} aria-hidden />
        <div className={styles.white} aria-hidden />
        <textarea
          {...rest}
          className={[styles.textarea, className].filter(Boolean).join(" ")}
        />
      </div>
    </div>
  );
}
