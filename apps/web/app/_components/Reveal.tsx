'use client';
import { motion, useReducedMotion } from 'motion/react';
import type { ReactNode } from 'react';

/**
 * Wrapper de scroll-reveal: fade + slide-up cuando entra al viewport.
 * Respeta prefers-reduced-motion.
 */
export function Reveal({
  children,
  delay = 0,
  y = 20,
  className,
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}

/** Stagger: aplica delays incrementales a los hijos directos. */
export function Stagger({
  children,
  className,
  step = 0.08,
  startDelay = 0,
}: {
  children: ReactNode[];
  className?: string;
  step?: number;
  startDelay?: number;
}) {
  return (
    <div className={className}>
      {children.map((child, i) => (
        <Reveal key={i} delay={startDelay + i * step}>
          {child}
        </Reveal>
      ))}
    </div>
  );
}
