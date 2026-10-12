import { serviceUrl } from "../utils/serviceUrl";
import { fetchJson } from "./httpClient";
import { validLocation } from "../utils/validation";
const BASE_URL = serviceUrl(
  process.env.EXPO_PUBLIC_GEOCODING_URL,
  "https://nominatim.openstreetmap.org/search",
);
const cache = new Map();
let lastRequest = 0;
let queue = Promise.resolve();
export function searchPlace(query) {
  if (
    typeof query !== "string" ||
    query.trim().length < 3 ||
    query.length > 200
  )
    return Promise.reject(new Error("Enter 3–200 characters to search."));
  const key = query.trim().toLowerCase();
  const operation = queue.then(async () => {
    if (cache.has(key)) return cache.get(key);
    const wait = Math.max(0, 1100 - (Date.now() - lastRequest));
    if (wait) await new Promise((resolve) => setTimeout(resolve, wait));
    lastRequest = Date.now();
    const data = await fetchJson(
      BASE_URL +
        "?q=" +
        encodeURIComponent(query.trim()) +
        "&format=json&limit=5&countrycodes=pk",
      {
        headers: { "User-Agent": "FuelTripPK/1.0", Accept: "application/json" },
      },
    );
    if (!Array.isArray(data)) throw new Error("Invalid place search response.");
    const places = data.map((item) => ({
      id: String(item.place_id),
      name: item.display_name,
      lat: Number(item.lat),
      lon: Number(item.lon),
    }));
    if (!places.every(validLocation))
      throw new Error("Invalid place coordinates returned by service.");
    if (cache.size >= 50) cache.delete(cache.keys().next().value);
    cache.set(key, places);
    return places;
  });
  queue = operation.catch(() => {});
  return operation;
}
