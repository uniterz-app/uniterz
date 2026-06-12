import type { Variants } from "framer-motion";

export const topCard: Variants = {
  hidden: { opacity: 0, y: -10, scale: 0.985 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring", stiffness: 170, damping: 18 },
  },
  exit: { opacity: 0, y: 10, transition: { duration: 0.12 } },
};

export const restContainer: Variants = {
  hidden: { opacity: 1 },
  show: {
    opacity: 1,
  },
};

export const restItem: Variants = {
  hidden: { opacity: 0, y: 6 },
  show: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.2,
      delay: Math.min(i * 0.025, 0.16),
      ease: [0.22, 1, 0.36, 1],
    },
  }),
};