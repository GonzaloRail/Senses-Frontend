import type { UseFormReturn } from "react-hook-form";
import { Edit, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SearchableSelect } from "@/shared/components/SearchableSelect";
import { SiteHeader } from "@/shared/components/SiteHeader";
import { InputWithHelper } from "@/features/systemUsers/components/InputWithHelper";
import type { UserMinimal } from "@/shared/interfaces/models";
import { TextareaWithHelper } from "@/shared/components/TextareaWithHelper";
import type { EmployeeLeaveFormSchema } from "@/shared/interfaces/forms/EmployeeLeaveFormSchema";

export type FormMode = "view" | "edit" | "create";

export interface BaseFormProps {
  mode: FormMode;
  form: UseFormReturn<EmployeeLeaveFormSchema>;
  onSave: () => void;
  onCancel: () => void;
  onEdit?: () => void;
  onDisable?: () => void;
  loading: boolean;

  // Search handlers
  onUsersSearch: (query: string) => void;

  // Search options
  usersOptions: UserMinimal[];

  // Loading states for searches
  usersSearchLoading?: boolean;

  // Status
  isActive?: boolean;
}

export const EmployeeLeaveBaseForm = ({
  mode,
  form,
  onSave,
  onCancel,
  onEdit,
  onDisable,
  loading,
  onUsersSearch,
  usersOptions,
  usersSearchLoading = false,
  isActive,
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
        return "Crear nuevo permiso";
      case "edit":
        return "Editar permiso";
      default:
        return "Detalle de permiso";
    }
  };

  return (
    <div className="h-screen flex flex-col">
      <SiteHeader title={getTitle()} />

      <form onSubmit={handleSubmit(onSave)} className="flex-1 flex flex-col">
        <div className="flex flex-col p-2 gap-5 flex-1">
          <div className="flex flex-col p-2 md:p-6 items-center gap-4">
            {/* Búsqueda de Psicólogo */}
            <SearchableSelect
              id="psychologistId"
              label="Psicólogo"
              placeholder="Buscar psicólogo..."
              value={watch("userId")}
              onValueChange={(value) => setValue("userId", value)}
              onSearch={onUsersSearch}
              options={usersOptions.map(({ dni, firstName, id, lastName }) => ({
                value: id,
                label: `${firstName} ${lastName} - DNI: ${dni}`,
              }))}
              loading={usersSearchLoading}
              readOnly={isViewMode || mode === "edit"}
              helper="Busque y seleccione el psicólogo"
              error={errors.userId?.message}
            />

            {/* Fechas de inicio y fin */}
            <div className="grid gap-2 my-2 w-full max-w-md md:grid-cols-2">
              <InputWithHelper
                id="startDate"
                label="Fecha de inicio"
                type="date"
                value={watch("startDate")}
                readOnly={isViewMode}
                helper="Fecha de inicio del permiso"
                {...register("startDate")}
                errors={errors.startDate}
                onChange={(e) => {
                  setValue("startDate", e.target.value);
                }}
              />

              <InputWithHelper
                id="endDate"
                label="Fecha de finalización"
                type="date"
                value={watch("endDate")}
                readOnly={isViewMode}
                helper="Fecha de fin del permiso"
                {...register("endDate")}
                errors={errors.endDate}
                onChange={(e) => {
                  setValue("endDate", e.target.value);
                }}
              />
            </div>

            {/* Motivo */}
            <TextareaWithHelper
              id="reason"
              label="Motivo"
              value={watch("reason")}
              placeholder="Ingrese el motivo (opcional)..."
              readOnly={isViewMode}
              helper="Ingrese el motivo del permiso"
              errors={errors.reason}
              rows={4}
              {...register("reason")}
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

                {onDisable && isActive && (
                  <Button
                    variant={"destructive"}
                    onClick={onDisable}
                    className="flex items-center gap-2"
                    disabled={loading}
                    type="button"
                  >
                    Cancelar permiso
                  </Button>
                )}

                {onEdit && isActive && (
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
                  {mode === "create" ? "Crear permiso" : "Guardar cambios"}
                </Button>
              </>
            )}
          </div>
        </div>
      </form>
    </div>
  );
};
