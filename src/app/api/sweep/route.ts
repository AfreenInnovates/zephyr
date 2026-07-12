import {
  Bbox,
  ScoreEvent,
  SweepInputs,
  VenueEvent,
  scoreConditions,
} from "@/lib/sweep";
import { fetchConditions, geocodeCity, hasAnakinKey } from "@/lib/anakin";
import { fetchSchools } from "@/lib/osm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const enc = new TextEncoder();
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const rand = (a: number, b: number) => a + Math.random() * (b - a);
const pick = <T>(a: T[]) => a[Math.floor(Math.random() * a.length)];

const FIELDS = ["North Field", "Practice Field", "Stadium", "Field A", "Field B"];

function syntheticVenues(
  center: { lat: number; lon: number },
  n: number,
  radiusDeg: number,
  city: string,
): VenueEvent[] {
  const out: VenueEvent[] = [];
  for (let i = 0; i < n; i++) {
    const t = Math.random() * Math.PI * 2;
    const r = Math.sqrt(Math.random()) * radiusDeg;
    out.push({
      id: `v${i}`,
      name: `${city.split(",")[0]} — ${pick(FIELDS)} ${i + 1}`,
      lat: center.lat + r * Math.cos(t),
      lon: center.lon + r * Math.sin(t) * 1.2,
    });
  }
  return out;
}

function bboxOf(vs: VenueEvent[]): Bbox {
  const lats = vs.map((v) => v.lat);
  const lons = vs.map((v) => v.lon);
  const pad = 0.015;
  return {
    minLat: Math.min(...lats) - pad,
    maxLat: Math.max(...lats) + pad,
    minLon: Math.min(...lons) - pad,
    maxLon: Math.max(...lons) + pad,
  };
}

function demoConditions() {
  const tempF = rand(74, 112);
  const humidity = rand(28, 82);
  const aqi = Math.random() < 0.75 ? rand(12, 90) : rand(90, 190);
  return { tempF, humidity, aqi };
}

export async function GET(req: Request) {
  const q = new URL(req.url).searchParams;
  const inputs: SweepInputs = {
    city: (q.get("city") || "Austin, Texas, United States").trim(),
    lat: Number(q.get("lat")),
    lon: Number(q.get("lon")),
    sport: q.get("sport") || "Football",
    when: q.get("when") === "tomorrow" ? "tomorrow" : "today",
    hour: Math.min(23, Math.max(0, Number(q.get("hour") ?? 16))),
    conditioning: q.get("conditioning") === "1",
    venues: Number(q.get("venues") ?? 20),
  };

  const liveWeather = hasAnakinKey();
  const total = Math.min(liveWeather ? 15 : 40, Math.max(4, inputs.venues));

  const target = new Date();
  if (inputs.when === "tomorrow") target.setDate(target.getDate() + 1);
  target.setHours(inputs.hour, 0, 0, 0);
  const iso = `${target.getFullYear()}-${String(target.getMonth() + 1).padStart(2, "0")}-${String(target.getDate()).padStart(2, "0")}T${String(inputs.hour).padStart(2, "0")}:00`;
  const leadTimeHours = Math.max(0, Math.round((target.getTime() - Date.now()) / 3.6e6));
  const timeLabel = `${inputs.when} ${inputs.hour % 12 || 12} ${inputs.hour < 12 ? "AM" : "PM"}`;
  const timezone = "auto";

  const stream = new ReadableStream({
    async start(controller) {
      let closed = false;
      const send = (event: string, data: unknown) => {
        if (closed) return;
        controller.enqueue(enc.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
      };
      req.signal.addEventListener("abort", () => (closed = true));

      try {
        send("status", { text: "Initializing regional sweep…" });
        await sleep(300);

        // Center: use the picked city coords; geocode label only as a fallback.
        let center = { lat: inputs.lat, lon: inputs.lon };
        let regionName = inputs.city;
        if (!Number.isFinite(center.lat) || !Number.isFinite(center.lon)) {
          const geo = await geocodeCity(inputs.city).catch(() => null);
          if (geo) {
            center = { lat: geo.lat, lon: geo.lon };
            regionName = geo.country ? `${geo.name}, ${geo.country}` : geo.name;
          } else {
            center = { lat: 30.27, lon: -97.74 };
          }
        }

        // --- Engine A: real schools from OpenStreetMap -------------------
        send("status", { text: `Resolving venues in ${regionName.split(",")[0]}…` });
        let venues: VenueEvent[] = [];
        let venueSource: "osm" | "synthetic" = "osm";
        try {
          const schools = await fetchSchools(center.lat, center.lon, 16000, total);
          venues = schools.map((s) => ({ id: s.id, name: s.name, lat: s.lat, lon: s.lon }));
        } catch {
          venues = [];
        }
        if (venues.length < 4) {
          venues = syntheticVenues(center, total, 0.14, inputs.city);
          venueSource = "synthetic";
        }

        const bbox = bboxOf(venues);
        send("meta", {
          region: regionName,
          bbox,
          total: venues.length,
          source: liveWeather ? "live" : "demo",
          venueSource,
          inputs: { ...inputs, lat: center.lat, lon: center.lon },
        });
        send("progress", { done: 0, total: venues.length });
        send("status", {
          text: `Retrieving ${timeLabel} forecast and air quality for ${venues.length} venues…`,
        });

        // --- Phase 1: discovery ------------------------------------------
        for (let i = 0; i < venues.length; i++) {
          if (closed) return;
          send("venue", venues[i]);
          await sleep(rand(45, 80));
        }
        await sleep(200);

        // --- Phase 2: conditions + scoring -------------------------------
        let done = 0;
        let flagged = 0;
        let unavailable = 0;
        const emitScore = (v: VenueEvent, c: { tempF: number; humidity: number; aqi: number | null }) => {
          const s = scoreConditions({ ...c, conditioning: inputs.conditioning, leadTimeHours });
          send("score", { venueId: v.id, ...s } satisfies ScoreEvent);
          done++;
          send("progress", { done, total: venues.length });
          if (s.risk === "high" || s.risk === "extreme") {
            flagged++;
            send("status", {
              kind: "alert",
              text: `⚠ ${v.name} — ${s.heatIndex}°F heat index${inputs.conditioning ? " · conditioning" : ""}`,
            });
          }
        };

        if (liveWeather) {
          let idx = 0;
          const workers = Array.from({ length: 2 }, async () => {
            while (idx < venues.length && !closed) {
              const v = venues[idx++];
              try {
                const c = await fetchConditions(v.lat, v.lon, timezone, iso);
                emitScore(v, c);
              } catch {
                // Real data unavailable — mark it; NEVER invent conditions.
                done++;
                unavailable++;
                send("unavailable", { venueId: v.id });
                send("progress", { done, total: venues.length });
              }
            }
          });
          await Promise.all(workers);
        } else {
          for (const v of venues) {
            if (closed) return;
            emitScore(v, demoConditions());
            await sleep(rand(70, 140));
          }
        }

        if (closed) return;
        const scored = venues.length - unavailable;
        send("status", {
          text: `Sweep complete — ${flagged} of ${scored} venues flagged${unavailable ? ` · ${unavailable} unavailable` : ""}.`,
        });
        send("done", { flagged, total: venues.length });
      } catch {
        send("error", { message: "Sweep failed. Try again." });
      } finally {
        try {
          controller.close();
        } catch {
          /* already closed */
        }
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
