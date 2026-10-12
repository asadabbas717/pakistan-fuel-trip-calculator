import { getStoredItem, setStoredItem, removeStoredItem } from "./appStorage";
import { validLocation, validCoordinates } from "../utils/validation";
import { createSerialQueue } from "./serialQueue";
const KEY = "FUEL_TRIP_PK_HISTORY";
const enqueue = createSerialQueue();
export function validTrip(trip) {
  return (
    !!trip &&
    validLocation(trip.start) &&
    validLocation(trip.destination) &&
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
    Number.isFinite(trip.route?.durationMinutes) &&
    trip.route.durationMinutes >= 0 &&
    validCoordinates(trip.route?.coordinates)
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
