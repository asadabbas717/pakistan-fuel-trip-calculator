import { DEFAULT_VEHICLES } from "../utils/constants";
import { positiveNumber } from "../utils/validation";
import { getStoredItem, setStoredItem } from "./appStorage";
import { createSerialQueue } from "./serialQueue";
const KEY = "FUEL_TRIP_PK_VEHICLES";
const enqueue = createSerialQueue();
export async function getVehicles() {
  const saved = await getStoredItem(KEY);
  if (saved === null)
    return DEFAULT_VEHICLES.map((vehicle) => ({ ...vehicle }));
  const vehicles = JSON.parse(saved);
  if (
    !Array.isArray(vehicles) ||
    !vehicles.every(
      (v) =>
        v &&
        typeof v.id === "string" &&
        typeof v.name === "string" &&
        v.name.trim() &&
        Number.isFinite(v.averageKmPerLiter) &&
        v.averageKmPerLiter > 0,
    )
  )
    throw new Error(
      "Saved vehicles are damaged. Existing data has been preserved.",
    );
  return vehicles;
}
export function saveVehicle(vehicle) {
  const name = vehicle.name?.trim();
  if (!name || name.length > 100)
    return Promise.reject(
      new Error("Vehicle name must contain 1–100 characters."),
    );
  let average;
  try {
    average = positiveNumber(vehicle.averageKmPerLiter, "Vehicle average");
  } catch (error) {
    return Promise.reject(error);
  }
  return enqueue(async () => {
    const vehicles = await getVehicles();
    const updated = [
      {
        id: Date.now().toString(36) + Math.random().toString(36).slice(2),
        name,
        averageKmPerLiter: average,
      },
      ...vehicles,
    ];
    await setStoredItem(KEY, JSON.stringify(updated));
    return updated;
  });
}
export function deleteVehicle(id) {
  return enqueue(async () => {
    const updated = (await getVehicles()).filter(
      (vehicle) => vehicle.id !== id,
    );
    await setStoredItem(KEY, JSON.stringify(updated));
    return updated;
  });
}
