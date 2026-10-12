import { createManualTrip } from "../src/services/manualTripService";
import { validTrip } from "../src/storage/tripStorage";
jest.mock("../src/storage/appStorage", () => ({
  getStoredItem: jest.fn(),
  setStoredItem: jest.fn(),
  removeStoredItem: jest.fn(),
}));
const input = {
  distanceKm: "150",
  fuelType: "petrol",
  fuelPrice: 300,
  averageKmPerLiter: 10,
};
test("manual return estimate requires no coordinates and does not invent a travel time", () => {
  const trip = createManualTrip({
    ...input,
    isReturnTrip: true,
    startName: " Karachi ",
    destinationName: "Hyderabad",
  });
  expect(trip.result).toEqual({
    distanceKm: 300,
    fuelNeeded: 30,
    totalCost: 9000,
  });
  expect(trip.start).toEqual({ name: "Karachi" });
  expect(trip.route).toEqual({
    source: "manual",
    distanceKm: 150,
    durationMinutes: null,
    coordinates: [],
  });
  expect(validTrip(trip)).toBe(true);
  expect(
    validTrip({ ...trip, route: { ...trip.route, source: "unknown" } }),
  ).toBe(false);
  expect(
    validTrip({ ...trip, route: { ...trip.route, coordinates: [[1, 2]] } }),
  ).toBe(false);
});
test.each([0, -1, Infinity, "junk", ""])(
  "invalid manual distance rejects %p",
  (distanceKm) => {
    expect(() => createManualTrip({ ...input, distanceKm })).toThrow();
  },
);
test("optional labels have defaults and oversized names are rejected", () => {
  expect(validTrip(null)).toBe(false);
  expect(validTrip({})).toBe(false);
  expect(createManualTrip(input).start.name).toBe("Starting point");
  expect(() =>
    createManualTrip({ ...input, startName: "a".repeat(201) }),
  ).toThrow();
});
