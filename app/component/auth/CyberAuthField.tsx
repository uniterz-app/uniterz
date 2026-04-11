"use client";

import React from "react";
import styles from "./cyberAuthField.module.css";

type Props = {
  leftIcon?: React.ReactNode;
  /** 右側（メールは装飾のみ、パスワードは button 推奨） */
  rightSlot?: React.ReactNode;
  /** 右スロット外枠の回転アニメ（パスワード切替など操作系のみ true） */
  rightSlotAnimated?: boolean;
  inputProps: React.InputHTMLAttributes<HTMLInputElement>;
};

/**
 * Uiverse 系のコニック発光枠＋グリッド風マスク付き入力ラッパー
 */
function CyberAuthField({
  leftIcon,
  rightSlot,
  rightSlotAnimated = false,
  inputProps,
}: Props) {
  const { className: inputClassName, ...restInput } = inputProps;

  return (
    <div className={styles.fieldMain}>
      <div className={styles.fieldPoda}>
        <div className={styles.glow} aria-hidden />
        <div className={styles.darkBorderBg} aria-hidden />
        <div className={styles.border} aria-hidden />
        <div className={styles.white} aria-hidden />
        <input
          {...restInput}
          className={[
            styles.input,
            leftIcon ? styles.inputWithLeft : "",
            inputClassName,
          ]
            .filter(Boolean)
            .join(" ")}
        />
        {leftIcon ? (
          <>
            <div className={styles.inputMask} aria-hidden />
            <div className={styles.pinkMask} aria-hidden />
            <div className={styles.leftIcon}>{leftIcon}</div>
          </>
        ) : null}
        {rightSlot ? (
          <div className={styles.rightSlot}>
            {rightSlotAnimated ? (
              <div className={styles.rightBorderSpin} aria-hidden />
            ) : null}
            <div
              className={styles.rightSlotInner}
              data-static={rightSlotAnimated ? undefined : "true"}
            >
              {rightSlot}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default CyberAuthField;
