// Geocode a US zip code (zippopotam) or a city name (Open-Meteo public API).
// Both are free, no key.

export type GeoPoint = { lat: number; lon: number; label: string };

export async function geocodeLocation(q: string): Promise<GeoPoint | null> {
  const query = q.trim();
  const zip = query.match(/^\d{5}$/);

  if (zip) {
    try {
      const r = await fetch(`https://api.zippopotam.us/us/${zip[0]}`, {
        signal: AbortSignal.timeout(6000),
      });
      if (r.ok) {
        const j = (await r.json()) as {
          places?: Array<Record<string, string>>;
        };
        const p = j.places?.[0];
        if (p) {
          return {
            lat: Number(p.latitude),
            lon: Number(p.longitude),
            label: `${p["place name"]}, ${p["state abbreviation"]} ${zip[0]}`,
          };
        }
      }
    } catch {
      /* fall through to city search */
    }
  }

  try {
    const r = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=1&language=en&format=json`,
      { signal: AbortSignal.timeout(6000) },
    );
    if (r.ok) {
      const j = (await r.json()) as {
        results?: Array<{ name: string; latitude: number; longitude: number; admin1?: string; country?: string }>;
      };
      const p = j.results?.[0];
      if (p) {
        return {
          lat: p.latitude,
          lon: p.longitude,
          label: [p.name, p.admin1, p.country].filter(Boolean).join(", "),
        };
      }
    }
  } catch {
    /* ignore */
  }
  return null;
}
