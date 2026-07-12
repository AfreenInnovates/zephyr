"use client";

import { useMemo, useRef } from "react";
import { gsap, useGSAP, mulberry32 } from "@/lib/gsap";

const ZONES = [
  { color: "#1f9e7a", label: "Safe" },
  { color: "#e0a80d", label: "Caution" },
  { color: "#f2760c", label: "High" },
  { color: "#e23a25", label: "Extreme" },
];

type Venue = {
  x: number;
  y: number;
  r: number;
  zoneIndex: number;
  delay: number;
};

// Weighted distribution: mostly safe, a meaningful cluster of danger.
function pickZone(rand: () => number): number {
  const v = rand();
  if (v < 0.5) return 0;
  if (v < 0.72) return 1;
  if (v < 0.88) return 2;
  return 3;
}

export default function DangerMap() {
  const wrap = useRef<HTMLDivElement>(null);

  const venues = useMemo<Venue[]>(() => {
    const rand = mulberry32(20260711);
    const out: Venue[] = [];
    const COUNT = 74;
    let placed = 0;
    let guard = 0;
    while (placed < COUNT && guard < 4000) {
      guard++;
      const x = rand() * 100;
      const y = rand() * 100;
      // Keep dots inside a soft blob so it reads as a "region".
      const dx = (x - 50) / 50;
      const dy = (y - 48) / 46;
      if (dx * dx + dy * dy > 1) continue;
      out.push({
        x,
        y,
        r: 2.4 + rand() * 1.8,
        zoneIndex: pickZone(rand),
        delay: rand(),
      });
      placed++;
    }
    return out;
  }, []);

  useGSAP(
    () => {
      const root = wrap.current;
      if (!root) return;
      const dots = gsap.utils.toArray<SVGCircleElement>(".venue-dot");
      const halos = gsap.utils.toArray<SVGCircleElement>(".venue-halo");

      gsap.set(dots, { scale: 0, transformOrigin: "center", fill: "#463b2e" });
      gsap.set(halos, { scale: 0, transformOrigin: "center", opacity: 0 });

      const tl = gsap.timeline({
        scrollTrigger: { trigger: root, start: "top 78%", once: true },
      });

      // 1. Dots stream in as "schedules arrive" - all grey.
      tl.to(dots, {
        scale: 1,
        duration: 0.5,
        ease: "back.out(1.8)",
        stagger: { each: 0.02, from: "random" },
      });

      // 2. A scan pass colors each dot as "conditions report in".
      dots.forEach((dot, i) => {
        const v = venues[i];
        const color = ZONES[v.zoneIndex].color;
        tl.to(
          dot,
          { fill: color, duration: 0.35, ease: "power1.out" },
          "-=0.35",
        );
        // Danger dots get a pulsing halo.
        if (v.zoneIndex >= 2) {
          const halo = halos[i];
          tl.to(
            halo,
            { scale: 1, opacity: 0.5, duration: 0.4, ease: "power2.out" },
            "<",
          );
          gsap.to(halo, {
            scale: 1.9,
            opacity: 0,
            duration: 1.6,
            repeat: -1,
            ease: "power1.out",
            delay: 1 + v.delay,
          });
        }
      });

      // Gentle idle breathing on the whole field.
      gsap.to(root, {
        filter: "brightness(1.06)",
        duration: 3,
        yoyo: true,
        repeat: -1,
        ease: "sine.inOut",
      });
    },
    { scope: wrap },
  );

  const dangerCount = venues.filter((v) => v.zoneIndex >= 2).length;

  return (
    <div ref={wrap} className="relative">
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full block"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* region outline */}
        <ellipse
          cx="50"
          cy="48"
          rx="49"
          ry="45"
          fill="rgba(255,255,255,0.02)"
          stroke="rgba(255,255,255,0.14)"
          strokeWidth="0.3"
          strokeDasharray="1.4 1.4"
        />
        {venues.map((v, i) => (
          <g key={i}>
            <circle
              className="venue-halo"
              cx={v.x}
              cy={v.y}
              r={v.r * 1.6}
              fill={ZONES[v.zoneIndex].color}
            />
            <circle
              className="venue-dot"
              cx={v.x}
              cy={v.y}
              r={v.r}
              fill="#463b2e"
            />
          </g>
        ))}
      </svg>

      <div className="pointer-events-none absolute bottom-2 left-2 rounded-lg border border-white/10 bg-black/40 px-3 py-2 font-mono text-[11px] text-bone-50/70 backdrop-blur-sm">
        <span className="font-semibold text-heat-extreme">{dangerCount}</span>{" "}
        venues flagged · scanning live
      </div>
    </div>
  );
}
