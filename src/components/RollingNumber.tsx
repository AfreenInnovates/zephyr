"use client";

import { useRef } from "react";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";

type RollingNumberProps = {
  value: number;
  prefix?: string;
  suffix?: string;
  className?: string;
};

const DIGITS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];

/**
 * Odometer-style counter. Each digit is a vertical reel that rolls to its
 * target when scrolled into view - the slot-machine feel from the reference
 * sites. Commas / symbols render as static glyphs.
 */
export default function RollingNumber({
  value,
  prefix = "",
  suffix = "",
  className,
}: RollingNumberProps) {
  const root = useRef<HTMLSpanElement>(null);
  const chars = value.toLocaleString("en-US").split("");

  useGSAP(
    () => {
      const el = root.current;
      if (!el) return;
      const reels = gsap.utils.toArray<HTMLElement>(".reel-column", el);

      gsap.set(reels, { yPercent: 0 });

      ScrollTrigger.create({
        trigger: el,
        start: "top 90%",
        once: true,
        onEnter: () => {
          reels.forEach((reel, i) => {
            const target = Number(reel.dataset.digit);
            gsap.to(reel, {
              yPercent: -target * 10,
              duration: 1.5,
              ease: "power4.out",
              delay: i * 0.08,
            });
          });
        },
      });
    },
    { scope: root },
  );

  return (
    <span ref={root} className={className}>
      {prefix}
      {chars.map((ch, i) => {
        if (!/[0-9]/.test(ch)) {
          return <span key={i}>{ch}</span>;
        }
        return (
          <span key={i} className="reel-window">
            <span className="reel-column" data-digit={ch}>
              {DIGITS.map((d) => (
                <span key={d}>{d}</span>
              ))}
            </span>
          </span>
        );
      })}
      {suffix}
    </span>
  );
}
