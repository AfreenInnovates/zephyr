"use client";

import { useRef, ReactNode } from "react";
import { gsap, useGSAP } from "@/lib/gsap";

type RevealProps = {
  children: ReactNode;
  className?: string;
  /** Stagger direct children instead of the wrapper (for card grids). */
  stagger?: boolean;
  /** Add a little scale + lift for the "cards coming up" feel. */
  rise?: boolean;
  y?: number;
  delay?: number;
};

/**
 * Fades content up on scroll. With `rise`, cards float up from further down
 * with a slight scale and a soft spring ease - the edmo / maggie card feel.
 */
export default function Reveal({
  children,
  className,
  stagger = false,
  rise = false,
  y,
  delay = 0,
}: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;

      const targets = stagger
        ? gsap.utils.toArray<HTMLElement>(el.children)
        : el;
      const travel = y ?? (rise ? 64 : 28);

      gsap.from(targets, {
        opacity: 0,
        y: travel,
        ...(rise ? { scale: 0.94 } : {}),
        transformOrigin: "center bottom",
        duration: rise ? 1 : 0.8,
        delay,
        ease: rise ? "back.out(1.4)" : "power3.out",
        stagger: stagger ? 0.12 : 0,
        scrollTrigger: {
          trigger: el,
          start: "top 85%",
          once: true,
        },
      });
    },
    { scope: ref },
  );

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
