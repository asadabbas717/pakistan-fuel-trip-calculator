import {
  getStoredItem,
  setStoredItem,
  removeStoredItem,
} from "./appStorage";

const TRIP_HISTORY_KEY = "FUEL_TRIP_PK_HISTORY";

export async function getTripHistory() {
  try {
    const saved = await getStoredItem(TRIP_HISTORY_KEY);

    if (!saved) {
      return [];
    }

    const parsedHistory = JSON.parse(saved);

    if (!Array.isArray(parsedHistory)) {
      return [];
    }

    return parsedHistory;
  } catch (error) {
    console.log("Trip history loading error:", error);
    return [];
  }
}

export async function saveTrip(trip) {
  const newTrip = {
    id: Date.now().toString(),
    createdAt: new Date().toISOString(),
    ...trip,
  };

  try {
    const history = await getTripHistory();

    const updatedHistory = [newTrip, ...history].slice(0, 25);

    await setStoredItem(TRIP_HISTORY_KEY, JSON.stringify(updatedHistory));

    return newTrip;
  } catch (error) {
    console.log("Trip saving error:", error);

    return newTrip;
  }
}

export async function clearTripHistory() {
  try {
    await removeStoredItem(TRIP_HISTORY_KEY);
  } catch (error) {
    console.log("Trip history clear error:", error);
  }
}