import { validLocation } from "../utils/validation";

export function directionsUrl(trip) {
  const manual = trip.route?.source === "manual";
  function endpoint(place) {
    if (!manual) {
      if (!validLocation(place))
        throw new Error("Valid route coordinates are required.");
      return `${place.lat},${place.lon}`;
    }
    if (
      !place ||
      typeof place.name !== "string" ||
      !place.name.trim() ||
      ["Starting point", "Destination"].includes(place.name.trim())
    )
      throw new Error(
        "Enter both place names before opening directions for a manual trip.",
      );
    return place.name.trim();
  }
  return (
    "https://www.google.com/maps/dir/?api=1&origin=" +
    encodeURIComponent(endpoint(trip.start)) +
    "&destination=" +
    encodeURIComponent(endpoint(trip.destination)) +
    "&travelmode=driving"
  );
}
