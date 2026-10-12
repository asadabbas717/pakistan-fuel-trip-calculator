jest.mock("react-native", () => ({ Platform: { OS: "web" } }));
jest.mock("expo-document-picker", () => ({ getDocumentAsync: jest.fn() }));
jest.mock("expo-sharing", () => ({
  isAvailableAsync: jest.fn(async () => true),
  shareAsync: jest.fn(),
}));
jest.mock("expo-file-system/legacy", () => ({
  cacheDirectory: "file:///cache/",
  getInfoAsync: jest.fn(),
  readAsStringAsync: jest.fn(),
  deleteAsync: jest.fn(),
  makeDirectoryAsync: jest.fn(),
  copyAsync: jest.fn(),
  writeAsStringAsync: jest.fn(),
  readDirectoryAsync: jest.fn(async () => []),
}));
import { Platform } from "react-native";
import { getDocumentAsync } from "expo-document-picker";
import {
  readAsStringAsync,
  deleteAsync,
  getInfoAsync,
  copyAsync,
  writeAsStringAsync,
} from "expo-file-system/legacy";
import { shareAsync } from "expo-sharing";
import {
  importBackupFile,
  exportBackupFile,
} from "../src/services/fileTransfer";
beforeEach(() => {
  jest.clearAllMocks();
  Platform.OS = "web";
  getInfoAsync.mockResolvedValue({ exists: true, size: 2, isDirectory: false });
  readAsStringAsync.mockResolvedValue("{}");
  deleteAsync.mockResolvedValue();
  copyAsync.mockImplementation(async ({ from }) => {
    if (from.startsWith("file:///host/cache/DocumentPicker"))
      throw new Error("outside scope");
  });
});
test("cancelled file selection is harmless", async () => {
  getDocumentAsync.mockResolvedValue({ canceled: true });
  expect(await importBackupFile()).toBeNull();
  expect(readAsStringAsync).not.toHaveBeenCalled();
});
test("web reads the selected File rather than fetching a private URI", async () => {
  getDocumentAsync.mockResolvedValue({
    canceled: false,
    assets: [
      { name: "backup.json", size: 2, file: { text: async () => "{}" } },
    ],
  });
  expect(await importBackupFile()).toEqual({ name: "backup.json", text: "{}" });
});
test("oversized native files reject without reading or deleting the original document", async () => {
  Platform.OS = "android";
  getDocumentAsync.mockResolvedValue({
    canceled: false,
    assets: [{ name: "backup.json", uri: "content://original" }],
  });
  getInfoAsync.mockResolvedValue({ exists: true, size: 2_000_001 });
  await expect(importBackupFile()).rejects.toThrow("2 MB");
  expect(readAsStringAsync).not.toHaveBeenCalled();
  expect(
    deleteAsync.mock.calls.every(([uri]) =>
      uri.startsWith("file:///cache/fueltrip-imports/"),
    ),
  ).toBe(true);
});
test("Drive content URI is copied into the project scope before reading", async () => {
  Platform.OS = "android";
  getDocumentAsync.mockResolvedValue({
    canceled: false,
    assets: [
      {
        name: "drive-backup.json",
        uri: "content://com.google.android.apps.docs/document/backup",
        size: 2,
      },
    ],
  });
  const result = await importBackupFile();
  expect(result).toEqual({ name: "drive-backup.json", text: "{}" });
  expect(getDocumentAsync).toHaveBeenCalledWith(
    expect.objectContaining({ copyToCacheDirectory: false }),
  );
  const owned = copyAsync.mock.calls[0][0].to;
  expect(owned).toMatch(/^file:\/\/\/cache\/fueltrip-imports\//);
  expect(readAsStringAsync).toHaveBeenCalledWith(owned);
  expect(deleteAsync).toHaveBeenCalledWith(owned, { idempotent: true });
});
test("import success and original read errors are not masked by cleanup failures", async () => {
  Platform.OS = "android";
  getDocumentAsync.mockResolvedValue({
    canceled: false,
    assets: [{ name: "backup.json", uri: "content://original", size: 2 }],
  });
  deleteAsync.mockRejectedValue(new Error("cleanup denied"));
  expect(await importBackupFile()).toEqual({ name: "backup.json", text: "{}" });
  readAsStringAsync.mockRejectedValueOnce(new Error("read failed"));
  await expect(importBackupFile()).rejects.toThrow("read failed");
});
test("backup export writes and shares directly in the owned cache", async () => {
  Platform.OS = "android";
  await exportBackupFile("{}");
  expect(writeAsStringAsync).toHaveBeenCalledWith(
    expect.stringContaining("file:///cache/fueltrip-exports/"),
    "{}",
    { encoding: "utf8" },
  );
  expect(shareAsync).toHaveBeenCalled();
  expect(copyAsync).not.toHaveBeenCalled();
});
