import { Platform, Share } from "react-native";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import * as FileSystem from "expo-file-system/legacy";
import { formatKm, formatLiters, formatPKR } from "../utils/formatters";
import { downloadBlob, shareExportFile } from "./fileTransfer";

export function escapeHtml(value) {
  return String(value).replace(
    /[&<>"']/g,
    (character) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        character
      ],
  );
}
export function tripDetails(trip) {
  const details = [
    ["From", trip.start.name],
    ["To", trip.destination.name],
    ["Distance", formatKm(trip.result.distanceKm)],
    ["Fuel needed", formatLiters(trip.result.fuelNeeded)],
    ["Fuel", trip.fuelType === "petrol" ? "Petrol" : "Diesel"],
    ["Price used", `${formatPKR(trip.fuelPrice)} / litre`],
    ["Vehicle average", `${trip.averageKmPerLiter} km/litre`],
    ["Trip", trip.isReturnTrip ? "Return trip" : "One way"],
    [
      "Distance source",
      trip.route.source === "manual"
        ? "Entered manually"
        : "Online routing estimate",
    ],
  ];
  if (typeof trip.priceLabel === "string")
    details.push(["Price source", trip.priceLabel.slice(0, 300)]);
  return details;
}
export function tripHtml(trip) {
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>FuelTrip PK estimate</title><style>@page{size:A4;margin:18mm}*{box-sizing:border-box}body{font-family:Arial,sans-serif;color:#202c35;margin:0;background:#fff}.hero{background:#e2f3ec;border-radius:24px;padding:32px}.brand{letter-spacing:3px;font-size:12px;color:#14634b}h1{font-size:32px;margin:18px 0}h2{font-size:38px;color:#14634b;margin:12px 0}.detail{padding:15px 0;border-bottom:1px solid #dce4e3;display:flex;justify-content:space-between;gap:24px}.value{text-align:right;max-width:70%;overflow-wrap:anywhere}.note{font-size:12px;color:#5c6b74;margin-top:24px;line-height:1.6}</style></head><body><div class="hero"><div class="brand">FUELTRIP PK · JOURNEY ESTIMATE</div><h1>Ready for the road.</h1><p>Estimated fuel budget</p><h2>${escapeHtml(formatPKR(trip.result.totalCost))}</h2></div>${tripDetails(
    trip,
  )
    .map(
      ([label, value]) =>
        `<div class="detail"><span>${escapeHtml(label)}</span><strong class="value">${escapeHtml(value)}</strong></div>`,
    )
    .join(
      "",
    )}<p class="note">Fuel estimate only. Tolls, parking and traffic are excluded. Return estimates double the outbound distance. Generated ${escapeHtml(new Date().toLocaleDateString())}.<br>Plan thoughtfully. Enjoy the journey.</p></body></html>`;
}
export async function shareTripText(trip) {
  const message = [
    "FuelTrip PK",
    ...tripDetails(trip).map(([label, value]) => `${label}: ${value}`),
    `Estimated fuel cost: ${formatPKR(trip.result.totalCost)}`,
    "Excludes tolls and parking.",
  ].join("\n");
  if (Platform.OS === "web" && !globalThis.navigator.share) {
    downloadBlob(
      new globalThis.Blob([message], { type: "text/plain" }),
      "fueltrip-estimate.txt",
    );
    return;
  }
  await Share.share({ message });
}
export async function exportTripPdf(trip) {
  const html = tripHtml(trip);
  if (Platform.OS === "web") {
    const preview = globalThis.window.open("", "_blank");
    if (!preview)
      throw new Error("Allow pop-ups to open the printable PDF preview.");
    preview.document.write(html);
    preview.document.close();
    preview.focus();
    preview.print();
    return;
  }
  if (!(await Sharing.isAvailableAsync()))
    throw new Error("File sharing is unavailable.");
  const { uri } = await Print.printToFileAsync({ html });
  try {
    await shareExportFile(uri, "pdf", {
      mimeType: "application/pdf",
      UTI: "com.adobe.pdf",
      dialogTitle: "Share trip PDF",
    });
  } finally {
    await FileSystem.deleteAsync(uri, { idempotent: true });
  }
}
