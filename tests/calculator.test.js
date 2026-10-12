import { calculateFuelCost } from "../src/services/calculatorService";
const input = {
  distanceKm: 100,
  averageKmPerLiter: 10,
  fuelPricePerLiter: 300,
};
test("one-way and return estimates preserve unrounded precision", () => {
  expect(calculateFuelCost(input)).toEqual({
    distanceKm: 100,
    fuelNeeded: 10,
    totalCost: 3000,
  });
  expect(calculateFuelCost({ ...input, isReturnTrip: true }).totalCost).toBe(
    6000,
  );
  expect(
    calculateFuelCost({ ...input, distanceKm: 1, averageKmPerLiter: 3 })
      .totalCost,
  ).toBe(100);
});
test.each([Infinity, -Infinity, NaN, 0, -1, "", "bad", null, true])(
  "rejects invalid domain input %p",
  (value) => {
    for (const field of Object.keys(input))
      expect(() => calculateFuelCost({ ...input, [field]: value })).toThrow();
  },
);
test("rejects overflow and nonboolean return flags", () => {
  expect(() =>
    calculateFuelCost({
      ...input,
      distanceKm: Number.MAX_VALUE,
      isReturnTrip: true,
    }),
  ).toThrow();
  expect(() =>
    calculateFuelCost({ ...input, isReturnTrip: "false" }),
  ).toThrow();
});
