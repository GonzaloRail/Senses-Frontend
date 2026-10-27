interface ScheduleOfficeRecord {
  officeId?: string | null;
  office?: { id?: string; name?: string } | null;
}

export interface ScheduleOfficeOption {
  value: string;
  label: string;
}

export function resolveScheduleOfficeId(schedule: ScheduleOfficeRecord): string {
  return schedule.officeId || schedule.office?.id || "";
}

export function getAssignedOfficeOptions(schedules: ScheduleOfficeRecord[]): ScheduleOfficeOption[] {
  const options = new Map<string, ScheduleOfficeOption>();
  for (const schedule of schedules) {
    const id = resolveScheduleOfficeId(schedule);
    if (id) options.set(id, { value: id, label: schedule.office?.name || "Consultorio asignado" });
  }
  return [...options.values()];
}

export function mergeScheduleOfficeOptions(
  saved: ScheduleOfficeOption[],
  searched: ScheduleOfficeOption[]
): ScheduleOfficeOption[] {
  const options = new Map(saved.map((option) => [option.value, option]));
  for (const option of searched) options.set(option.value, option);
  return [...options.values()];
}
