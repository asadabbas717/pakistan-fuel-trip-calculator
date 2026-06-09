const OSRM_BASE_URL = "https://router.project-osrm.org/route/v1/driving";

export async function getRoute({ start, destination }) {
  if (!start || !destination) {
    throw new Error("Start and destination are required.");
  }

  const coordinates = `${start.lon},${start.lat};${destination.lon},${destination.lat}`;

  const url = `${OSRM_BASE_URL}/${coordinates}?overview=full&geometries=geojson&alternatives=true&steps=false`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("Failed to fetch route.");
  }

  const data = await response.json();

  if (!data.routes || data.routes.length === 0) {
    throw new Error("No route found.");
  }

  const routes = data.routes.map((route, index) => ({
    id: `route-${index}`,
    distanceKm: Number((route.distance / 1000).toFixed(2)),
    durationMinutes: Number((route.duration / 60).toFixed(0)),
    coordinates: route.geometry.coordinates.map(([lon, lat]) => [lat, lon]),
  }));

  routes.sort((a, b) => a.distanceKm - b.distanceKm);

  return {
    bestRoute: routes[0],
    allRoutes: routes,
  };
}