import { Platform } from "react-native";
import { captureRef } from "react-native-view-shot";
import * as Sharing from "expo-sharing";
import * as FileSystem from "expo-file-system/legacy";
import { tripDetails } from "./tripExportService";
import { formatPKR } from "../utils/formatters";
import { downloadBlob, shareExportFile } from "./fileTransfer";

function webImage(trip) {
  const canvas = globalThis.document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 2600;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Image export is unavailable in this browser.");
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, 1080, 2600);
  ctx.fillStyle = "#e2f3ec";
  ctx.fillRect(60, 60, 960, 360);
  ctx.fillStyle = "#14634b";
  ctx.font = "bold 24px Arial";
  ctx.fillText("FUELTRIP PK · JOURNEY ESTIMATE", 100, 125);
  ctx.fillStyle = "#202c35";
  ctx.font = "bold 64px Arial";
  ctx.fillText("Ready for the road.", 100, 225);
  ctx.fillStyle = "#14634b";
  ctx.font = "bold 72px Arial";
  ctx.fillText(formatPKR(trip.result.totalCost), 100, 340);
  let y = 500;
  for (const [label, value] of tripDetails(trip)) {
    ctx.font = "28px Arial";
    ctx.fillStyle = "#5c6b74";
    ctx.fillText(label.toUpperCase(), 80, y);
    y += 46;
    ctx.font = "bold 34px Arial";
    ctx.fillStyle = "#202c35";
    let line = "";
    for (const word of String(value).split(/\s+/)) {
      // Split overlong tokens as well as ordinary words, avoiding clipped addresses.
      for (const character of word + " ") {
        if (ctx.measureText(line + character).width > 920) {
          ctx.fillText(line, 80, y);
          y += 44;
          line = "";
        }
        line += character;
      }
    }
    ctx.fillText(line.trim(), 80, y);
    y += 66;
  }
  ctx.font = "24px Arial";
  ctx.fillStyle = "#5c6b74";
  ctx.fillText("Fuel estimate only · excludes tolls and parking.", 80, y);
  const output = globalThis.document.createElement("canvas");
  output.width = 1080;
  output.height = y + 100;
  output.getContext("2d").drawImage(canvas, 0, 0);
  return new Promise((resolve, reject) =>
    output.toBlob(
      (blob) =>
        blob ? resolve(blob) : reject(new Error("Unable to create image.")),
      "image/png",
    ),
  );
}
export async function shareTripImage(trip, ref) {
  if (Platform.OS === "web") {
    downloadBlob(await webImage(trip), "fueltrip-estimate.png");
    return;
  }
  if (!(await Sharing.isAvailableAsync()))
    throw new Error("File sharing is unavailable.");
  const uri = await captureRef(ref, {
    format: "png",
    quality: 1,
    result: "tmpfile",
    width: 1080,
  });
  try {
    await shareExportFile(uri, "png", {
      mimeType: "image/png",
      UTI: "public.png",
      dialogTitle: "Share your journey",
    });
  } finally {
    await FileSystem.deleteAsync(uri, { idempotent: true });
  }
}
