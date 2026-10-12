jest.mock("../src/storage/appStorage", () => ({
  getStoredItem: jest.fn(),
  setStoredItem: jest.fn(),
  replaceStoredItems: jest.fn(),
}));
import { getStoredItem, replaceStoredItems } from "../src/storage/appStorage";
import {
  exportAppBackup,
  parseBackup,
  restoreAppBackup,
} from "../src/services/backupService";
import { createManualTrip } from "../src/services/manualTripService";
const trip = {
  ...createManualTrip({
    distanceKm: "100",
    startName: "Karachi",
    destinationName: "Hyderabad",
    fuelType: "petrol",
    fuelPrice: 300,
    averageKmPerLiter: 10,
    isReturnTrip: false,
  }),
  id: "one",
  createdAt: "2026-10-13T10:00:00Z",
};
let values;
beforeEach(() => {
  jest.clearAllMocks();
  values = new Map();
  getStoredItem.mockImplementation(async (key) => values.get(key) ?? null);
  replaceStoredItems.mockImplementation(async (entries) => {
    for (const [key, value] of Object.entries(entries)) values.set(key, value);
  });
});
test("full app backup restores all included settings after validation", async () => {
  values.set("FUEL_TRIP_PK_HISTORY", JSON.stringify([trip]));
  values.set(
    "FUEL_TRIP_PK_APPEARANCE",
    JSON.stringify({ mode: "dark", palette: "ocean" }),
  );
  const text = await exportAppBackup();
  const backup = parseBackup(text);
  expect(backup.version).toBe(2);
  expect(backup.vehicles.length).toBeGreaterThan(0);
  values.clear();
  await restoreAppBackup(text, "replace");
  expect(JSON.parse(values.get("FUEL_TRIP_PK_HISTORY"))).toEqual([trip]);
  expect(JSON.parse(values.get("FUEL_TRIP_PK_APPEARANCE"))).toEqual({
    mode: "dark",
    palette: "ocean",
  });
  expect(replaceStoredItems).toHaveBeenCalledTimes(1);
});
test("merge preserves existing duplicate records and settings and accepts old history files", async () => {
  values.set("FUEL_TRIP_PK_HISTORY", JSON.stringify([trip]));
  const text = JSON.stringify({
    app: "FuelTripPK",
    version: 1,
    kind: "trip-history",
    trips: [
      { ...trip, start: { name: "Changed" } },
      { ...trip, id: "two" },
    ],
  });
  const merged = await restoreAppBackup(text, "merge");
  expect(merged.find((value) => value.id === "one").start.name).toBe("Karachi");
  expect(merged).toHaveLength(2);
  expect(Object.keys(replaceStoredItems.mock.calls[0][0])).toEqual([
    "FUEL_TRIP_PK_HISTORY",
  ]);
});
test("invalid full backup changes no stored data", async () => {
  const backup = JSON.parse(await exportAppBackup());
  backup.vehicles = [{ id: "bad", name: "Bad", averageKmPerLiter: -1 }];
  await expect(
    restoreAppBackup(JSON.stringify(backup), "replace"),
  ).rejects.toThrow("vehicle");
  expect(replaceStoredItems).not.toHaveBeenCalled();
});
