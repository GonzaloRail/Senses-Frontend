import { Button } from "@/components/ui/button";
import { DataTable } from "@/shared/components/DataTable";
import { SiteHeader } from "@/shared/components/SiteHeader";
import type { ClinicalHistoriesListSchema } from "@/shared/interfaces/tables/ClinicalHistoriesListSchema";
import type { ColumnDef } from "@tanstack/react-table";
import { useNavigate } from "react-router";
import { getAllClinicalHistoriesPaginatedApi } from "../api/clinicalHistoriesApi";
import type { ClinicalHistoriesPaginatedResponse } from "@/shared/interfaces/apiResponses/getAllClinicalHistoriesPaginatedResponse";
import { queryClient } from "@/lib/queryClient";
import { useEffect, useState } from "react";
import { getAllUsersPaginatedApi } from "@/features/systemUsers/api/systemUsersApi";
import type { UsersPaginatedResponse } from "@/shared/interfaces/apiResponses/getAllUsersPaginatedResponse";
import { exportPatientsToExcelApi } from "@/features/patients/api/patientsApi";

export const ClinicalHistoriesList = () => {
  const navigate = useNavigate();

  const columns: ColumnDef<ClinicalHistoriesListSchema>[] = [
    {
      accessorKey: "displayInt",
      header: "N° Historia",
      cell: ({ row }) => <div>{row.original.displayInt}</div>,
    },
    {
      accessorKey: "patientName",
      header: "Paciente",
      cell: ({ row }) => <div>{row.original.patientName}</div>,
    },
    {
      accessorKey: "psichologystName",
      header: "Psicólogo",
      cell: ({ row }) => <div>{row.original.psichologystName}</div>,
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
              navigate(`/clinical-histories/${row.original.id}`);
            }}
          >
            Ver Detalles
          </Button>
        </div>
      ),
    },
  ];

  const [psychologists, setPsychologists] = useState<string[]>([]);

  // traer psicólogos para el filtro
  // por ahora solo trae los 10 primeros registros de usuarios
  // luego se trabajará el filtro directamente desde el backend
  useEffect(() => {
    const fetchPsychologists = async () => {
      const page = 1;
      const take = 10;
      const search = "";

      const dataResponse = await queryClient.fetchQuery<UsersPaginatedResponse>({
        queryKey: ["users", page, take],
        queryFn: () => getAllUsersPaginatedApi({ page, take, search }),
      });

      const data = dataResponse.users.map((user) => ({
        name: `${user.firstName} ${user.lastName}`,
        role: user.roles.map((role) => role.role.name),
      }));

      const allPsychologists = data
        .filter((item) => item.role.includes("PSYCHOLOGIST"))
        .map((item) => item.name)
        .filter((name) => name && name.trim() !== "");

      console.log(allPsychologists)
      setPsychologists(allPsychologists);
    };

    fetchPsychologists();
  }, []);

  const fetchData = async ({ pageIndex = 0, pageSize = 10 }) => {
    const page = pageIndex + 1;
    const take = pageSize;
    const dataResponse =
      await queryClient.fetchQuery<ClinicalHistoriesPaginatedResponse>({
        queryKey: ["clinicalHistories", page, take],
        queryFn: () => getAllClinicalHistoriesPaginatedApi({ page, take }),
      });

    const data = dataResponse.clinicalHistories.map(
      ({ displayInt, id, patient }) => ({
        id: id,
        displayInt: `HC-${displayInt}`,
        patientName: `${patient?.firstName} ${patient?.lastName}`,
        psichologystName: (patient?.psychologist) ? `${patient?.psychologist?.firstName} ${patient?.psychologist?.lastName}` : "No asignado",
        adminButton: "Ver detalles",
      })
    );

    return {
      data,
      pageCount: dataResponse.totalPages,
    };
  };

  const fetchDataSearch = async ({
    pageIndex = 0,
    pageSize = 10,
    search = "",
  }) => {
    const page = pageIndex + 1;
    const take = pageSize;

    const dataResponse = await queryClient.fetchQuery<ClinicalHistoriesPaginatedResponse>({
      queryKey: ["users", page, take],
      queryFn: () => getAllClinicalHistoriesPaginatedApi({ page, take, search }),
    });

    const data = dataResponse.clinicalHistories.map(
      ({ displayInt, id, patient }) => ({
        id: id,
        displayInt: `HC-${displayInt}`,
        patientName: `${patient?.firstName} ${patient?.lastName}`,
        psichologystName: `${patient?.psychologist?.firstName} ${patient?.psychologist?.lastName}`,
        adminButton: "Ver detalles",
      })
    );

    return {
      data: data,
      pageCount: dataResponse.totalPages,
    };
  };

  const downloadExcel = async () => {
    const blob = await exportPatientsToExcelApi();

    const url = window.URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "pacientes.xlsx";
    document.body.appendChild(a);
    a.click();
    a.remove();

    window.URL.revokeObjectURL(url);
  };

  return (
    <>
      <SiteHeader title="Historias clínicas" />
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            <DataTable
              fetchData={fetchData}
              searchItem={{
                searchLabel: "Buscar paciente por DNI",
                fetchDataSearch: fetchDataSearch,
              }}
              filter={{
                filterLabel: "Filtrar por psicólogo",
                filterLabelMobile: "Psicólogo",
                filterOptions: psychologists,
                filterColumn: "psichologystName",
              }}
              columns={columns}
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
