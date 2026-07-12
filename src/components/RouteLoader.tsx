"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

/**
 * Shows a branded curtain during page-to-page navigation. It triggers the
 * instant an internal link is clicked (covering the whole transition/compile
 * pause) and hides once the destination route has rendered — so there's never
 * a frozen blank screen between pages.
 */
export default function RouteLoader() {
  const pathname = usePathname();
  const [active, setActive] = useState(false);
  const startedAt = useRef(0);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const failsafe = useRef<ReturnType<typeof setTimeout> | null>(null);
  const first = useRef(true);

  // Navigation START — internal link clicks + browser back/forward.
  useEffect(() => {
    const show = () => {
      startedAt.current = Date.now();
      setActive(true);
      if (failsafe.current) clearTimeout(failsafe.current);
      // Never let the curtain get stuck.
      failsafe.current = setTimeout(() => setActive(false), 8000);
    };

    const onClick = (e: MouseEvent) => {
      if (
        e.defaultPrevented ||
        e.button !== 0 ||
        e.metaKey ||
        e.ctrlKey ||
        e.shiftKey ||
        e.altKey
      )
        return;
      const a = (e.target as Element | null)?.closest?.("a");
      if (!a) return;
      const href = a.getAttribute("href");
      if (!href || a.getAttribute("target") === "_blank" || a.hasAttribute("download"))
        return;
      let url: URL;
      try {
        url = new URL(href, window.location.href);
      } catch {
        return;
      }
      if (url.origin !== window.location.origin) return;
      // Same-page hash links (#why, #how) shouldn't trigger the curtain.
      if (url.pathname === window.location.pathname) return;
      show();
    };

    const onPop = () => show();
    document.addEventListener("click", onClick, true);
    window.addEventListener("popstate", onPop);
    return () => {
      document.removeEventListener("click", onClick, true);
      window.removeEventListener("popstate", onPop);
    };
  }, []);

  // Navigation END — the destination route has rendered.
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const elapsed = Date.now() - startedAt.current;
    const wait = Math.max(0, 380 - elapsed); // keep it visible long enough to read
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => {
      if (failsafe.current) clearTimeout(failsafe.current);
      setActive(false);
    }, wait);
    return () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, [pathname]);

  if (!active) return null;

  return (
    <div className="route-loader fixed inset-0 z-[95] flex flex-col items-center justify-center bg-console">
      <div className="font-display text-6xl tracking-tightest text-bone-50 sm:text-7xl">
        zephyr<span className="text-heat-high">.</span>
      </div>
      <div className="mt-6 h-[3px] w-40 overflow-hidden rounded-full bg-white/10">
        <div className="route-bar h-full w-2/5 rounded-full bg-gradient-to-r from-heat-caution to-heat-high" />
      </div>
    </div>
  );
}
