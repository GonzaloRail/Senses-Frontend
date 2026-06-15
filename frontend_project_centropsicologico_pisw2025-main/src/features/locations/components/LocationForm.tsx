import { SiteHeader } from "@/shared/components/SiteHeader";
import { useEffect, useState } from "react";
import { Edit, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router";
import { InputWithHelper } from "../../systemUsers/components/InputWithHelper";
import { SelectWithHelper } from "../../systemUsers/components/SelectWithHelper";
import type { District, Location, Province } from "@/shared/interfaces/models";
import {
  useGetAllRegionsQuery,
  useGetProvinceByIdQuery,
  useProvincesByRegionIdQuery,
} from "@/shared/hooks";
import { useCreateLocation, useUpdateLocation } from "../hooks";
import { useForm } from "react-hook-form";
import {
  locationFormSchema,
  type LocationFormSchema,
} from "@/shared/interfaces/forms/LocationFormSchema";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loading } from "@/shared/components/Loading";

export type FormMode = "view" | "edit" | "create";

type locationFormData = Partial<Location> & {
  districtId?: string;
  provinceId?: string;
  regionId?: string;
};

type LocationFormProps = {
  data?: locationFormData;
  locationId?: string;
};

export const LocationForm = ({ data }: LocationFormProps) => {
  const navigate = useNavigate();

  const {
    handleSubmit,
    watch,
    register,
    reset,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<LocationFormSchema>({
    resolver: zodResolver(locationFormSchema),
    defaultValues: {
      name: "",
      address: "",
      districtId: "",
      provinceId: "",
      regionId: "",
    },
  });

  // Determinar el modo basado en la data enviada como prop
  const [mode, setMode] = useState<FormMode>(() => {
    if (!data) return "create";
    return "view";
  });

  const updateLocation = useUpdateLocation();
  const createLocation = useCreateLocation();
  useEffect(() => {
    if (data) {
      console.log(data);
      reset({
        name: data.name || "",
        address: data.address || "",
        districtId: data.districtId || "",
        provinceId: data.district?.province?.id || "",
        regionId: data.district?.province?.region?.id || "",
        isActive: data.isActive ?? true,
      });
    }
  }, [mode, data, reset]);

  const regionId = watch("regionId");
  const provinceId = watch("provinceId");

  // Queries para obtener datos
  const { data: allRegions } = useGetAllRegionsQuery();
  const { data: provincesByRegionId } = useProvincesByRegionIdQuery(
    regionId ?? ""
  );
  const { data: provinceById } = useGetProvinceByIdQuery(provinceId ?? "");

  // Estados para las listas filtradas
  const [filteredProvinces, setFilteredProvinces] = useState<Province[]>([]);
  const [filteredDistricts, setFilteredDistricts] = useState<District[]>([]);

  const isViewMode = mode === "view";
  const [loading, setLoading] = useState(false);

  // Effect para actualizar provincias cuando cambia la región
  useEffect(() => {
    if (regionId && provincesByRegionId) {
      setFilteredProvinces(provincesByRegionId);
      setFilteredDistricts([]);

      // Solo resetear el distrito si no estamos en modo vista/edición
      if (mode !== "view") {
        setValue("provinceId", "");
        setValue("districtId", "");
      }
    } else {
      setFilteredProvinces([]);
      setFilteredDistricts([]);
      if (mode !== "view") {
        setValue("provinceId", "");
        setValue("districtId", "");
      }
    }
  }, [regionId, provincesByRegionId]);

  // Effect para actualizar distritos cuando cambia la provincia
  useEffect(() => {
    if (provinceId && provinceById) {
      setFilteredDistricts(provinceById.districts || []);

      // Solo resetear el distrito si no estamos en modo vista/edición
      if (mode !== "view") {
        setValue("districtId", "");
      }
    } else {
      setFilteredDistricts([]);
      if (mode !== "view") {
        setValue("districtId", "");
      }
    }
  }, [provinceId, provinceById]);

  // Manejar el envío del formulario
  const handleSave = async () => {
    setLoading(true);
    try {
      if (mode === "create") {
        // Aquí la llamada para crear una nueva ubicación
        const locationToCreate: Partial<Location> = {
          name: getValues("name"),
          address: getValues("address"),
          districtId: getValues("districtId"),
        };
        console.log("llamada create");
        createLocation.mutate(locationToCreate, {
          onSuccess: () => {
            navigate("/locations"); // Redirigir a la lista de ubicaciones
          },
        });
      } else {
        // Aquí la llamada para actualizar la ubicación existente
        const locationToUpdate: Partial<Location> = {
          name: getValues("name"),
          address: getValues("address"),
          districtId: getValues("districtId"),
        };
        updateLocation.mutate(
          { id: data?.id ?? "", locationToUpdate },
          {
            onSuccess: () => {
              navigate("/locations");
            },
          }
        );
      }
    } catch (error) {
      console.error("Error al guardar la ubicación:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (mode === "create") {
      navigate("/locations");
    } else {
      setMode("view");
    }
  };

  const handleEdit = () => {
    setMode("edit");
  };

  const handleDisable = async () => {
    if (confirm("¿Está seguro de que desea deshabilitar esta sede?")) {
      try {
        //console.log("Deshabilitando sede");
        const locationToUpdate = {
          isActive: !data!.isActive,
        };
        updateLocation.mutate(
          { id: data?.id ?? "", locationToUpdate },
          {
            onSuccess: () => {
              navigate("/locations");
            },
          }
        );
      } catch (error) {
        console.error("Error al deshabilitar sede:", error);
      }
    }
  };

  if (loading) {
    return <Loading message="Cargando información de sedes..." />;
  }
  console.log("errors", errors);

  return (
    <div className="h-screen flex flex-col">
      <>
        {mode === "create" ? (
          <SiteHeader title="Crear sede" />
        ) : (
          <SiteHeader title="Sede" />
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
                value={watch("name")}
                //onChange={(e) => handleInputChange("name", e.target.value)}
                readOnly={isViewMode}
                helper="Ingrese el nombre de la sede"
                {...register("name")}
                errors={errors.name}
              />

              <InputWithHelper
                id="address"
                label="Dirección"
                value={watch("address")}
                //onChange={(e) => handleInputChange("address", e.target.value)}
                readOnly={isViewMode}
                helper="Ingrese la dirección de la sede"
                {...register("address")}
                errors={errors.address}
              />

              <SelectWithHelper
                id="regionId"
                label="Región"
                value={watch("regionId")}
                onValueChange={(value) => setValue("regionId", value)}
                options={
                  allRegions?.map((region) => ({
                    id: region.id,
                    name: region.name,
                  })) ?? []
                }
                readOnly={isViewMode}
                helper="Seleccione la región a la que pertenece la sede"
                {...register("regionId")}
                errors={errors.regionId}
              />

              <SelectWithHelper
                id="provinceId"
                label="Provincia"
                value={watch("provinceId")}
                onValueChange={(value) => setValue("provinceId", value)}
                options={
                  filteredProvinces?.map((province) => ({
                    id: province.id,
                    name: province.name,
                  })) ?? []
                }
                readOnly={isViewMode || !regionId}
                helper="Seleccione la provincia a la que pertenece la sede"
                {...register("provinceId")}
                errors={errors.provinceId}
              />

              <SelectWithHelper
                id="districtId"
                label="Distrito"
                value={watch("districtId")}
                onValueChange={(value) => setValue("districtId", value)}
                options={
                  filteredDistricts?.map((district) => ({
                    id: district.id,
                    name: district.name,
                  })) ?? []
                }
                readOnly={isViewMode || !provinceId}
                helper="Seleccione el distrito a la que pertenece la sede"
                {...register("districtId")}
                errors={errors.districtId}
              />
            </div>

            {/* Botones de acción */}
            <div className="flex flex-col p-2 gap-3 pt-4 border-t w-full md:flex-row md:justify-end mt-auto">
              {isViewMode && (
                <>
                  <Button
                    variant="destructive"
                    onClick={() => {
                      navigate("/locations");
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
                    {mode === "create" ? "Crear sede" : "Guardar"}
                  </Button>
                </>
              )}
            </div>
          </div>
        </form>
      </>
    </div>
  );
};
