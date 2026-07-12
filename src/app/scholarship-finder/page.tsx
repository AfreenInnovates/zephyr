import Link from "next/link";
import { FiUsers, FiMapPin, FiAward, FiSearch } from "react-icons/fi";

export const metadata = {
  title: "Zephyr — Youth Sports Access Finder",
  description: "Find free programs, scholarships, and equipment for youth sports.",
};

export default function ScholarshipFinderPage() {
  return (
    <main className="mx-auto min-h-screen max-w-5xl px-5 pt-24 pb-12 sm:px-8">
      <div className="flex flex-col items-center text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-indigo-100 to-indigo-200">
          <FiUsers className="h-10 w-10 text-indigo-500" />
        </div>

        <h1 className="mt-8 font-display text-5xl text-ink-900 sm:text-6xl">
          Youth Sports Access Finder
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-lg leading-relaxed text-ink-500">
          Sport is proven to change kids' life trajectories, but cost and access 
          remain massive barriers. This swarm scrapes every free/subsidized youth program, 
          scholarship, and adaptive-sports league across the region into one map matched 
          to a family's location and budget.
        </p>

        <div className="mt-12 grid w-full max-w-3xl gap-4 sm:grid-cols-3">
          {[
            {
              icon: <FiSearch className="h-6 w-6" />,
              label: "Program Swarm",
              desc: "Scrape hundreds of small org and league websites",
            },
            {
              icon: <FiMapPin className="h-6 w-6" />,
              label: "Local Matching",
              desc: "Find programs in your immediate neighborhood",
            },
            {
              icon: <FiAward className="h-6 w-6" />,
              label: "Scholarships",
              desc: "Surface application deadlines and equipment drives",
            },
          ].map((f, i) => (
            <div
              key={i}
              className="tcard bg-white/80 p-6 text-center"
            >
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-500">
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
