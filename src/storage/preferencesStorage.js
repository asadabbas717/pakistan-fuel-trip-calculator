import { getStoredItem, setStoredItem } from "./appStorage";
import { enqueueCollection } from "./collectionQueue";
const KEY = "FUEL_TRIP_PK_PREFERENCES";
export function validPreferences(value) {
  return (
    !!value &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    (value.vehicleId === undefined || typeof value.vehicleId === "string") &&
    (value.fuelType === undefined ||
      ["petrol", "diesel"].includes(value.fuelType))
  );
}
export async function getPreferences() {
  const raw = await getStoredItem(KEY);
  if (!raw) return {};
  const value = JSON.parse(raw);
  if (!validPreferences(value))
    throw new Error("Saved preferences are damaged.");
  return value;
}
export function savePreferences(next) {
  return enqueueCollection(async () => {
    const value = { ...(await getPreferences()), ...next };
    if (!validPreferences(value)) throw new Error("Invalid preferences.");
    await setStoredItem(KEY, JSON.stringify(value));
    return value;
  });
}
