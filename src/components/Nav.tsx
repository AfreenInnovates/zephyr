"use client";

import { useRef, useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { gsap, useGSAP } from "@/lib/gsap";
import {
  FiMenu,
  FiX,
  FiThermometer,
  FiHeart,
} from "react-icons/fi";

const SECTION_LINKS = [
  { id: "why", label: "Why" },
  { id: "how", label: "How it works" },
  { id: "impact", label: "Impact" },
];

const FEATURES = [
  {
    href: "/heat-shield",
    label: "Heat Shield",
    desc: "Live danger map for youth sports",
    icon: <FiThermometer className="h-5 w-5" />,
    color: "text-heat-high",
    bg: "bg-orange-50",
  },
  {
    href: "/aed-map",
    label: "AED Gap Map",
    desc: "Find fields missing a defibrillator",
    icon: <FiHeart className="h-5 w-5" />,
    color: "text-rose-500",
    bg: "bg-rose-50",
  },
];

function scrollTo(id: string) {
  const el = document.getElementById(id);
  if (el) {
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

export default function Nav() {
  const ref = useRef<HTMLElement>(null);
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useGSAP(
    () => {
      gsap.from(ref.current, {
        y: -24,
        opacity: 0,
        duration: 0.8,
        delay: 0.2,
        ease: "power3.out",
      });
    },
    { scope: ref },
  );

  // Close sidebar on route change
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Lock body scroll when sidebar is open
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const isHome = pathname === "/";

  return (
    <>
      <header ref={ref} className="fixed inset-x-0 top-0 z-40 px-4 pt-4">
        <nav className="mx-auto flex max-w-6xl items-center justify-between gap-4 rounded-full border border-ink-900/12 bg-bone-50/90 px-4 py-2.5 shadow-[0_12px_34px_-18px_rgba(23,19,16,0.5)] backdrop-blur-md sm:px-5">
          <Link href="/" className="flex items-baseline gap-0.5 pl-2">
            <span className="font-display text-2xl leading-none text-ink-900">
              zephyr
            </span>
            <span className="text-2xl leading-none text-heat-high">.</span>
          </Link>

          {/* Section scroll buttons — only visible on homepage */}
          {isHome && (
            <div className="hidden items-center gap-7 md:flex">
              {SECTION_LINKS.map((l) => (
                <button
                  key={l.id}
                  type="button"
                  onClick={() => scrollTo(l.id)}
                  className="text-sm font-semibold text-ink-700 transition-colors hover:text-ink-900"
                >
                  {l.label}
                </button>
              ))}
            </div>
          )}

          {/* Hamburger button */}
          <button
            onClick={() => setOpen(true)}
            className="flex h-10 w-10 items-center justify-center rounded-full text-ink-800 transition hover:bg-ink-900/8"
            aria-label="Open menu"
          >
            <FiMenu className="h-5 w-5" />
          </button>
        </nav>
      </header>

      {/* Overlay */}
      <div
        className={`fixed inset-0 z-50 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={() => setOpen(false)}
      />

      {/* Slide-out sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-80 flex-col border-r border-ink-900/10 bg-bone-50 shadow-2xl transition-transform duration-300 ease-out ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Sidebar header */}
        <div className="flex items-center justify-between border-b border-ink-900/8 px-6 py-5">
          <Link href="/" className="flex items-baseline gap-0.5" onClick={() => setOpen(false)}>
            <span className="font-display text-2xl leading-none text-ink-900">
              zephyr
            </span>
            <span className="text-2xl leading-none text-heat-high">.</span>
          </Link>
          <button
            onClick={() => setOpen(false)}
            className="flex h-9 w-9 items-center justify-center rounded-full text-ink-600 transition hover:bg-ink-900/8"
            aria-label="Close menu"
          >
            <FiX className="h-5 w-5" />
          </button>
        </div>

        {/* Feature links */}
        <div className="flex-1 overflow-y-auto px-4 py-6">
          <p className="mb-3 px-2 font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-ink-400">
            Features
          </p>
          <div className="space-y-1.5">
            {FEATURES.map((f) => {
              const active = pathname === f.href;
              return (
                <Link
                  key={f.href}
                  href={f.href}
                  onClick={() => setOpen(false)}
                  className={`group flex items-center gap-3.5 rounded-xl px-3 py-3 transition-all ${
                    active
                      ? "bg-ink-900 text-bone-50 shadow-md"
                      : "text-ink-700 hover:bg-ink-900/5"
                  }`}
                >
                  <span
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition ${
                      active
                        ? "bg-white/15 text-bone-50"
                        : `${f.bg} ${f.color}`
                    }`}
                  >
                    {f.icon}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold leading-tight">
                      {f.label}
                    </span>
                    <span
                      className={`block text-xs leading-snug ${
                        active ? "text-bone-50/60" : "text-ink-400"
                      }`}
                    >
                      {f.desc}
                    </span>
                  </span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Sidebar footer */}
        <div className="border-t border-ink-900/8 px-6 py-4">
          <p className="text-center font-mono text-[11px] text-ink-400">
            Built with{" "}
            <a
              href="https://anakin.io"
              target="_blank"
              rel="noopener noreferrer"
              className="text-ink-600 underline decoration-ink-300 transition hover:text-ink-900"
            >
              Anakin
            </a>
          </p>
        </div>
      </aside>
    </>
  );
}
