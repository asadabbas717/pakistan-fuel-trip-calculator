import { getTripHistory, validateSavedTrips } from "../storage/tripStorage";
import { getVehicles } from "../storage/vehicleStorage";
import { getFuelPrices } from "./fuelPriceService";
import {
  getPreferences,
  validPreferences,
} from "../storage/preferencesStorage";
import { getStoredItem, replaceStoredItems } from "../storage/appStorage";
import { enqueueCollection } from "../storage/collectionQueue";

export function parseBackup(text) {
  if (typeof text !== "string" || text.length > 2_000_000)
    throw new Error("Backup is missing or too large.");
  let value;
  try {
    value = JSON.parse(text);
  } catch {
    throw new Error("This file is not valid JSON.");
  }
  if (value?.app !== "FuelTripPK")
    throw new Error("Choose a FuelTrip PK backup file.");
  if (value.version === 1 && value.kind === "trip-history") {
    validateSavedTrips(value.trips);
    return value;
  }
  if (value.version !== 2 || value.kind !== "app-backup")
    throw new Error("Unsupported backup version.");
  validateSavedTrips(value.trips);
  if (
    !Array.isArray(value.vehicles) ||
    value.vehicles.length > 1000 ||
    !value.vehicles.every(
      (v) =>
        v &&
        typeof v.id === "string" &&
        v.id &&
        typeof v.name === "string" &&
        v.name.trim() &&
        v.name.length <= 100 &&
        Number.isFinite(v.averageKmPerLiter) &&
        v.averageKmPerLiter > 0,
    ) ||
    new Set(value.vehicles.map((v) => v.id)).size !== value.vehicles.length
  )
    throw new Error("Invalid vehicle profiles in backup.");
  if (
    !value.prices ||
    ![value.prices.petrol, value.prices.diesel].every(
      (n) => Number.isFinite(n) && n > 0,
    ) ||
    !validPreferences(value.preferences)
  )
    throw new Error("Invalid settings in backup.");
  if (
    value.appearance &&
    (!["system", "light", "dark"].includes(value.appearance.mode) ||
      !["forest", "ocean", "sunset"].includes(value.appearance.palette))
  )
    throw new Error("Invalid appearance in backup.");
  return value;
}
export function exportAppBackup() {
  return enqueueCollection(async () => {
    const value = {
      app: "FuelTripPK",
      version: 2,
      kind: "app-backup",
      exportedAt: new Date().toISOString(),
      trips: await getTripHistory(),
      vehicles: await getVehicles(),
      prices: await getFuelPrices(),
      preferences: await getPreferences(),
      appearance: JSON.parse(
        (await getStoredItem("FUEL_TRIP_PK_APPEARANCE")) || "null",
      ),
    };
    const text = JSON.stringify(value, null, 2);
    parseBackup(text);
    return text;
  });
}
export function restoreAppBackup(text, mode) {
  if (!["merge", "replace"].includes(mode))
    return Promise.reject(new Error("Choose merge or replace."));
  let backup;
  try {
    backup = parseBackup(text);
  } catch (error) {
    return Promise.reject(error);
  }
  const snapshot = JSON.parse(JSON.stringify(backup));
  return enqueueCollection(async () => {
    let trips = snapshot.trips;
    if (mode === "merge") {
      const combined = new Map(snapshot.trips.map((trip) => [trip.id, trip]));
      for (const trip of await getTripHistory()) combined.set(trip.id, trip);
      trips = [...combined.values()]
        .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
        .slice(0, 25);
    }
    const entries = { FUEL_TRIP_PK_HISTORY: JSON.stringify(trips) };
    if (snapshot.version === 2 && mode === "replace") {
      entries.FUEL_TRIP_PK_VEHICLES = JSON.stringify(snapshot.vehicles);
      entries.FUEL_TRIP_PK_PRICES = JSON.stringify(snapshot.prices);
      entries.FUEL_TRIP_PK_PREFERENCES = JSON.stringify(snapshot.preferences);
      entries.FUEL_TRIP_PK_APPEARANCE = JSON.stringify(
        snapshot.appearance || { mode: "system", palette: "forest" },
      );
    } else if (snapshot.version === 2) {
      const vehicles = new Map(snapshot.vehicles.map((v) => [v.id, v]));
      for (const v of await getVehicles()) vehicles.set(v.id, v);
      if (vehicles.size > 1000)
        throw new Error("Merged backup has too many vehicles.");
      entries.FUEL_TRIP_PK_VEHICLES = JSON.stringify([...vehicles.values()]);
    }
    await replaceStoredItems(entries);
    return trips;
  });
}
