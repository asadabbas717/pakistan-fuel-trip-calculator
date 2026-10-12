const test = require("node:test");
const assert = require("node:assert/strict");
const { parseOfficialPrices } = require("../scripts/fuel-price-parser.cjs");
const now = new Date("2026-10-13T12:00:00Z");
function table(date, petrol = "395.37", diesel = "396.85") {
  return `Effective From: ${date}<table><tr><td>PREMIER EURO 5</td><td>Rs.${petrol}/Ltr</td></tr><tr><td>HI-CETANE DIESEL EURO 5</td><td>Rs.${diesel}/Ltr</td></tr></table>`;
}
test("extracts the latest currently effective table without mixing historical rows", () => {
  const value = parseOfficialPrices(
    table("October 10, 2026", "398.3", "396.24") +
      table("October 14, 2026", "410", "420") +
      table("October 13, 2026"),
    now,
  );
  assert.equal(value.petrol, 395.37);
  assert.equal(value.diesel, 396.85);
  assert.equal(value.effectiveDate, "2026-10-13");
});
test("rejects missing, ambiguous, stale and invalid price publications", () => {
  for (const html of [
    "maintenance",
    table("October 13, 2026", "0"),
    table("August 1, 2026"),
    table("October 32, 2026"),
    table("October 13, 2026").replace(
      "HI-CETANE DIESEL EURO 5",
      "changed label",
    ),
  ])
    assert.throws(() => parseOfficialPrices(html, now));
});
