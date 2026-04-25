"use client";

import { ReactNode } from "react";
import { motion } from "motion/react";
import { fadeTransition, fadeVariants } from "@lib/motionVariants";

interface Props {
  children: ReactNode;
}

export default function Template({ children }: Props) {
  return (
    <motion.div
      variants={fadeVariants}
      initial="initial"
      animate="animate"
      transition={fadeTransition}
    >
      {children}
    </motion.div>
  );
}
