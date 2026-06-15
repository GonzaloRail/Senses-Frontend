import { useEffect, useState, type ReactNode } from "react";
import {
  patientFormSchema,
  type PatientFormSchema,
} from "@/shared/interfaces/forms/PatientFormSchema";
import type {
  Patient,
  Province,
  District,
  Gender,
  MaritalStatus,
} from "@/shared/interfaces/models";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormProvider, useForm } from "react-hook-form";
import { InputWithHelper } from "../../systemUsers/components/InputWithHelper";
import { SelectWithHelper } from "../../systemUsers/components/SelectWithHelper";
import { CalendarWithHelper } from "./CalendarWithHelper";
import {
  useGetAllRegionsQuery,
  useProvincesByRegionIdQuery,
  // useGetProvinceByIdQuery,
  useDistrictsByProvinceIdQuery,
} from "@/shared/hooks";
import { Button } from "@/components/ui/button";
import { Save, X, Edit, Plus, ChevronDown } from "lucide-react";
import { useNavigate } from "react-router";
import { SiteHeader } from "@/shared/components/SiteHeader";
import { Loading } from "@/shared/components/Loading";
import { useCreatePatient, useUpdatePatient } from "../hooks";
import { TextareaWithHelper } from "@/shared/components/TextareaWithHelper";
import {
  complementaryFields,
  defaultComplementaryValues,
  extractComplementaryFormValues,
} from "../utils/patientComplementaryFields";

export type FormMode = "view" | "edit" | "create";

type patientFormData = Partial<Patient> & {
  districtId?: string;
  provinceId?: string;
  regionId?: string;
};

type PatientFormProps = {
  data?: patientFormData;
  patientId?: string;
};

const genderOptions = [
  { id: "MALE", name: "Masculino" },
  { id: "FEMALE", name: "Femenino" },
  { id: "LGBTQ", name: "LGBTQ+" },
  { id: "NOT_SPECIFIED", name: "No especificado" },
];
const maritalStatusOptions = [
  { id: "SINGLE", name: "Soltero/a" },
  { id: "MARRIED", name: "Casado/a" },
  { id: "WIDOWED", name: "Viudo/a" },
  { id: "DIVORCED", name: "Divorciado/a" },
  { id: "COHABITANT", name: "Conviviente" },
];

type ComplementarySectionKey =
  | "family"
  | "clinical"
  | "preferences"
  | "marketing"
  | "socioeconomic"
  | "consent";

type AccordionSectionProps = {
  title: string;
  isOpen: boolean;
  onToggle: () => void;
  children: ReactNode;
};

const initialOpenSections: Record<ComplementarySectionKey, boolean> = {
  family: false,
  clinical: false,
  preferences: false,
  marketing: false,
  socioeconomic: false,
  consent: false,
};

const yesNoOptions = ["Sí", "No"];
const scheduleOptions = ["Mañana", "Tarde", "Noche", "Fin de semana"];
const specialtyOptions = [
  "Ansiedad",
  "Depresión",
  "Terapia de pareja",
  "Terapia familiar",
  "Psicología infantil",
  "Evaluación psicológica",
  "Orientación vocacional",
  "Otro",
];
const contactOptions = ["WhatsApp", "Llamada telefónica", "Correo electrónico"];
const howFoundUsOptions = [
  "Facebook",
  "Instagram",
  "TikTok",
  "Google",
  "Recomendación",
  "Volante",
  "Convenio",
  "Otro",
];
const employmentStatusOptions = [
  "Sin trabajo",
  "Con trabajo",
  "Independiente",
  "Estudiante",
  "Jubilado/a",
];
const incomeRangeOptions = [
  "Menos de S/ 1025",
  "S/ 1025 - S/ 1500",
  "S/ 1501 - S/ 2500",
  "S/ 2501 - S/ 4000",
  "Más de S/ 4000",
  "Prefiero no decirlo",
];
const paymentMethodOptions = [
  "Efectivo",
  "Yape",
  "Plin",
  "Transferencia bancaria",
  "Tarjeta",
];
const urgencyOptions = [
  {
    value: "Baja",
    description: "Puedo esperar algunos días o semanas para iniciar terapia.",
    className: "border-green-200 bg-green-50 text-green-800",
    selectedClassName: "border-green-600 bg-green-600 text-white",
  },
  {
    value: "Media",
    description: "Me gustaría recibir atención lo antes posible.",
    className: "border-yellow-200 bg-yellow-50 text-yellow-800",
    selectedClassName: "border-yellow-500 bg-yellow-500 text-white",
  },
  {
    value: "Alta",
    description: "Siento mucho malestar emocional y necesito ayuda urgente.",
    className: "border-orange-200 bg-orange-50 text-orange-800",
    selectedClassName: "border-orange-600 bg-orange-600 text-white",
  },
  {
    value: "Crítica / Emergencia",
    description: "Estoy en crisis emocional o siento riesgo para mí o para otros.",
    className: "border-red-200 bg-red-50 text-red-800",
    selectedClassName: "border-red-600 bg-red-600 text-white",
  },
];

const AccordionSection = ({
  title,
  isOpen,
  onToggle,
  children,
}: AccordionSectionProps) => (
  <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
    <button
      type="button"
      onClick={onToggle}
      className="flex w-full items-center justify-between gap-4 bg-gray-50 px-4 py-3 text-left text-[#0B2035] transition-colors hover:bg-gray-100 md:px-5"
    >
      <span className="font-semibold">{title}</span>
      <ChevronDown
        className={`h-5 w-5 shrink-0 text-[#75B2C5] transition-transform duration-300 ${
          isOpen ? "rotate-180" : ""
        }`}
      />
    </button>
    <div
      className={`overflow-hidden transition-all duration-300 ${
        isOpen ? "max-h-[2200px] opacity-100" : "max-h-0 opacity-0"
      }`}
    >
      <div className="p-4 md:p-6">{children}</div>
    </div>
  </div>
);

export const PatientForm = ({ data, patientId }: PatientFormProps) => {
  const navigate = useNavigate();
  const methods = useForm<PatientFormSchema>({
    resolver: zodResolver(patientFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      dni: "",
      gender: "",
      birthdate: "",
      educationLevel: "",
      birthPlace: "",
      occupation: "",
      maritalStatus: "",
      religion: "",
      occupationLocation: "",
      phoneNumber: "",
      address: "",
      parentFullName: "",
      parentDni: "",
      parentPhoneNumber: "",
      districtId: "",
      provinceId: "",
      regionId: "",
      ...defaultComplementaryValues,
    },
  });

  const {
    handleSubmit,
    watch,
    register,
    reset,
    setValue,
    setError,
    clearErrors,
    getValues,
    formState: { errors },
  } = methods;

  const [mode, setMode] = useState<FormMode>(() => {
    if (!data) return "create";
    return "view";
  });

  useEffect(() => {
    if (data) {
      console.log("datainicial", data);
      reset({
        ...data,
        birthdate: data.birthdate
          ? data.birthdate.toString().split("T")[0]
          : "",

        districtId: data.districtId || "",
        provinceId: data.district?.province?.id || "",
        regionId: data.district?.province?.region?.id || "",
        isActive: data.isActive ?? true,
        ...extractComplementaryFormValues(data),
      });
      setShowComplementary(true);
    }
  }, [mode, data, reset]);

  const regionId = watch("regionId");
  const provinceId = watch("provinceId");

  const { data: allRegions } = useGetAllRegionsQuery();
  const { data: provincesByRegionId } = useProvincesByRegionIdQuery(
    regionId ?? ""
  );
  const { data: districtsByProvinceId } = useDistrictsByProvinceIdQuery(
    provinceId ?? ""
  );

  const createPatient = useCreatePatient();
  const updatePatient = useUpdatePatient();

  const [filteredProvinces, setFilteredProvinces] = useState<Province[]>([]);
  const [filteredDistricts, setFilteredDistricts] = useState<District[]>([]);
  const isViewMode = mode === "view";
  const [loading, setLoading] = useState(false);
  const [showComplementary, setShowComplementary] = useState(false);
  const [openSections, setOpenSections] =
    useState<Record<ComplementarySectionKey, boolean>>(initialOpenSections);

  const toggleSection = (section: ComplementarySectionKey) => {
    setOpenSections((current) => ({
      ...current,
      [section]: !current[section],
    }));
  };

  const toggleCommaValue = (field: keyof PatientFormSchema, value: string) => {
    const selected = String(getValues(field) || "")
      .split(", ")
      .filter(Boolean);
    const next = selected.includes(value)
      ? selected.filter((item) => item !== value)
      : [...selected, value];

    setValue(field, next.join(", "), { shouldDirty: true });
  };

  const isCommaValueSelected = (field: keyof PatientFormSchema, value: string) =>
    String(watch(field) || "")
      .split(", ")
      .filter(Boolean)
      .includes(value);

  const setSingleToggleValue = (field: keyof PatientFormSchema, value: string) => {
    setValue(field, watch(field) === value ? "" : value, { shouldDirty: true });
  };

  const removeComplementaryFields = (values: PatientFormSchema) => {
    const filtered = { ...values };
    complementaryFields.forEach((field) => {
      delete filtered[field];
    });
    return filtered;
  };

  // Provincias por región
  useEffect(() => {
    if (regionId && provincesByRegionId) {
      setFilteredProvinces(provincesByRegionId);
      setFilteredDistricts([]);
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

  // Distritos por provincia
  useEffect(() => {
    if (provinceId && districtsByProvinceId) {
      setFilteredDistricts(districtsByProvinceId || []);
      if (mode !== "view") {
        setValue("districtId", "");
      }
    } else {
      setFilteredDistricts([]);
      if (mode !== "view") {
        setValue("districtId", "");
      }
    }
  }, [provinceId, districtsByProvinceId]);

  // Guardar paciente (simulado)
  const handleSave = async () => {
    try {
      const values = getValues();

      if (mode !== "view" && showComplementary && !values.acceptDataPolicy) {
        setOpenSections((current) => ({ ...current, consent: true }));
        setError("acceptDataPolicy", {
          type: "manual",
          message:
            "Debes aceptar el tratamiento de datos personales para registrar al paciente.",
        });
        return;
      }

      setLoading(true);
      if (mode === "create") {
        console.log("valores", getValues());

        // Antes de enviar al backend:
        const valuesToSubmit = showComplementary
          ? values
          : removeComplementaryFields(values);
        const payload = {
          ...valuesToSubmit,
          gender: valuesToSubmit.gender as Gender,
          maritalStatus: valuesToSubmit.maritalStatus as MaritalStatus,
          // esto es importante para que no se altere la fecha
          // birthdate: values.birthdate ? new Date(values.birthdate) : null,
          birthdate: new Date(`${valuesToSubmit.birthdate}T00:00:00`),
          provinceId: "",
          regionId: "",
        };
        // const dataToSendToBack =
        // Normalizar datos para la API
        const normalizedData = Object.fromEntries(
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          Object.entries(payload).filter(([_, value]) => value !== "")
        );
        createPatient.mutate(normalizedData, {
          onSuccess: () => {
            navigate("/patients");
          },
        });

        // enviar payload al backend
        //navigate("/patients");
      } else {
        console.log("llega aquí");
        const valuesToSubmit = showComplementary
          ? values
          : removeComplementaryFields(values);
        //const selectedDate = value ? new Date(`${value}T00:00:00`) : undefined;
        const payload = {
          ...valuesToSubmit,
          gender: valuesToSubmit.gender as Gender,
          maritalStatus: valuesToSubmit.maritalStatus as MaritalStatus,
          birthdate: new Date(`${valuesToSubmit.birthdate}T00:00:00`),
          provinceId: "",
          regionId: "",
          clinicalHistoryId: "",
        };

        const keysToIgnoreEmpty = ["provinceId", "regionId", "clinicalHistoryId"];

        const normalizedData = Object.fromEntries(
          Object.entries(payload).filter(([key, value]) => {
            if (value == null) return false;
            if (value === "" && keysToIgnoreEmpty.includes(key)) return false; // ignorar estos vacíos
            return true; // incluir strings vacíos
          })
        );

        console.log("normalized", normalizedData);
        updatePatient.mutate(
          {
            id: patientId ?? "",
            patientToUpdate: normalizedData,
          },
          {
            onSuccess: () => {
              // setMode("view");
              navigate("/patients");
            },
          }
        );

        console.log("fecha", payload.birthdate);
      }
      setLoading(false);
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (mode === "create") {
      navigate("/patients");
    } else {
      setMode("view");
    }
  };

  const handleEdit = () => {
    setMode("edit");
  };

  // Función para calcular la edad
  function getAgeFromBirthdate(birthdate?: string) {
    if (!birthdate) return "";
    const today = new Date();
    const [date] = birthdate.split("T");
    const [year, month, day] = date.split("-").map(Number);
    console.log(year, month, day);
    if (!year || !month || !day) return "";
    let age = today.getFullYear() - year;
    const m = today.getMonth() + 1 - month;
    if (m < 0 || (m === 0 && today.getDate() < day)) {
      age--;
    }
    return age >= 0 ? String(age) : "";
  }

  if (loading) {
    return <Loading message="Cargando información de paciente..." />;
  }
  console.log(errors);

  return (
    <FormProvider {...methods}>
      <div className="h-screen flex flex-col">
        {mode === "create" ? (
          <SiteHeader title="Registrar paciente" />
        ) : (
          <SiteHeader title="Paciente" />
        )}
        <form
          onSubmit={handleSubmit(handleSave)}
          className="flex-1 flex flex-col"
        >
          <div className="flex flex-col p-2 gap-5 flex-1 self-center">
            <div className="grid grid-cols-1 md:grid-cols-2 p-2 md:p-6 items-center gap-2">
              {/* Datos personales */}
              <InputWithHelper
                id="firstName"
                label="Nombres"
                readOnly={isViewMode}
                //value={watch("firstName")}
                helper="Ingrese los nombres"
                {...register("firstName")}
                errors={errors.firstName}
              //register={register("firstName")}
              />
              <InputWithHelper
                id="lastName"
                label="Apellidos"
                readOnly={isViewMode}
                helper="Ingrese los apellidos"
                {...register("lastName")}
                errors={errors.lastName}
              //register={register("lastName")}
              />
              <InputWithHelper
                id="dni"
                label="DNI"
                readOnly={isViewMode}
                helper="Ingrese el DNI"
                {...register("dni")}
                errors={errors.dni}
              />
              <SelectWithHelper
                id="gender"
                label="Género"
                value={watch("gender")}
                onValueChange={(value) => setValue("gender", value)}
                options={genderOptions}
                readOnly={isViewMode}
                helper="Seleccione el género"
                {...register("gender")}
                errors={errors.gender}
              />
              <CalendarWithHelper
                id="birthdate"
                label="Fecha de nacimiento"
                value={watch("birthdate")}
                readOnly={isViewMode}
                helper="Se calculará la edad automáticamente"
                errors={errors.birthdate}
                onChange={(value) => setValue("birthdate", value)}
                register={register("birthdate")}
              />
              <InputWithHelper
                id="age"
                label="Edad"
                value={getAgeFromBirthdate(watch("birthdate"))}
                readOnly={true}
              />
              <InputWithHelper
                id="educationLevel"
                label="Nivel educativo"
                readOnly={isViewMode}
                helper="Ingrese el nivel educativo"
                {...register("educationLevel")}
                errors={errors.educationLevel}
              />
              <InputWithHelper
                id="birthPlace"
                label="Lugar de nacimiento"
                readOnly={isViewMode}
                helper="Ingrese el lugar de nacimiento"
                {...register("birthPlace")}
                errors={errors.birthPlace}
              />
              <InputWithHelper
                id="occupation"
                label="Ocupación"
                readOnly={isViewMode}
                helper="Ingrese la ocupación"
                {...register("occupation")}
                errors={errors.occupation}
              />
              <SelectWithHelper
                id="maritalStatus"
                label="Estado civil"
                value={watch("maritalStatus")}
                onValueChange={(value) => setValue("maritalStatus", value)}
                options={maritalStatusOptions}
                readOnly={isViewMode}
                helper="Seleccione el estado civil"
                {...register("maritalStatus")}
                errors={errors.maritalStatus}
              />
              <InputWithHelper
                id="religion"
                label="Religión"
                readOnly={isViewMode}
                helper="Ingrese la religión (opcional)"
                {...register("religion")}
                errors={errors.religion}
              />
              <InputWithHelper
                id="occupationLocation"
                label="Lugar de trabajo"
                readOnly={isViewMode}
                helper="Ingrese el lugar de trabajo"
                {...register("occupationLocation")}
                errors={errors.occupationLocation}
              />
              <InputWithHelper
                id="phoneNumber"
                label="Teléfono"
                readOnly={isViewMode}
                helper="Ingrese el teléfono"
                {...register("phoneNumber")}
                errors={errors.phoneNumber}
              />
              <InputWithHelper
                id="address"
                label="Dirección"
                readOnly={isViewMode}
                helper="Ingrese la dirección"
                {...register("address")}
                errors={errors.address}
              />
              {/* Datos del apoderado */}
              <InputWithHelper
                id="parentFullName"
                label="Nombre completo del apoderado"
                readOnly={isViewMode}
                helper="Ingrese el nombre del apoderado (opcional)"
                {...register("parentFullName")}
                errors={errors.parentFullName}
              />
              <InputWithHelper
                id="parentDni"
                label="DNI del apoderado"
                readOnly={isViewMode}
                helper="Ingrese el DNI del apoderado (opcional)"
                {...register("parentDni")}
                errors={errors.parentDni}
              />
              <InputWithHelper
                id="parentPhoneNumber"
                label="Teléfono del apoderado"
                value={watch("parentPhoneNumber")}
                readOnly={isViewMode}
                helper="Ingrese el teléfono del apoderado (opcional)"
                {...register("parentPhoneNumber")}
                errors={errors.parentPhoneNumber}
              />
              {/* Región, provincia, distrito */}
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
                helper="Seleccione la región"
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
                helper="Seleccione la provincia"
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
                helper="Seleccione el distrito"
                {...register("districtId")}
                errors={errors.districtId}
              />
            </div>

            {(mode === "create" || data) && (
              <section className="w-full px-2 pb-4 md:px-6">
                <div className="flex justify-center py-2">
                  <button
                    type="button"
                    onClick={() => setShowComplementary((current) => !current)}
                    className="flex w-full max-w-3xl items-center justify-center gap-3 rounded-xl bg-[#0B2035] px-5 py-4 text-center font-semibold text-white shadow-lg shadow-slate-300 transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#102c48] hover:shadow-xl"
                  >
                    <Plus
                      className={`h-5 w-5 transition-transform duration-300 ${
                        showComplementary ? "rotate-45" : ""
                      }`}
                    />
                    {showComplementary
                      ? "Ocultar información opcional del paciente"
                      : mode === "create"
                      ? "+ Agregar información opcional del paciente"
                      : "Mostrar información opcional del paciente"}
                  </button>
                </div>

                <div
                  className={`overflow-hidden transition-all duration-500 ${
                    showComplementary
                      ? "max-h-[9000px] opacity-100"
                      : "max-h-0 opacity-0"
                  }`}
                >
                  <div className="mt-5 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                    <div className="bg-gradient-to-r from-[#0B2035] to-[#0B2035]/90 px-5 py-5 text-white md:px-8">
                      <h2 className="text-lg font-semibold md:text-xl">
                        Información complementaria del paciente
                      </h2>
                      <p className="mt-2 max-w-4xl text-sm leading-6 text-white/85">
                        Estos datos ayudan a mejorar la atención clínica, la
                        organización interna y el seguimiento comercial. Puede
                        completarlos ahora o después.
                      </p>
                    </div>

                    <div className="space-y-4 p-4 md:p-6">
                      <AccordionSection
                        title="Información Familiar"
                        isOpen={openSections.family}
                        onToggle={() => toggleSection("family")}
                      >
                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                          <InputWithHelper
                            id="livesWith"
                            label="¿Con quién vive actualmente?"
                            readOnly={isViewMode}
                            helper="Indique con quién reside"
                            {...register("livesWith")}
                          />
                          <InputWithHelper
                            id="numChildren"
                            type="number"
                            label="Número de hijos"
                            readOnly={isViewMode}
                            helper="Cantidad de hijos"
                            {...register("numChildren")}
                          />
                          <InputWithHelper
                            id="guardianName"
                            label="Nombre del apoderado, si aplica"
                            readOnly={isViewMode}
                            helper="Nombre completo del apoderado"
                            {...register("guardianName")}
                          />
                          <InputWithHelper
                            id="guardianPhone"
                            label="Teléfono del apoderado, si aplica"
                            readOnly={isViewMode}
                            helper="Teléfono del apoderado"
                            {...register("guardianPhone")}
                          />
                        </div>
                      </AccordionSection>

                      <AccordionSection
                        title="Información Clínica"
                        isOpen={openSections.clinical}
                        onToggle={() => toggleSection("clinical")}
                      >
                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                          <TextareaWithHelper
                            id="mainReason"
                            label="Motivo principal de consulta"
                            placeholder="Describa el motivo de consulta"
                            readOnly={isViewMode}
                            rows={4}
                            {...register("mainReason")}
                          />
                          <InputWithHelper
                            id="howLong"
                            label="¿Hace cuánto presenta esta situación?"
                            readOnly={isViewMode}
                            helper="Ej: 3 meses, 1 año"
                            {...register("howLong")}
                          />
                          <SelectWithHelper
                            id="previousTherapy"
                            label="¿Ha llevado terapia anteriormente?"
                            value={watch("previousTherapy")}
                            readOnly={isViewMode}
                            onValueChange={(value) =>
                              setValue("previousTherapy", value)
                            }
                            options={yesNoOptions}
                          />
                          <SelectWithHelper
                            id="psychiatricMedication"
                            label="¿Actualmente toma medicación psiquiátrica?"
                            value={watch("psychiatricMedication")}
                            readOnly={isViewMode}
                            onValueChange={(value) =>
                              setValue("psychiatricMedication", value)
                            }
                            options={["Sí", "No", "Prefiero no decirlo"]}
                          />
                        </div>
                        <div className="mt-5">
                          <p className="mb-3 text-sm font-semibold text-[#0B2035]">
                            Nivel de urgencia
                          </p>
                          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                            {urgencyOptions.map((option) => {
                              const selected = watch("urgencyLevel") === option.value;
                              return (
                                <button
                                  key={option.value}
                                  type="button"
                                  disabled={isViewMode}
                                  onClick={() =>
                                    setSingleToggleValue(
                                      "urgencyLevel",
                                      option.value
                                    )
                                  }
                                  className={`rounded-xl border p-4 text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm ${
                                    selected
                                      ? option.selectedClassName
                                      : option.className
                                  } ${isViewMode ? "cursor-default hover:translate-y-0 hover:shadow-none" : ""}`}
                                >
                                  <span className="block font-semibold">
                                    {option.value}
                                  </span>
                                  <span className="mt-1 block text-sm opacity-90">
                                    {option.description}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </AccordionSection>

                      <AccordionSection
                        title="Preferencias de Atención"
                        isOpen={openSections.preferences}
                        onToggle={() => toggleSection("preferences")}
                      >
                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                          <SelectWithHelper
                            id="preferredModality"
                            label="Modalidad preferida"
                            value={watch("preferredModality")}
                            readOnly={isViewMode}
                            onValueChange={(value) =>
                              setValue("preferredModality", value)
                            }
                            options={["Virtual", "Presencial", "Mixta"]}
                          />
                        </div>
                        <div className="mt-5 space-y-5">
                          {[
                            ["Horarios preferidos", "preferredSchedule", scheduleOptions],
                            ["Especialidades requeridas", "requiredSpecialty", specialtyOptions],
                            ["Contacto preferido", "preferredContact", contactOptions],
                          ].map(([label, field, options]) => (
                            <div key={String(field)}>
                              <p className="mb-3 text-sm font-semibold text-[#0B2035]">
                                {String(label)}
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {(options as string[]).map((option) => {
                                  const selected = isCommaValueSelected(
                                    field as keyof PatientFormSchema,
                                    option
                                  );
                                  return (
                                    <button
                                      key={option}
                                      type="button"
                                      disabled={isViewMode}
                                      onClick={() =>
                                        toggleCommaValue(
                                          field as keyof PatientFormSchema,
                                          option
                                        )
                                      }
                                      className={`rounded-full border px-4 py-2 text-sm transition-colors ${
                                        selected
                                          ? "border-[#0B2035] bg-[#0B2035] text-white"
                                          : "border-gray-200 bg-white text-gray-600 hover:border-[#75B2C5] hover:text-[#0B2035]"
                                      } ${isViewMode ? "cursor-default" : ""}`}
                                    >
                                      {option}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                        </div>
                      </AccordionSection>

                      <AccordionSection
                        title="Información Comercial y Marketing"
                        isOpen={openSections.marketing}
                        onToggle={() => toggleSection("marketing")}
                      >
                        <div>
                          <p className="mb-3 text-sm font-semibold text-[#0B2035]">
                            ¿Cómo nos encontró?
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {howFoundUsOptions.map((option) => {
                              const selected = isCommaValueSelected(
                                "howFoundUs",
                                option
                              );
                              return (
                                <button
                                  key={option}
                                  type="button"
                                  disabled={isViewMode}
                                  onClick={() => toggleCommaValue("howFoundUs", option)}
                                  className={`rounded-full border px-4 py-2 text-sm transition-colors ${
                                    selected
                                      ? "border-[#0B2035] bg-[#0B2035] text-white"
                                      : "border-gray-200 bg-white text-gray-600 hover:border-[#75B2C5] hover:text-[#0B2035]"
                                  } ${isViewMode ? "cursor-default" : ""}`}
                                >
                                  {option}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                        <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2">
                          <InputWithHelper
                            id="whoReferred"
                            label="¿Quién le recomendó el servicio?"
                            readOnly={isViewMode}
                            helper="Nombre de la persona que le recomendó"
                            {...register("whoReferred")}
                          />
                          <SelectWithHelper
                            id="comparedOtherCenters"
                            label="¿Comparó otros centros antes de elegirnos?"
                            value={watch("comparedOtherCenters")}
                            readOnly={isViewMode}
                            onValueChange={(value) =>
                              setValue("comparedOtherCenters", value)
                            }
                            options={yesNoOptions}
                          />
                          <TextareaWithHelper
                            id="whatAttractedAttention"
                            label="¿Qué fue lo que más le llamó la atención?"
                            placeholder="Describa qué le atrajo de nuestros servicios"
                            readOnly={isViewMode}
                            rows={4}
                            {...register("whatAttractedAttention")}
                          />
                          <SelectWithHelper
                            id="acceptPromotions"
                            label="¿Acepta recibir contenido psicológico y promociones?"
                            value={watch("acceptPromotions")}
                            readOnly={isViewMode}
                            onValueChange={(value) =>
                              setValue("acceptPromotions", value)
                            }
                            options={yesNoOptions}
                          />
                        </div>
                      </AccordionSection>

                      <AccordionSection
                        title="Información Socioeconómica"
                        isOpen={openSections.socioeconomic}
                        onToggle={() => toggleSection("socioeconomic")}
                      >
                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                          <SelectWithHelper
                            id="employmentStatus"
                            label="Situación laboral"
                            value={watch("employmentStatus")}
                            readOnly={isViewMode}
                            onValueChange={(value) =>
                              setValue("employmentStatus", value)
                            }
                            options={employmentStatusOptions}
                          />
                          <InputWithHelper
                            id="workSector"
                            label="Sector laboral / rubro"
                            readOnly={isViewMode}
                            helper="Ej: Salud, Educación, Tecnología"
                            {...register("workSector")}
                          />
                          <SelectWithHelper
                            id="workMode"
                            label="¿Trabaja remoto, presencial o mixto?"
                            value={watch("workMode")}
                            readOnly={isViewMode}
                            onValueChange={(value) => setValue("workMode", value)}
                            options={["Remoto", "Presencial", "Mixto", "No aplica"]}
                          />
                          <SelectWithHelper
                            id="incomeRange"
                            label="Rango aproximado de ingresos"
                            value={watch("incomeRange")}
                            readOnly={isViewMode}
                            onValueChange={(value) =>
                              setValue("incomeRange", value)
                            }
                            options={incomeRangeOptions}
                          />
                        </div>
                        <div className="mt-5">
                          <p className="mb-3 text-sm font-semibold text-[#0B2035]">
                            Métodos de pago
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {paymentMethodOptions.map((option) => {
                              const selected = isCommaValueSelected(
                                "paymentMethods",
                                option
                              );
                              return (
                                <button
                                  key={option}
                                  type="button"
                                  disabled={isViewMode}
                                  onClick={() =>
                                    toggleCommaValue("paymentMethods", option)
                                  }
                                  className={`rounded-full border px-4 py-2 text-sm transition-colors ${
                                    selected
                                      ? "border-[#0B2035] bg-[#0B2035] text-white"
                                      : "border-gray-200 bg-white text-gray-600 hover:border-[#75B2C5] hover:text-[#0B2035]"
                                  } ${isViewMode ? "cursor-default" : ""}`}
                                >
                                  {option}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </AccordionSection>

                      <AccordionSection
                        title="Consentimiento"
                        isOpen={openSections.consent}
                        onToggle={() => toggleSection("consent")}
                      >
                        <div className="space-y-5">
                          <label className="flex items-start gap-3 rounded-lg border border-gray-200 p-4">
                            <input
                              type="checkbox"
                              className="mt-1 h-4 w-4 accent-[#0B2035]"
                              disabled={isViewMode}
                              {...register("acceptDataPolicy", {
                                onChange: () => clearErrors("acceptDataPolicy"),
                              })}
                            />
                            <span>
                              <span className="block text-sm font-medium text-[#0B2035]">
                                Acepto el tratamiento de mis datos personales
                                conforme a la política de privacidad.
                              </span>
                              <span className="mt-1 block text-xs text-red-500">
                                * Este consentimiento es obligatorio para registrar
                                al paciente.
                              </span>
                              {errors.acceptDataPolicy?.message && (
                                <span className="mt-2 block text-sm text-red-500">
                                  {errors.acceptDataPolicy.message}
                                </span>
                              )}
                            </span>
                          </label>

                          <label className="flex items-start gap-3 rounded-lg border border-gray-200 p-4">
                            <input
                              type="checkbox"
                              className="mt-1 h-4 w-4 accent-[#0B2035]"
                              disabled={isViewMode}
                              {...register("acceptCommunications")}
                            />
                            <span>
                              <span className="block text-sm font-medium text-[#0B2035]">
                                Acepto recibir información, contenido y promociones
                                de Senses Psicólogos.
                              </span>
                              <span className="mt-1 block text-xs text-gray-500">
                                Este consentimiento es opcional.
                              </span>
                            </span>
                          </label>
                        </div>
                      </AccordionSection>
                    </div>
                  </div>
                </div>
              </section>
            )}
          </div>

          {/* Botones de acción */}
          <div className="flex flex-col p-2 gap-3 pt-4 border-t w-full md:flex-row md:justify-end mt-auto">
            {isViewMode && (
              <>
                <Button
                  variant="destructive"
                  onClick={() => navigate("/patients")}
                  className="flex items-center gap-2"
                  disabled={loading}
                  type="button"
                >
                  Volver
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
                  className="flex items-center gap-2"
                  disabled={loading}
                  type="submit"
                >
                  <Save className="h-4 w-4" />
                  {mode === "create" ? "Registrar paciente" : "Guardar"}
                </Button>
              </>
            )}
          </div>
        </form>
      </div>
    </FormProvider>
  );
};
