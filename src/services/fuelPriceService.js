import { DEFAULT_FUEL_PRICES } from "../utils/constants";
import { positiveNumber } from "../utils/validation";
import {
  getStoredItem,
  setStoredItem,
  removeStoredItem,
} from "../storage/appStorage";
const KEY = "FUEL_TRIP_PK_PRICES";
export async function getFuelPrices() {
  const saved = await getStoredItem(KEY);
  if (saved === null) return { ...DEFAULT_FUEL_PRICES };
  const prices = JSON.parse(saved);
  return {
    petrol: positiveNumber(prices.petrol, "Petrol price"),
    diesel: positiveNumber(prices.diesel, "Diesel price"),
    lastUpdated: prices.lastUpdated || "Saved locally",
  };
}
export async function saveFuelPrices(prices) {
  const payload = {
    petrol: positiveNumber(prices.petrol, "Petrol price"),
    diesel: positiveNumber(prices.diesel, "Diesel price"),
    lastUpdated: new Date().toISOString(),
  };
  await setStoredItem(KEY, JSON.stringify(payload));
  return payload;
}
export async function resetFuelPrices() {
  await setStoredItem(KEY, JSON.stringify(DEFAULT_FUEL_PRICES));
  return { ...DEFAULT_FUEL_PRICES };
}
export async function clearFuelPrices() {
  await removeStoredItem(KEY);
}
