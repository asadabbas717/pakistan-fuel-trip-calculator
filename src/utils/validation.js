export function positiveNumber(value, label) {
  if (
    (typeof value !== "number" && typeof value !== "string") ||
    String(value).trim() === ""
  )
    throw new Error(label + " must be a finite number greater than 0.");
  const number = Number(value);
  if (!Number.isFinite(number) || number <= 0)
    throw new Error(label + " must be a finite number greater than 0.");
  return number;
}
export function validLocation(location) {
  return (
    !!location &&
    typeof location.name === "string" &&
    location.name.trim().length > 0 &&
    Number.isFinite(location.lat) &&
    Math.abs(location.lat) <= 90 &&
    Number.isFinite(location.lon) &&
    Math.abs(location.lon) <= 180
  );
}
export function validCoordinates(coordinates) {
  return (
    Array.isArray(coordinates) &&
    coordinates.length >= 2 &&
    coordinates.every(
      (point) =>
        Array.isArray(point) &&
        point.length === 2 &&
        Number.isFinite(point[0]) &&
        Math.abs(point[0]) <= 90 &&
        Number.isFinite(point[1]) &&
        Math.abs(point[1]) <= 180,
    )
  );
}
