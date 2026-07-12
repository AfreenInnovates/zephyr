"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  FiMapPin,
  FiActivity,
  FiCalendar,
  FiClock,
  FiGrid,
  FiSearch,
  FiChevronDown,
} from "react-icons/fi";
import {
  AQI_BANDS,
  Bbox,
  CitySuggestion,
  DoneEvent,
  HEAT_BANDS,
  ProgressEvent,
  Risk,
  RISK_META,
  ScoreEvent,
  StatusEvent,
  SweepInputs,
  SweepMeta,
  VenueEvent,
  projectWithBbox,
} from "@/lib/sweep";

type Venue = VenueEvent & Partial<ScoreEvent> & { unavailable?: boolean };
type Phase = "idle" | "running" | "done";

const SPORTS = ["Football", "Soccer", "Cross country", "Band", "Field hockey"];
const HOURS = [6, 8, 10, 12, 14, 15, 16, 17, 18, 19, 20];
const hourLabel = (h: number) =>
  h === 12 ? "12 PM" : h < 12 ? `${h} AM` : `${h - 12} PM`;

const FILLERS = [
  "Retrieving hourly forecasts…",
  "Querying air-quality stations…",
  "Scoring against NWS heat-index bands…",
  "Aggregating venue conditions…",
];

const DEFAULT_CITY: SweepInputs = {
  city: "Austin, Texas, United States",
  lat: 30.2672,
  lon: -97.7431,
  sport: "Football",
  when: "today",
  hour: 16,
  conditioning: true,
  venues: 10,
};

export default function SweepApp() {
  const [form, setForm] = useState<SweepInputs>(DEFAULT_CITY);
  const [phase, setPhase] = useState<Phase>("idle");
  const [venues, setVenues] = useState<Record<string, Venue>>({});
  const [meta, setMeta] = useState<SweepMeta | null>(null);
  const [status, setStatus] = useState<StatusEvent>({
    text: "Pick a city and run a sweep.",
  });
  const [progress, setProgress] = useState<ProgressEvent>({ done: 0, total: 0 });
  const [flaggedCount, setFlaggedCount] = useState(0);
  const [hover, setHover] = useState<{ id: string; x: number; y: number } | null>(null);

  const esRef = useRef<EventSource | null>(null);
  const lastStatusAt = useRef(0);
  const fillerIdx = useRef(0);

  useEffect(() => {
    if (phase !== "running") return;
    const id = setInterval(() => {
      if (Date.now() - lastStatusAt.current > 2400) {
        fillerIdx.current = (fillerIdx.current + 1) % FILLERS.length;
        setStatus({ text: FILLERS[fillerIdx.current] });
        lastStatusAt.current = Date.now();
      }
    }, 1200);
    return () => clearInterval(id);
  }, [phase]);

  useEffect(() => () => esRef.current?.close(), []);

  const pushStatus = (s: StatusEvent) => {
    lastStatusAt.current = Date.now();
    setStatus(s);
  };
  const set = <K extends keyof SweepInputs>(k: K, v: SweepInputs[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const run = () => {
    esRef.current?.close();
    setVenues({});
    setMeta(null);
    setProgress({ done: 0, total: 0 });
    setFlaggedCount(0);
    setPhase("running");
    setHover(null);
    pushStatus({ text: "Initializing regional sweep…" });

    const p = new URLSearchParams({
      city: form.city,
      lat: String(form.lat),
      lon: String(form.lon),
      sport: form.sport,
      when: form.when,
      hour: String(form.hour),
      conditioning: form.conditioning ? "1" : "0",
      venues: String(form.venues),
    });
    const es = new EventSource(`/api/sweep?${p.toString()}`);
    esRef.current = es;

    es.addEventListener("meta", (e) => setMeta(JSON.parse((e as MessageEvent).data)));
    es.addEventListener("status", (e) => pushStatus(JSON.parse((e as MessageEvent).data)));
    es.addEventListener("venue", (e) => {
      const v = JSON.parse((e as MessageEvent).data) as VenueEvent;
      setVenues((prev) => ({ ...prev, [v.id]: v }));
    });
    es.addEventListener("score", (e) => {
      const s = JSON.parse((e as MessageEvent).data) as ScoreEvent;
      setVenues((prev) =>
        prev[s.venueId] ? { ...prev, [s.venueId]: { ...prev[s.venueId], ...s } } : prev,
      );
    });
    es.addEventListener("unavailable", (e) => {
      const { venueId } = JSON.parse((e as MessageEvent).data) as { venueId: string };
      setVenues((prev) =>
        prev[venueId] ? { ...prev, [venueId]: { ...prev[venueId], unavailable: true } } : prev,
      );
    });
    es.addEventListener("progress", (e) => setProgress(JSON.parse((e as MessageEvent).data)));
    es.addEventListener("done", (e) => {
      const d = JSON.parse((e as MessageEvent).data) as DoneEvent;
      setFlaggedCount(d.flagged);
      setPhase("done");
      es.close();
    });
    es.onerror = () => {
      es.close();
      setPhase((ph) => (ph === "running" ? "idle" : ph));
    };
  };

  const bbox: Bbox = meta?.bbox ?? { minLat: 0, maxLat: 1, minLon: 0, maxLon: 1 };
  const list = Object.values(venues);
  const flagged = list
    .filter((v) => v.risk === "high" || v.risk === "extreme")
    .sort(
      (a, b) =>
        RISK_META[b.risk!].rank - RISK_META[a.risk!].rank ||
        (b.heatIndex ?? 0) - (a.heatIndex ?? 0),
    );
  const pct = progress.total ? Math.round((progress.done / progress.total) * 100) : 0;
  const scored = list.filter((v) => v.risk).length;
  const noData = list.filter((v) => v.unavailable).length;
  const canRun = Number.isFinite(form.lat) && Number.isFinite(form.lon) && !!form.city;

  return (
    <main className="mx-auto min-h-screen max-w-7xl px-5 pt-24 pb-6 sm:px-8">
      <div className="flex flex-wrap items-center justify-end gap-4">
        <span
          className="flex items-center gap-2 rounded-full border border-ink-900/10 bg-white/60 px-3 py-1.5 font-mono text-xs text-ink-600"
          title={meta?.source === "live" ? "Live Open-Meteo data" : "Demo data"}
        >
          <span
            className={`h-2 w-2 rounded-full ${
              meta?.source === "live" ? "bg-heat-safe" : "bg-heat-caution"
            }`}
          />
          {meta ? (meta.source === "live" ? "LIVE DATA" : "DEMO DATA") : "READY"}
        </span>
      </div>

      {/* ---- Input form ---- */}
      <div className="tcard mt-6 bg-white/80 p-6">
        <CityPicker
          value={form.city}
          onSelect={(c) => setForm((f) => ({ ...f, city: c.label, lat: c.lat, lon: c.lon }))}
        />

        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <SelectField icon={<FiActivity />} label="Sport" hint="Football = highest risk">
            <Select value={form.sport} onChange={(v) => set("sport", v)} options={SPORTS} />
          </SelectField>
          <SelectField icon={<FiCalendar />} label="When" hint="Forecast day">
            <Select
              value={form.when}
              onChange={(v) => set("when", v as SweepInputs["when"])}
              options={["today", "tomorrow"]}
              render={(v) => v[0].toUpperCase() + v.slice(1)}
            />
          </SelectField>
          <SelectField icon={<FiClock />} label="Practice time" hint="Hour we score">
            <Select
              value={String(form.hour)}
              onChange={(v) => set("hour", Number(v))}
              options={HOURS.map(String)}
              render={(v) => hourLabel(Number(v))}
            />
          </SelectField>
          <SelectField icon={<FiGrid />} label="Venues" hint="More = more credits">
            <Select
              value={String(form.venues)}
              onChange={(v) => set("venues", Number(v))}
              options={["10", "15", "20", "40"]}
              render={(v) => `${v} venues`}
            />
          </SelectField>
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-4 border-t border-ink-900/8 pt-5">
          <button
            type="button"
            onClick={() => set("conditioning", !form.conditioning)}
            className="flex items-center gap-3 text-left text-sm text-ink-700"
          >
            <span
              className={`relative h-6 w-11 shrink-0 rounded-full transition ${
                form.conditioning ? "bg-heat-extreme" : "bg-ink-900/20"
              }`}
            >
              <span
                className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
                  form.conditioning ? "left-[22px]" : "left-0.5"
                }`}
              />
            </span>
            <span>
              <span className="font-semibold">Preseason conditioning</span>
              <span className="ml-1.5 text-ink-400">escalates risk one level</span>
            </span>
          </button>

          <button
            onClick={run}
            disabled={phase === "running" || !canRun}
            className="rounded-full bg-ink-900 px-8 py-3 text-sm font-semibold text-bone-50 transition hover:bg-ink-800 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {phase === "running" ? "Sweeping…" : phase === "done" ? "Run again" : "Run a sweep"}
          </button>
        </div>
      </div>

      {/* ---- Map + panels ---- */}
      <div className="mt-5 grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <div className="console-card p-5 sm:p-6">
          <div className="mb-3 flex items-center justify-between font-mono text-xs text-bone-50/60">
            <span className="flex min-w-0 items-center gap-2">
              <span
                className={`h-2 w-2 shrink-0 rounded-full ${
                  phase === "running" ? "animate-pulse bg-heat-high" : "bg-heat-safe"
                }`}
              />
              <span className="truncate">{meta?.region ?? form.city}</span>
            </span>
            <span className="shrink-0 text-bone-50/40">
              {progress.done}/{progress.total || "—"} scored
            </span>
          </div>

          <div className="relative mx-auto aspect-square w-full max-w-xl rounded-2xl bg-black/30 p-2">
            <svg viewBox="0 0 100 100" className="block h-full w-full">
              <ellipse
                cx="50" cy="50" rx="46" ry="44"
                fill="rgba(255,255,255,0.02)"
                stroke="rgba(255,255,255,0.12)"
                strokeWidth="0.3" strokeDasharray="1.4 1.4"
              />
              {list.map((v) => {
                const { x, y } = projectWithBbox(v.lat, v.lon, bbox);
                const color = v.unavailable
                  ? "#5b6472"
                  : v.risk
                    ? RISK_META[v.risk].color
                    : "#463b2e";
                const danger = v.risk === "high" || v.risk === "extreme";
                const active = hover?.id === v.id;
                return (
                  <g key={v.id}>
                    {danger && (
                      <circle
                        className="sweep-halo"
                        cx={x} cy={y} r={3.4} fill={color}
                        style={{ pointerEvents: "none" }}
                      />
                    )}
                    <circle
                      className="sweep-dot"
                      cx={x} cy={y} r={active ? 3 : 2.1} fill={color}
                      stroke={active ? "#fff" : "none"} strokeWidth={active ? 0.6 : 0}
                      style={{ pointerEvents: "none" }}
                    />
                    <circle
                      cx={x} cy={y} r={4.5} fill="transparent"
                      style={{ pointerEvents: "all", cursor: "pointer" }}
                      onMouseEnter={() => setHover({ id: v.id, x, y })}
                      onMouseLeave={() => setHover((h) => (h?.id === v.id ? null : h))}
                    />
                  </g>
                );
              })}
            </svg>

            {hover && venues[hover.id] && (
              <div
                className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-lg border border-white/10 bg-black/90 px-2.5 py-1.5 shadow-lg backdrop-blur"
                style={{ left: `${hover.x}%`, top: `${hover.y}%`, marginTop: -8 }}
              >
                <div className="whitespace-nowrap text-[12px] font-semibold text-bone-50">
                  {venues[hover.id].name}
                </div>
                {venues[hover.id].unavailable ? (
                  <div className="mt-0.5 font-mono text-[11px] text-bone-50/50">no data</div>
                ) : venues[hover.id].risk ? (
                  <div className="mt-0.5 flex items-center gap-1.5 whitespace-nowrap font-mono text-[11px] text-bone-50/75">
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ background: RISK_META[venues[hover.id].risk!].color }}
                    />
                    {RISK_META[venues[hover.id].risk!].label} · {venues[hover.id].heatIndex}°F
                    {venues[hover.id].aqi != null ? ` · AQI ${venues[hover.id].aqi}` : ""}
                  </div>
                ) : (
                  <div className="mt-0.5 font-mono text-[11px] text-bone-50/50">scoring…</div>
                )}
              </div>
            )}
          </div>

          <div className="mt-4 flex items-center gap-2.5 rounded-xl bg-black/30 px-4 py-3">
            <span
              className={`h-2 w-2 shrink-0 rounded-full ${
                status.kind === "alert"
                  ? "bg-heat-extreme"
                  : phase === "running"
                    ? "animate-pulse bg-heat-high"
                    : "bg-heat-safe"
              }`}
            />
            <p
              className={`truncate font-mono text-[13px] ${
                status.kind === "alert" ? "text-heat-high" : "text-bone-50/80"
              }`}
            >
              {status.text}
            </p>
          </div>

          <div className="mt-4">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-heat-caution to-heat-high transition-[width] duration-300"
                style={{ width: `${pct}%` }}
              />
            </div>
            <div className="mt-3 flex flex-wrap gap-4 font-mono text-[11px] text-bone-50/60">
              {(Object.keys(RISK_META) as Risk[]).map((r) => (
                <span key={r} className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full" style={{ background: RISK_META[r].color }} />
                  {RISK_META[r].label}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-3 gap-3">
            <Stat label="Venues" value={list.length} />
            <Stat label="Scored" value={scored} />
            <Stat label="Flagged" value={phase === "done" ? flaggedCount : flagged.length} accent />
          </div>

          <div className="tcard flex min-h-[20rem] flex-1 flex-col bg-white/80 p-5">
            <h2 className="font-display text-2xl text-ink-900">Flagged fields</h2>
            <p className="mt-1 text-sm text-ink-500">🟠 High or 🔴 Extreme, most severe first.</p>
            <div className="mt-4 flex-1 space-y-2.5 overflow-y-auto pr-1">
              {flagged.length === 0 && (
                <div className="flex h-full min-h-[10rem] items-center justify-center text-center text-sm text-ink-400">
                  {phase === "idle"
                    ? "Run a sweep to surface dangerous practices."
                    : phase === "running"
                      ? "Scoring venues…"
                      : "No fields flagged — all clear."}
                </div>
              )}
              {flagged.map((v) => (
                <FlaggedCard key={v.id} v={v} />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ---- Explainers ---- */}
      <div className="mt-5 grid gap-5 md:grid-cols-2">
        <div className="tcard bg-white/80 p-6">
          <h3 className="font-display text-xl text-ink-900">What just happened</h3>
          {meta ? (
            <p className="mt-2 text-sm leading-relaxed text-ink-600">
              Zephyr resolved <b>{meta.total} venues</b> across <b>{meta.region}</b>, then retrieved
              the {meta.inputs.when} {hourLabel(meta.inputs.hour)} forecast and air quality at each{" "}
              {meta.source === "live" ? "from Open-Meteo" : "(demo data)"}. It scored heat index
              against NWS bands and AQI against EPA bands, took the worse of the two
              {meta.inputs.conditioning ? ", and escalated conditioning by one level" : ""}.{" "}
              <b>{flagged.length || flaggedCount}</b> were flagged dangerous
              {noData > 0 ? `; ${noData} couldn't be retrieved (shown grey, not scored)` : ""}.
            </p>
          ) : (
            <p className="mt-2 text-sm text-ink-500">
              Pick a city, run a sweep, and this explains exactly what Zephyr did.
            </p>
          )}
        </div>

        <div className="tcard bg-white/80 p-6">
          <h3 className="font-display text-xl text-ink-900">How risk is scored</h3>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <BandList title="Heat index" bands={HEAT_BANDS} />
            <BandList title="Air quality (AQI)" bands={AQI_BANDS} />
          </div>
        </div>
      </div>
    </main>
  );
}

// ---------------------------------------------------------------------------

function CityPicker({
  value,
  onSelect,
}: {
  value: string;
  onSelect: (c: CitySuggestion) => void;
}) {
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
    if (timer.current) clearTimeout(timer.current);
    if (q.trim().length < 2) {
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
        <FiMapPin className="h-3.5 w-3.5" /> City
      </label>
      <div className="mt-1.5 flex items-center gap-2 rounded-xl border border-ink-900/12 bg-white px-3.5 transition focus-within:border-ink-900/40 focus-within:ring-2 focus-within:ring-ink-900/5">
        <FiSearch className="h-4 w-4 shrink-0 text-ink-400" />
        <input
          value={text}
          onChange={(e) => query(e.target.value)}
          onFocus={() => text.trim().length >= 2 && setOpen(true)}
          onKeyDown={(e) => {
            if (!open || !items.length) return;
            if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => (a + 1) % items.length); }
            else if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => (a - 1 + items.length) % items.length); }
            else if (e.key === "Enter") { e.preventDefault(); choose(items[active]); }
            else if (e.key === "Escape") setOpen(false);
          }}
          placeholder="Start typing a city — e.g. Miami, Phoenix, Dallas…"
          className="w-full bg-transparent py-3 text-[15px] outline-none placeholder:text-ink-400"
        />
      </div>
      <p className="mt-1 text-[11px] text-ink-400">
        Pick a city to lock its exact location — no more wrong matches.
      </p>

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
                <span className="text-ink-400">
                  {[c.admin1, c.country].filter(Boolean).join(", ") ? ` · ${[c.admin1, c.country].filter(Boolean).join(", ")}` : ""}
                </span>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function SelectField({
  icon,
  label,
  hint,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-ink-500">
        <span className="h-3.5 w-3.5">{icon}</span>
        {label}
      </label>
      <div className="mt-1.5">{children}</div>
      {hint && <p className="mt-1 text-[11px] text-ink-400">{hint}</p>}
    </div>
  );
}

function Select({
  value,
  onChange,
  options,
  render,
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
  render?: (v: string) => string;
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full appearance-none rounded-xl border border-ink-900/12 bg-white px-3.5 py-3 text-[15px] outline-none transition focus:border-ink-900/40 focus:ring-2 focus:ring-ink-900/5"
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {render ? render(o) : o}
          </option>
        ))}
      </select>
      <FiChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div className="tcard bg-white/80 px-4 py-3 text-center">
      <div
        className={`font-display text-3xl tabular-nums ${accent ? "text-heat-extreme" : "text-ink-900"}`}
      >
        {value}
      </div>
      <div className="mt-0.5 text-[11px] uppercase tracking-wider text-ink-500">{label}</div>
    </div>
  );
}

function FlaggedCard({ v }: { v: Venue }) {
  const meta = RISK_META[v.risk!];
  return (
    <div className="flex items-start gap-3 rounded-xl border border-ink-900/8 bg-white/80 p-3">
      <span className="mt-1 min-h-[2.5rem] w-1 shrink-0 rounded-full" style={{ background: meta.color }} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <div className="truncate font-semibold text-ink-900">{v.name}</div>
          <span
            className="shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold"
            style={{ background: `${meta.color}22`, color: meta.color }}
          >
            {meta.label}
          </span>
        </div>
        <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 font-mono text-[12px] text-ink-600">
          <span>{v.heatIndex}°F heat idx</span>
          <span>{v.tempF}°F / {v.humidity}% RH</span>
          <span>AQI {v.aqi ?? "—"}</span>
          <span>+{v.leadTimeHours}h lead</span>
        </div>
        <div className="mt-1 text-[13px] text-ink-500">{v.action}</div>
      </div>
    </div>
  );
}

function BandList({
  title,
  bands,
}: {
  title: string;
  bands: { risk: Risk; range: string; action: string }[];
}) {
  return (
    <div>
      <div className="text-xs font-semibold uppercase tracking-wider text-ink-500">{title}</div>
      <div className="mt-2 space-y-1.5">
        {bands.map((b) => (
          <div key={b.range} className="flex items-center gap-2 text-[13px]">
            <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: RISK_META[b.risk].color }} />
            <span className="w-20 shrink-0 font-mono text-ink-800">{b.range}</span>
            <span className="truncate text-ink-500">{b.action}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
