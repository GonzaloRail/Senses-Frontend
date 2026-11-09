import { useFieldArray, useFormContext } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { staffDays, type UserFormSchema } from "@/shared/interfaces/forms/UserFormSchema";
import { defaultsToAttendance, hasStaffAttendanceSchedule } from "../utils/userAttendance";

const labels = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
export function UserAttendanceSettings({ readOnly, creating, roles }: {
  readOnly: boolean; creating: boolean; roles: string[];
}) {
  const { control, register, watch, setValue, formState: { errors } } = useFormContext<UserFormSchema>();
  const { fields, append, remove } = useFieldArray({ control, name: "staffSchedule" });
  const required = watch("attendanceRequired");
  return (
    <section className="space-y-4 rounded-lg border p-4">
      <h2 className="font-semibold">Asistencia</h2>
      <Label>
        <input type="checkbox" role="switch" disabled={readOnly}
          checked={required ?? (creating && defaultsToAttendance(roles))}
          onChange={(event) => setValue("attendanceRequired", event.target.checked, { shouldDirty: true })}
        />
        Registra asistencia
      </Label>
      {readOnly && required === undefined && <p className="text-sm text-muted-foreground">Sin información de asistencia.</p>}
      {hasStaffAttendanceSchedule(roles) && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold">Horario de asistencia</h3>
          {fields.length === 0 && <p className="text-sm text-muted-foreground">Sin bloques de horario asignados.</p>}
          {fields.map((field, index) => (
            <div key={field.id} className="space-y-2">
              <div className="grid items-end gap-2 sm:grid-cols-[1fr_1fr_1fr_auto]">
                <Label className="flex-col items-start">Día
                  <select disabled={readOnly} className="h-9 w-full rounded-md border bg-background px-2" {...register(`staffSchedule.${index}.day`)}>
                    {staffDays.map((day, dayIndex) => <option key={day} value={day}>{labels[dayIndex]}</option>)}
                  </select>
                </Label>
                <Label className="flex-col items-start">Entrada
                  <Input type="time" step={1} readOnly={readOnly} {...register(`staffSchedule.${index}.startTime`)} />
                </Label>
                <Label className="flex-col items-start">Salida
                  <Input type="time" step={1} readOnly={readOnly} {...register(`staffSchedule.${index}.endTime`)} />
                </Label>
                {!readOnly && <Button type="button" variant="outline" onClick={() => remove(index)}>Quitar</Button>}
              </div>
              {(errors.staffSchedule?.[index]?.startTime || errors.staffSchedule?.[index]?.endTime) && (
                <p role="alert" className="text-sm text-destructive">{errors.staffSchedule[index]?.startTime?.message ?? errors.staffSchedule[index]?.endTime?.message}</p>
              )}
            </div>
          ))}
          {!readOnly && <Button type="button" variant="outline" onClick={() => append({ day: "MONDAY", startTime: "08:00", endTime: "17:00" })}>Agregar bloque</Button>}
        </div>
      )}
    </section>
  );
}
