import { FiHeart, FiMapPin, FiAlertTriangle } from "react-icons/fi";

export const metadata = {
  title: "Zephyr — AED Gap Map",
  description: "Map which fields have a working AED — and flag the dangerous gaps.",
};

export default function AedMapPage() {
  return (
    <main className="mx-auto min-h-screen max-w-5xl px-5 pt-24 pb-12 sm:px-8">
      <div className="flex flex-col items-center text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-rose-100 to-rose-200">
          <FiHeart className="h-10 w-10 text-rose-500" />
        </div>

        <h1 className="mt-8 font-display text-5xl text-ink-900 sm:text-6xl">
          AED Gap Map
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-lg leading-relaxed text-ink-500">
          Sudden cardiac arrest is a leading cause of death in young athletes, and
          survival depends on an AED being within reach. This tool maps which
          fields and gyms have a working, accessible AED — and flags the
          dangerous gaps for leagues to fix.
        </p>

        <div className="mt-12 grid w-full max-w-3xl gap-4 sm:grid-cols-3">
          {[
            {
              icon: <FiMapPin className="h-6 w-6" />,
              label: "Venue Discovery",
              desc: "Scrape AED registries across the region",
            },
            {
              icon: <FiHeart className="h-6 w-6" />,
              label: "Coverage Mapping",
              desc: "Match AED locations to sports venues",
            },
            {
              icon: <FiAlertTriangle className="h-6 w-6" />,
              label: "Gap Alerts",
              desc: "Flag fields with no AED within reach",
            },
          ].map((f, i) => (
            <div
              key={i}
              className="tcard bg-white/80 p-6 text-center"
            >
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-500">
                {f.icon}
              </div>
              <div className="mt-4 font-semibold text-ink-900">{f.label}</div>
              <div className="mt-1 text-sm text-ink-500">{f.desc}</div>
            </div>
          ))}
        </div>

        <div className="mt-12 rounded-2xl border border-dashed border-ink-900/20 bg-bone-100/50 px-8 py-10">
          <p className="font-mono text-sm text-ink-400">
            🚧 Feature under development — coming soon
          </p>
        </div>
      </div>
    </main>
  );
}
