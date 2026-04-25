import type { Transition, Variants } from "motion/react";

export const fadeVariants: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

export const fadeTransition: Transition = {
  duration: 0.15,
  ease: "easeOut",
};
