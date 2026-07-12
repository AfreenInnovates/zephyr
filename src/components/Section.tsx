import { ReactNode } from "react";
import Reveal from "./Reveal";
import MaskReveal from "./MaskReveal";

type SectionHeaderProps = {
  eyebrow: string;
  title: ReactNode;
  intro?: ReactNode;
  center?: boolean;
};

export function SectionHeader({
  eyebrow,
  title,
  intro,
  center = false,
}: SectionHeaderProps) {
  return (
    <div className={center ? "mx-auto max-w-3xl text-center" : "max-w-3xl"}>
      <Reveal>
        <div
          className={`flex items-center gap-2.5 font-mono text-xs font-semibold uppercase tracking-[0.22em] text-heat-high ${
            center ? "justify-center" : ""
          }`}
        >
          <span className="h-2 w-2 rounded-full bg-heat-high" />
          {eyebrow}
        </div>
      </Reveal>
      <MaskReveal
        as="h2"
        className="mt-5 font-display text-5xl leading-[0.92] tracking-tightest text-ink-900 sm:text-6xl md:text-7xl"
      >
        {title}
      </MaskReveal>
      {intro && (
        <Reveal delay={0.1}>
          <p className="mt-6 text-lg leading-relaxed text-ink-500 sm:text-xl">
            {intro}
          </p>
        </Reveal>
      )}
    </div>
  );
}
