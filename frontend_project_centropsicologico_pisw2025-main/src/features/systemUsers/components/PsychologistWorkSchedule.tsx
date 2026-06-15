import { Controller } from "react-hook-form";
import type {
  UseFieldArrayReturn,
  Control,
  FieldErrors,
  UseFormRegister,
} from "react-hook-form";
import { type UserFormSchema } from "@/shared/interfaces/forms/UserFormSchema";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SearchableSelect } from "@/shared/components/SearchableSelect";
import { useOfficesSearchQuery } from "@/features/offices/hooks/useOfficesQueries";

const days = [
  { id: "MONDAY", label: "Lunes" },
  { id: "TUESDAY", label: "Martes" },
  { id: "WEDNESDAY", label: "Miércoles" },
  { id: "THURSDAY", label: "Jueves" },
  { id: "FRIDAY", label: "Viernes" },
  { id: "SATURDAY", label: "Sábado" },
  { id: "SUNDAY", label: "Domingo" },
];

const getDayIndex = (id: string) => days.findIndex((d) => d.id === id);

interface UserWorkScheduleProps {
  control: Control<UserFormSchema>;
  register: UseFormRegister<UserFormSchema>;
  errors: FieldErrors<UserFormSchema>;
  fields: UseFieldArrayReturn<UserFormSchema, "workSchedule", "id">["fields"];
  isViewMode: boolean;
  selectedDays: string[];
  handleSelectionChange: (newDays: string[]) => void;
}

export const UserWorkSchedule = ({
  control,
  register,
  errors,
  fields,
  isViewMode,
  selectedDays,
  handleSelectionChange,
}: UserWorkScheduleProps) => {
  const officesSearch = useOfficesSearchQuery();

  return (
    <div className="flax flex-col">
      <p className="font-semibold text-lg lg:text-2xl">
        Días laborables y horarios
      </p>
      <div>
        <fieldset disabled={isViewMode}>
          <ToggleGroup
            type="multiple"
            className="grid grid-cols-4 grid-rows-2 lg:flex gap-2 justify-between rounded-md bg-white my-5 w-full"
            value={selectedDays}
            onValueChange={!isViewMode ? handleSelectionChange : () => {}}
          >
            {days.map((day) => (
              <ToggleGroupItem
                key={day.id}
                className="rounded-md data-[state=on]:bg-senses-primary data-[state=on]:text-white shadow-md lg:p-4"
                value={day.id}
              >
                {day.label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </fieldset>
        {errors.workSchedule && (
          <p className="font-light text-sm text-red-500">
            {errors.workSchedule?.root?.message || errors.workSchedule?.message}
          </p>
        )}
      </div>
      {fields
        .slice()
        .sort((a, b) => getDayIndex(a.day) - getDayIndex(b.day))
        .map((sortedField) => {
          const day = days.find((d) => d.id === sortedField.day);
          if (!day) return null;

          const originalIndex = fields.findIndex(
            (f) => f.id === sortedField.id
          );
          const officeOptions = officesSearch.offices.map((item) => ({
            value: item.id,
            label: item.name,
          }));

          return (
            <Card
              key={sortedField.id}
              className="animate-in fade-in-0 duration-300 my-2"
            >
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>
                  Horario para {day.label} (formato 24:00 h)
                </CardTitle>
                {!isViewMode && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      const newDays = selectedDays.filter(
                        (d) => d !== sortedField.day
                      );
                      handleSelectionChange(newDays);
                    }}
                  >
                    Eliminar
                  </Button>
                )}
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium">Desde</label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        placeholder="00"
                        min="0"
                        max="23"
                        className="w-full"
                        readOnly={isViewMode}
                        {...register(`workSchedule.${originalIndex}.fromHour`)}
                      />
                      {/* <span>:</span>
                      <Input
                        type="number"
                        placeholder="00"
                        min="0"
                        max="59"
                        className="w-full"
                        readOnly={isViewMode}
                        {...register(
                          `workSchedule.${originalIndex}.fromMinute`
                        )}
                      /> */}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium">Hasta</label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        placeholder="00"
                        min="0"
                        max="23"
                        className="w-full"
                        readOnly={isViewMode}
                        {...register(`workSchedule.${originalIndex}.toHour`)}
                      />
                      {/* <span>:</span>
                      <Input
                        type="number"
                        placeholder="00"
                        min="0"
                        max="59"
                        className="w-full"
                        readOnly={isViewMode}
                        {...register(`workSchedule.${originalIndex}.toMinute`)}
                      /> */}
                    </div>
                  </div>
                </div>
                {errors.workSchedule &&
                  (errors.workSchedule[originalIndex]?.fromHour ||
                    errors.workSchedule[originalIndex]?.toHour) && (
                    <p className="font-light text-sm text-red-500">
                      {errors.workSchedule[originalIndex]?.fromHour?.message ||
                        errors.workSchedule[originalIndex]?.toHour?.message}
                    </p>
                  )}
                <div>
                  <label className="text-sm font-medium">Consultorio</label>
                  <Controller
                    control={control}
                    name={`workSchedule.${originalIndex}.officeId`}
                    render={({ field, fieldState }) => (
                      <SearchableSelect
                        readOnly={isViewMode}
                        options={officeOptions}
                        value={field.value || undefined}
                        onValueChange={field.onChange}
                        placeholder="Seleccionar consultorio"
                        onSearch={officesSearch.setNameQuery}
                        error={fieldState.error?.message}
                      />
                    )}
                  />
                </div>
              </CardContent>
            </Card>
          );
        })}
    </div>
  );
};
