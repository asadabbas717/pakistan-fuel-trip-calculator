jest.mock("../src/storage/appStorage", () => ({
  getStoredItem: jest.fn(),
  setStoredItem: jest.fn(),
}));
jest.mock("../src/services/httpClient", () => ({ fetchJson: jest.fn() }));
import { getStoredItem, setStoredItem } from "../src/storage/appStorage";
import { fetchJson } from "../src/services/httpClient";
import {
  getOfficialPrices,
  validateOfficialPrices,
} from "../src/services/officialFuelService";
import {
  refreshFuelPrices,
  saveFuelPrices,
} from "../src/services/fuelPriceService";
let values;
const now = "2026-10-13T12:00:00.000Z";
const feed = {
  version: 1,
  source: "PSO",
  sourceUrl: "https://psopk.com/fuel-prices/pol/archives",
  petrol: 395.37,
  diesel: 396.85,
  effectiveDate: "2026-10-13",
  checkedAt: now,
};
beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(Date, "now").mockReturnValue(Date.parse(now));
  values = new Map();
  getStoredItem.mockImplementation(async (key) => values.get(key) ?? null);
  setStoredItem.mockImplementation(async (key, value) => {
    values.set(key, value);
  });
});
afterEach(() => {
  jest.restoreAllMocks();
});
test("wrong sources, invalid prices and future dates are never accepted", () => {
  expect(validateOfficialPrices(feed)).toEqual(feed);
  for (const changes of [
    { petrol: 0 },
    { source: "Unknown" },
    { effectiveDate: "2026-10-14" },
    { checkedAt: "2027-01-01" },
  ])
    expect(() => validateOfficialPrices({ ...feed, ...changes })).toThrow();
});
test("cached verified prices remain usable offline", async () => {
  values.set(
    "FUEL_TRIP_PK_OFFICIAL_PRICES",
    JSON.stringify({ ...feed, fetchedAt: "2026-10-12T00:00:00Z" }),
  );
  fetchJson.mockRejectedValue(new Error("offline"));
  expect(await getOfficialPrices()).toEqual(
    expect.objectContaining({ petrol: 395.37, offline: true }),
  );
});
test("late automatic update cannot overwrite a newer manual override", async () => {
  let resolve;
  fetchJson.mockReturnValue(
    new Promise((done) => {
      resolve = done;
    }),
  );
  const automatic = refreshFuelPrices();
  for (let tick = 0; tick < 100 && !fetchJson.mock.calls.length; tick++)
    await Promise.resolve();
  expect(fetchJson).toHaveBeenCalledTimes(1);
  await saveFuelPrices({ petrol: 350, diesel: 360 });
  resolve(feed);
  expect(await automatic).toEqual(
    expect.objectContaining({ mode: "manual", petrol: 350 }),
  );
});
