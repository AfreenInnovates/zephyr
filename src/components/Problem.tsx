import Reveal from "./Reveal";
import RollingNumber from "./RollingNumber";
import { SectionHeader } from "./Section";

export default function Problem() {
  return (
    <section id="why" className="relative mx-auto max-w-7xl px-6 py-24 md:py-28">
      <SectionHeader
        eyebrow="Why it matters"
        title={
          <>
            The danger is real -{" "}
            <span className="text-gradient-heat">and preventable.</span>
          </>
        }
        intro="Exertional heat illness is the leading cause of preventable death in U.S. high-school athletics, and wildfire smoke is a fast-growing second front. Both cluster in exactly the window Zephyr watches."
      />

      <Reveal stagger rise className="mt-14 grid gap-5 md:grid-cols-2">
        {/* HEAT */}
        <div className="tcard tcard-hover overflow-hidden bg-card-coral p-8 md:p-10">
          <div className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-heat-extreme">
            Heat
          </div>
          <div className="mt-6 font-display text-7xl leading-none text-ink-900 tabular-nums md:text-8xl">
            <RollingNumber value={9237} prefix="~" />
          </div>
          <div className="mt-2 text-lg font-medium text-ink-700">
            time-loss heat illnesses every year
          </div>
          <p className="mt-5 text-[15px] leading-relaxed text-ink-600">
            Most during preseason football. Its heat-illness rate is{" "}
            <span className="font-semibold text-ink-900">
              ~11× all other sports combined
            </span>{" "}
            - and <span className="font-semibold text-ink-900">100%</span> of
            heat-stroke football deaths happen during conditioning sessions.
          </p>
          <div className="mt-7 inline-flex rounded-full bg-ink-900/8 px-4 py-2 text-sm font-semibold text-ink-800">
            Almost entirely preventable with activity modification
          </div>
        </div>

        {/* SMOKE */}
        <div className="tcard tcard-hover overflow-hidden bg-card-sky p-8 md:p-10">
          <div className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-breeze-600">
            Smoke
          </div>
          <div className="mt-6 font-display text-7xl leading-none text-ink-900 md:text-8xl">
            AQI 150
          </div>
          <div className="mt-2 text-lg font-medium text-ink-700">
            the line where youth activity gets canceled
          </div>
          <p className="mt-5 text-[15px] leading-relaxed text-ink-600">
            At <span className="font-semibold text-ink-900">AQI 101–150</span>{" "}
            youth activity should be limited; above{" "}
            <span className="font-semibold text-ink-900">150</span>, health
            authorities now say cancel outdoor youth activity entirely.
          </p>
          <div className="mt-7 inline-flex rounded-full bg-ink-900/8 px-4 py-2 text-sm font-semibold text-ink-800">
            Smoke harms kids at lower exposures than once thought
          </div>
        </div>
      </Reveal>

      {/* The gap - one clean line */}
      <Reveal rise className="mt-5">
        <div className="tcard bg-card-cream px-8 py-10 text-center md:px-12">
          <p className="mx-auto max-w-3xl font-display text-3xl leading-tight text-ink-900 sm:text-4xl">
            Schedules live on hundreds of scattered sites. Conditions live
            somewhere else. <span className="text-gradient-heat">Nobody joins
            the two</span> - until now.
          </p>
        </div>
      </Reveal>
    </section>
  );
}
