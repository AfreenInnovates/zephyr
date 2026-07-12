import MaskReveal from "./MaskReveal";
import Reveal from "./Reveal";

export default function Footer() {
  return (
    <footer className="relative flex h-screen w-full flex-col items-center justify-center overflow-hidden bg-console text-bone-100">
      <div className="pointer-events-none absolute -top-40 left-1/2 h-80 w-[40rem] -translate-x-1/2 rounded-full bg-heat-high/25 blur-[100px]" />

      <div className="relative mx-auto max-w-5xl px-6 text-center">
        <MaskReveal
          as="p"
          className="font-display text-4xl leading-[0.95] tracking-tight text-bone-50 sm:text-6xl md:text-7xl"
        >
          <span>
            Zephyr is the <span className="text-gradient-heat">missing alarm</span>{" "}
            - it rings before kids ever step onto a dangerous field.
          </span>
        </MaskReveal>

        <Reveal delay={0.1}>
          <div className="mt-11 flex flex-wrap items-center justify-center gap-3">
            <a
              href="#how"
              className="group flex items-center gap-2 rounded-full bg-bone-50 px-7 py-3.5 text-base font-semibold text-ink-900 transition hover:bg-white"
            >
              See how it works
              <span className="transition-transform group-hover:translate-x-1">
                →
              </span>
            </a>
            <a
              href="#top"
              className="rounded-full border border-white/20 px-7 py-3.5 text-base font-semibold text-bone-100 transition hover:bg-white/10"
            >
              Back to top
            </a>
          </div>
        </Reveal>

        <div className="mt-20 flex flex-col items-center gap-3 border-t border-white/10 pt-10 text-sm text-bone-100/50">
          <div className="font-display text-3xl tracking-tightest text-bone-50">
            zephyr<span className="text-heat-high">.</span>
          </div>
          <p className="text-xs text-bone-100/40">
            Impact figures from NFHS, CDC, EPA, and the Oregon Health Authority.
            Informational only - not medical advice.
          </p>
        </div>
      </div>
    </footer>
  );
}
