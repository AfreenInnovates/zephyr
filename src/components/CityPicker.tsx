"use client";

import { useEffect, useRef, useState } from "react";
import { FiMapPin, FiSearch } from "react-icons/fi";
import { CitySuggestion } from "@/lib/sweep";

type CityPickerProps = {
  value: string;
  onSelect: (c: CitySuggestion) => void;
  /** Fires on every keystroke — lets the parent accept free text (e.g. a zip). */
  onText?: (text: string) => void;
  label?: string;
  placeholder?: string;
  hint?: string;
};

/**
 * City autocomplete (Open-Meteo geocoding via /api/cities). Numeric input is
 * treated as a zip and passed straight through (no suggestions).
 */
export default function CityPicker({
  value,
  onSelect,
  onText,
  label = "City",
  placeholder = "Start typing a city — e.g. Miami, Phoenix, Dallas…",
  hint = "Pick a city to lock its exact location — no more wrong matches.",
}: CityPickerProps) {
  const [text, setText] = useState(value);
  const [items, setItems] = useState<CitySuggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const query = (q: string) => {
    setText(q);
    onText?.(q);
    if (timer.current) clearTimeout(timer.current);
    // A zip / numeric entry: pass through, don't autocomplete.
    if (q.trim().length < 2 || /^\d+$/.test(q.trim())) {
      setItems([]);
      setOpen(false);
      return;
    }
    setLoading(true);
    setOpen(true);
    timer.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/cities?q=${encodeURIComponent(q)}`);
        const { cities } = (await res.json()) as { cities: CitySuggestion[] };
        setItems(cities);
        setActive(0);
      } catch {
        setItems([]);
      } finally {
        setLoading(false);
      }
    }, 220);
  };

  const choose = (c: CitySuggestion) => {
    onSelect(c);
    setText(c.label);
    setOpen(false);
  };

  return (
    <div ref={boxRef} className="relative">
      <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-ink-500">
        <FiMapPin className="h-3.5 w-3.5" /> {label}
      </label>
      <div className="mt-1.5 flex items-center gap-2 rounded-xl border border-ink-900/12 bg-white px-3.5 transition focus-within:border-ink-900/40 focus-within:ring-2 focus-within:ring-ink-900/5">
        <FiSearch className="h-4 w-4 shrink-0 text-ink-400" />
        <input
          value={text}
          onChange={(e) => query(e.target.value)}
          onFocus={() => text.trim().length >= 2 && !/^\d+$/.test(text.trim()) && setOpen(true)}
          onKeyDown={(e) => {
            if (!open || !items.length) return;
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setActive((a) => (a + 1) % items.length);
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setActive((a) => (a - 1 + items.length) % items.length);
            } else if (e.key === "Enter") {
              e.preventDefault();
              choose(items[active]);
            } else if (e.key === "Escape") setOpen(false);
          }}
          placeholder={placeholder}
          className="w-full bg-transparent py-3 text-[15px] outline-none placeholder:text-ink-400"
        />
      </div>
      {hint && <p className="mt-1 text-[11px] text-ink-400">{hint}</p>}

      {open && (
        <div className="absolute z-30 mt-1.5 w-full overflow-hidden rounded-xl border border-ink-900/12 bg-white shadow-xl">
          {loading && items.length === 0 && (
            <div className="px-4 py-3 text-sm text-ink-400">Searching…</div>
          )}
          {!loading && items.length === 0 && (
            <div className="px-4 py-3 text-sm text-ink-400">No matches.</div>
          )}
          {items.map((c, i) => (
            <button
              key={c.id}
              onMouseEnter={() => setActive(i)}
              onClick={() => choose(c)}
              className={`flex w-full items-center gap-2.5 px-4 py-2.5 text-left transition ${
                i === active ? "bg-bone-100" : ""
              }`}
            >
              <FiMapPin className="h-4 w-4 shrink-0 text-heat-high" />
              <span className="text-sm text-ink-800">
                <b>{c.name}</b>
                {[c.admin1, c.country].filter(Boolean).length ? (
                  <span className="text-ink-400">
                    {" · "}
                    {[c.admin1, c.country].filter(Boolean).join(", ")}
                  </span>
                ) : null}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
