export const limaMonth = () => new Intl.DateTimeFormat("sv-SE", {
  year: "numeric", month: "2-digit", timeZone: "America/Lima",
}).format();

const time = new Intl.DateTimeFormat("es-PE", {
  hour: "2-digit", minute: "2-digit", hourCycle: "h23", timeZone: "America/Lima",
});
export const attendanceTime = (iso: string | null) => iso ? time.format(new Date(iso)) : "—";
export const workedTime = (minutes: number) => `${Math.floor(minutes / 60)} h ${minutes % 60} min`;
