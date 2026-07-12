import Reveal from "./Reveal";
import RollingNumber from "./RollingNumber";
import { SectionHeader } from "./Section";
import { FiZap, FiClock, FiMapPin, FiCheckCircle } from "react-icons/fi";

export default function Impact() {
  return (
    <section id="impact" className="relative mx-auto max-w-7xl px-6 py-24 md:py-28">
      <SectionHeader
        eyebrow="Impact"
        title={
          <>
            Fast enough for game day.{" "}
            <span className="text-gradient-heat">Early enough to matter.</span>
          </>
        }
        intro="A whole region is swept in parallel, so an alert lands with hours of lead time - long before kids ever step onto the field."
      />

      <Reveal stagger rise className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <Metric
          bg="bg-card-mint"
          accent="#0c7f77"
          icon={<FiZap className="h-6 w-6" />}
          value={<RollingNumber value={45} suffix="s" />}
          label="to sweep a full region, every venue at once"
          delay={0}
        />
        <Metric
          bg="bg-card-sun"
          accent="#c26a00"
          icon={<FiClock className="h-6 w-6" />}
          value={<RollingNumber value={3} suffix="h+" />}
          label="lead time - early enough to move practice to morning"
          delay={1}
        />
        <Metric
          bg="bg-card-sky"
          accent="#0b63b8"
          icon={<FiMapPin className="h-6 w-6" />}
          value={<RollingNumber value={200} prefix="~" />}
          label="venues scored in a single county pass"
          delay={2}
        />
        <Metric
          bg="bg-card-lilac"
          accent="#5b3fc4"
          icon={<FiCheckCircle className="h-6 w-6" />}
          value={<RollingNumber value={100} suffix="%" />}
          label="of these deaths are preventable - that's the whole point"
          delay={3}
        />
      </Reveal>

      <Reveal rise className="mt-12 md:mt-16">
        <div className="tcard bg-card-cream px-8 py-10 md:px-12">
          <div className="grid gap-8 md:grid-cols-3">
            <Point title="Coverage">
              Venues monitored, events scored per day, and the average lead time
              before each start.
            </Point>
            <Point title="Detection">
              Danger flags issued - split by heat vs. smoke, and how many were
              preseason conditioning sessions.
            </Point>
            <Point title="Outcome">
              How many flagged practices were moved or canceled after an alert,
              against a baseline of ~9,237 illnesses a year.
            </Point>
          </div>
        </div>
      </Reveal>
    </section>
  );
}

function Metric({
  bg,
  accent,
  icon,
  value,
  label,
  delay,
}: {
  bg: string;
  accent: string;
  icon: React.ReactNode;
  value: React.ReactNode;
  label: string;
  delay: number;
}) {
  return (
    <div className={`tcard tcard-hover relative flex flex-col justify-start ${bg} p-7 text-left`}>
      <div className="absolute -right-3 -top-5 animate-float" style={{ animationDelay: `-${delay * 0.75}s` }}>
        <div 
          className="flex h-14 w-14 rotate-[10deg] items-center justify-center rounded-full bg-white shadow-[0_8px_20px_rgba(0,0,0,0.12)] transition-transform hover:rotate-0"
          style={{ color: accent }}
        >
          {icon}
        </div>
      </div>
      <div
        className="font-display text-6xl leading-none text-ink-900 tabular-nums"
        style={{ color: accent }}
      >
        {value}
      </div>
      <div className="mt-4 text-[15px] leading-snug text-ink-700">{label}</div>
    </div>
  );
}

function Point({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h3 className="font-display text-2xl text-ink-900">{title}</h3>
      <p className="mt-2 text-[15px] leading-relaxed text-ink-600">
        {children}
      </p>
    </div>
  );
}
