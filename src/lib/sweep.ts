// Shared model for a "sweep" — used by the streaming API route and the client.
// Same event contract whether the data is live (Anakin/Open-Meteo) or demo.

export type Risk = "safe" | "caution" | "high" | "extreme";

export const RISK_META: Record<
  Risk,
  { color: string; label: string; rank: number }
> = {
  safe: { color: "#1f9e7a", label: "Safe", rank: 0 },
  caution: { color: "#e0a80d", label: "Caution", rank: 1 },
  high: { color: "#f2760c", label: "High", rank: 2 },
  extreme: { color: "#e23a25", label: "Extreme", rank: 3 },
};

export type Bbox = {
  minLat: number;
  maxLat: number;
  minLon: number;
  maxLon: number;
};

export type SweepInputs = {
  city: string; // display label e.g. "Miami, Florida, United States"
  lat: number;
  lon: number;
  sport: string;
  when: "today" | "tomorrow";
  hour: number; // 0–23, local practice time
  conditioning: boolean;
  venues: number;
};

export type SweepMeta = {
  region: string;
  bbox: Bbox;
  total: number;
  source: "live" | "demo"; // weather data source
  venueSource: "osm" | "synthetic"; // school data source
  inputs: SweepInputs;
};

export type CitySuggestion = {
  id: string;
  label: string;
  name: string;
  admin1?: string;
  country?: string;
  lat: number;
  lon: number;
};

export type VenueEvent = { id: string; name: string; lat: number; lon: number };

export type ScoreEvent = {
  venueId: string;
  risk: Risk;
  heatIndex: number; // °F
  tempF: number;
  humidity: number; // %
  aqi: number | null; // US AQI (null = air-quality unavailable)
  conditioning: boolean;
  action: string;
  leadTimeHours: number;
};

/** A venue whose real conditions couldn't be retrieved — shown, never scored. */
export type UnavailableEvent = { venueId: string };

export type ProgressEvent = { done: number; total: number };
export type StatusEvent = { text: string; kind?: "info" | "alert" };
export type DoneEvent = { flagged: number; total: number };

// ---- Scoring (pure functions, identical for live + demo) -------------------

/** NWS Rothfusz heat index in °F from air temp (°F) and relative humidity (%). */
export function heatIndexF(T: number, R: number): number {
  if (T < 80) return Math.round(T);
  let HI =
    -42.379 +
    2.04901523 * T +
    10.14333127 * R -
    0.22475541 * T * R -
    0.00683783 * T * T -
    0.05481717 * R * R +
    0.00122874 * T * T * R +
    0.00085282 * T * R * R -
    0.00000199 * T * T * R * R;
  if (R < 13 && T >= 80 && T <= 112)
    HI -= ((13 - R) / 4) * Math.sqrt((17 - Math.abs(T - 95)) / 17);
  else if (R > 85 && T >= 80 && T <= 87)
    HI += ((R - 85) / 10) * ((87 - T) / 5);
  // The Rothfusz regression extrapolates to nonsense (>150°F) for extreme
  // temp+humidity; the NWS chart tops out at ~137°F. Clamp to that ceiling.
  return Math.min(137, Math.max(T, Math.round(HI)));
}

export const HEAT_BANDS = [
  { risk: "safe" as Risk, range: "< 91°F", action: "Normal activity" },
  { risk: "caution" as Risk, range: "91–103°F", action: "Mandatory water breaks" },
  { risk: "high" as Risk, range: "103–115°F", action: "Shorten · remove pads · extra breaks" },
  { risk: "extreme" as Risk, range: "> 115°F", action: "Move to morning or cancel" },
];

export const AQI_BANDS = [
  { risk: "safe" as Risk, range: "0–50", action: "Normal" },
  { risk: "caution" as Risk, range: "51–100", action: "Caution on long sessions" },
  { risk: "high" as Risk, range: "101–150", action: "Limit intensity" },
  { risk: "extreme" as Risk, range: "151+", action: "Cancel outdoor youth activity" },
];

export function heatZone(hi: number): Risk {
  if (hi < 91) return "safe";
  if (hi < 103) return "caution";
  if (hi < 115) return "high";
  return "extreme";
}

export function aqiZone(aqi: number): Risk {
  if (aqi <= 50) return "safe";
  if (aqi <= 100) return "caution";
  if (aqi <= 150) return "high";
  return "extreme";
}

function bump(r: Risk): Risk {
  const order: Risk[] = ["safe", "caution", "high", "extreme"];
  return order[Math.min(order.length - 1, RISK_META[r].rank + 1)];
}

const ACTIONS: Record<Risk, string> = {
  safe: "Normal activity",
  caution: "Mandatory water breaks",
  high: "Shorten · remove pads · extra breaks",
  extreme: "Move to morning or cancel",
};

/** Combine heat + AQI into a final risk, escalating preseason conditioning. */
export function scoreConditions(input: {
  tempF: number;
  humidity: number;
  aqi: number | null;
  conditioning: boolean;
  leadTimeHours: number;
}): Omit<ScoreEvent, "venueId"> {
  const heatIndex = heatIndexF(input.tempF, input.humidity);
  const hz = heatZone(heatIndex);
  const az = input.aqi == null ? "safe" : aqiZone(input.aqi);
  let risk: Risk = RISK_META[hz].rank >= RISK_META[az].rank ? hz : az;
  // Preseason conditioning is where 100% of heat-stroke deaths cluster.
  if (input.conditioning && risk !== "safe") risk = bump(risk);
  return {
    risk,
    heatIndex,
    tempF: Math.round(input.tempF),
    humidity: Math.round(input.humidity),
    aqi: input.aqi == null ? null : Math.round(input.aqi),
    conditioning: input.conditioning,
    action: ACTIONS[risk],
    leadTimeHours: input.leadTimeHours,
  };
}

// ---- Map projection --------------------------------------------------------

/** Project lat/lon into 0–100 map space (north up) using a bounding box. */
export function projectWithBbox(
  lat: number,
  lon: number,
  b: Bbox,
): { x: number; y: number } {
  const w = b.maxLon - b.minLon || 1;
  const h = b.maxLat - b.minLat || 1;
  const nx = (lon - b.minLon) / w;
  const ny = (b.maxLat - lat) / h;
  const pad = 10;
  return { x: pad + nx * (100 - pad * 2), y: pad + ny * (100 - pad * 2) };
}
