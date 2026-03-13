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
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.26,   // ← ここを広げる
      when: "beforeChildren",
    },
  },
};

export const restItem: Variants = {
  hidden: { opacity: 0, y: 16, scale: 0.985 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 170,
      damping: 20,
      mass: 0.6,
    },
  },
};