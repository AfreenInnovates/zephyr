"use client";

import { useEffect, useRef, useState } from "react";
import CityPicker from "@/components/CityPicker";
import {
  FiMapPin,
  FiActivity,
  FiUsers,
  FiSearch,
  FiChevronDown,
  FiExternalLink,
  FiBell,
  FiClock,
  FiCheck,
} from "react-icons/fi";
import {
  ASSISTANCE_OPTIONS,
  CAT_META,
  Category,
  Opportunity,
  ScholarshipInputs,
} from "@/lib/scholarships";

type Phase = "idle" | "scanning" | "done";
const SPORTS = ["Football", "Soccer", "Basketball", "Baseball", "Softball", "Track", "Any sport"];
const AGES = ["", "6", "8", "10", "12", "14", "16"];

export default function ScholarshipFinder() {
  const [form, setForm] = useState<ScholarshipInputs>({
    location: "78702",
    sport: "Football",
    age: "10",
    assistance: ["scholarship", "equipment"],
    lunch: true,
  });
  const [phase, setPhase] = useState<Phase>("idle");
  const [status, setStatus] = useState("Set your filters and scan your area.");
  const [center, setCenter] = useState<string>("");
  const [items, setItems] = useState<Opportunity[]>([]);
  const [hover, setHover] = useState<string | null>(null);

  const esRef = useRef<EventSource | null>(null);
  useEffect(() => () => esRef.current?.close(), []);

  const set = <K extends keyof ScholarshipInputs>(k: K, v: ScholarshipInputs[K]) =>
    setForm((f) => ({ ...f, [k]: v }));
  const toggleAssist = (id: string) =>
    setForm((f) => ({
      ...f,
      assistance: f.assistance.includes(id)
        ? f.assistance.filter((a) => a !== id)
        : [...f.assistance, id],
    }));

  const scan = () => {
    esRef.current?.close();
    setItems([]);
    setCenter("");
    setPhase("scanning");
    setStatus("Spinning up the swarm…");

    const p = new URLSearchParams({
      location: form.location,
      sport: form.sport,
      age: form.age,
      assistance: form.assistance.join(","),
      lunch: form.lunch ? "1" : "0",
    });
    const es = new EventSource(`/api/scholarships?${p.toString()}`);
    esRef.current = es;
    es.addEventListener("status", (e) => setStatus(JSON.parse((e as MessageEvent).data).text));
    es.addEventListener("center", (e) => setCenter(JSON.parse((e as MessageEvent).data).label));
    es.addEventListener("result", (e) =>
      setItems((prev) => [...prev, JSON.parse((e as MessageEvent).data) as Opportunity]),
    );
    es.addEventListener("done", () => {
      setPhase("done");
      es.close();
    });
    es.addEventListener("error", (e) => {
      const msg = (() => {
        try {
          return JSON.parse((e as MessageEvent).data).message;
        } catch {
          return null;
        }
      })();
      if (msg) setStatus(msg);
      es.close();
      setPhase((ph) => (ph === "scanning" ? "done" : ph));
    });
    es.onerror = () => {
      es.close();
      setPhase((ph) => (ph === "scanning" ? "done" : ph));
    };
  };

  const canScan = !!form.location.trim();
  const counts = (["scholarship", "equipment", "program"] as Category[]).map(
    (c) => items.filter((i) => i.category === c).length,
  );

  return (
    <main className="mx-auto min-h-screen max-w-7xl px-5 pb-12 pt-24 sm:px-8 sm:pt-28">
      <div>
        <div className="flex items-center gap-1.5 font-mono text-xs uppercase tracking-[0.2em] text-indigo-500">
          <FiUsers className="h-3.5 w-3.5" /> Youth Access Finder
        </div>
        <h1 className="mt-2 font-display text-4xl tracking-tightest text-ink-900 sm:text-5xl">
          Find every door into the game.
        </h1>
        <p className="mt-1.5 text-sm text-ink-500">
          Free programs, scholarships, and gear near you — matched to your family.
        </p>
      </div>

      {/* ---- Filters ---- */}
      <div className="tcard mt-6 bg-white/80 p-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <CityPicker
            value={form.location}
            label="Location"
            placeholder="Zip (78702) or start typing a city…"
            hint="Zip code, or pick a city"
            onSelect={(c) => set("location", c.label)}
            onText={(t) => set("location", t)}
          />
          <Field icon={<FiActivity />} label="Sport">
            <Select value={form.sport} onChange={(v) => set("sport", v)} options={SPORTS} />
          </Field>
          <Field icon={<FiUsers />} label="Age">
            <Select
              value={form.age}
              onChange={(v) => set("age", v)}
              options={AGES}
              render={(v) => (v ? `${v}U` : "Any age")}
            />
          </Field>
          <Field icon={<FiSearch />} label="Qualifies for free lunch?" hint="Unlocks top grants">
            <button
              type="button"
              onClick={() => set("lunch", !form.lunch)}
              className={`flex h-[46px] w-full items-center gap-2.5 rounded-xl border px-3.5 text-sm transition ${
                form.lunch
                  ? "border-indigo-300 bg-indigo-50 text-indigo-700"
                  : "border-ink-900/12 bg-white text-ink-500"
              }`}
            >
              <span
                className={`flex h-5 w-5 items-center justify-center rounded-md border ${
                  form.lunch ? "border-indigo-500 bg-indigo-500 text-white" : "border-ink-900/25"
                }`}
              >
                {form.lunch && <FiCheck className="h-3.5 w-3.5" />}
              </span>
              Free / reduced lunch
            </button>
          </Field>
        </div>

        <div className="mt-4 flex flex-wrap items-end justify-between gap-4 border-t border-ink-900/8 pt-4">
          <div>
            <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-ink-500">
              Assistance type
            </div>
            <div className="flex flex-wrap gap-2">
              {ASSISTANCE_OPTIONS.map((a) => {
                const on = form.assistance.includes(a.id);
                return (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => toggleAssist(a.id)}
                    className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition ${
                      on
                        ? "border-indigo-300 bg-indigo-50 text-indigo-700"
                        : "border-ink-900/12 bg-white text-ink-600 hover:bg-bone-100"
                    }`}
                  >
                    {a.label}
                  </button>
                );
              })}
            </div>
          </div>
          <button
            onClick={scan}
            disabled={phase === "scanning" || !canScan}
            className="rounded-full bg-ink-900 px-8 py-3 text-sm font-semibold text-bone-50 transition hover:bg-ink-800 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {phase === "scanning" ? "Scanning…" : phase === "done" ? "Scan again" : "Scan area"}
          </button>
        </div>
      </div>

      {/* ---- Results ---- */}
      <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_0.85fr]">
        {/* Feed */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2.5 rounded-xl border border-ink-900/8 bg-white/70 px-4 py-3">
            <span
              className={`h-2 w-2 shrink-0 rounded-full ${
                phase === "scanning" ? "animate-pulse bg-indigo-500" : "bg-heat-safe"
              }`}
            />
            <p className="truncate font-mono text-[13px] text-ink-600">{status}</p>
          </div>

          {items.length === 0 && phase !== "scanning" && (
            <div className="tcard flex min-h-[16rem] items-center justify-center bg-white/70 p-8 text-center text-sm text-ink-400">
              Scan your area to surface local scholarships, gear drives, and programs.
            </div>
          )}
          {items.map((o) => (
            <OppCard key={o.id} o={o} onHover={setHover} active={hover === o.id} />
          ))}
        </div>

        {/* Map */}
        <div className="lg:sticky lg:top-6 lg:self-start">
          <div className="tcard overflow-hidden bg-gradient-to-b from-indigo-50/60 to-white p-4">
            <div className="mb-3 flex items-center justify-between px-1 font-mono text-xs text-ink-500">
              <span className="flex items-center gap-1.5 truncate">
                <FiMapPin className="h-3.5 w-3.5 text-indigo-500" />
                {center || form.location}
              </span>
              <span>{items.length} pins</span>
            </div>
            <div className="relative aspect-square w-full rounded-2xl bg-white">
              <div
                className="absolute inset-0 rounded-2xl opacity-60"
                style={{
                  backgroundImage:
                    "linear-gradient(rgba(99,102,241,0.08) 1px,transparent 1px),linear-gradient(90deg,rgba(99,102,241,0.08) 1px,transparent 1px)",
                  backgroundSize: "28px 28px",
                }}
              />
              <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full">
                {/* center marker */}
                <circle cx="50" cy="50" r="2.4" fill="#4f46e5" />
                <circle cx="50" cy="50" r="5" fill="none" stroke="#4f46e5" strokeWidth="0.5" opacity="0.4" />
                {items.map((o) => (
                  <g key={o.id}>
                    <circle
                      cx={o.x}
                      cy={o.y}
                      r={hover === o.id ? 3.4 : 2.6}
                      fill={CAT_META[o.category].color}
                      stroke="#fff"
                      strokeWidth="0.7"
                      style={{ cursor: "pointer", transition: "r .15s" }}
                      onMouseEnter={() => setHover(o.id)}
                      onMouseLeave={() => setHover((h) => (h === o.id ? null : h))}
                    />
                  </g>
                ))}
              </svg>
              {hover && (() => {
                const o = items.find((i) => i.id === hover);
                if (!o) return null;
                return (
                  <div
                    className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-lg border border-ink-900/10 bg-white px-2.5 py-1.5 text-[11px] font-medium text-ink-800 shadow-lg"
                    style={{ left: `${o.x}%`, top: `${o.y}%`, marginTop: -8, maxWidth: 200 }}
                  >
                    {o.title}
                  </div>
                );
              })()}
            </div>
            <div className="mt-3 flex flex-wrap justify-center gap-4 text-[11px]">
              {(["scholarship", "equipment", "program"] as Category[]).map((c, i) => (
                <span key={c} className="flex items-center gap-1.5 text-ink-600">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: CAT_META[c].color }} />
                  {CAT_META[c].label} ({counts[i]})
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

function OppCard({
  o,
  onHover,
  active,
}: {
  o: Opportunity;
  onHover: (id: string | null) => void;
  active: boolean;
}) {
  const meta = CAT_META[o.category];
  const [alertOpen, setAlertOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [alertState, setAlertState] = useState<"idle" | "sending" | "sent" | "error">("idle");

  const sendAlert = async () => {
    if (!email.trim()) return;
    setAlertState("sending");
    try {
      const res = await fetch("/api/monitor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: o.url, email, title: o.title }),
      });
      setAlertState(res.ok ? "sent" : "error");
    } catch {
      setAlertState("error");
    }
  };

  return (
    <div
      onMouseEnter={() => onHover(o.id)}
      onMouseLeave={() => onHover(null)}
      className={`tcard flex gap-3 bg-white/85 p-4 transition ${active ? "ring-2 ring-indigo-200" : ""}`}
    >
      <span className="mt-0.5 w-1 shrink-0 self-stretch rounded-full" style={{ background: meta.color }} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className="rounded-full px-2 py-0.5 text-[11px] font-semibold"
            style={{ background: `${meta.color}1f`, color: meta.color }}
          >
            {meta.label}
          </span>
          {o.closed ? (
            <span className="rounded-full bg-ink-900/8 px-2 py-0.5 text-[11px] font-semibold text-ink-500">
              🔒 Closed
            </span>
          ) : o.deadline ? (
            <span className="flex items-center gap-1 rounded-full bg-heat-extreme/10 px-2 py-0.5 text-[11px] font-semibold text-heat-extreme">
              <FiClock className="h-3 w-3" /> {o.deadline}
            </span>
          ) : null}
          <span className="ml-auto truncate text-[11px] text-ink-400">{o.source}</span>
        </div>

        <h3 className="mt-1.5 font-semibold leading-snug text-ink-900">{o.title}</h3>
        <p className="mt-1 text-[13px] leading-relaxed text-ink-500">
          {o.snippet}
          {o.snippet.length >= 260 ? "…" : ""}
        </p>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          {!o.closed && (
            <a
              href={o.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded-full bg-ink-900 px-4 py-1.5 text-[13px] font-semibold text-bone-50 transition hover:bg-ink-800"
            >
              Apply / Visit <FiExternalLink className="h-3.5 w-3.5" />
            </a>
          )}
          {alertState === "sent" ? (
            <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-3.5 py-1.5 text-[13px] font-semibold text-emerald-600">
              <FiCheck className="h-3.5 w-3.5" /> We&apos;ll email you when it opens
            </span>
          ) : (
            <button
              onClick={() => setAlertOpen((v) => !v)}
              className="flex items-center gap-1.5 rounded-full border border-ink-900/15 px-4 py-1.5 text-[13px] font-semibold text-ink-700 transition hover:bg-bone-100"
            >
              <FiBell className="h-3.5 w-3.5" /> Alert me when {o.closed ? "open" : "it changes"}
            </button>
          )}
        </div>

        {alertOpen && alertState !== "sent" && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@email.com"
              className="min-w-0 flex-1 rounded-lg border border-ink-900/12 bg-white px-3 py-2 text-sm outline-none focus:border-ink-900/40"
            />
            <button
              onClick={sendAlert}
              disabled={alertState === "sending" || !email.trim()}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-50"
            >
              {alertState === "sending" ? "Setting up…" : "Notify me"}
            </button>
            {alertState === "error" && (
              <span className="w-full text-xs text-heat-extreme">
                Couldn&apos;t set up the alert. Try again.
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Field({
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
        className="h-[46px] w-full appearance-none rounded-xl border border-ink-900/12 bg-white px-3.5 text-[15px] outline-none focus:border-ink-900/40"
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
