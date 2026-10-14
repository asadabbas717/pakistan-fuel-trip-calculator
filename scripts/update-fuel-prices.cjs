const fs = require("node:fs/promises");
const { parseOfficialPrices, SOURCE_URL } = require("./fuel-price-parser.cjs");
async function main() {
  const response = await fetch(SOURCE_URL, {
    signal: globalThis.AbortSignal.timeout(20000),
    headers: {
      "User-Agent": "SafarWise-price-checker/1.0",
      Accept: "text/html",
    },
  });
  if (!response.ok || response.url !== SOURCE_URL)
    throw new Error("PSO source unavailable or redirected unexpectedly.");
  const prices = parseOfficialPrices(await response.text());
  await fs.mkdir("data", { recursive: true });
  await fs.writeFile(
    "data/fuel-prices.json.tmp",
    JSON.stringify(prices, null, 2) + "\n",
  );
  await fs.rename("data/fuel-prices.json.tmp", "data/fuel-prices.json");
  process.stdout.write(
    `Verified PSO prices effective ${prices.effectiveDate}\n`,
  );
}
main().catch((error) => {
  process.stderr.write(error.message + "\n");
  process.exitCode = 1;
});
