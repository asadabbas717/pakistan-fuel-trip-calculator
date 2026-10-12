import { positiveNumber } from "../utils/validation";
export function calculateFuelCost({
  distanceKm,
  averageKmPerLiter,
  fuelPricePerLiter,
  isReturnTrip = false,
}) {
  const distance = positiveNumber(distanceKm, "Distance");
  const average = positiveNumber(averageKmPerLiter, "Vehicle average");
  const price = positiveNumber(fuelPricePerLiter, "Fuel price");
  if (typeof isReturnTrip !== "boolean")
    throw new Error("Return trip must be a boolean.");
  const finalDistance = isReturnTrip ? distance * 2 : distance;
  const fuelNeeded = finalDistance / average;
  const totalCost = fuelNeeded * price;
  if (![finalDistance, fuelNeeded, totalCost].every(Number.isFinite))
    throw new Error("Estimate exceeds supported numeric range.");
  return {
    distanceKm: Number(finalDistance.toFixed(2)),
    fuelNeeded: Number(fuelNeeded.toFixed(2)),
    totalCost: Number(totalCost.toFixed(2)),
  };
}
