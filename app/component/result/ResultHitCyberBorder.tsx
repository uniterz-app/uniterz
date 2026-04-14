"use client";

import styles from "./ResultHitCyberBorder.module.css";

/** HIT / 連勝時：枠の上にサイバー風の走光 */
export default function ResultHitCyberBorder() {
  return (
    <div className={styles.wrap} aria-hidden>
      <div className={styles.ringClip}>
        <div className={styles.dotsBorder} />
      </div>
    </div>
  );
}
