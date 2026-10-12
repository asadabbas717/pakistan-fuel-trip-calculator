export async function fetchJson(url, options = {}, timeoutMs = 15000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    if (!response.ok)
      throw new Error(
        "Location service unavailable (HTTP " +
          response.status +
          "). Please try again.",
      );
    return await response.json();
  } catch (error) {
    if (controller.signal.aborted)
      throw new Error("Location request timed out. Please try again.");
    throw error;
  } finally {
    clearTimeout(timer);
  }
}
