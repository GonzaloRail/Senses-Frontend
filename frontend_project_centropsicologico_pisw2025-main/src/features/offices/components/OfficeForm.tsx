import { SiteHeader } from "@/shared/components/SiteHeader";
import { useEffect, useState } from "react";
import { Edit, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router";
import { InputWithHelper } from "../../systemUsers/components/InputWithHelper";
import type { ItemInstance, Office } from "@/shared/interfaces/models";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loading } from "@/shared/components/Loading";
import {
  officeFormSchema,
  type OfficeFormSchema,
} from "@/shared/interfaces/forms/OfficeFormSchema";
import { useCreateOffice, useUpdateOffice } from "../hooks/useOfficesMutations";
import { useLocationSearchQuery } from "@/features/locations/hooks";
import { SearchableSelect } from "@/shared/components/SearchableSelect";
import { AssignItemsModal } from "./AssignItemsModal";

export type FormMode = "view" | "edit" | "create";

type officeFormData = Partial<Office>;

type OfficeFormProps = {
  data?: officeFormData;
  officeId?: string;
};

export const OfficeForm = ({ data }: OfficeFormProps) => {
  const navigate = useNavigate();

  const methods = useForm<OfficeFormSchema>({
    resolver: zodResolver(officeFormSchema),
    defaultValues: {
      name: "",
      capacity: 0,
      locationId: "",
      type: "",
    },
  });

  const {
    handleSubmit,
    register,
    reset,
    getValues,
    setValue,
    watch,
    formState: { errors },
  } = methods;

  // Determinar el modo basado en la data enviada como prop
  const [mode, setMode] = useState<FormMode>(() => {
    if (!data) return "create";
    return "view";
  });

  const locationsSearch = useLocationSearchQuery();

  const isViewMode = mode === "view";
  useEffect(() => {

    if (data) {
      console.log(data);
      reset({
        name: data.name || "",
        capacity: data.capacity || 0,
        locationId: data.locationId || "",
        type: data.type || "No hay tipo",
        isActive: data.isActive ?? true,
      });
    }
  }, [mode, data, reset]);

  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const updateOffice = useUpdateOffice();
  const createOffice = useCreateOffice();
  const officeItems = data?.itemInstances?.reduce(
      (acc, instance) => {
        if (!instance.item?.id) return acc; // Ignorar instancias sin item

        // Verificar si ya existe un grupo para este item
        const existingGroup = acc.find(
          (group) => group.itemId === instance.item.id
        );

        if (existingGroup) {
          // Si existe, añadir la instancia al grupo existente
          existingGroup.instances.push(instance);
          existingGroup.quantity = existingGroup.instances.length;
        } else {
          // Si no existe, crear nuevo grupo
          acc.push({
            itemId: instance.item.id,
            quantity: 1,
            instances: [instance],
            name: instance.item.name || "Sin nombre",
          });
        }

        return acc;
      },
      [] as {
        itemId: string;
        quantity: number;
        instances: ItemInstance[];
        name: string;
      }[]
    ) || [];

  console.log("items:", officeItems);

  // Manejar el envío del formulario
  const handleSave = async () => {
    setLoading(true);
    console.log(getValues());
    try {
      if (mode === "create") {
        // Crear
        const officeToCreate: Partial<Office> = {
          name: getValues("name"),
          capacity: getValues("capacity") || 0,
          locationId: getValues("locationId"),
          type: getValues("type"),
        };
        console.log("llamada create");
        createOffice.mutate(officeToCreate, {
          onSuccess: () => {
            navigate("/offices");
          },
        });
      } else {
        // Actualizar
        const officeToUpdate: Partial<Office> = {
          name: getValues("name"),
          capacity: getValues("capacity") || 0,
          locationId: getValues("locationId"),
          type: getValues("type"),
        };
        updateOffice.mutate(
          { id: data?.id ?? "", officeToUpdate },
          {
            onSuccess: () => {
              navigate("/offices");
            },
          }
        );
      }
    } catch (error) {
      console.error("Error al guardar el consultorio:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (mode === "create") {
      navigate("/offices");
    } else {
      setMode("view");
    }
  };

  const handleEdit = () => {
    console.log();
    setMode("edit");
  };

  const handleDisable = async () => {
    if (confirm("¿Está seguro de que desea deshabilitar este consultorio?")) {
      try {
        console.log("Deshabilitando consultorio...");
        const officeToUpdate = {
          isActive: !data!.isActive,
        };
        updateOffice.mutate(
          { id: data?.id ?? "", officeToUpdate },
          {
            onSuccess: () => {
              navigate("/offices");
            },
          }
        );
      } catch (error) {
        console.error("Error al deshabilitar conusltorio:", error);
      }
    }
  };

  if (loading) {
    return <Loading message="Cargando información del consultorio..." />;
  }
  console.log("errors", errors);

  return (
    <div className="h-screen flex flex-col">
      <FormProvider {...methods}>
        <>
          {mode === "create" ? (
            <SiteHeader title="Crear nuevo consultorio" />
          ) : (
            <SiteHeader title="Administrar consultorio" />
          )}

          <form
            onSubmit={handleSubmit(handleSave)}
            className="flex-1 flex flex-col"
          >
            <div className="flex flex-col p-2 gap-5 flex-1">
              <div className="flex flex-col p-2 md:p-6 items-center gap-2">
                {/* Información básica */}
                <InputWithHelper
                  id="name"
                  label="Nombre"
                  readOnly={isViewMode}
                  helper="Ingrese el nombre del consultorio"
                  {...register("name")}
                  errors={errors.name}
                />

                <InputWithHelper
                  id="capacity"
                  label="Aforo"
                  type="number"
                  readOnly={isViewMode}
                  helper="Ingrese la capacidad máxima del consultorio"
                  {...register("capacity", {
                    valueAsNumber: true,
                  })}
                  errors={errors.capacity}
                />

                <SearchableSelect
                  id="locationId"
                  label="Sede"
                  value={watch("locationId")}
                  onValueChange={(value) => setValue("locationId", value)}
                  options={
                    locationsSearch.locations.map((location) => ({
                      value: location.id,
                      label: location.name,
                    })) ?? []
                  }
                  onSearch={locationsSearch.setNameQuery}
                  readOnly={isViewMode}
                  helper="Seleccione la sede del consultorio"
                  {...register("locationId")}
                  error={errors.locationId?.message}
                />

                <InputWithHelper
                  id="type"
                  label="Tipo"
                  readOnly={isViewMode}
                  helper="Ingrese el tipo de consultorio"
                  {...register("type")}
                  errors={errors.type}
                />
              </div>

              {/* Botones de acción */}
              <div className="flex flex-col p-2 gap-3 pt-4 border-t w-full md:flex-row md:justify-end mt-auto">
                {isViewMode && (
                  <>
                    <Button
                      variant="destructive"
                      onClick={() => {
                        navigate("/offices");
                      }}
                      className="flex items-center gap-2"
                      disabled={loading}
                      type="button"
                    >
                      Volver
                    </Button>
                    <Button
                      variant={data?.isActive ? "destructive" : "default"}
                      onClick={handleDisable}
                      className="flex items-center gap-2"
                      disabled={loading}
                      type="button"
                    >
                      {data?.isActive ? "Deshabilitar" : "Habilitar"}
                    </Button>

                    <Button
                      onClick={() => setOpen(true)}
                      className="flex items-center gap-2"
                      disabled={loading}
                      type="button"
                    >
                      Asignar inventario
                    </Button>

                    <Button
                      onClick={handleEdit}
                      className="flex items-center gap-2"
                      disabled={loading}
                      type="button"
                    >
                      <Edit className="h-4 w-4" />
                      Editar
                    </Button>
                  </>
                )}

                {(mode === "edit" || mode === "create") && (
                  <>
                    <Button
                      variant="destructive"
                      onClick={handleCancel}
                      className="flex items-center gap-2"
                      disabled={loading}
                      type="button"
                    >
                      <X className="h-4 w-4" />
                      Cancelar
                    </Button>
                    <Button
                      // onClick={handleSave}
                      className="flex items-center gap-2"
                      disabled={loading}
                      type="submit"
                    >
                      <Save className="h-4 w-4" />
                      {mode === "create" ? "Crear" : "Guardar"}
                    </Button>
                  </>
                )}
              </div>
            </div>
          </form>

          <AssignItemsModal
            open={open}
            onOpenChange={setOpen}
            officeId={data?.id ?? ""}
            officeItems = {officeItems}
          />
        </>
      </FormProvider>
    </div>
  );
};
