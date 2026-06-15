import type { UseFormReturn } from "react-hook-form";
import { Edit, Save, X, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SearchableSelect } from "@/shared/components/SearchableSelect";
import { SiteHeader } from "@/shared/components/SiteHeader";
import type { AppointmentFormSchema } from "@/shared/interfaces/forms/AppointmentFormSchema";
import { InputWithHelper } from "@/features/systemUsers/components/InputWithHelper";
import type {
  AppointmentStatus,
  UserMinimal,
} from "@/shared/interfaces/models";
import { TextareaWithHelper } from "@/shared/components/TextareaWithHelper";
import RadioGroupWithHelper from "@/shared/components/RadioGroupWithHelper";

export type FormMode = "view" | "edit" | "create";
export interface BaseFormProps {
  mode: FormMode;
  form: UseFormReturn<AppointmentFormSchema>;
  onSave: () => void;
  onCancel: () => void;
  onEdit?: () => void;
  onDisable?: () => void;
  loading: boolean;

  // Search handlers
  onPatientSearch: (query: string) => void;
  onPsychologistSearch: (query: string) => void;
  onOfficeSearch: (query: string) => void;

  // Date/Time handlers for psychologist search
  onPsychologistDateChange?: (date: string) => void;
  onPsychologistStartTimeChange?: (time: string) => void;
  onPsychologistEndTimeChange?: (time: string) => void;

  // Search options
  patientOptions: Array<{ id: string; name: string; dni?: string }>;
  psychologistOptions: UserMinimal[];
  officeOptions: Array<{ id: string; name: string; location?: string }>;
  assignedOffice?: { id: string; name: string; location?: string } | null;

  // Loading states for searches
  patientSearchLoading?: boolean;
  psychologistSearchLoading?: boolean;
  officeSearchLoading?: boolean;
  appointmentStatus?: AppointmentStatus;
}

export const AppointmentBaseForm = ({
  mode,
  form,
  onSave,
  onCancel,
  onEdit,
  onDisable,
  loading,
  onPatientSearch,
  onPsychologistSearch,
  onOfficeSearch,
  onPsychologistDateChange,
  onPsychologistStartTimeChange,
  onPsychologistEndTimeChange,
  patientOptions,
  psychologistOptions,
  officeOptions,
  assignedOffice,
  patientSearchLoading = false,
  psychologistSearchLoading = false,
  officeSearchLoading = false,
  appointmentStatus,
}: BaseFormProps) => {
  const {
    handleSubmit,
    watch,
    register,
    setValue,
    formState: { errors },
  } = form;

  const isViewMode = mode === "view";

  const getTitle = () => {
    switch (mode) {
      case "create":
        return "Crear nueva cita";
      case "edit":
        return "Editar cita";
      default:
        return "Detalle de cita";
    }
  };

  return (
    <div className="h-screen flex flex-col">
      <SiteHeader title={getTitle()} />

      <form onSubmit={handleSubmit(onSave)} className="flex-1 flex flex-col">
        <div className="flex flex-col p-2 gap-5 flex-1">
          <div className="flex flex-col p-2 md:p-6 items-center gap-4">
            {/* Búsqueda de Paciente */}
            <SearchableSelect
              id="patientId"
              label="Paciente"
              placeholder="Buscar paciente por DNI..."
              value={watch("patientId")}
              onValueChange={(value) => setValue("patientId", value)}
              onSearch={onPatientSearch}
              options={patientOptions.map((patient) => ({
                value: patient.id,
                label: patient.dni
                  ? `${patient.name} - ${patient.dni}`
                  : patient.name,
              }))}
              loading={patientSearchLoading}
              readOnly={isViewMode || mode === "edit"}
              helper="Busque y seleccione el paciente para la cita"
              error={errors.patientId?.message}
            />

            {/* Búsqueda de Psicólogo */}
            <SearchableSelect
              id="psychologistId"
              label="Psicólogo a cargo"
              placeholder="Buscar psicólogo..."
              value={watch("psychologistId")}
              onValueChange={(value) => setValue("psychologistId", value)}
              onSearch={onPsychologistSearch}
              options={psychologistOptions.map(
                ({ dni, firstName, id, lastName }) => ({
                  value: id,
                  label: `${firstName} ${lastName} - DNI: ${dni}`,
                })
              )}
              loading={psychologistSearchLoading}
              readOnly={isViewMode}
              helper="Busque y seleccione el psicólogo para la cita"
              error={errors.psychologistId?.message}
            />
            {/* Ver horario de psicólogo - Button */}
            <Button
              type="button"
              variant="outline"
              className="w-full max-w-md flex items-center gap-2"
              onClick={() => {
                window.open(
                  `/schedules/psychologist/${watch("psychologistId")}`,
                  "_blank"
                );
              }}
              disabled={!watch("psychologistId")}
            >
              <Calendar className="h-4 w-4" />
              Ver horario de psicólogo
            </Button>

            {/* Fecha */}
            <InputWithHelper
              id="date"
              label="Fecha"
              type="date"
              value={watch("date")}
              readOnly={isViewMode}
              helper="Seleccione la fecha de la cita"
              {...register("date")}
              errors={errors.date}
              onChange={(e) => {
                setValue("date", e.target.value);
                onPsychologistDateChange?.(e.target.value);
              }}
            />

            {/* Hora de inicio y fin */}
            <div className="grid gap-2 my-2 w-full max-w-md md:grid-cols-2">
              <InputWithHelper
                id="startTime"
                label="Hora de inicio"
                type="time"
                value={watch("startTime")}
                readOnly={isViewMode}
                helper="Hora de inicio"
                {...register("startTime")}
                errors={errors.startTime}
                onChange={(e) => {
                  setValue("startTime", e.target.value);
                  if (e.target.value && !watch("endTime")) {
                    const start = new Date(`2000-01-01T${e.target.value}`);
                    const end = new Date(start.getTime() + 60 * 60 * 1000);
                    const endTimeString = end.toTimeString().slice(0, 5);
                    setValue("endTime", endTimeString);
                    onPsychologistEndTimeChange?.(endTimeString);
                  }
                  onPsychologistStartTimeChange?.(e.target.value);
                }}
              />

              <InputWithHelper
                id="endTime"
                label="Hora de fin"
                type="time"
                value={watch("endTime")}
                readOnly={isViewMode}
                helper="Hora de fin"
                {...register("endTime")}
                errors={errors.endTime}
                onChange={(e) => {
                  setValue("endTime", e.target.value);
                  onPsychologistEndTimeChange?.(e.target.value);
                }}
              />
            </div>

            <InputWithHelper
              id="officeId"
              label="Consultorio"
              helper={!isViewMode ? "Consultorio se asigna automáticamente" : undefined}
              value={
                assignedOffice
                  ? `${assignedOffice.name}${
                      assignedOffice.location
                        ? " - " + assignedOffice.location
                        : ""
                    }`
                  : "No disponible"
              }
              // mantener officeId en el form aunque sea readonly
              {...{ register: undefined }}
              disabled={true}
              errors={errors.officeId}
            />

            {/* Motivo */}
            <TextareaWithHelper
              id="reason"
              label="Motivo"
              value={watch("reason")}
              placeholder="Ingrese el motivo..."
              readOnly={isViewMode}
              helper="Ingrese el motivo de la consulta"
              errors={errors.reason}
              rows={3}
              {...register("reason")}
            />

            {/* Tipo */}
            <RadioGroupWithHelper
              id="type"
              label="Tipo"
              options={[
                { id: "PARTICULAR", label: "Particular" },
                { id: "SOCIAL", label: "Caso Social/Convenio" },
              ]}
              direction="row"
              disabled={isViewMode}
              helper={!isViewMode ? "Seleccione el tipo de cita" : undefined}
              register={register("typeId")}
              value={watch("typeId")}
              onChange={(v: string) => setValue("typeId", v)}
              errors={errors.typeId}
            />

          </div>

          {/* Botones de acción */}
          <div className="flex flex-col p-2 gap-3 pt-4 border-t w-full md:flex-row md:justify-end mt-auto">
            {isViewMode && (
              <>
                <Button
                  variant="destructive"
                  onClick={onCancel}
                  className="flex items-center gap-2"
                  disabled={loading}
                  type="button"
                >
                  Volver
                </Button>

                {onDisable && appointmentStatus === "PENDING" && (
                  <Button
                    variant={"destructive"}
                    onClick={onDisable}
                    className="flex items-center gap-2"
                    disabled={loading}
                    type="button"
                  >
                    {"Cancelar cita"}
                  </Button>
                )}

                {onEdit && appointmentStatus === "PENDING" && (
                  <Button
                    onClick={onEdit}
                    className="flex items-center gap-2"
                    disabled={loading}
                    type="button"
                  >
                    <Edit className="h-4 w-4" />
                    Editar
                  </Button>
                )}
              </>
            )}

            {(mode === "edit" || mode === "create") && (
              <>
                <Button
                  variant="destructive"
                  onClick={onCancel}
                  className="flex items-center gap-2"
                  disabled={loading}
                  type="button"
                >
                  <X className="h-4 w-4" />
                  Cancelar
                </Button>
                <Button
                  className="flex items-center gap-2"
                  disabled={loading}
                  type="submit"
                >
                  <Save className="h-4 w-4" />
                  {mode === "create" ? "Crear cita" : "Guardar cambios"}
                </Button>
              </>
            )}
          </div>
        </div>
      </form>
    </div>
  );
};
