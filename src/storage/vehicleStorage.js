import { DEFAULT_VEHICLES } from "../utils/constants";
import {
  getStoredItem,
  setStoredItem,
} from "./appStorage";

const VEHICLE_KEY = "FUEL_TRIP_PK_VEHICLES";

export async function getVehicles() {
  try {
    const saved = await getStoredItem(VEHICLE_KEY);

    if (!saved) {
      await setStoredItem(VEHICLE_KEY, JSON.stringify(DEFAULT_VEHICLES));
      return DEFAULT_VEHICLES;
    }

    const parsedVehicles = JSON.parse(saved);

    if (!Array.isArray(parsedVehicles)) {
      await setStoredItem(VEHICLE_KEY, JSON.stringify(DEFAULT_VEHICLES));
      return DEFAULT_VEHICLES;
    }

    return parsedVehicles;
  } catch (error) {
    console.log("Vehicle loading error:", error);
    return DEFAULT_VEHICLES;
  }
}

export async function saveVehicle(vehicle) {
  try {
    const vehicles = await getVehicles();

    const newVehicle = {
      id: Date.now().toString(),
      name: vehicle.name,
      averageKmPerLiter: Number(vehicle.averageKmPerLiter),
    };

    const updatedVehicles = [newVehicle, ...vehicles];

    await setStoredItem(VEHICLE_KEY, JSON.stringify(updatedVehicles));

    return updatedVehicles;
  } catch (error) {
    console.log("Vehicle saving error:", error);
    return DEFAULT_VEHICLES;
  }
}

export async function deleteVehicle(vehicleId) {
  try {
    const vehicles = await getVehicles();

    const updatedVehicles = vehicles.filter((item) => item.id !== vehicleId);

    await setStoredItem(VEHICLE_KEY, JSON.stringify(updatedVehicles));

    return updatedVehicles;
  } catch (error) {
    console.log("Vehicle delete error:", error);
    return DEFAULT_VEHICLES;
  }
}