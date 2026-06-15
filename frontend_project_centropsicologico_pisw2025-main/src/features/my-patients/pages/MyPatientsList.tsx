import { Button } from "@/components/ui/button";
import { queryClient } from "@/lib/queryClient";
import { DataTable } from "@/shared/components/DataTable";
import { SiteHeader } from "@/shared/components/SiteHeader";
import type { MyPatientsListSchema } from "@/shared/interfaces/tables/MyPatientsListSchema";
import type { ColumnDef } from "@tanstack/react-table";
import { useNavigate } from "react-router";
import { getMyPatientListApi } from "../api/myPatientsApi";
import { useAuth } from "@/store/auth/auth.store";
import type { PatientsPaginatedResponse } from "@/shared/interfaces/apiResponses/getAllPatientsPaginatedResponse";

export const MyPatientsList = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const columns: ColumnDef<MyPatientsListSchema>[] = [
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
              navigate(`/clinical-history/${row.original.id}`);
            }}
          >
            {row.original.adminButton}
          </Button>
        </div>
      ),
    },
  ];

  const fetchData = async ({ pageIndex = 0, pageSize = 10, search = "" }) => {
    const page = pageIndex + 1;
    const take = pageSize;
    console.log(page, take);

    const dataResponse =
      await queryClient.fetchQuery<PatientsPaginatedResponse>({
        queryKey: [
          "patients",
          { psychologistId: user?.id ?? "", page, take, search: "" },
        ],
        queryFn: () =>
          getMyPatientListApi({
            psychologistId: user?.id ?? "",
            page,
            take,
            search,
          }),
      });

    const data = dataResponse.patients.map(
      ({ firstName, lastName, dni, phoneNumber, clinicalHistoryId }) => ({
        id: clinicalHistoryId,
        name: `${firstName} ${lastName}`,
        dni,
        phoneNumber,
        adminButton: "Ver historia clínica",
      })
    );

    return {
      data,
      pageCount: dataResponse.totalPages,
    };
  };

  return (
    <>
      <SiteHeader title="Mis Pacientes" />
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            <DataTable
              fetchData={fetchData}
              columns={columns}
              searchItem={{
                searchLabel: "Buscar por DNI",
                fetchDataSearch: fetchData,
              }}
            />
          </div>
        </div>
      </div>
    </>
  );
};
