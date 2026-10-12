import { Platform } from "react-native";
import { createSerialQueue } from "./serialQueue";
import * as FileSystem from "expo-file-system/legacy";

const enqueue = createSerialQueue();
let recovered = false;
const JOURNAL = "FUEL_TRIP_PK_RESTORE";
const restoreKeys = [
  "FUEL_TRIP_PK_HISTORY",
  "FUEL_TRIP_PK_VEHICLES",
  "FUEL_TRIP_PK_PRICES",
  "FUEL_TRIP_PK_APPEARANCE",
  "FUEL_TRIP_PK_PREFERENCES",
];
function serialized(key, operation) {
  if (!/^FUEL_TRIP_PK_[A-Z_]+$/.test(key))
    return Promise.reject(new Error("Invalid storage key."));
  return enqueue(async () => {
    await recoverRestore();
    return operation();
  });
}
async function recoverRestore() {
  if (recovered) return;
  const journal = await read(JOURNAL);
  if (journal) {
    const previous = JSON.parse(journal);
    if (
      !previous ||
      typeof previous !== "object" ||
      Array.isArray(previous) ||
      Object.entries(previous).some(
        ([key, value]) =>
          !restoreKeys.includes(key) ||
          (value !== null && typeof value !== "string"),
      )
    )
      throw new Error(
        "Recovery data is invalid. Saved data has been preserved.",
      );
    for (const [key, value] of Object.entries(previous)) {
      if (value === null) await remove(key);
      else await write(key, value);
    }
    await remove(JOURNAL);
  }
  recovered = true;
}
export function replaceStoredItems(entries) {
  if (
    !entries ||
    Object.entries(entries).some(
      ([key, value]) => !restoreKeys.includes(key) || typeof value !== "string",
    )
  )
    return Promise.reject(new Error("Invalid restore values."));
  return enqueue(async () => {
    await recoverRestore();
    const previous = {};
    for (const key of Object.keys(entries))
      previous[key] = (await read(key)) ?? null;
    await write(JOURNAL, JSON.stringify(previous));
    try {
      for (const [key, value] of Object.entries(entries))
        await write(key, value);
      await remove(JOURNAL);
    } catch (error) {
      recovered = false;
      try {
        await recoverRestore();
      } catch {
        throw new Error(
          "Restore failed. Recovery will be retried when the app restarts; keep your backup file.",
        );
      }
      throw new Error(
        "Restore failed; previous data was recovered. " + error.message,
      );
    }
  });
}
function filePath(key) {
  if (!/^FUEL_TRIP_PK_[A-Z_]+$/.test(key))
    throw new Error("Invalid storage key.");
  if (!FileSystem.documentDirectory)
    throw new Error("Device storage is unavailable.");
  return FileSystem.documentDirectory + "fuel-trip-storage/" + key + ".json";
}
function webStorage() {
  if (typeof localStorage === "undefined")
    throw new Error("Browser storage is unavailable.");
  return localStorage;
}
async function read(key) {
  if (Platform.OS === "web") return webStorage().getItem(key);
  const path = filePath(key);
  const info = await FileSystem.getInfoAsync(path);
  if (info.exists) return FileSystem.readAsStringAsync(path);
  const backup = await FileSystem.getInfoAsync(path + ".bak");
  return backup.exists ? FileSystem.readAsStringAsync(path + ".bak") : null;
}
async function write(key, value) {
  if (Platform.OS === "web") webStorage().setItem(key, String(value));
  else {
    const path = filePath(key);
    await FileSystem.makeDirectoryAsync(
      FileSystem.documentDirectory + "fuel-trip-storage",
      { intermediates: true },
    );
    await FileSystem.writeAsStringAsync(path + ".tmp", String(value));
    // iOS legacy move removes the target first; retain a recovery copy.
    if ((await FileSystem.getInfoAsync(path)).exists)
      await FileSystem.copyAsync({ from: path, to: path + ".bak" });
    await FileSystem.moveAsync({ from: path + ".tmp", to: path });
  }
  return true;
}
async function remove(key) {
  if (Platform.OS === "web") webStorage().removeItem(key);
  else {
    const path = filePath(key);
    await FileSystem.deleteAsync(path + ".bak", { idempotent: true });
    await FileSystem.deleteAsync(path + ".tmp", { idempotent: true });
    await FileSystem.deleteAsync(path, { idempotent: true });
  }
  return true;
}

export function getStoredItem(key) {
  return serialized(key, () => read(key));
}
export function setStoredItem(key, value) {
  return serialized(key, () => write(key, value));
}
export function removeStoredItem(key) {
  return serialized(key, () => remove(key));
}
