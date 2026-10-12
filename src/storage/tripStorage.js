import { getStoredItem, setStoredItem, removeStoredItem } from "./appStorage";
import { validLocation, validCoordinates } from "../utils/validation";
import { createSerialQueue } from "./serialQueue";
const KEY = "FUEL_TRIP_PK_HISTORY";
const enqueue = createSerialQueue();
export function validTrip(trip) {
  const manual = trip?.route?.source === "manual";
  const namedPlace = (place) =>
    place &&
    typeof place.name === "string" &&
    place.name.trim().length > 0 &&
    place.name.length <= 200;
  const validRoute = manual
    ? trip.route.durationMinutes === null &&
      Array.isArray(trip.route.coordinates) &&
      trip.route.coordinates.length === 0
    : (trip?.route?.source === undefined || trip.route.source === "osrm") &&
      Number.isFinite(trip?.route?.durationMinutes) &&
      trip.route.durationMinutes >= 0 &&
      validCoordinates(trip.route?.coordinates);
  return (
    !!trip &&
    (manual
      ? namedPlace(trip.start) && namedPlace(trip.destination)
      : validLocation(trip.start) && validLocation(trip.destination)) &&
    ["petrol", "diesel"].includes(trip.fuelType) &&
    typeof trip.isReturnTrip === "boolean" &&
    [trip.fuelPrice, trip.averageKmPerLiter, trip.route?.distanceKm].every(
      (n) => Number.isFinite(n) && n > 0,
    ) &&
    // A positive short route can legitimately round displayed values to zero.
    [
      trip.result?.distanceKm,
      trip.result?.fuelNeeded,
      trip.result?.totalCost,
    ].every((n) => Number.isFinite(n) && n >= 0) &&
    validRoute
  );
}
export async function getTripHistory() {
  const saved = await getStoredItem(KEY);
  if (saved === null) return [];
  const history = JSON.parse(saved);
  if (
    !Array.isArray(history) ||
    !history.every(
      (trip) =>
        validTrip(trip) &&
        typeof trip.id === "string" &&
        Number.isFinite(Date.parse(trip.createdAt)),
    )
  )
    throw new Error(
      "Saved history is damaged. Existing data has been preserved.",
    );
  return history;
}
export function saveTrip(trip) {
  if (!validTrip(trip))
    return Promise.reject(new Error("Cannot save an invalid trip."));
  const snapshot = JSON.parse(JSON.stringify(trip));
  return enqueue(async () => {
    const history = await getTripHistory();
    const saved = {
      ...snapshot,
      id: Date.now().toString(36) + Math.random().toString(36).slice(2),
      createdAt: new Date().toISOString(),
    };
    await setStoredItem(KEY, JSON.stringify([saved, ...history].slice(0, 25)));
    return saved;
  });
}
export function clearTripHistory() {
  return enqueue(() => removeStoredItem(KEY));
}

const MAX_BACKUP_LENGTH = 2_000_000;
export async function exportTripHistory() {
  const backup = JSON.stringify(
    {
      app: "FuelTripPK",
      version: 1,
      kind: "trip-history",
      trips: await getTripHistory(),
    },
    null,
    2,
  );
  if (backup.length > MAX_BACKUP_LENGTH)
    throw new Error("History is too large for a text backup.");
  return backup;
}

export function restoreTripHistory(text) {
  let backup;
  try {
    if (typeof text !== "string" || text.length > MAX_BACKUP_LENGTH)
      throw new Error("History backup text is missing or too large.");
    backup = JSON.parse(text);
    const validSavedTrip = (trip) =>
      validTrip(trip) &&
      typeof trip.id === "string" &&
      trip.id.length > 0 &&
      Number.isFinite(Date.parse(trip.createdAt));
    if (
      backup?.app !== "FuelTripPK" ||
      backup.version !== 1 ||
      backup.kind !== "trip-history" ||
      !Array.isArray(backup.trips) ||
      backup.trips.length > 25 ||
      !backup.trips.every(validSavedTrip) ||
      new Set(backup.trips.map((trip) => trip.id)).size !== backup.trips.length
    )
      throw new Error(
        "Invalid or unsupported history backup. Existing history has not been changed.",
      );
  } catch (error) {
    return Promise.reject(error);
  }
  // Validate the entire backup before replacing one collection, never partially import.
  const snapshot = JSON.stringify(backup.trips);
  return enqueue(async () => {
    await setStoredItem(KEY, snapshot);
    return JSON.parse(snapshot);
  });
}
