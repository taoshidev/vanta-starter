"use client";

import * as React from "react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
  type TargetAndTransition,
  type Variants,
} from "framer-motion";

import { cn } from "@/lib/utils";

const EASE = [0.22, 1, 0.36, 1] as const;

/** Fade + slide in when scrolled into view. */
export function Reveal({
  children,
  className,
  delay = 0,
  y = 24,
  once = true,
  as = "div",
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  y?: number;
  once?: boolean;
  as?: "div" | "section" | "li" | "span";
}) {
  const reduce = useReducedMotion();
  const MotionTag = motion[as] as typeof motion.div;
  return (
    <MotionTag
      className={className}
      initial={reduce ? false : { opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once, margin: "-80px" }}
      transition={{ duration: 0.6, ease: EASE, delay }}
    >
      {children}
    </MotionTag>
  );
}

const containerVariants: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: EASE } },
};

/** Wraps children that should animate in sequence. Use <StaggerItem> inside. */
export function Stagger({
  children,
  className,
  once = true,
}: {
  children: React.ReactNode;
  className?: string;
  once?: boolean;
}) {
  return (
    <motion.div
      className={className}
      variants={containerVariants}
      initial="hidden"
      whileInView="show"
      viewport={{ once, margin: "-60px" }}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div className={className} variants={itemVariants}>
      {children}
    </motion.div>
  );
}

/** Translates its content as the page scrolls, for a parallax depth effect. */
export function Parallax({
  children,
  className,
  distance = 80,
}: {
  children: React.ReactNode;
  className?: string;
  distance?: number;
}) {
  const ref = React.useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], [distance, -distance]);
  return (
    <div ref={ref} className={className}>
      <motion.div style={reduce ? undefined : { y }}>{children}</motion.div>
    </div>
  );
}

/** Animated aurora/gradient blobs for hero backgrounds. Pointer-events none. */
export function Aurora({ className }: { className?: string }) {
  const reduce = useReducedMotion();
  const blob = (extra: string, animate: TargetAndTransition, delay = 0) => (
    <motion.div
      className={cn("absolute rounded-full blur-3xl", extra)}
      animate={reduce ? undefined : animate}
      transition={{ duration: 14, repeat: Infinity, repeatType: "mirror", ease: "easeInOut", delay }}
    />
  );
  return (
    <div className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}>
      {blob(
        "left-[5%] top-[-10%] size-[34rem] bg-primary/20",
        { x: [0, 60, 0], y: [0, 40, 0], scale: [1, 1.1, 1] },
      )}
      {blob(
        "right-[0%] top-[10%] size-[30rem] bg-sky-400/15",
        { x: [0, -50, 0], y: [0, 60, 0], scale: [1, 1.15, 1] },
        2,
      )}
      {blob(
        "left-[30%] bottom-[-15%] size-[28rem] bg-cyan-400/10",
        { x: [0, 40, 0], y: [0, -30, 0], scale: [1, 1.08, 1] },
        4,
      )}
    </div>
  );
}

/** Subtle hover lift for cards. */
export function HoverLift({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      {children}
    </motion.div>
  );
}
