import { searchPlace } from "../src/services/geocodingService";
beforeEach(() => {
  global.fetch = jest.fn();
});
afterEach(() => {
  jest.useRealTimers();
});
test("automatic place search validates input and caches equivalent repeated queries", async () => {
  await expect(searchPlace("ab")).rejects.toThrow();
  expect(fetch).not.toHaveBeenCalled();
  fetch.mockResolvedValue({
    ok: true,
    json: async () => ({
      features: [
        {
          properties: {
            osm_type: "N",
            osm_id: 1,
            name: "Karachi",
            countrycode: "PK",
          },
          geometry: { type: "Point", coordinates: [67, 24.8] },
        },
      ],
    }),
  });
  expect(await searchPlace("Karachi unique")).toEqual([
    { id: "N1", name: "Karachi", lat: 24.8, lon: 67 },
  ]);
  await searchPlace(" KARACHI UNIQUE ");
  expect(fetch).toHaveBeenCalledTimes(1);
  expect(fetch.mock.calls[0][0]).toContain("countrycode=PK");
  expect(fetch.mock.calls[0][0]).toContain("photon.komoot.io");
});
test("searches are serialized and invalid upstream coordinates reject", async () => {
  jest.useFakeTimers();
  fetch.mockResolvedValue({
    ok: true,
    json: async () => ({
      features: [
        {
          properties: {
            osm_type: "N",
            osm_id: 2,
            name: "Bad",
            countrycode: "PK",
          },
          geometry: { type: "Point", coordinates: [67, 999] },
        },
      ],
    }),
  });
  const result = expect(searchPlace("invalid unique")).rejects.toThrow(
    "coordinates",
  );
  await jest.advanceTimersByTimeAsync(1200);
  await result;
});
