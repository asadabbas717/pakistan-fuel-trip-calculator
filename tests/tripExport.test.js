jest.mock("react-native", () => ({
  Platform: { OS: "android" },
  Share: { share: jest.fn() },
}));
jest.mock("expo-print", () => ({
  printToFileAsync: jest.fn(async () => ({
    uri: "file:///host/cache/Print/trip.pdf",
    base64: "JVBERi0xLjc=",
  })),
}));
jest.mock("expo-sharing", () => ({
  isAvailableAsync: jest.fn(async () => true),
  shareAsync: jest.fn(),
}));
jest.mock("expo-file-system/legacy", () => ({
  cacheDirectory: "file:///cache/",
  deleteAsync: jest.fn(),
  makeDirectoryAsync: jest.fn(),
  readDirectoryAsync: jest.fn(async () => []),
  copyAsync: jest.fn(),
  writeAsStringAsync: jest.fn(),
}));
jest.mock("expo-document-picker", () => ({}));
import { tripHtml, exportTripPdf } from "../src/services/tripExportService";
import { shareAsync } from "expo-sharing";
import {
  deleteAsync,
  writeAsStringAsync,
  copyAsync,
} from "expo-file-system/legacy";
import { printToFileAsync } from "expo-print";
import { Platform } from "react-native";
import { createManualTrip } from "../src/services/manualTripService";
const trip = createManualTrip({
  distanceKm: "100",
  startName: '<script>alert("x")</script>',
  destinationName: "کراچی",
  fuelType: "petrol",
  fuelPrice: 300,
  averageKmPerLiter: 10,
  isReturnTrip: true,
});
test("PDF template escapes user labels and contains actual trip assumptions", () => {
  const html = tripHtml(trip);
  expect(html).not.toContain("<script>alert");
  expect(html).toContain("&lt;script&gt;");
  expect(html).toContain("کراچی");
  expect(html).toContain("Return trip");
  expect(html).toContain("200.00 km");
});
beforeEach(() => {
  jest.clearAllMocks();
  Platform.OS = "android";
  deleteAsync.mockResolvedValue();
});
test("PDF bytes are written in the project scope without reading or deleting Print's host file", async () => {
  deleteAsync.mockImplementation(async (uri) => {
    if (uri.startsWith("file:///host/")) throw new Error("not deletable");
  });
  await exportTripPdf(trip);
  expect(printToFileAsync).toHaveBeenCalledWith(
    expect.objectContaining({ base64: true }),
  );
  expect(writeAsStringAsync).toHaveBeenCalledWith(
    expect.stringContaining("file:///cache/fueltrip-exports/"),
    "JVBERi0xLjc=",
    { encoding: "base64" },
  );
  expect(copyAsync).not.toHaveBeenCalled();
  expect(deleteAsync).not.toHaveBeenCalled();
  expect(shareAsync).toHaveBeenCalledWith(
    expect.stringContaining("fueltrip-exports/"),
    expect.objectContaining({ mimeType: "application/pdf" }),
  );
});
test("share errors survive cleanup permission failures", async () => {
  shareAsync.mockRejectedValueOnce(new Error("share failed"));
  deleteAsync.mockRejectedValueOnce(new Error("not deletable"));
  await expect(exportTripPdf(trip)).rejects.toThrow("share failed");
  expect(
    deleteAsync.mock.calls.every(([uri]) => uri.startsWith("file:///cache/")),
  ).toBe(true);
});
test("web opens and prints a complete document without calling native export", async () => {
  Platform.OS = "web";
  const preview = {
    document: { write: jest.fn(), close: jest.fn() },
    focus: jest.fn(),
    print: jest.fn(),
  };
  global.window = { open: jest.fn(() => preview) };
  await exportTripPdf(trip);
  expect(preview.document.write).toHaveBeenCalledWith(
    expect.stringContaining("FuelTrip PK estimate"),
  );
  expect(preview.document.close).toHaveBeenCalled();
  expect(preview.print).toHaveBeenCalled();
  Platform.OS = "android";
  delete global.window;
});
