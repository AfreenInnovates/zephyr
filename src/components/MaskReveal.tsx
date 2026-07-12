"use client";

import { useRef, ReactNode, ElementType } from "react";
import { gsap, useGSAP } from "@/lib/gsap";

type MaskRevealProps = {
  children: ReactNode;
  className?: string;
  as?: ElementType;
  delay?: number;
};

/**
 * Editorial "wipe up" reveal: the content sits inside an overflow-hidden
 * window and slides up from below when scrolled into view.
 */
export default function MaskReveal({
  children,
  className,
  as: Tag = "div",
  delay = 0,
}: MaskRevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      const inner = el.querySelector<HTMLElement>(".mask-inner");
      if (!inner) return;

      gsap.from(inner, {
        yPercent: 115,
        duration: 1,
        delay,
        ease: "power4.out",
        scrollTrigger: {
          trigger: el,
          start: "top 88%",
          once: true,
        },
      });
    },
    { scope: ref },
  );

  return (
    <Tag ref={ref} className={`line-mask ${className ?? ""}`}>
      <span className="mask-inner block">{children}</span>
    </Tag>
  );
}
