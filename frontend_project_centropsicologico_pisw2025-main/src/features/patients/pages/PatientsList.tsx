import { Button } from "@/components/ui/button";
import { queryClient } from "@/lib/queryClient";
import { DataTable } from "@/shared/components/DataTable";
import { SiteHeader } from "@/shared/components/SiteHeader";
import type { PatientsPaginatedResponse } from "@/shared/interfaces/apiResponses/getAllPatientsPaginatedResponse";
import type { PatientsListSchema } from "@/shared/interfaces/tables/PatientsListSchema";
import type { Patient } from "@/shared/interfaces/models";
import type { ColumnDef } from "@tanstack/react-table";
import { useCallback, useState } from "react";
import { useNavigate } from "react-router";
import { getAllPatientsApi, getPatientByIdApi } from "../api/patientsApi";
import {
  PatientTableSearch,
  arePatientTableFiltersEqual,
  getEmptyPatientTableFilters,
  type PatientTableFilters,
} from "../components/PatientTableSearch";
import {
  complementaryExportColumns,
  extractComplementaryFormValues,
} from "../utils/patientComplementaryFields";

const genderLabels: Record<string, string> = {
  MALE: "Masculino",
  FEMALE: "Femenino",
  LGBTQ: "LGBTQ+",
  NOT_SPECIFIED: "No especificado",
};

const maritalStatusLabels: Record<string, string> = {
  SINGLE: "Soltero/a",
  MARRIED: "Casado/a",
  WIDOWED: "Viudo/a",
  DIVORCED: "Divorciado/a",
  COHABITANT: "Conviviente",
};

const csvValue = (value: unknown) => {
  const normalized = value == null ? "" : String(value);
  return `"${normalized.replace(/"/g, '""')}"`;
};

const formatDate = (date?: Date | string) => {
  if (!date) return "";
  const parsedDate = new Date(date);
  if (Number.isNaN(parsedDate.getTime())) return "";
  return parsedDate.toLocaleDateString("es-PE");
};

const buildPatientsCsv = (patients: Partial<Patient>[]) => {
  const baseColumns = [
    { key: "firstName", label: "Nombre" },
    { key: "lastName", label: "Apellido" },
    { key: "dni", label: "DNI" },
    { key: "gender", label: "Género" },
    { key: "birthdate", label: "Fecha de nacimiento" },
    { key: "educationLevel", label: "Nivel educativo" },
    { key: "birthPlace", label: "Lugar de nacimiento" },
    { key: "occupation", label: "Ocupación" },
    { key: "address", label: "Dirección" },
    { key: "maritalStatus", label: "Estado civil" },
    { key: "religion", label: "Religión" },
    { key: "occupationLocation", label: "Lugar de trabajo" },
    { key: "phoneNumber", label: "Teléfono" },
    { key: "parentFullName", label: "Nombre del apoderado" },
    { key: "parentDni", label: "DNI del apoderado" },
    { key: "parentPhoneNumber", label: "Teléfono del apoderado" },
  ] as const;

  const headers = [
    ...baseColumns.map((column) => column.label),
    ...complementaryExportColumns.map((column) => column.label),
  ];

  const rows = patients.map((patient) => {
    const complementaryValues = extractComplementaryFormValues(patient);
    const baseValues = baseColumns.map((column) => {
      if (column.key === "gender") {
        return genderLabels[String(patient.gender)] ?? patient.gender ?? "";
      }

      if (column.key === "maritalStatus") {
        return (
          maritalStatusLabels[String(patient.maritalStatus)] ??
          patient.maritalStatus ??
          ""
        );
      }

      if (column.key === "birthdate") {
        return formatDate(patient.birthdate);
      }

      return patient[column.key] ?? "";
    });

    const complementaryRowValues = complementaryExportColumns.map((column) => {
      const value = complementaryValues[column.key];
      return typeof value === "boolean" ? (value ? "Sí" : "No") : value;
    });

    return [...baseValues, ...complementaryRowValues].map(csvValue).join(",");
  });

  return [headers.map(csvValue).join(","), ...rows].join("\n");
};

export const PatientsList = () => {
  const navigate = useNavigate();
  const [appliedFilters, setAppliedFilters] = useState<PatientTableFilters>(getEmptyPatientTableFilters);

  const columns: ColumnDef<PatientsListSchema>[] = [
    {
      accessorKey: "name",
      header: "Nombre",
      cell: ({ row }) => <div className="">{row.original.name}</div>,
    },
    {
      accessorKey: "dni",
      header: "DNI",
      cell: ({ row }) => <div className="">{row.original.dni}</div>,
    },
    {
      accessorKey: "phoneNumber",
      header: "Teléfono",
      cell: ({ row }) => <div className="">{row.original.phoneNumber}</div>,
    },
    {
      accessorKey: "adminButton",
      header: "",
      cell: ({ row }) => (
        <div className="flex justify-end">
          <Button
            variant="outline"
            className="flex px-1.5 text-muted-foreground cursor-pointer"
            onClick={() => {
              navigate(`/patient/${row.original.id}`);
            }}
          >
            {row.original.adminButton}
          </Button>
        </div>
      ),
    },
  ];

  const fetchData = useCallback(async ({ pageIndex = 0, pageSize = 10 }) => {
    const page = pageIndex + 1;
    const take = pageSize;
    const normalizedDni = appliedFilters.dni.trim();
    const normalizedFirstname = appliedFilters.firstname.trim();
    const normalizedLastname = appliedFilters.lastname.trim();

    const dataResponse =
      await queryClient.fetchQuery<PatientsPaginatedResponse>({
        queryKey: [
          "patients",
          page,
          take,
          normalizedDni,
          normalizedFirstname,
          normalizedLastname,
        ],
        queryFn: () =>
          getAllPatientsApi({
            page,
            take,
            ...(normalizedDni ? { dni: normalizedDni } : {}),
            ...(normalizedFirstname ? { firstname: normalizedFirstname } : {}),
            ...(normalizedLastname ? { lastname: normalizedLastname } : {}),
          }),
      });

    const data = dataResponse.patients.map(
      ({ id, firstName, lastName, dni, phoneNumber }) => ({
        id,
        name: `${firstName} ${lastName}`,
        dni,
        phoneNumber,
        adminButton: "Administrar",
      })
    );

    return {
      data,
      pageCount: dataResponse.totalPages,
    };
  }, [appliedFilters]);

  const downloadExcel = async () => {
    const firstPage = await getAllPatientsApi({ page: 1, take: 100 });
    const remainingPages = Array.from(
      { length: Math.max(firstPage.totalPages - 1, 0) },
      (_, index) => index + 2
    );
    const remainingResponses = await Promise.all(
      remainingPages.map((page) => getAllPatientsApi({ page, take: 100 }))
    );
    const patients = [
      ...firstPage.patients,
      ...remainingResponses.flatMap((response) => response.patients),
    ];
    const patientsWithDetails = await Promise.all(
      patients.map((patient) => getPatientByIdApi({ id: patient.id }))
    );
    const csv = buildPatientsCsv(patientsWithDetails);
    const blob = new Blob([`\uFEFF${csv}`], {
      type: "text/csv;charset=utf-8;",
    });

    const url = window.URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "pacientes.csv";
    document.body.appendChild(a);
    a.click();
    a.remove();

    window.URL.revokeObjectURL(url);
  };

  const handleFiltersChange = useCallback((nextFilters: PatientTableFilters) => {
    setAppliedFilters((currentFilters) =>
      arePatientTableFiltersEqual(currentFilters, nextFilters) ? currentFilters : nextFilters
    );
  }, []);

  return (
    <>
      <SiteHeader title="Pacientes" />
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            <PatientTableSearch onFiltersChange={handleFiltersChange} />
            <DataTable
              fetchData={fetchData}
              columns={columns}
              addItem={{
                addItemLabel: "Agregar nuevo paciente",
                onClickAddItem: () => {
                  navigate("/patients/create");
                },
              }}
              optionalExtraButton={{
                optionalExtraButtonLabel: "Exportar pacientes",
                onClickOptionalExtraButton: downloadExcel,
              }}
            />
          </div>
        </div>
      </div>
    </>
  );
};
