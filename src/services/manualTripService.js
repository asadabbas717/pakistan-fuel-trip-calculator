import { calculateFuelCost } from "./calculatorService";
import { positiveNumber } from "../utils/validation";

function placeName(value, fallback) {
  const name = typeof value === "string" ? value.trim() : "";
  if (name.length > 200)
    throw new Error("Place names must be at most 200 characters.");
  return name || fallback;
}

// Manual estimates contain no invented coordinates or travel-time claims.
export function createManualTrip({
  distanceKm,
  startName,
  destinationName,
  fuelType,
  fuelPrice,
  averageKmPerLiter,
  isReturnTrip = false,
}) {
  if (!["petrol", "diesel"].includes(fuelType))
    throw new Error("Choose a valid fuel type.");
  const distance = positiveNumber(distanceKm, "One-way distance");
  const price = positiveNumber(fuelPrice, "Fuel price");
  const average = positiveNumber(averageKmPerLiter, "Vehicle average");
  return {
    start: { name: placeName(startName, "Starting point") },
    destination: { name: placeName(destinationName, "Destination") },
    fuelType,
    fuelPrice: price,
    averageKmPerLiter: average,
    isReturnTrip,
    result: calculateFuelCost({
      distanceKm: distance,
      averageKmPerLiter: average,
      fuelPricePerLiter: price,
      isReturnTrip,
    }),
    route: {
      source: "manual",
      distanceKm: distance,
      durationMinutes: null,
      coordinates: [],
    },
  };
}
