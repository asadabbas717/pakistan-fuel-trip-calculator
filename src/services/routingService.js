import { serviceUrl } from "../utils/serviceUrl";
import { fetchJson } from "./httpClient";
import { validLocation, validCoordinates } from "../utils/validation";
const BASE_URL = serviceUrl(
  process.env.EXPO_PUBLIC_ROUTING_URL,
  "https://router.project-osrm.org/route/v1/driving",
);
export async function getRoute({ start, destination }) {
  if (!validLocation(start) || !validLocation(destination))
    throw new Error("Valid start and destination coordinates are required.");
  const url =
    BASE_URL +
    "/" +
    start.lon +
    "," +
    start.lat +
    ";" +
    destination.lon +
    "," +
    destination.lat +
    "?overview=full&geometries=geojson&alternatives=true&steps=false";
  const data = await fetchJson(url);
  if (
    data.code !== "Ok" ||
    !Array.isArray(data.routes) ||
    data.routes.length === 0
  )
    throw new Error("No route found.");
  const routes = data.routes.map((route, index) => {
    if (
      !Number.isFinite(route.distance) ||
      route.distance <= 0 ||
      !Number.isFinite(route.duration) ||
      route.duration < 0 ||
      !Array.isArray(route.geometry?.coordinates)
    )
      throw new Error("Invalid route response.");
    const coordinates = route.geometry.coordinates.map((point) =>
      Array.isArray(point) ? [point[1], point[0]] : [],
    );
    if (!validCoordinates(coordinates))
      throw new Error("Invalid route geometry.");
    return {
      id: "route-" + index,
      distanceKm: route.distance / 1000,
      durationMinutes: Math.round(route.duration / 60),
      coordinates,
    };
  });
  routes.sort((a, b) => a.distanceKm - b.distanceKm);
  return { bestRoute: routes[0], allRoutes: routes };
}
