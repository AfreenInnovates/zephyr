// Server-only Anakin client. The API key lives in ANAKIN_API_KEY (never sent
// to the browser). Wire actions are async: submit (202 + poll_url) → poll the
// job until status:"completed", then read the payload at body.data.data.

const HOST = "https://anakin.io";
const WIRE_BASE = `${HOST}/v1`;

export function hasAnakinKey(): boolean {
  return !!process.env.ANAKIN_API_KEY;
}

type Json = Record<string, unknown>;

function headers(): HeadersInit {
  return {
    "X-API-Key": process.env.ANAKIN_API_KEY ?? "",
    "Content-Type": "application/json",
  };
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Completed job → { data: { status:"ok", data:{…payload…}, error } }. */
function extractPayload(body: Json): Json {
  const env = body.data as Json | undefined;
  if (env && typeof env === "object") {
    if (env.error) throw new Error(String(env.error));
    const payload = env.data as Json | undefined;
    if (payload && typeof payload === "object") return payload;
    return env;
  }
  return body;
}

/** Submit a Wire action and poll its job to completion. Returns the payload. */
export async function runWire(
  actionId: string,
  params: Json,
  { timeoutMs = 30000 }: { timeoutMs?: number } = {},
): Promise<Json> {
  const submit = await fetch(`${WIRE_BASE}/wire/task`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ action_id: actionId, params }),
  });
  if (!submit.ok) {
    throw new Error(`Wire ${actionId} submit failed: ${submit.status}`);
  }
  const first = (await submit.json()) as Json;

  // Some actions may return a completed result immediately.
  if (first.status === "completed" || first.status === "succeeded") {
    return extractPayload(first);
  }

  const pollUrl = first.poll_url as string | undefined;
  const jobId = (first.job_id as string) || (first.jobId as string) || (first.id as string);
  if (!pollUrl && !jobId) return extractPayload(first);
  const full = pollUrl
    ? pollUrl.startsWith("http")
      ? pollUrl
      : `${HOST}${pollUrl}`
    : `${WIRE_BASE}/wire/jobs/${jobId}`;

  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    await sleep(1400);
    const res = await fetch(full, { headers: headers() });
    if (!res.ok) continue;
    const body = (await res.json()) as Json;
    const s = body.status as string;
    if (s === "completed" || s === "succeeded") return extractPayload(body);
    if (s === "failed") throw new Error(`Wire ${actionId} failed`);
  }
  throw new Error(`Wire ${actionId} timed out`);
}

// ---- Typed helpers ---------------------------------------------------------

export type GeoResult = {
  lat: number;
  lon: number;
  name: string;
  country?: string;
  timezone?: string;
};

export async function geocodeCity(name: string): Promise<GeoResult | null> {
  // Open-Meteo geocoding matches a bare city name — strip ", ST" / ", Country".
  const q = name.split(",")[0].trim() || name;
  const payload = await runWire("om_geocoding", { name: q, count: 5 });
  const r = (payload.results as Json[] | undefined)?.[0];
  if (!r) return null;
  return {
    lat: Number(r.latitude),
    lon: Number(r.longitude),
    name: String(r.name ?? name),
    country: r.country ? String(r.country) : undefined,
    timezone: r.timezone ? String(r.timezone) : undefined,
  };
}

export type Conditions = { tempF: number; humidity: number; aqi: number | null };

function pickIndex(times: string[] | undefined, targetLocalHourISO: string): number {
  if (!times) return -1;
  return times.findIndex((t) => t.startsWith(targetLocalHourISO));
}

async function retry<T>(fn: () => Promise<T>, times = 2, delayMs = 600): Promise<T> {
  try {
    return await fn();
  } catch (e) {
    if (times <= 0) throw e;
    await sleep(delayMs);
    return retry(fn, times - 1, delayMs * 2);
  }
}

/**
 * Real temperature + humidity + AQI at a target local hour ("2026-07-12T16:00").
 * Forecast is REQUIRED — if it can't be retrieved we throw (caller marks the
 * venue "no data" rather than inventing weather). AQI is best-effort: if the
 * air-quality call fails, aqi is null (never fabricated).
 */
export async function fetchConditions(
  lat: number,
  lon: number,
  timezone: string,
  targetLocalHourISO: string,
): Promise<Conditions> {
  // Forecast (temperature) is required — retry once, then propagate the error.
  const forecast = await retry(() =>
    runWire("om_forecast", {
      latitude: lat,
      longitude: lon,
      hourly: "temperature_2m,relative_humidity_2m",
      timezone,
      forecast_days: 2,
    }),
  );
  const fh = (forecast.hourly as Json) || {};
  const times = fh.time as string[] | undefined;
  const temps = fh.temperature_2m as number[] | undefined;
  const hums = fh.relative_humidity_2m as number[] | undefined;
  if (!temps?.length) throw new Error("no temperature data");
  const fi = pickIndex(times, targetLocalHourISO);
  const i = fi >= 0 ? fi : 0;
  const tempC = Number(temps[i]);
  const humidity = Number(hums?.[i] ?? 50);
  if (!Number.isFinite(tempC)) throw new Error("bad temperature");

  // AQI is best-effort — a failure yields null, never a fabricated value.
  let aqi: number | null = null;
  try {
    const air = await runWire("om_air_quality", {
      latitude: lat,
      longitude: lon,
      hourly: "us_aqi,pm2_5",
      timezone,
    });
    const ah = (air.hourly as Json) || {};
    const ai = pickIndex(ah.time as string[], targetLocalHourISO);
    const v = (ah.us_aqi as number[])?.[ai >= 0 ? ai : 0];
    if (Number.isFinite(Number(v))) aqi = Number(v);
  } catch {
    aqi = null;
  }

  return { tempF: tempC * (9 / 5) + 32, humidity, aqi };
}
