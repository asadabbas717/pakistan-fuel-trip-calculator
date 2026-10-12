import { fetchJson } from "./httpClient";
import { getStoredItem, setStoredItem } from "../storage/appStorage";
import { serviceUrl } from "../utils/serviceUrl";
import { enqueueCollection } from "../storage/collectionQueue";
const KEY = "FUEL_TRIP_PK_OFFICIAL_PRICES";
const URL = serviceUrl(
  process.env.EXPO_PUBLIC_FUEL_PRICES_URL,
  "https://raw.githubusercontent.com/asadabbas717/pakistan-fuel-trip-calculator/master/data/fuel-prices.json",
);
export function validateOfficialPrices(value, now = Date.now()) {
  const today = new Date(now + 5 * 3600000).toISOString().slice(0, 10);
  if (
    value?.version !== 1 ||
    value.source !== "PSO" ||
    value.sourceUrl !== "https://psopk.com/fuel-prices/pol/archives" ||
    ![value.petrol, value.diesel].every(
      (n) => Number.isFinite(n) && n >= 20 && n <= 5000,
    ) ||
    !/^\d{4}-\d{2}-\d{2}$/.test(value.effectiveDate) ||
    !Number.isFinite(Date.parse(value.effectiveDate)) ||
    new Date(value.effectiveDate).toISOString().slice(0, 10) !==
      value.effectiveDate ||
    value.effectiveDate > today ||
    !Number.isFinite(Date.parse(value.checkedAt)) ||
    Date.parse(value.checkedAt) > now + 300000
  )
    throw new Error(
      "The official price feed is invalid; saved prices were kept.",
    );
  return value;
}
let pending;
export async function getOfficialPrices({ force = false } = {}) {
  const raw = await getStoredItem(KEY);
  const cached = raw ? validateOfficialPrices(JSON.parse(raw)) : null;
  if (
    !force &&
    cached &&
    Date.now() - Date.parse(cached.fetchedAt) < 6 * 3600000
  )
    return cached;
  if (!pending) {
    pending = fetchJson(URL, {}, 8000)
      .then((value) => {
        const prices = {
          ...validateOfficialPrices(value),
          fetchedAt: new Date().toISOString(),
        };
        return enqueueCollection(async () => {
          await setStoredItem(KEY, JSON.stringify(prices));
          return prices;
        });
      })
      .finally(() => {
        pending = null;
      });
  }
  try {
    return await pending;
  } catch (error) {
    if (!force && cached) return { ...cached, offline: true };
    throw error;
  }
}
export function officialPriceLabel(prices) {
  const checked = Date.parse(prices.checkedAt);
  const old = !Number.isFinite(checked) || Date.now() - checked > 2 * 86400000;
  return `PSO · effective ${prices.effectiveDate} · checked ${new Date(checked).toLocaleDateString()}${old ? " · update is overdue" : ""}${prices.offline ? " · offline cache" : ""}`;
}
