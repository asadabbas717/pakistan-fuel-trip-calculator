import { DEFAULT_FUEL_PRICES } from "../utils/constants";
import {
  getStoredItem,
  setStoredItem,
  removeStoredItem,
} from "../storage/appStorage";

const FUEL_PRICE_KEY = "FUEL_TRIP_PK_PRICES";

function cleanPriceValue(value) {
  if (value === null || value === undefined) {
    return 0;
  }

  const cleanedValue = String(value)
    .replace(/Rs\.?/gi, "")
    .replace(/PKR/gi, "")
    .replace(/,/g, "")
    .replace(/\s/g, "")
    .replace(/[^\d.]/g, "");

  const numberValue = Number(cleanedValue);

  if (Number.isNaN(numberValue)) {
    return 0;
  }

  return numberValue;
}

function isValidPrice(value) {
  const numberValue = cleanPriceValue(value);
  return numberValue > 0;
}

export async function getFuelPrices() {
  try {
    const saved = await getStoredItem(FUEL_PRICE_KEY);

    if (!saved) {
      await setStoredItem(FUEL_PRICE_KEY, JSON.stringify(DEFAULT_FUEL_PRICES));
      return DEFAULT_FUEL_PRICES;
    }

    const parsedPrices = JSON.parse(saved);

    if (
      !parsedPrices ||
      !isValidPrice(parsedPrices.petrol) ||
      !isValidPrice(parsedPrices.diesel)
    ) {
      await setStoredItem(FUEL_PRICE_KEY, JSON.stringify(DEFAULT_FUEL_PRICES));
      return DEFAULT_FUEL_PRICES;
    }

    return {
      petrol: cleanPriceValue(parsedPrices.petrol),
      diesel: cleanPriceValue(parsedPrices.diesel),
      lastUpdated: parsedPrices.lastUpdated || "Saved locally",
    };
  } catch (error) {
    console.log("Fuel price loading error:", error);
    return DEFAULT_FUEL_PRICES;
  }
}

export async function saveFuelPrices(prices) {
  try {
    const petrolPrice = cleanPriceValue(prices.petrol);
    const dieselPrice = cleanPriceValue(prices.diesel);

    if (petrolPrice <= 0) {
      throw new Error("Please enter a valid petrol price.");
    }

    if (dieselPrice <= 0) {
      throw new Error("Please enter a valid diesel price.");
    }

    const payload = {
      petrol: petrolPrice,
      diesel: dieselPrice,
      lastUpdated: prices.lastUpdated || new Date().toLocaleDateString("en-PK"),
    };

    await setStoredItem(FUEL_PRICE_KEY, JSON.stringify(payload));

    return payload;
  } catch (error) {
    console.log("Fuel price saving error:", error);

    throw new Error(
      error.message || "Unable to save fuel prices. Please try again."
    );
  }
}

export async function resetFuelPrices() {
  try {
    await setStoredItem(FUEL_PRICE_KEY, JSON.stringify(DEFAULT_FUEL_PRICES));

    return DEFAULT_FUEL_PRICES;
  } catch (error) {
    console.log("Fuel price reset error:", error);

    return DEFAULT_FUEL_PRICES;
  }
}

export async function clearFuelPrices() {
  try {
    await removeStoredItem(FUEL_PRICE_KEY);
  } catch (error) {
    console.log("Fuel price clear error:", error);
  }
}