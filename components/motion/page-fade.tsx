"use client";

import { usePathname } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";

/** Fades + lifts page content on route change. */
export function PageFade({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const pathname = usePathname();
  const reduce = useReducedMotion();
  return (
    <motion.div
      key={pathname}
      className={className}
      initial={reduce ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
