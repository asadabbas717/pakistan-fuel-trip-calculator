import { DEFAULT_FUEL_PRICES } from "../utils/constants";
import { positiveNumber } from "../utils/validation";
import {
  getOfficialPrices,
  validateOfficialPrices,
  officialPriceLabel,
} from "./officialFuelService";
import { enqueueCollection } from "../storage/collectionQueue";
import {
  getStoredItem,
  setStoredItem,
  removeStoredItem,
} from "../storage/appStorage";
const KEY = "FUEL_TRIP_PK_PRICES";
export async function getFuelPrices() {
  const saved = await getStoredItem(KEY);
  if (saved === null) {
    const raw = await getStoredItem("FUEL_TRIP_PK_OFFICIAL_PRICES");
    if (raw) {
      const prices = validateOfficialPrices(JSON.parse(raw));
      return {
        ...prices,
        mode: "auto",
        lastUpdated: officialPriceLabel(prices),
      };
    }
    return { ...DEFAULT_FUEL_PRICES, mode: "auto" };
  }
  const prices = JSON.parse(saved);
  return {
    ...prices,
    petrol: positiveNumber(prices.petrol, "Petrol price"),
    diesel: positiveNumber(prices.diesel, "Diesel price"),
    lastUpdated:
      prices.mode === "auto" && prices.source === "PSO"
        ? officialPriceLabel(prices)
        : prices.lastUpdated || "Saved locally",
    mode: prices.mode === "auto" ? "auto" : "manual",
  };
}
export async function saveFuelPrices(prices) {
  const payload = {
    petrol: positiveNumber(prices.petrol, "Petrol price"),
    diesel: positiveNumber(prices.diesel, "Diesel price"),
    lastUpdated: new Date().toISOString(),
    mode: "manual",
  };
  await enqueueCollection(() => setStoredItem(KEY, JSON.stringify(payload)));
  return payload;
}
export async function resetFuelPrices() {
  await enqueueCollection(() =>
    setStoredItem(
      KEY,
      JSON.stringify({ ...DEFAULT_FUEL_PRICES, mode: "manual" }),
    ),
  );
  return { ...DEFAULT_FUEL_PRICES };
}
export async function clearFuelPrices() {
  await enqueueCollection(() => removeStoredItem(KEY));
}
export async function refreshFuelPrices({
  force = false,
  enable = false,
} = {}) {
  const current = await getFuelPrices();
  if (current.mode === "manual" && !enable) return current;
  try {
    const prices = await getOfficialPrices({ force });
    const payload = {
      ...prices,
      mode: "auto",
      lastUpdated: officialPriceLabel(prices),
    };
    await enqueueCollection(async () => {
      // A slow automatic check must not overwrite a manual override saved meanwhile.
      const raw = await getStoredItem(KEY);
      if (!enable && raw && JSON.parse(raw).mode !== "auto") return;
      await setStoredItem(KEY, JSON.stringify(payload));
    });
    return getFuelPrices();
  } catch (error) {
    if (force || enable) throw error;
    return {
      ...current,
      lastUpdated: current.lastUpdated + " · automatic check unavailable",
    };
  }
}
