export const hasStaffAttendanceSchedule = (roles: string[]) =>
  roles.some((role) => ["ADMISSION", "CASHIER", "HR"].includes(role));

export const defaultsToAttendance = (roles: string[]) =>
  !roles.includes("ADMIN") && (hasStaffAttendanceSchedule(roles) || roles.some((role) => ["PSYCHOLOGIST", "INTERNAL"].includes(role)));
