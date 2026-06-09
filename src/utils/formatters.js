export function formatPKR(value) {
  const amount = Number(value || 0);

  return `Rs. ${amount.toLocaleString("en-PK", {
    maximumFractionDigits: 2,
  })}`;
}

export function formatKm(value) {
  return `${Number(value || 0).toFixed(2)} km`;
}

export function formatLiters(value) {
  return `${Number(value || 0).toFixed(2)} L`;
}