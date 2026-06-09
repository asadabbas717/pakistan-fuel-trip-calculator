const NOMINATIM_BASE_URL = "https://nominatim.openstreetmap.org/search";

export async function searchPlace(query) {
  if (!query || query.trim().length < 3) {
    throw new Error("Please enter at least 3 characters.");
  }

  const url = `${NOMINATIM_BASE_URL}?q=${encodeURIComponent(
    query
  )}&format=json&limit=5&countrycodes=pk`;

  const response = await fetch(url, {
    headers: {
      "User-Agent": "FuelTripPK/1.0 student-project",
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("Failed to search location.");
  }

  const data = await response.json();

  return data.map((item) => ({
    id: item.place_id.toString(),
    name: item.display_name,
    lat: Number(item.lat),
    lon: Number(item.lon),
  }));
}