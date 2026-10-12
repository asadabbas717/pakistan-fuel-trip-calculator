export function serviceUrl(value, fallback) {
  const url = new URL(value || fallback);
  if (
    url.protocol !== "https:" ||
    url.username ||
    url.password ||
    url.search ||
    url.hash
  )
    throw new Error(
      "Service endpoint must be an HTTPS URL without credentials, query or fragment.",
    );
  return url.toString().replace(/\/$/, "");
}
