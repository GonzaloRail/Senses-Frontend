import { SiteHeader } from "@/shared/components/SiteHeader";
import { useEffect, useState } from "react";
import { Edit, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router";
import { InputWithHelper } from "../../systemUsers/components/InputWithHelper";
import type { Item } from "@/shared/interfaces/models";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loading } from "@/shared/components/Loading";
import {
  itemFormSchema,
  type ItemFormSchema,
} from "@/shared/interfaces/forms/ItemFormSchema";
import { useCreateItem, useUpdateItem } from "../hooks/useItemsMutations";
import { queryClient } from "@/lib/queryClient";

export type FormMode = "view" | "edit" | "create";

type itemFormData = Partial<Item>;

type ItemFormProps = {
  data?: itemFormData;
  itemId?: string;
};

export const ItemForm = ({ data }: ItemFormProps) => {
  const navigate = useNavigate();

  const methods = useForm<ItemFormSchema>({
    resolver: zodResolver(itemFormSchema),
    defaultValues: {
      name: "",
      quantity: 0,
      description: "",
    },
  });

  const {
    handleSubmit,
    register,
    reset,
    getValues,
    formState: { errors },
  } = methods;

  // Determinar el modo basado en la data enviada como prop
  const [mode, setMode] = useState<FormMode>(() => {
    if (!data) return "create";
    return "view";
  });

  const isViewMode = mode === "view";
  useEffect(() => {
    if (data) {
      console.log(data);
      reset({
        name: data.name || "",
        quantity: data.quantity || 0,
        description: data.description || "No hay descripción",
        isActive: data.isActive ?? true,
      });
    }
  }, [mode, data, reset]);

  const [loading, setLoading] = useState(false);

  const updateItem = useUpdateItem();
  const createItem = useCreateItem();

  // Manejar el envío del formulario
  const handleSave = async () => {
    setLoading(true);
    console.log(getValues())
    try {
      if (mode === "create") {
        // Crear
        const itemToCreate: Partial<Item> = {
          name: getValues("name"),
          quantity: getValues("quantity") || 0,
          description: getValues("description"),
        };
        console.log("llamada create");
        createItem.mutate(itemToCreate, {
          onSuccess: () => {
            navigate("/inventory");
          },
        });
      } else {
        // Actualizar
        const itemToUpdate: Partial<Item> = {
          name: getValues("name"),
          quantity: getValues("quantity") || 0,
          description: getValues("description"),
        };
        updateItem.mutate(
          { id: data?.id ?? "", itemToUpdate },
          {
            onSuccess: () => {
              navigate("/inventory");
            },
          }
        );
      }
    } catch (error) {
      console.error("Error al guardar el item:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (mode === "create") {
      navigate("/inventory");
    } else {
      setMode("view");
    }
  };

  const handleEdit = () => {
    console.log();
    setMode("edit");
  };

  const handleDisable = async () => {
    let message = ""
    data?.isActive ? message ="¿Está seguro de que desea deshabilitar este artículo? Al hacerlo se desvinculará de los consultorios que lo tengan asignado." : message= "¿Está seguro de que desea habilitar este artículo?";
    if (confirm(message)) {
      try {
        const itemToUpdate = {
          isActive: !data!.isActive,
        };
        updateItem.mutate(
          { id: data?.id ?? "", itemToUpdate },
          {
            onSuccess: () => {
              queryClient.invalidateQueries({ queryKey: ["offices"] });
              queryClient.invalidateQueries({ queryKey: ["office"] });
              navigate("/inventory");
            },
          }
        );
      } catch (error) {
        console.error("Error al deshabilitar item:", error);
      }
    }
  };

  if (loading) {
    return <Loading message="Cargando información de items..." />;
  }
  console.log("errors", errors);

  return (
      <div className="h-screen flex flex-col">
    <FormProvider {...methods}>
        <>
          {mode === "create" ? (
            <SiteHeader title="Crear nuevo artículo" />
          ) : (
            <SiteHeader title="Administrar artículo" />
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
                  label="Nombre del artículo"
                  readOnly={isViewMode}
                  helper="Ingrese el nombre del artículo"
                  {...register("name")}
                  errors={errors.name}
                />

                <InputWithHelper
                  id="quantity"
                  label="Cantidad"
                  type="number"
                  readOnly={isViewMode}
                  helper="Ingrese la cantidad del artículo"
                  {...register("quantity", {
                    valueAsNumber: true
                  })}
                  errors={errors.quantity}
                />

                <InputWithHelper
                  id="description"
                  label="Descripción"
                  readOnly={isViewMode}
                  helper="Ingrese la descripción del artículo"
                  {...register("description")}
                  errors={errors.description}
                />
              </div>

                {/* Botones de acción */}
                <div className="flex flex-col p-2 gap-3 pt-4 border-t w-full md:flex-row md:justify-end mt-auto">
                  {isViewMode && (
                    <>
                      <Button
                        variant="destructive"
                        onClick={() => {
                          navigate("/inventory");
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
        </>
    </FormProvider>
      </div>
  );
};
