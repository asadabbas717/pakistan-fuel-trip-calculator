jest.mock("../src/storage/appStorage", () => ({
  getStoredItem: jest.fn(),
  setStoredItem: jest.fn(),
  removeStoredItem: jest.fn(),
}));
import {
  getStoredItem,
  setStoredItem,
  removeStoredItem,
} from "../src/storage/appStorage";
import { getVehicles, saveVehicle } from "../src/storage/vehicleStorage";
import {
  getTripHistory,
  saveTrip,
  clearTripHistory,
  exportTripHistory,
  restoreTripHistory,
} from "../src/storage/tripStorage";
import {
  getFuelPrices,
  saveFuelPrices,
  resetFuelPrices,
} from "../src/services/fuelPriceService";
let data;
beforeEach(() => {
  jest.resetAllMocks();
  data = {};
  getStoredItem.mockImplementation(async (key) => data[key] ?? null);
  setStoredItem.mockImplementation(async (key, value) => {
    data[key] = value;
  });
  removeStoredItem.mockImplementation(async (key) => {
    delete data[key];
  });
});
const trip = {
  start: { name: "Karachi", lat: 24, lon: 67 },
  destination: { name: "Hyderabad", lat: 25, lon: 68 },
  fuelType: "petrol",
  fuelPrice: 300,
  averageKmPerLiter: 10,
  isReturnTrip: false,
  result: { distanceKm: 100, fuelNeeded: 10, totalCost: 3000 },
  route: {
    distanceKm: 100,
    durationMinutes: 80,
    coordinates: [
      [24, 67],
      [25, 68],
    ],
  },
};
test("short routes with rounded zero fuel remain valid history", async () => {
  const shortTrip = {
    ...trip,
    route: { ...trip.route, distanceKm: 0.001 },
    result: { distanceKm: 0, fuelNeeded: 0, totalCost: 0.03 },
  };
  await saveTrip(shortTrip);
  expect((await getTripHistory())[0].result).toEqual(shortTrip.result);
});
test("concurrent vehicle saves retain both records", async () => {
  await Promise.all([
    saveVehicle({ name: "A", averageKmPerLiter: 10 }),
    saveVehicle({ name: "B", averageKmPerLiter: 20 }),
  ]);
  expect((await getVehicles()).slice(0, 2).map((v) => v.name)).toEqual([
    "B",
    "A",
  ]);
});
test("write failures reject and do not poison subsequent saves", async () => {
  setStoredItem.mockRejectedValueOnce(new Error("disk full"));
  await expect(
    saveVehicle({ name: "A", averageKmPerLiter: 10 }),
  ).rejects.toThrow("disk full");
  await expect(
    saveVehicle({ name: "B", averageKmPerLiter: 20 }),
  ).resolves.toBeDefined();
});
test("corrupt collections are preserved instead of overwritten", async () => {
  data.FUEL_TRIP_PK_VEHICLES = '{"bad":true}';
  await expect(
    saveVehicle({ name: "A", averageKmPerLiter: 10 }),
  ).rejects.toThrow();
  expect(setStoredItem).not.toHaveBeenCalled();
  data.FUEL_TRIP_PK_HISTORY = JSON.stringify([{ start: null }]);
  await expect(getTripHistory()).rejects.toThrow("damaged");
});
test("history retains 25 trips, unique ids, and serializes clear with save", async () => {
  await Promise.all(Array.from({ length: 30 }, () => saveTrip(trip)));
  const history = await getTripHistory();
  expect(history).toHaveLength(25);
  expect(new Set(history.map((t) => t.id)).size).toBe(25);
  await Promise.all([saveTrip(trip), clearTripHistory()]);
  expect(await getTripHistory()).toEqual([]);
});
test("invalid trip and vehicle fail before writing", async () => {
  await expect(saveTrip({ ...trip, fuelPrice: Infinity })).rejects.toThrow();
  await expect(
    saveVehicle({ name: "", averageKmPerLiter: 10 }),
  ).rejects.toThrow();
  expect(setStoredItem).not.toHaveBeenCalled();
});
test("prices reject negative, junk and infinity and propagate reset failures", async () => {
  for (const petrol of ["-300", "abc300", Infinity])
    await expect(saveFuelPrices({ petrol, diesel: 300 })).rejects.toThrow();
  await saveFuelPrices({ petrol: "300.50", diesel: 310 });
  expect((await getFuelPrices()).petrol).toBe(300.5);
  setStoredItem.mockRejectedValueOnce(new Error("quota"));
  await expect(resetFuelPrices()).rejects.toThrow("quota");
});

test("history backup round trip retains routed and manual trips", async () => {
  const { createManualTrip } = require("../src/services/manualTripService");
  await saveTrip(trip);
  await saveTrip(
    createManualTrip({
      distanceKm: 50,
      fuelType: "diesel",
      fuelPrice: 300,
      averageKmPerLiter: 10,
    }),
  );
  const before = await getTripHistory();
  const backup = await exportTripHistory();
  await clearTripHistory();
  expect(await restoreTripHistory(backup)).toEqual(before);
  expect(await getTripHistory()).toEqual(before);
});
test("invalid restore preserves the collection without partial writes", async () => {
  await saveTrip(trip);
  const saved = await getTripHistory();
  setStoredItem.mockClear();
  const payload = {
    app: "FuelTripPK",
    version: 1,
    kind: "trip-history",
    trips: saved,
  };
  for (const bad of [
    "broken JSON",
    "x".repeat(2_000_001),
    JSON.stringify({ ...payload, version: 2 }),
    JSON.stringify({
      ...payload,
      trips: [...saved, { ...saved[0], id: "bad", start: null }],
    }),
    JSON.stringify({ ...payload, trips: [...saved, ...saved] }),
  ])
    await expect(restoreTripHistory(bad)).rejects.toThrow();
  expect(setStoredItem).not.toHaveBeenCalled();
  expect(await getTripHistory()).toEqual(saved);
});
test("restore propagates storage failure and serializes with subsequent saves", async () => {
  const empty = JSON.stringify({
    app: "FuelTripPK",
    version: 1,
    kind: "trip-history",
    trips: [],
  });
  setStoredItem.mockRejectedValueOnce(new Error("disk full"));
  await expect(restoreTripHistory(empty)).rejects.toThrow("disk full");
  await Promise.all([restoreTripHistory(empty), saveTrip(trip)]);
  expect(await getTripHistory()).toHaveLength(1);
});
