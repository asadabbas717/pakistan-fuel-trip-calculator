import { searchPlace } from "../src/services/geocodingService";
beforeEach(() => {
  global.fetch = jest.fn();
});
afterEach(() => {
  jest.useRealTimers();
});
test("explicit place search validates input and caches equivalent repeated queries", async () => {
  await expect(searchPlace("ab")).rejects.toThrow();
  expect(fetch).not.toHaveBeenCalled();
  fetch.mockResolvedValue({
    ok: true,
    json: async () => [
      { place_id: 1, display_name: "Karachi", lat: "24.8", lon: "67" },
    ],
  });
  expect(await searchPlace("Karachi unique")).toEqual([
    { id: "1", name: "Karachi", lat: 24.8, lon: 67 },
  ]);
  await searchPlace(" KARACHI UNIQUE ");
  expect(fetch).toHaveBeenCalledTimes(1);
});
test("searches are serialized and invalid upstream coordinates reject", async () => {
  jest.useFakeTimers();
  fetch.mockResolvedValue({
    ok: true,
    json: async () => [
      { place_id: 2, display_name: "Bad", lat: "999", lon: "67" },
    ],
  });
  const result = expect(searchPlace("invalid unique")).rejects.toThrow(
    "coordinates",
  );
  await jest.advanceTimersByTimeAsync(1200);
  await result;
});
