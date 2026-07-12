"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { FiThermometer, FiAlertTriangle, FiShield, FiArrowRight } from "react-icons/fi";
import DangerMap from "./DangerMap";
import RollingNumber from "./RollingNumber";
import Reveal from "./Reveal";

export default function Hero() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      // Self-contained entrance — does NOT depend on the intro loader, so the
      // hero can never be left blank if that handoff is missed.
      gsap.from(".hero-line-inner", {
        yPercent: 115,
        duration: 1.1,
        stagger: 0.1,
        ease: "power4.out",
        delay: 0.35,
      });
      gsap.from(".hero-fade", {
        opacity: 0,
        y: 26,
        duration: 0.9,
        stagger: 0.1,
        ease: "power3.out",
        delay: 0.7,
      });

      // Failsafe: guarantee the hero is visible even if the tween ever stalls.
      const safety = window.setTimeout(() => {
        gsap.set(".hero-line-inner", { yPercent: 0 });
        gsap.set(".hero-fade", { opacity: 1, y: 0 });
      }, 3000);
      return () => window.clearTimeout(safety);
    },
    { scope: root },
  );

  return (
    <section
      id="top"
      ref={root}
      className="relative pt-32 pb-10 sm:pt-40"
    >
      {/* Big full-width statement */}
      <div className="sticky top-28 z-0 mx-auto max-w-6xl px-5 pb-20 text-center sm:top-32 sm:pb-32">
        <div className="hero-fade mb-8 inline-flex items-center gap-2 rounded-full border border-ink-900/12 bg-white/70 px-4 py-1.5 text-sm font-semibold text-ink-700">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-heat-high/60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-heat-high" />
          </span>
          The missing alarm for youth sports
        </div>

        <h1 className="font-display text-[3.25rem] leading-[0.88] tracking-tightest text-ink-900 sm:text-8xl lg:text-9xl">
          <span className="line-mask">
            <span className="hero-line-inner block">Stop kids playing</span>
          </span>
          <span className="line-mask">
            <span className="hero-line-inner block">in deadly heat</span>
          </span>
          <span className="line-mask">
            <span className="hero-line-inner block text-gradient-heat">
              &amp; wildfire smoke.
            </span>
          </span>
        </h1>

        <p className="hero-fade mx-auto mt-8 max-w-2xl text-lg leading-relaxed text-ink-500 sm:text-xl">
          Zephyr matches every youth practice with the heat and air quality at
          that exact field and hour - and flags the dangerous ones{" "}
          <span className="font-semibold text-ink-800">in time to act.</span>
        </p>

        <div className="hero-fade mt-9 flex flex-wrap items-center justify-center gap-3">
          <a
            href="#how"
            className="group flex items-center gap-2 rounded-full bg-ink-900 px-8 py-4 text-base font-semibold text-bone-50 transition hover:bg-ink-800"
          >
            See how it works
            <FiArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
          </a>
          <a
            href="#why"
            className="rounded-full border border-ink-900/15 bg-white/50 px-8 py-4 text-base font-semibold text-ink-800 transition hover:bg-white/80"
          >
            Why it matters
          </a>
        </div>
      </div>

      {/* The Reveal Card for Map & Metrics */}
      <div className="relative z-10 mx-auto w-full rounded-t-[2.5rem] border-t border-ink-900/5 bg-gradient-to-b from-heat-high from-60% to-[#f5f3ee] px-5 pt-16 pb-12 shadow-[0_-20px_60px_rgba(23,19,16,0.06)] sm:rounded-t-[3.5rem] sm:px-10 sm:pt-24 sm:pb-20">
        
        {/* Live danger-map showcase */}
        <Reveal rise className="mx-auto max-w-3xl">
          <div className="console-card p-5 sm:p-6">
            <div className="mb-4 flex items-center justify-between px-1">
              <div className="flex items-center gap-2 font-mono text-xs text-bone-50/60">
                <span className="h-2 w-2 animate-pulse rounded-full bg-heat-safe" />
                LIVE · region sweep
              </div>
              <div className="font-mono text-[11px] text-bone-50/40">
                every field at once
              </div>
            </div>
            <div className="mx-auto aspect-square w-full max-w-md rounded-2xl bg-black/30 p-2">
              <DangerMap />
            </div>
            <div className="mt-4 flex flex-wrap justify-center gap-4 px-1 font-mono text-[11px] text-bone-50/60">
              {[
                ["#1f9e7a", "Safe"],
                ["#e0a80d", "Caution"],
                ["#f2760c", "High"],
                ["#e23a25", "Extreme"],
              ].map(([c, l]) => (
                <span key={l} className="flex items-center gap-1.5">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ background: c }}
                  />
                  {l}
                </span>
              ))}
            </div>
          </div>
        </Reveal>

        {/* Quick stats */}
        <Reveal stagger rise className="mx-auto mt-8 grid max-w-3xl grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            { 
              icon: <FiThermometer className="h-6 w-6 text-heat-high" />,
              n: <RollingNumber value={9237} prefix="~" />, l: "heat illnesses / yr in HS athletes" 
            },
            { 
              icon: <FiAlertTriangle className="h-6 w-6 text-heat-high" />,
              n: <>~<RollingNumber value={11} />×</>, l: "football's heat rate vs. all sports" 
            },
            { 
              icon: <FiShield className="h-6 w-6 text-heat-safe" />,
              n: <RollingNumber value={100} suffix="%" />, l: "of these deaths are preventable" 
            },
          ].map((s, i) => (
            <div key={i} className="tcard relative flex flex-col items-center bg-white/70 px-6 py-5 text-center">
              <div className="absolute -right-3 -top-5 animate-float" style={{ animationDelay: `-${i * 0.75}s` }}>
                <div className="flex h-12 w-12 rotate-[10deg] items-center justify-center rounded-full bg-white shadow-[0_8px_20px_rgba(0,0,0,0.12)] transition-transform hover:rotate-0">
                  {s.icon}
                </div>
              </div>
              <div className="font-display text-5xl text-ink-900 tabular-nums">
                {s.n}
              </div>
              <div className="mt-2 text-sm text-ink-500">{s.l}</div>
            </div>
          ))}
        </Reveal>
      </div>
    </section>
  );
}
