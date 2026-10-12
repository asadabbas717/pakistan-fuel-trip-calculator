import { directionsUrl } from "../src/services/directionsService";
const start = { name: "GPS location", lat: 24.8, lon: 67 };
const destination = { name: "Hyderabad", lat: 25.4, lon: 68.3 };
test("navigation preserves both selected coordinates before and after swap", () => {
  const forward = new URL(directionsUrl({ start, destination, route: {} }));
  const reversed = new URL(
    directionsUrl({ start: destination, destination: start, route: {} }),
  );
  expect(forward.searchParams.get("origin")).toBe("24.8,67");
  expect(forward.searchParams.get("destination")).toBe("25.4,68.3");
  expect(reversed.searchParams.get("origin")).toBe("25.4,68.3");
  expect(reversed.searchParams.get("destination")).toBe("24.8,67");
});
test("manual addresses are encoded and unnamed endpoints do not open a misleading route", () => {
  const trip = {
    start: { name: "کراچی & Saddar" },
    destination: { name: "Hyderabad" },
    route: { source: "manual" },
  };
  const url = new URL(directionsUrl(trip));
  expect(url.searchParams.get("origin")).toBe("کراچی & Saddar");
  expect(() =>
    directionsUrl({ ...trip, start: { name: "Starting point" } }),
  ).toThrow("both place names");
  expect(() =>
    directionsUrl({ start: { ...start, lat: 999 }, destination, route: {} }),
  ).toThrow("coordinates");
});
