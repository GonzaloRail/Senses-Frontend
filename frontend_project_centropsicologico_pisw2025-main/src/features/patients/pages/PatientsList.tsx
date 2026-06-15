import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { queryClient } from "@/lib/queryClient";
import { DataTable } from "@/shared/components/DataTable";
import { SiteHeader } from "@/shared/components/SiteHeader";
import type { PatientsPaginatedResponse } from "@/shared/interfaces/apiResponses/getAllPatientsPaginatedResponse";
import type { PatientsListSchema } from "@/shared/interfaces/tables/PatientsListSchema";
import type { Patient } from "@/shared/interfaces/models";
import type { ColumnDef } from "@tanstack/react-table";
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { getAllPatientsApi, getPatientByIdApi } from "../api/patientsApi";
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
  const [searchType, setSearchType] = useState<"DNI" | "NAME_SURNAME">("DNI");
  const [dniSearch, setDniSearch] = useState("");
  const [nameSearch, setNameSearch] = useState("");
  const [lastNameSearch, setLastNameSearch] = useState("");
  const [appliedFilters, setAppliedFilters] = useState({
    dni: "",
    firstname: "",
    lastname: "",
  });

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

  const handleSearch = () => {
    if (searchType === "DNI") {
      setAppliedFilters({
        dni: dniSearch.trim(),
        firstname: "",
        lastname: "",
      });
      return;
    }

    setAppliedFilters({
      dni: "",
      firstname: nameSearch.trim(),
      lastname: lastNameSearch.trim(),
    });
  };

  const handleSearchTypeChange = (value: "DNI" | "NAME_SURNAME") => {
    setSearchType(value);
    setAppliedFilters({
      dni: "",
      firstname: "",
      lastname: "",
    });
    setDniSearch("");
    setNameSearch("");
    setLastNameSearch("");
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchType === "DNI") {
        setAppliedFilters({
          dni: dniSearch.trim(),
          firstname: "",
          lastname: "",
        });
        return;
      }

      setAppliedFilters({
        dni: "",
        firstname: nameSearch.trim(),
        lastname: lastNameSearch.trim(),
      });
    }, 350);

    return () => clearTimeout(timer);
  }, [searchType, dniSearch, nameSearch, lastNameSearch]);

  return (
    <>
      <SiteHeader title="Pacientes" />
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            <div className="px-4 lg:px-6">
              <div className="flex justify-end">
                <div className="flex w-full max-w-4xl items-center gap-2">
                  <Select
                    value={searchType}
                    onValueChange={(value) =>
                      handleSearchTypeChange(value as "DNI" | "NAME_SURNAME")
                    }
                  >
                    <SelectTrigger className="w-52">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DNI">DNI</SelectItem>
                      <SelectItem value="NAME_SURNAME">Nombre y Apellido</SelectItem>
                    </SelectContent>
                  </Select>

                  {searchType === "DNI" ? (
                    <Input
                      value={dniSearch}
                      onChange={(event) => setDniSearch(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          handleSearch();
                        }
                      }}
                      placeholder="Buscar por DNI..."
                      maxLength={8}
                      className="w-full"
                    />
                  ) : (
                    <>
                      <Input
                        value={nameSearch}
                        onChange={(event) => setNameSearch(event.target.value)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter") {
                            event.preventDefault();
                            handleSearch();
                          }
                        }}
                        placeholder="Nombre"
                        maxLength={40}
                        className="w-full"
                      />
                      <Input
                        value={lastNameSearch}
                        onChange={(event) => setLastNameSearch(event.target.value)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter") {
                            event.preventDefault();
                            handleSearch();
                          }
                        }}
                        placeholder="Apellido"
                        maxLength={40}
                        className="w-full"
                      />
                    </>
                  )}

                  <Button type="button" onClick={handleSearch}>
                    Buscar
                  </Button>
                </div>
              </div>
            </div>
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
