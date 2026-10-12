import { Platform } from "react-native";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import * as DocumentPicker from "expo-document-picker";

export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = globalThis.document.createElement("a");
  link.href = url;
  link.download = filename;
  globalThis.document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export async function shareExportFile(uri, extension, options) {
  if (!FileSystem.cacheDirectory)
    throw new Error("Export storage is unavailable.");
  const directory = FileSystem.cacheDirectory + "fueltrip-exports/";
  await FileSystem.makeDirectoryAsync(directory, { intermediates: true });
  const now = Date.now();
  for (const name of await FileSystem.readDirectoryAsync(directory)) {
    const match = /^fueltrip-(\d+)-[a-z0-9]+\.(json|pdf|png)$/.exec(name);
    if (match && now - Number(match[1]) > 7 * 86400000)
      await FileSystem.deleteAsync(directory + name, { idempotent: true });
  }
  const target =
    directory +
    `fueltrip-${now}-${Math.random().toString(36).slice(2)}.${extension}`;
  await FileSystem.copyAsync({ from: uri, to: target });
  try {
    await Sharing.shareAsync(target, options);
  } catch (error) {
    await FileSystem.deleteAsync(target, { idempotent: true });
    throw error;
  }
  // A receiving Android app can read the URI after the chooser returns.
  // Keep successful exports in the private cache; prune them on later exports.
}
export async function exportBackupFile(text) {
  const filename = `fueltrip-backup-${new Date().toISOString().slice(0, 10)}.json`;
  if (Platform.OS === "web") {
    downloadBlob(
      new globalThis.Blob([text], { type: "application/json" }),
      filename,
    );
    return;
  }
  if (!(await Sharing.isAvailableAsync()))
    throw new Error("File sharing is unavailable on this device.");
  const uri = FileSystem.cacheDirectory + filename;
  await FileSystem.writeAsStringAsync(uri, text);
  try {
    await shareExportFile(uri, "json", {
      mimeType: "application/json",
      dialogTitle: "Save your FuelTrip backup",
      UTI: "public.json",
    });
  } finally {
    await FileSystem.deleteAsync(uri, { idempotent: true });
  }
}
export async function importBackupFile() {
  const result = await DocumentPicker.getDocumentAsync({
    type: ["application/json", "text/plain", "application/octet-stream"],
    copyToCacheDirectory: true,
    multiple: false,
  });
  if (result.canceled) return null;
  const asset = result.assets[0];
  if (!asset || typeof asset.name !== "string")
    throw new Error("No readable backup file was selected.");
  if (asset.size > 2_000_000)
    throw new Error("Backup exceeds the 2 MB size limit.");
  let text;
  if (Platform.OS === "web") {
    if (!asset.file)
      throw new Error("The browser did not provide a readable file.");
    text = await asset.file.text();
  } else {
    try {
      const info = await FileSystem.getInfoAsync(asset.uri);
      if (info.size > 2_000_000)
        throw new Error("Backup exceeds the 2 MB size limit.");
      text = await FileSystem.readAsStringAsync(asset.uri);
    } finally {
      if (
        FileSystem.cacheDirectory &&
        asset.uri.startsWith(FileSystem.cacheDirectory)
      )
        await FileSystem.deleteAsync(asset.uri, { idempotent: true });
    }
  }
  if (text.length > 2_000_000) throw new Error("Backup is too large.");
  return { name: asset.name, text };
}
