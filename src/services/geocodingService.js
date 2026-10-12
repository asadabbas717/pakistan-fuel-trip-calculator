import { serviceUrl } from "../utils/serviceUrl";
import { fetchJson } from "./httpClient";
import { validLocation } from "../utils/validation";
const BASE_URL = serviceUrl(
  process.env.EXPO_PUBLIC_GEOCODING_URL,
  "https://photon.komoot.io/api/",
);
const cache = new Map();
let lastRequest = 0;
let queue = Promise.resolve();
export function searchPlace(query, { signal } = {}) {
  if (
    typeof query !== "string" ||
    query.trim().length < 3 ||
    query.length > 200
  )
    return Promise.reject(new Error("Enter 3–200 characters to search."));
  const key = query.trim().toLowerCase();
  const operation = queue.then(async () => {
    if (signal?.aborted) throw new Error("Search cancelled.");
    if (new URL(BASE_URL).hostname === "nominatim.openstreetmap.org")
      throw new Error(
        "Use a Photon-compatible endpoint for automatic suggestions.",
      );
    if (cache.has(key)) return cache.get(key);
    const wait = Math.max(0, 1100 - (Date.now() - lastRequest));
    if (wait) await new Promise((resolve) => setTimeout(resolve, wait));
    if (signal?.aborted) throw new Error("Search cancelled.");
    lastRequest = Date.now();
    const data = await fetchJson(
      BASE_URL +
        "?q=" +
        encodeURIComponent(query.trim()) +
        "&limit=5&countrycode=PK&lang=en",
      {
        signal,
        headers: { "User-Agent": "FuelTripPK/1.0", Accept: "application/json" },
      },
    );
    if (!Array.isArray(data.features))
      throw new Error("Invalid place search response.");
    const places = data.features
      .filter((item) => item.properties?.countrycode?.toUpperCase() === "PK")
      .map((item) => {
        const p = item.properties;
        if (!p.osm_type || !Number.isFinite(p.osm_id))
          throw new Error("Invalid place identity returned by service.");
        const parts = [
          p.name,
          p.street,
          p.city,
          p.district,
          p.state,
          p.country,
        ].filter((part) => typeof part === "string" && part.trim());
        return {
          id: String(p.osm_type) + String(p.osm_id),
          name: [...new Set(parts)].join(", ").slice(0, 200),
          lat:
            item.geometry?.type === "Point"
              ? item.geometry.coordinates?.[1]
              : NaN,
          lon:
            item.geometry?.type === "Point"
              ? item.geometry.coordinates?.[0]
              : NaN,
        };
      });
    if (!places.every(validLocation))
      throw new Error("Invalid place coordinates returned by service.");
    if (cache.size >= 50) cache.delete(cache.keys().next().value);
    const unique = [
      ...new Map(places.map((place) => [place.id, place])).values(),
    ];
    cache.set(key, unique);
    return unique;
  });
  queue = operation.catch(() => {});
  return operation;
}
