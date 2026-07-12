// Real schools/venues for a city, straight from OpenStreetMap via Overpass.
// Free, no key, works for any city worldwide.

export type OsmVenue = { id: string; name: string; lat: number; lon: number };

const ENDPOINTS = [
  "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
];

type OverpassEl = {
  type: string;
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
};

/**
 * Schools (and named sports grounds) within `radiusM` of a point.
 * Returns real names + coordinates, deduped and spread up to `limit`.
 */
export async function fetchSchools(
  lat: number,
  lon: number,
  radiusM: number,
  limit: number,
): Promise<OsmVenue[]> {
  // Schools + colleges, plus real team-sport stadiums/fields. Excludes
  // motorsport speedways, horse tracks, commercial gyms and swim schools.
  const q = `
    [out:json][timeout:20];
    (
      nwr["amenity"="school"](around:${radiusM},${lat},${lon});
      nwr["amenity"="college"](around:${radiusM},${lat},${lon});
      nwr["leisure"~"^(stadium|pitch)$"]["sport"~"soccer|football|american_football|baseball|softball|basketball|athletics|lacrosse|multi",i](around:${radiusM},${lat},${lon});
    );
    out center tags 200;
  `;

  let elements: OverpassEl[] = [];
  for (const url of ENDPOINTS) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "User-Agent": "Zephyr/1.0 (youth-sports-safety)",
        },
        body: "data=" + encodeURIComponent(q),
        signal: AbortSignal.timeout(22000),
      });
      if (!res.ok) continue;
      const json = (await res.json()) as { elements?: OverpassEl[] };
      elements = json.elements ?? [];
      if (elements.length) break;
    } catch {
      /* try next mirror */
    }
  }

  const seen = new Set<string>();
  const venues: OsmVenue[] = [];
  for (const el of elements) {
    const name = el.tags?.name;
    if (!name || seen.has(name)) continue;
    const vlat = el.lat ?? el.center?.lat;
    const vlon = el.lon ?? el.center?.lon;
    if (vlat == null || vlon == null) continue;
    seen.add(name);
    venues.push({ id: `osm${el.id}`, name, lat: vlat, lon: vlon });
  }

  // Deterministic: the N venues closest to the city center. Same city →
  // same venues every run (no run-to-run flicker).
  venues.sort(
    (a, b) =>
      (a.lat - lat) ** 2 +
      (a.lon - lon) ** 2 -
      ((b.lat - lat) ** 2 + (b.lon - lon) ** 2),
  );
  return venues.slice(0, limit);
}
