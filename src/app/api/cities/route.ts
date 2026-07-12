import { CitySuggestion } from "@/lib/sweep";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type OMResult = {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  country?: string;
  admin1?: string;
};

/** Typeahead city search via Open-Meteo's public geocoding (fast, no key). */
export async function GET(req: Request) {
  const q = new URL(req.url).searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) return Response.json({ cities: [] });

  try {
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=6&language=en&format=json`;
    const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
    const json = (await res.json()) as { results?: OMResult[] };
    const cities: CitySuggestion[] = (json.results ?? []).map((r) => ({
      id: String(r.id),
      name: r.name,
      admin1: r.admin1,
      country: r.country,
      lat: r.latitude,
      lon: r.longitude,
      label: [r.name, r.admin1, r.country].filter(Boolean).join(", "),
    }));
    return Response.json({ cities });
  } catch {
    return Response.json({ cities: [] });
  }
}
