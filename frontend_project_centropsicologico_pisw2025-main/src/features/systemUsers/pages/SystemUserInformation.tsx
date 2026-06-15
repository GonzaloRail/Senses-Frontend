import { SiteHeader } from "@/shared/components/SiteHeader";
import { useEffect, useState } from "react";
import { Edit, Loader2, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate, useParams } from "react-router";
import { InputWithHelper } from "../components/InputWithHelper";
import { FileUploadWithHelper } from "../components/FileUploadWithHelper";
import { CheckboxGroupWithHelper } from "../components/CheckBoxGroupWithHelper";
import {
  type Document,
  type RoleType,
  type WorkSchedule,
} from "@/shared/interfaces/models";
import {
  useCreateUser,
  usePsychologistSearchByNameQuery,
  useUpdateUser,
  useUserByIdQuery,
} from "../hooks";
import { useRolesQuery } from "@/shared/hooks";
import { FormProvider, useFieldArray, useForm } from "react-hook-form";
import {
  userFormSchema,
  type UserFormSchema,
} from "@/shared/interfaces/forms/UserFormSchema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAlert } from "@/shared/hooks/useAlert";
import type { AxiosError } from "axios";
import { Loading } from "@/shared/components/Loading";
import { UserWorkSchedule } from "../components/PsychologistWorkSchedule";
import { SearchableSelect } from "@/shared/components/SearchableSelect";
import { uploadFileToCloudStorage } from "@/shared/utils/uploadFileToCloudStorage";

type FormMode = "view" | "edit" | "create";

const rolesName = {
  ADMISSION: "Admisión",
  PSYCHOLOGIST: "Psicólogo",
  ADMIN: "Gerente",
  INTERNAL: "Interno",
};

// Crear opciones para el selector de roles con valores en inglés y etiquetas en español
const roleOptions = Object.entries(rolesName).map(([value, label]) => ({
  id: value,
  label,
}));

export const SystemUserInformation = () => {
  const methods = useForm<UserFormSchema>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      roles: [],
      cv: undefined,
      title: undefined,
      mentalHealthCertificate: undefined,
      presentationLetter: undefined,
      certificate: undefined,
      csp: "",
      dni: "",
      psychologistId: "",
      workSchedule: [],
    },
  });

  const {
    register,
    formState: { errors },
    handleSubmit,
    setValue,
    watch,
    reset,
    // getValues, GAB: Is was just used for logging
    control,
  } = methods;

  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [mode, setMode] = useState<FormMode>(() => {
    if (!id) return "create";
    return "view";
  });
  const [selectedRoles, setSelectedRoles] = useState<RoleType[]>([]);
  const [loading, setLoading] = useState(false);
  const { data: userData, isLoading } = useUserByIdQuery({ id });
  // creo que no esta trayendo schedules, falta eso y poder editar horarios de hbaerlos
  const { data: rolesDb } = useRolesQuery();
  const updateUser = useUpdateUser();
  const createUser = useCreateUser();

  const { showAlert } = useAlert();
  const [selectedDays, setSelectedDays] = useState<string[]>([]);

  // logiac para manejar dinamicamente campos de horarios
  const { fields, append, remove } = useFieldArray({
    control,
    name: "workSchedule",
  });

  // Sincronizar datos del usuario al form de React Hook Form
  useEffect(() => {
    if (id && mode === "view" && userData) {
      console.log("userdata:", userData);
      // Buscar URLs de documentos existentes
      const findDocUrl = (name: string) =>
        userData.documents?.find(
          (doc) => doc.type === "USER_DOCS" && doc.name === name
        )?.fileUrl || "";

      // Formatear los horarios de trabajo para el formulario
      let formattedSchedules: Partial<WorkSchedule>[] = [];
      if (userData.workSchedule && userData.workSchedule.length > 0) {
        formattedSchedules = userData.workSchedule.map((schedule) => {
          // Convierte los strings ISO a objetos Date.
          const startDate = new Date(schedule.startTime);
          const endDate = new Date(schedule.endTime);

          // Extrae las horas y minutos usando los métodos UTC
          const fromHour = String(startDate.getUTCHours()).padStart(2, "0");
          const fromMinute = "00";
          const toHour = String(endDate.getUTCHours()).padStart(2, "0");
          const toMinute = "00";

          // 3. Retorna el objeto con el formato correcto para el formulario.
          return {
            day: schedule.day,
            officeId: schedule.officeId,
            fromHour, // ej. "07"
            fromMinute, // ej. "00"
            toHour, // ej. "21"
            toMinute, // ej. "00"
          };
        });
        console.log("schedules formatted:", formattedSchedules);

        // Sincroniza los botones de días (ToggleGroup) con los datos cargados
        const daysFromData = userData.workSchedule.map((s) => s.day);
        setSelectedDays(daysFromData);
      }

      reset({
        firstName: userData.firstName ?? "",
        lastName: userData.lastName ?? "",
        email: userData.email ?? "",
        roles: (userData.roles ?? [])
          .map((r) => r.role?.name)
          .filter(Boolean) as string[],
        dni: userData.dni ?? "",
        csp: userData.csp ?? "",
        psychologistId: userData.psychologistId ?? "",
        cv: findDocUrl("Curriculum Vitae"),
        title: findDocUrl("Título profesional"),
        mentalHealthCertificate: findDocUrl(
          "Certificado médico de salud mental"
        ),
        presentationLetter: findDocUrl("Carta de presentación"),
        certificate: findDocUrl("Constancia de habilitación"),
        workSchedule: formattedSchedules,
      });
      setSelectedRoles(
        (userData.roles ?? [])
          .map((userRole) => userRole.role?.name)
          .filter((name): name is RoleType => typeof name === "string")
      );
    }
  }, [id, mode, userData, reset]);

  const isViewMode = mode === "view";

  // Manejar archivos: actualiza el valor en React Hook Form
  const handleFileUpload = (field: keyof UserFormSchema, file: File | null) => {
    setValue(field, file, { shouldValidate: true });
  };

  // Manejar roles (checkbox group)
  const handleRolesChange = (newRoles: string[]) => {
    setValue("roles", newRoles, { shouldValidate: true });
    setSelectedRoles(newRoles as RoleType[]);
  };

  // Función para manejar el cambio de selección de días
  const handleSelectionChange = (newDays: string[]) => {
    const currentDays = fields.map((field) => field.day);

    // Son los días que están en newDays pero no en el formulario actual.
    const daysToAdd = newDays.filter((day) => !currentDays.includes(day));
    daysToAdd.forEach((dayId) => {
      append({
        day: dayId,
        fromHour: "07", // Valor por defecto
        fromMinute: "00", // Valor por defecto
        toHour: "21", // Valor por defecto
        toMinute: "00", // Valor por defecto
        officeId: "", // Valor por defecto
      });
    });

    // Son los días que están en el formulario pero ya no en newDays.
    const indicesToRemove: number[] = [];
    fields.forEach((field, index) => {
      if (!newDays.includes(field.day)) {
        indicesToRemove.push(index);
      }
    });

    // Es importante remover los índices en orden descendente para no alterar
    // la posición de los elementos que aún no se han quitado.
    indicesToRemove.reverse().forEach((index) => {
      remove(index);
    });

    // Sincroniza el estado local que controla los Toggles
    setSelectedDays(newDays);
  };

  type DocumentFront = Partial<Document> & { fileObject?: File };

  const onSubmit = async (data: UserFormSchema) => {
    setLoading(true);
    try {
      // Construir el array de documentos a partir de los campos file individuales
      const documents: Partial<DocumentFront>[] = [];
      if (data.cv && data.cv instanceof File) {
        documents.push({
          name: "Curriculum Vitae",
          type: "USER_DOCS",
          fileObject: data.cv,
        });
      }
      if (data.title && data.title instanceof File) {
        documents.push({
          name: "Título profesional",
          type: "USER_DOCS",
          fileObject: data.title,
        });
      }
      if (
        data.mentalHealthCertificate &&
        data.mentalHealthCertificate instanceof File
      ) {
        documents.push({
          name: "Certificado médico de salud mental",
          type: "USER_DOCS",
          fileObject: data.mentalHealthCertificate,
        });
      }
      if (data.presentationLetter && data.presentationLetter instanceof File) {
        documents.push({
          name: "Carta de presentación",
          type: "USER_DOCS",
          fileObject: data.presentationLetter,
        });
      }
      if (data.certificate && data.certificate instanceof File) {
        documents.push({
          name: "Constancia de habilitación",
          type: "USER_DOCS",
          fileObject: data.certificate,
        });
      }

      // Procesar archivos y obtener URLs
      let processedDocuments: Partial<Document>[] = [];
      if (documents.length > 0) {
        processedDocuments = await processDocuments(
          documents as (Partial<Document> & { fileObject: File })[],
          data.dni
        );
      }

      let workSchedules;
      if (data.workSchedule) {
        workSchedules = data.workSchedule.map((schedule) => {
          // Función auxiliar para asegurar que los números tengan dos dígitos (7 -> "07")
          const pad = (num: string) => String(num).padStart(2, "0");

          const startTime = `${pad(schedule.fromHour)}:${pad(
            schedule.fromMinute
          )}:00`;
          const endTime = `${pad(schedule.toHour)}:${pad(
            schedule.toMinute
          )}:00`;

          // Retornamos el nuevo objeto con el formato que espera la API
          return {
            day: schedule.day,
            startTime, // e.g., "09:00:00"
            endTime, // e.g., "17:00:00"
            officeId: schedule.officeId,
          };
        });
      }

      // Normalizar datos para la API
      const normalizedData = Object.fromEntries(
        Object.entries(data).filter(
          ([key, value]) =>
            ![
              "cv",
              "title",
              "mentalHealthCertificate",
              "presentationLetter",
              "certificate",
              "workSchedule",
            ].includes(key) && value !== ""
        )
      );

      // Mapear roles a formato esperado por la API
      const userRoles = data.roles
        .flatMap((roleName) => {
          // Si es INTERNAL, devolver ambos roles: INTERNAL y PSYCHOLOGIST
          if (roleName === "INTERNAL") {
            return ["INTERNAL", "PSYCHOLOGIST"];
          }
          return [roleName];
        })
        .map((roleName) => ({
          roleId: rolesDb?.find((r) => r.name === roleName)?.id,
        }))
        .filter(
          (role, index, self) =>
            // Eliminar duplicados: mantener solo la primera ocurrencia de cada roleId
            role.roleId !== undefined &&
            self.findIndex((r) => r.roleId === role.roleId) === index
        );

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const userPayload: Record<string, any> = {
        ...normalizedData,
        roles: userRoles,
        documents:
          processedDocuments.length > 0 ? processedDocuments : undefined,
        workSchedule: workSchedules,
      };

      console.log("userPayload", userPayload); //falta isActive y documentos

      if (mode === "create") {
        createUser.mutate(userPayload, {
          onSuccess: () => {
            navigate("/system-users");
          },
          onError: (error) => {
            const axiosError = error as AxiosError<{ message: string }>;
            const errorMessage =
              axiosError.response?.data?.message || error.message;
            showAlert(errorMessage, "error");
          },
        });
      } else {
        // email campo inmutable
        delete userPayload.email;
        updateUser.mutate(
          { id: id!, userToUpdate: userPayload },
          {
            onSuccess: () => {
              navigate("/system-users");
            },
          }
        );
      }
    } catch (error) {
      console.error("Error al guardar:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (mode === "create") {
      navigate("/system-users"); // Volver a la lista
    } else {
      setMode("view");
    }
  };

  const processDocuments = async (
    updatedDocuments: (Partial<Document> & { fileObject?: File })[],
    dni: string
  ): Promise<Partial<Document>[]> => {
    const uploaded = await Promise.all(
      updatedDocuments.map(async (doc) => {
        if (!doc.fileObject) {
          throw new Error(`Documento ${doc.name} no tiene archivo`);
        }

        const filePath = await uploadFileToCloudStorage(
          doc.fileObject,
          dni,
          doc.name
        );

        return {
          name: doc.name,
          type: doc.type,
          filePath,
        };
      })
    );

    return uploaded;
  };

  const handleDisable = async () => {
    if (confirm("¿Está seguro de que desea deshabilitar este usuario?")) {
      try {
        console.log("Deshabilitando usuario:", id);
        const userToUpdate = {
          isActive: !userData!.isActive,
        };
        console.log(userToUpdate);
        updateUser.mutate(
          { id: id!, userToUpdate },
          {
            onSuccess: () => {
              console.log("navegnando");
              navigate("/system-users");
            },
            onError: (error) => {
              console.error("onError", error);
            },
            onSettled: () => {
              console.log("onSettled");
            },
          }
        );
      } catch (error) {
        console.error("Error al deshabilitar usuario:", error);
      }
    }
  };

  // Determinar qué campos mostrar según los roles
  const shouldShowField = (field: string): boolean => {
    const hasRole = (role: RoleType) => selectedRoles.includes(role);
    // Condición para manejar la configuración incorrecta de Internal
    const isInternalMisconfigured =
      hasRole("PSYCHOLOGIST") && hasRole("INTERNAL");
    // Mapeo de campos y sus roles requeridos
    const fieldRoleMap: Record<
      string,
      {
        roles: RoleType[];
        hideIfMisconfigured?: boolean;
      }
    > = {
      cv: {
        roles: ["PSYCHOLOGIST", "ADMISSION"],
        hideIfMisconfigured: true,
      },
      title: {
        roles: ["PSYCHOLOGIST"],
        hideIfMisconfigured: true,
      },
      presentationLetter: {
        roles: ["INTERNAL"],
      },
      certificate: {
        roles: ["PSYCHOLOGIST"],
        hideIfMisconfigured: true,
      },
      mentalHealthCertificate: {
        roles: ["INTERNAL", "ADMISSION"],
      },
      csp: {
        roles: ["PSYCHOLOGIST"],
        hideIfMisconfigured: true,
      },
      psychologistId: {
        roles: ["INTERNAL"],
      },
    };

    const config = fieldRoleMap[field];

    // Si el campo no está en el mapa, se muestra por defecto
    if (!config) return true;

    // Si hay configuración incorrecta y el campo debe ocultarse
    if (isInternalMisconfigured && config.hideIfMisconfigured) {
      return false;
    }

    // Verificar si el usuario tiene alguno de los roles requeridos
    return config.roles.some((role) => hasRole(role));
  };

  const psychologistSearch = usePsychologistSearchByNameQuery();

  if (isLoading || loading) {
    return <Loading message="Cargando información del usuario..." />;
  }

  /* console.log("errors", errors);
  console.log("dinamic: ", getValues());
  console.log(
    "dataFiles",
    getValues("cv"),
    getValues("title"),
    getValues("mentalHealthCertificate"),
    getValues("presentationLetter"),
    getValues("certificate")
  ); */
  return (
    <FormProvider {...methods}>
      <div className="h-screen flex flex-col">
        <>
          {mode === "create" ? (
            <SiteHeader title="Crear usuario" />
          ) : (
            <SiteHeader title="Usuario" />
          )}
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="flex-1 flex flex-col"
          >
            <div className="flex flex-col p-2 gap-5 flex-1">
              <div className="flex flex-col gap-10 justify-center mt-5 lg:flex-row">
                <div className="flex flex-col p-2 md:p-6 items-center gap-2">
                  {/* Información básica */}
                  <InputWithHelper
                    id="firstName"
                    label="Nombres"
                    readOnly={isViewMode}
                    //value={watch("firstName")}
                    helper="Ingrese los nombres del usuario"
                    errors={errors.firstName}
                    {...register("firstName")}
                  />
                  <InputWithHelper
                    id="lastName"
                    label="Apellidos"
                    readOnly={isViewMode}
                    //value={watch("lastName")}
                    helper="Ingrese los apellidos del usuario"
                    errors={errors.lastName}
                    {...register("lastName")}
                  />
                  <InputWithHelper
                    id="email"
                    label="Correo electrónico"
                    type="email"
                    readOnly={isViewMode}
                    //value={watch("email")}
                    helper="Debe ser un email válido"
                    errors={errors.email}
                    {...register("email")}
                  />
                  {/* Roles */}
                  <CheckboxGroupWithHelper
                    id="roles"
                    label="Roles"
                    options={roleOptions}
                    selectedValues={watch("roles")}
                    onSelectionChange={handleRolesChange}
                    readOnly={isViewMode}
                    helper="Seleccione uno o más roles para el usuario"
                    columns={2}
                    errors={errors.roles}
                    {...register("roles")}
                  />
                  {/* Campos condicionales según roles */}
                  {shouldShowField("cv") && (
                    <FileUploadWithHelper
                      id="cv"
                      label="Currículum"
                      onChange={(file) => handleFileUpload("cv", file)}
                      readOnly={isViewMode}
                      currentFile={
                        userData?.documents?.find(
                          (doc) =>
                            doc.type === "USER_DOCS" &&
                            doc.name === "Curriculum Vitae"
                        )?.fileUrl
                      }
                      existingFileName={
                        userData?.documents?.find(
                          (doc) =>
                            doc.type === "USER_DOCS" &&
                            doc.name === "Curriculum Vitae"
                        )?.name
                      }
                      existingFileUrl={
                        userData?.documents?.find(
                          (doc) =>
                            doc.type === "USER_DOCS" &&
                            doc.name === "Curriculum Vitae"
                        )?.fileUrl
                      }
                      helper="Formato PDF, DOC o DOCX. Máximo 5MB"
                      accept=".pdf,.doc,.docx"
                      errors={errors.cv}
                    />
                  )}
                  {shouldShowField("title") && (
                    <FileUploadWithHelper
                      id="title"
                      label="Título profesional"
                      onChange={(file) => handleFileUpload("title", file)}
                      readOnly={isViewMode}
                      currentFile={
                        userData?.documents?.find(
                          (doc) =>
                            doc.type === "USER_DOCS" &&
                            doc.name === "Título profesional"
                        )?.fileUrl
                      }
                      existingFileName={
                        userData?.documents?.find(
                          (doc) =>
                            doc.type === "USER_DOCS" &&
                            doc.name === "Título profesional"
                        )?.name
                      }
                      existingFileUrl={
                        userData?.documents?.find(
                          (doc) =>
                            doc.type === "USER_DOCS" &&
                            doc.name === "Título profesional"
                        )?.fileUrl
                      }
                      helper="Título profesional en formato PDF"
                      accept=".pdf"
                      errors={errors.title}
                    />
                  )}
                  {shouldShowField("presentationLetter") && (
                    <FileUploadWithHelper
                      id="presentationLetter"
                      label="Carta de Presentación"
                      onChange={(file) =>
                        handleFileUpload("presentationLetter", file)
                      }
                      readOnly={isViewMode}
                      currentFile={
                        userData?.documents?.find(
                          (doc) =>
                            doc.type === "USER_DOCS" &&
                            doc.name === "Carta de presentación"
                        )?.fileUrl
                      }
                      existingFileName={
                        userData?.documents?.find(
                          (doc) =>
                            doc.type === "USER_DOCS" &&
                            doc.name === "Carta de presentación"
                        )?.name
                      }
                      existingFileUrl={
                        userData?.documents?.find(
                          (doc) =>
                            doc.type === "USER_DOCS" &&
                            doc.name === "Carta de presentación"
                        )?.fileUrl
                      }
                      helper="Carta de presentación de la institución"
                      accept=".pdf,.doc,.docx"
                      errors={errors.presentationLetter}
                    />
                  )}
                  {shouldShowField("certificate") && (
                    <FileUploadWithHelper
                      id="certificate"
                      label="Constancia de habilitación"
                      onChange={(file) => handleFileUpload("certificate", file)}
                      readOnly={isViewMode}
                      currentFile={
                        userData?.documents?.find(
                          (doc) =>
                            doc.type === "USER_DOCS" &&
                            doc.name === "Constancia de habilitación"
                        )?.fileUrl
                      }
                      existingFileName={
                        userData?.documents?.find(
                          (doc) =>
                            doc.type === "USER_DOCS" &&
                            doc.name === "Constancia de habilitación"
                        )?.name
                      }
                      existingFileUrl={
                        userData?.documents?.find(
                          (doc) =>
                            doc.type === "USER_DOCS" &&
                            doc.name === "Constancia de habilitación"
                        )?.fileUrl
                      }
                      helper="Constancia de habilitación profesional"
                      accept=".pdf"
                      errors={errors.certificate}
                    />
                  )}
                  {shouldShowField("mentalHealthCertificate") && (
                    <FileUploadWithHelper
                      id="mentalHealthCertificate"
                      label="Certificado de Salud Mental"
                      onChange={(file) =>
                        handleFileUpload("mentalHealthCertificate", file)
                      }
                      currentFile={
                        userData?.documents?.find(
                          (doc) =>
                            doc.type === "USER_DOCS" &&
                            doc.name === "Certificado médico de salud mental"
                        )?.fileUrl
                      }
                      existingFileName={
                        userData?.documents?.find(
                          (doc) =>
                            doc.type === "USER_DOCS" &&
                            doc.name === "Certificado médico de salud mental"
                        )?.name
                      }
                      existingFileUrl={
                        userData?.documents?.find(
                          (doc) =>
                            doc.type === "USER_DOCS" &&
                            doc.name === "Certificado médico de salud mental"
                        )?.fileUrl
                      }
                      readOnly={isViewMode}
                      helper="Certificado médico de salud mental"
                      accept=".pdf"
                      errors={errors.mentalHealthCertificate}
                    />
                  )}
                  {shouldShowField("csp") && (
                    <InputWithHelper
                      id="csp"
                      label="Código C.Ps.P."
                      readOnly={isViewMode}
                      //value={watch("csp")}
                      helper="Número de colegio profesional"
                      errors={errors.csp}
                      {...register("csp")}
                    />
                  )}
                  {shouldShowField("psychologistId") && (
                    <SearchableSelect
                      id="psychologistId"
                      label="Psicólogo Asignado"
                      placeholder="Selecciona psicólogo..."
                      value={watch("psychologistId")}
                      onValueChange={(value) =>
                        setValue("psychologistId", value)
                      }
                      onSearch={psychologistSearch.setSearchQuery}
                      options={psychologistSearch.psychologists.filter((psychologist) => 
                        (psychologist.roles ?? []).every((ur) => ur.role?.name !== "INTERNAL")
                      ).map(
                        ({ dni, firstName, id, lastName }) => ({
                          value: id,
                          label: `${firstName} ${lastName} - DNI: ${dni}`,
                        })
                      )}
                      loading={psychologistSearch.isLoading}
                      readOnly={isViewMode}
                      helper="Seleccione el psicólogo supervisor"
                      error={errors.psychologistId?.message}
                    />
                    // <SelectWithHelper
                    //   //value={watch("psychologistId")}
                    //   onValueChange={(value) =>
                    //     setValue("psychologistId", value, {
                    //       shouldValidate: true,
                    //     })
                    //   }
                    //   readOnly={isViewMode}
                    //   options={availablePsychologists}
                    //   errors={errors.psychologistId}
                    //   {...register("psychologistId")}
                    // />
                  )}
                  <InputWithHelper
                    id="dni"
                    label="Número de DNI"
                    readOnly={isViewMode}
                    //value={watch("dni")}
                    helper="8 dígitos del DNI"
                    errors={errors.dni}
                    {...register("dni")}
                  />
                </div>

                {/* HORARIOS PARA PSICOLOGOS */}
                {(selectedRoles.includes("PSYCHOLOGIST") ||
                  selectedRoles.includes("INTERNAL")) && (
                  <UserWorkSchedule
                    control={control}
                    register={register}
                    errors={errors}
                    fields={fields}
                    isViewMode={isViewMode}
                    selectedDays={selectedDays}
                    handleSelectionChange={handleSelectionChange}
                  />
                )}
              </div>

              {/* Botones de acción */}
              <div className="flex flex-col p-2 gap-3 pt-4 border-t w-full md:flex-row md:justify-end mt-auto">
                {isViewMode && (
                  <>
                    <Button
                      variant="destructive"
                      onClick={() => {
                        navigate("/system-users");
                      }}
                      className="flex items-center gap-2 cursor-pointer"
                      disabled={loading}
                      type="button"
                    >
                      Volver
                    </Button>
                    <Button
                      variant={userData?.isActive ? "destructive" : "default"}
                      onClick={handleDisable}
                      className="flex items-center gap-2 cursor-pointer"
                      disabled={loading}
                      type="button"
                    >
                      {userData?.isActive ? "Deshabilitar" : "Habilitar"}
                    </Button>

                    <Button
                      onClick={() => setMode("edit")}
                      className="flex items-center gap-2 cursor-pointer"
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
                      className="flex items-center gap-2 cursor-pointer"
                      disabled={loading}
                      type="button"
                    >
                      <X className="h-4 w-4" />
                      Cancelar
                    </Button>
                    <Button
                      className="flex items-center gap-2 cursor-pointer"
                      disabled={
                        loading || createUser.isPending || updateUser.isPending
                      }
                      type="submit"
                    >
                      <Save className="h-4 w-4" />
                      {mode === "create" ? (
                        createUser.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Creando usuario...
                          </>
                        ) : (
                          "Crear Usuario"
                        )
                      ) : (
                        "Guardar"
                      )}
                    </Button>
                  </>
                )}
              </div>
            </div>
          </form>
        </>
      </div>
    </FormProvider>
  );
};
