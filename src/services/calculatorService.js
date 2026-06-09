export function calculateFuelCost({
  distanceKm,
  averageKmPerLiter,
  fuelPricePerLiter,
  isReturnTrip = false,
}) {
  const distance = Number(distanceKm);
  const average = Number(averageKmPerLiter);
  const price = Number(fuelPricePerLiter);

  if (!distance || distance <= 0) {
    throw new Error("Distance must be greater than 0.");
  }

  if (!average || average <= 0) {
    throw new Error("Vehicle average must be greater than 0.");
  }

  if (!price || price <= 0) {
    throw new Error("Fuel price must be greater than 0.");
  }

  const finalDistance = isReturnTrip ? distance * 2 : distance;
  const fuelNeeded = finalDistance / average;
  const totalCost = fuelNeeded * price;

  return {
    distanceKm: Number(finalDistance.toFixed(2)),
    fuelNeeded: Number(fuelNeeded.toFixed(2)),
    totalCost: Number(totalCost.toFixed(2)),
  };
}