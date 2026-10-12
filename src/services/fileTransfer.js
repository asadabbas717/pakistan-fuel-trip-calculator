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
export async function cleanupOwnedFile(uri) {
  if (
    typeof uri !== "string" ||
    !FileSystem.cacheDirectory ||
    !uri.startsWith(FileSystem.cacheDirectory)
  )
    return;
  try {
    await FileSystem.deleteAsync(uri, { idempotent: true });
  } catch {
    /* Cleanup must not replace a successful result or the original error. */
  }
}
async function exportPath(extension) {
  if (!["json", "pdf", "png"].includes(extension))
    throw new Error("Unsupported export format.");
  if (!FileSystem.cacheDirectory)
    throw new Error("Export storage is unavailable.");
  const directory = FileSystem.cacheDirectory + "fueltrip-exports/";
  await FileSystem.makeDirectoryAsync(directory, { intermediates: true });
  const now = Date.now();
  try {
    for (const name of await FileSystem.readDirectoryAsync(directory)) {
      const match = /^fueltrip-(\d+)-[a-z0-9]+\.(json|pdf|png)$/.exec(name);
      if (match && now - Number(match[1]) > 7 * 86400000)
        await cleanupOwnedFile(directory + name);
    }
  } catch {
    /* Pruning old exports is optional. */
  }
  return (
    directory +
    `fueltrip-${now}-${Math.random().toString(36).slice(2)}.${extension}`
  );
}
async function shareOwnedExport(target, options) {
  await Sharing.shareAsync(target, options);
  // A receiving Android app can read the URI after the chooser returns.
  // Keep successful exports in the private cache; prune them on later exports.
}
export async function shareExportFile(uri, extension, options) {
  const target = await exportPath(extension);
  try {
    await FileSystem.copyAsync({ from: uri, to: target });
    await shareOwnedExport(target, options);
  } catch (error) {
    await cleanupOwnedFile(target);
    throw error;
  }
}
export async function shareExportData(
  content,
  extension,
  options,
  encoding = "utf8",
) {
  if (typeof content !== "string" || !content)
    throw new Error("The export is empty.");
  const target = await exportPath(extension);
  try {
    await FileSystem.writeAsStringAsync(target, content, { encoding });
    await shareOwnedExport(target, options);
  } catch (error) {
    await cleanupOwnedFile(target);
    throw error;
  }
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
  await shareExportData(text, "json", {
    mimeType: "application/json",
    dialogTitle: "Save your FuelTrip backup",
    UTI: "public.json",
  });
}
export async function importBackupFile() {
  const result = await DocumentPicker.getDocumentAsync({
    type: ["application/json", "text/plain", "application/octet-stream"],
    copyToCacheDirectory: Platform.OS !== "android",
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
    if (!FileSystem.cacheDirectory)
      throw new Error("Import storage is unavailable.");
    const directory = FileSystem.cacheDirectory + "fueltrip-imports/";
    await FileSystem.makeDirectoryAsync(directory, { intermediates: true });
    const ownedUri =
      directory +
      `backup-${Date.now()}-${Math.random().toString(36).slice(2)}.json`;
    try {
      // Android keeps the provider's content URI, avoiding Expo Go's host-cache scope.
      // copyAsync supports content URIs; text reads only use our own scoped file.
      await FileSystem.copyAsync({ from: asset.uri, to: ownedUri });
      const info = await FileSystem.getInfoAsync(ownedUri);
      if (!info.exists || info.isDirectory)
        throw new Error("The selected backup could not be read.");
      if (info.size > 2_000_000)
        throw new Error("Backup exceeds the 2 MB size limit.");
      text = await FileSystem.readAsStringAsync(ownedUri);
    } finally {
      await cleanupOwnedFile(ownedUri);
    }
  }
  if (text.length > 2_000_000) throw new Error("Backup is too large.");
  return { name: asset.name, text };
}
