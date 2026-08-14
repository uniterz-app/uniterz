"use client";

import { motion, useReducedMotion } from "framer-motion";

type OfficialLpRevealProps = {
  children: React.ReactNode;
  className?: string;
};

/** 初期状態でも読める。スクロール入場は透明度をわずかに上げるだけ。 */
export default function OfficialLpReveal({
  children,
  className,
}: OfficialLpRevealProps) {
  const reduce = useReducedMotion();

  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0.92, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.16 }}
      transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}
