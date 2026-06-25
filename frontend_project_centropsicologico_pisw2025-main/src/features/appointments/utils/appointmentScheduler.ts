import type { WorkSchedule } from "@/shared/interfaces/models/WorkSchedule";

export type Shift = "morning" | "afternoon";

export interface TimeSlot {
  startHour: number;
  endHour: number;
  label: string;
}

export interface CalendarDay {
  date: Date;
  day: number;
  key: string;
  weekdayIndex: number;
}

export interface NormalizedWorkSchedule {
  weekdayIndex: number;
  officeId: string;
  officeName: string;
  startHour: number;
  endHour: number;
}

const weekdayToIndex: Record<string, number> = {
  MONDAY: 0,
  TUESDAY: 1,
  WEDNESDAY: 2,
  THURSDAY: 3,
  FRIDAY: 4,
  SATURDAY: 5,
  SUNDAY: 6,
};

export const weekDayNames = [
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
  "Domingo",
];

export const shiftSlots: Record<Shift, TimeSlot[]> = {
  morning: createTimeSlots(7, 14),
  afternoon: createTimeSlots(14, 21),
};

export const allHourOptions = Array.from({ length: 15 }, (_, index) => index + 7);

export function createTimeSlots(startHour: number, endHour: number) {
  return Array.from({ length: endHour - startHour }, (_, index) => {
    const hour = startHour + index;
    return {
      startHour: hour,
      endHour: hour + 1,
      label: `${formatHour(hour)} - ${formatHour(hour + 1)}`,
    };
  });
}

export function formatHour(hour: number) {
  const normalizedHour = hour % 24;
  const suffix = normalizedHour >= 12 ? "PM" : "AM";
  const displayHour = normalizedHour % 12 || 12;
  return `${displayHour} ${suffix}`;
}

export function formatSlotRange(startHour: number, endHour: number) {
  return `${formatHour(startHour)} - ${formatHour(endHour)}`;
}

export function formatTimeInput(hour: number) {
  return `${hour.toString().padStart(2, "0")}:00`;
}

export function createId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function padDatePart(value: number) {
  return value.toString().padStart(2, "0");
}

export function getDateKey(date: Date) {
  return `${date.getFullYear()}-${padDatePart(date.getMonth() + 1)}-${padDatePart(date.getDate())}`;
}

export function parseDateInput(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function getWeekdayIndex(date: Date) {
  return (date.getDay() + 6) % 7;
}

export function getMonthLabel(date: Date) {
  const label = date.toLocaleDateString("es-ES", {
    month: "long",
    year: "numeric",
  });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function getLongDateLabel(date: Date) {
  return date.toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function generateMonthWeeks(baseDate: Date) {
  const year = baseDate.getFullYear();
  const month = baseDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const leadingEmptyCells = getWeekdayIndex(firstDay);
  const cells: Array<CalendarDay | null> = [];

  for (let index = 0; index < leadingEmptyCells; index += 1) {
    cells.push(null);
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = new Date(year, month, day);
    cells.push({
      date,
      day,
      key: getDateKey(date),
      weekdayIndex: getWeekdayIndex(date),
    });
  }

  while (cells.length % 7 !== 0) {
    cells.push(null);
  }

  const weeks: Array<Array<CalendarDay | null>> = [];
  for (let index = 0; index < cells.length; index += 7) {
    weeks.push(cells.slice(index, index + 7));
  }

  return weeks;
}

export function getSlotKey(dateKey: string, startHour: number) {
  return `${dateKey}-${startHour}`;
}

function extractHour(value?: string) {
  if (!value) return 0;
  const time = value.includes("T") ? value.split("T")[1] : value;
  return Number(time.slice(0, 2));
}

export function normalizeWorkSchedule(workSchedule?: WorkSchedule[]) {
  return (workSchedule ?? [])
    .map((schedule) => {
      const officeId = schedule.officeId ?? schedule.office?.id ?? "";

      return {
        weekdayIndex: weekdayToIndex[schedule.day],
        officeId,
        officeName: schedule.office?.name ?? "Pendiente",
        startHour: extractHour(schedule.startTime),
        endHour: extractHour(schedule.endTime),
      };
    })
    .filter((schedule) => Number.isFinite(schedule.weekdayIndex) && schedule.officeId);
}

export function getWorkScheduleForWeekday(
  schedules: NormalizedWorkSchedule[],
  weekdayIndex: number
) {
  return schedules.find((schedule) => schedule.weekdayIndex === weekdayIndex);
}

export function isSlotInsideWorkSchedule(slot: TimeSlot, schedule?: NormalizedWorkSchedule) {
  return Boolean(schedule && slot.startHour >= schedule.startHour && slot.endHour <= schedule.endHour);
}

export function getDatesBetween(startDate: Date, endDate: Date) {
  if (endDate < startDate) return [];

  const dates: Date[] = [];
  const currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    dates.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return dates;
}

export function createLocalIso(dateKey: string, hour: number) {
  return new Date(`${dateKey}T${formatTimeInput(hour)}`).toISOString();
}
