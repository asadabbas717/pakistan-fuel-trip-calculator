import { fetchJson } from "../src/services/httpClient";
import { getRoute } from "../src/services/routingService";
const start = { name: "A", lat: 24, lon: 67 },
  destination = { name: "B", lat: 25, lon: 68 };
beforeEach(() => {
  global.fetch = jest.fn();
});
afterEach(() => {
  jest.useRealTimers();
});
test("route sorts by full distance and converts longitude-first geometry", async () => {
  fetch.mockResolvedValue({
    ok: true,
    json: async () => ({
      code: "Ok",
      routes: [1001, 1000].map((distance) => ({
        distance,
        duration: 120,
        geometry: {
          coordinates: [
            [67, 24],
            [68, 25],
          ],
        },
      })),
    }),
  });
  const result = await getRoute({ start, destination });
  expect(result.bestRoute.distanceKm).toBe(1);
  expect(result.bestRoute.coordinates).toEqual([
    [24, 67],
    [25, 68],
  ]);
});
test("invalid coordinates never enter a URL", async () => {
  await expect(
    getRoute({ start: { ...start, lat: "0];alert(1)" }, destination }),
  ).rejects.toThrow();
  expect(fetch).not.toHaveBeenCalled();
});
test.each([
  { code: "NoRoute" },
  { code: "Ok", routes: [{ distance: Infinity }] },
])("rejects malformed upstream route %p", async (data) => {
  fetch.mockResolvedValue({ ok: true, json: async () => data });
  await expect(getRoute({ start, destination })).rejects.toThrow();
});
test("HTTP errors surface", async () => {
  fetch.mockResolvedValue({ ok: false, status: 429 });
  await expect(fetchJson("https://example.test")).rejects.toThrow("429");
});
test("hung requests abort and clear their timer", async () => {
  jest.useFakeTimers();
  fetch.mockImplementation(
    (_url, { signal }) =>
      new Promise((_resolve, reject) =>
        signal.addEventListener("abort", () => reject(new Error("aborted"))),
      ),
  );
  const result = expect(
    fetchJson("https://example.test", {}, 100),
  ).rejects.toThrow("timed out");
  await jest.advanceTimersByTimeAsync(100);
  await result;
  expect(jest.getTimerCount()).toBe(0);
});
test("editing a location aborts its HTTP request and clears timeout and listener", async () => {
  jest.useFakeTimers();
  const controller = new AbortController();
  const remove = jest.spyOn(controller.signal, "removeEventListener");
  fetch.mockImplementation(
    (_url, { signal }) =>
      new Promise((_resolve, reject) => {
        signal.addEventListener("abort", () => reject(new Error("aborted")));
      }),
  );
  const result = expect(
    fetchJson("https://example.test", { signal: controller.signal }),
  ).rejects.toThrow("cancelled");
  controller.abort();
  await result;
  expect(jest.getTimerCount()).toBe(0);
  expect(remove).toHaveBeenCalledWith("abort", expect.any(Function));
});
