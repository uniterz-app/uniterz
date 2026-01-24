"use client";

import { motion } from "framer-motion";

export function DepthCard({
  children,
  delay = 0,
}: {
  children: React.ReactNode;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{
        opacity: 0,
        y: 64,
        z: -220,
        rotateX: 10,
      }}
      animate={{
        opacity: 1,
        y: 0,
        z: 0,
        rotateX: 0,
      }}
      transition={{
        duration: 0.9,
        delay,
        ease: [0.22, 1, 0.36, 1],
      }}
      style={{
        transformStyle: "preserve-3d",
      }}
    >
      {children}
    </motion.div>
  );
}
