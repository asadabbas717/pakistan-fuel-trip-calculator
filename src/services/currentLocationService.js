import { Platform } from "react-native";
import * as Location from "expo-location";
import { fetchJson } from "./httpClient";
import { validLocation } from "../utils/validation";
async function boundedAddressLookup(coordinates) {
  let timer;
  try {
    return await Promise.race([
      Location.reverseGeocodeAsync(coordinates),
      new Promise((_resolve, reject) => {
        timer = setTimeout(
          () => reject(new Error("Address lookup timed out.")),
          8000,
        );
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
}

export function addressName(address) {
  return [
    ...new Set(
      [
        address?.district,
        address?.street,
        address?.city,
        address?.region,
      ].filter((value) => typeof value === "string" && value.trim()),
    ),
  ]
    .join(", ")
    .slice(0, 200);
}
export async function resolveCurrentLocation(position) {
  const place = {
    id: "current-location",
    lat: position.coords.latitude,
    lon: position.coords.longitude,
    name: "GPS location — address unavailable",
  };
  if (!validLocation(place))
    throw new Error("The device returned an invalid location.");
  if (Number.isFinite(position.coords.accuracy))
    place.accuracyMeters = Math.round(position.coords.accuracy);
  try {
    let name;
    if (Platform.OS === "web") {
      const response = await fetchJson(
        `https://photon.komoot.io/reverse?lat=${place.lat}&lon=${place.lon}&limit=1&lang=en`,
        {},
        8000,
      );
      const p = response.features?.[0]?.properties;
      name = addressName({
        district: p?.name,
        street: p?.street,
        city: p?.city,
        region: p?.state,
      });
    } else {
      // The already-granted foreground permission also covers native reverse geocoding.
      const addresses = await boundedAddressLookup({
        latitude: place.lat,
        longitude: place.lon,
      });
      name = addressName(addresses[0]);
    }
    if (name) place.name = name;
  } catch {
    /* GPS remains useful without an address service. */
  }
  return place;
}
