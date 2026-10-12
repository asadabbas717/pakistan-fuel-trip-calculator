const SOURCE_URL = "https://psopk.com/fuel-prices/pol/archives";
const months = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
function parseOfficialPrices(html, now = new Date()) {
  if (typeof html !== "string" || html.length > 5_000_000)
    throw new Error("Invalid PSO document.");
  const sections = [
    ...html.matchAll(
      /Effective From:\s*([A-Za-z]+)\s+(\d{1,2}),\s*(\d{4})([\s\S]*?)(?=Effective From:|$)/g,
    ),
  ];
  const today = new Date(now.getTime() + 5 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);
  const records = sections
    .map(([, month, day, year, section]) => {
      const index = months.indexOf(month);
      if (index < 0) throw new Error("Unrecognized effective month.");
      const effectiveDate = `${year}-${String(index + 1).padStart(2, "0")}-${day.padStart(2, "0")}`;
      if (new Date(effectiveDate).toISOString().slice(0, 10) !== effectiveDate)
        throw new Error("Invalid effective date.");
      const rows = [...section.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)].map(
        ([, row]) =>
          row
            .replace(/<[^>]+>/g, " ")
            .replace(/&nbsp;/g, " ")
            .replace(/\s+/g, " ")
            .trim(),
      );
      function price(label) {
        const matches = rows
          .filter((row) => row.startsWith(label + " "))
          .map((row) => row.match(/Rs\.\s*([\d,]+(?:\.\d+)?)\s*\/Ltr/i));
        if (matches.length !== 1 || !matches[0])
          throw new Error("Expected one " + label + " price.");
        const value = Number(matches[0][1].replace(/,/g, ""));
        if (!Number.isFinite(value) || value < 20 || value > 5000)
          throw new Error("Invalid price range.");
        return value;
      }
      return {
        effectiveDate,
        petrol: price("PREMIER EURO 5"),
        diesel: price("HI-CETANE DIESEL EURO 5"),
      };
    })
    .filter((record) => record.effectiveDate <= today)
    .sort((a, b) => b.effectiveDate.localeCompare(a.effectiveDate));
  if (!records.length)
    throw new Error("No currently effective PSO prices found.");
  if (new Date(today) - new Date(records[0].effectiveDate) > 45 * 86400000)
    throw new Error("Published prices are unexpectedly old.");
  return {
    version: 1,
    source: "PSO",
    sourceUrl: SOURCE_URL,
    ...records[0],
    checkedAt: now.toISOString(),
  };
}
module.exports = { parseOfficialPrices, SOURCE_URL };
