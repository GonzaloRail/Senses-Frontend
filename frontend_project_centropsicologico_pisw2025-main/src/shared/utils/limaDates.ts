export function limaDate(value: string | Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Lima", year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(new Date(value));
  const part = (type: string) => parts.find((item) => item.type === type)!.value;
  return `${part("year")}-${part("month")}-${part("day")}`;
}

export const startOfLimaDayIso = (date: string) =>
  new Date(`${date}T00:00:00-05:00`).toISOString();

export function dayAfterLimaIso(date: string) {
  const nextDay = new Date(startOfLimaDayIso(date));
  nextDay.setUTCDate(nextDay.getUTCDate() + 1);
  return nextDay.toISOString();
}

export function getLimaMonthRange(value = new Date()) {
  const [year, month] = limaDate(value).split("-").map(Number);
  const prefix = `${year}-${String(month).padStart(2, "0")}`;
  return { from: `${prefix}-01`, to: `${prefix}-${new Date(Date.UTC(year, month, 0)).getUTCDate()}` };
}
