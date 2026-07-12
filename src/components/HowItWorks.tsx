import Reveal from "./Reveal";
import { SectionHeader } from "./Section";

export default function HowItWorks() {
  return (
    <section
      id="how"
      className="relative border-y border-ink-900/10 bg-bone-100 py-24 md:py-28"
    >
      <div className="mx-auto max-w-7xl px-6">
        <SectionHeader
          center
          eyebrow="How it works"
          title={
            <>
              Two engines,{" "}
              <span className="text-gradient-heat">one danger score.</span>
            </>
          }
          intro="Zephyr fans out across a whole region at once - every step is a single Anakin job, so hundreds of fields get checked in the time it takes to check one."
        />

        <Reveal stagger rise className="mt-14 grid gap-5 lg:grid-cols-2">
          <EngineCard
            bg="bg-card-sun"
            tag="01 · Schedules"
            accent="#c26a00"
            desc="Harvest youth & high-school practices from the messy long tail of league sites."
            steps={[
              "Discover schedule pages across each league site",
              "Crawl the JS-rendered calendars for events",
              "Normalize each into { team, venue, lat/lon, time }",
            ]}
          />
          <EngineCard
            bg="bg-card-mint"
            tag="02 · Conditions"
            accent="#0c7f77"
            desc="Pull the hyperlocal heat and air quality for each venue - no scraping needed."
            steps={[
              "Geocode the venue to a lat/lon",
              "Forecast temperature + humidity for the practice hour",
              "Read the air-quality index (AQI + PM2.5) for that spot",
            ]}
          />
        </Reveal>

        {/* Fusion */}
        <Reveal rise className="mt-5">
          <div className="tcard bg-card-coral px-8 py-10 text-center md:px-12">
            <div className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-heat-extreme">
              Fusion
            </div>
            <p className="mx-auto mt-4 max-w-3xl font-display text-3xl leading-tight text-ink-900 sm:text-4xl md:text-5xl">
              Take the more severe of the two zones, escalate preseason
              conditioning, and fire an alert with hours to spare.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3 text-sm">
              {[
                ["bg-heat-safe", "Safe"],
                ["bg-heat-caution", "Caution"],
                ["bg-heat-high", "High"],
                ["bg-heat-extreme", "Extreme"],
                ["bg-ink-700", "Cancel"],
              ].map(([c, l]) => (
                <span
                  key={l}
                  className="inline-flex items-center gap-2 rounded-full bg-white/60 px-3.5 py-1.5 text-[13px] font-semibold text-ink-800 shadow-sm"
                >
                  <span className={`h-2.5 w-2.5 rounded-full ${c} shadow-[inset_0_1px_1px_rgba(255,255,255,0.4)]`} />
                  {l}
                </span>
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function EngineCard({
  bg,
  tag,
  accent,
  desc,
  steps,
}: {
  bg: string;
  tag: string;
  accent: string;
  desc: string;
  steps: string[];
}) {
  return (
    <div className={`tcard tcard-hover ${bg} p-8 md:p-10`}>
      <div
        className="font-mono text-xs font-semibold uppercase tracking-[0.2em]"
        style={{ color: accent }}
      >
        {tag}
      </div>
      <p className="mt-4 max-w-md font-display text-3xl leading-[0.95] text-ink-900 sm:text-4xl">
        {desc}
      </p>
      <ol className="mt-7 space-y-3.5">
        {steps.map((s, i) => (
          <li key={i} className="flex gap-3.5">
            <span
              className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
              style={{ background: accent }}
            >
              {i + 1}
            </span>
            <span className="pt-0.5 text-[15px] leading-snug text-ink-700">
              {s}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}
