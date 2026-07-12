"use client";

import { useMemo, useRef, useState } from "react";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";

const WORD = "zephyr";
const ALPHA = "abcdefghijklmnopqrstuvwxyz";

/** For a target letter, build a reel that rolls a→z→…→target. */
function stripFor(target: string): string[] {
  const idx = ALPHA.indexOf(target);
  return (ALPHA + ALPHA.slice(0, idx + 1)).split("");
}

/** Percent translate (of column height) that rests on the last cell. */
function restPct(count: number): number {
  return -100 * ((count - 1) / count);
}

export default function IntroLoader() {
  const root = useRef<HTMLDivElement>(null);
  const countRef = useRef<HTMLSpanElement>(null);
  const [done, setDone] = useState(false);

  const strips = useMemo(() => WORD.split("").map(stripFor), []);

  useGSAP(
    () => {
      const overlay = root.current;
      if (!overlay) return;

      const seen =
        typeof window !== "undefined" &&
        sessionStorage.getItem("zephyr_intro") === "1";
      const reduce = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;

      let finished = false;
      const finish = () => {
        if (finished) return;
        finished = true;
        document.body.style.overflow = "";
        sessionStorage.setItem("zephyr_intro", "1");
        ScrollTrigger.refresh();
        setDone(true);
      };

      // Reels already REST on "zephyr" (inline transform), so skipping the
      // animation still shows the brand — never a broken "aaaaaa".
      if (seen) {
        document.body.style.overflow = "";
        finish();
        return;
      }

      document.body.style.overflow = "hidden";
      window.scrollTo(0, 0);
      // Never leave scroll locked, even if the animation loop stalls.
      const safety = window.setTimeout(finish, 3800);

      if (reduce) {
        window.setTimeout(finish, 400);
        return () => window.clearTimeout(safety);
      }

      const cols = gsap.utils.toArray<HTMLElement>(".intro-reel-col");
      const counter = { v: 100 };
      const tl = gsap.timeline({
        onComplete: () => {
          window.clearTimeout(safety);
          finish();
        },
      });

      // Each reel spins from 'a' up to its target, resolving left → right.
      // immediateRender:false => the "start on a" state is applied only when
      // the tween actually runs; otherwise the reel stays on its target.
      cols.forEach((col, i) => {
        const n = Number(col.dataset.count);
        tl.fromTo(
          col,
          { yPercent: 0 },
          {
            yPercent: restPct(n),
            duration: 1.5,
            ease: "power4.out",
            immediateRender: false,
          },
          i * 0.12,
        );
      });

      tl.fromTo(
        ".intro-rule",
        { scaleX: 0 },
        { scaleX: 1, duration: 1.2, ease: "power2.inOut", immediateRender: false },
        0,
      )
        .fromTo(
          counter,
          { v: 0 },
          {
            v: 100,
            duration: 1.6,
            ease: "power2.out",
            immediateRender: false,
            onUpdate: () => {
              if (countRef.current)
                countRef.current.textContent = String(
                  Math.round(counter.v),
                ).padStart(3, "0");
            },
          },
          0,
        )
        .to(".intro-meta", { opacity: 0, duration: 0.3 }, ">+0.15")
        .to(overlay, { yPercent: -100, duration: 0.9, ease: "power4.inOut" }, "<");

      return () => window.clearTimeout(safety);
    },
    { scope: root },
  );

  if (done) return null;

  return (
    <div
      ref={root}
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-console text-bone-50"
    >
      <div className="flex items-end font-display text-6xl leading-none tracking-tightest sm:text-8xl">
        {strips.map((strip, i) => (
          <span key={i} className="intro-reel-window">
            <span
              className="intro-reel-col"
              data-count={strip.length}
              style={{ transform: `translateY(${restPct(strip.length)}%)` }}
            >
              {strip.map((c, j) => (
                <span key={j}>{c}</span>
              ))}
            </span>
          </span>
        ))}
        <span className="ml-1 text-heat-high">.</span>
      </div>

      <div className="intro-meta mt-10 flex w-[min(80vw,420px)] flex-col items-center gap-4">
        <div className="intro-rule h-px w-full origin-left bg-bone-50/25" />
        <div className="flex w-full items-center justify-between font-mono text-xs uppercase tracking-[0.25em] text-bone-50/50">
          <span>watching every field</span>
          <span>
            <span ref={countRef}>100</span>%
          </span>
        </div>
      </div>
    </div>
  );
}
