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
      staggerChildren: 0.1,
      when: "beforeChildren",
    },
  },
};

export const restItem: Variants = {
  hidden: { opacity: 0, y: 20, scale: 0.988 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 82,
      damping: 18,
      mass: 0.92,
    },
  },
};