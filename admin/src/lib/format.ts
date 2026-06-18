export function formatCurrency(value: number) {
  return `${value.toLocaleString("uz-UZ")} UZS`;
}

export function formatDateTime(value: string | Date) {
  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleString("uz-UZ", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}
