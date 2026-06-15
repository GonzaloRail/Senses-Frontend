import { SiteHeader } from "@/shared/components/SiteHeader";
import { DataTable } from "@/shared/components/DataTable";
import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Outlet, useNavigate } from "react-router";
import { queryClient } from "@/lib/queryClient";
import clsx from "clsx";
import type { EmployeeLeavesListSchema } from "@/shared/interfaces/tables/EmployeeLeavesListSchema";
import type { EmployeeLeavesPaginatedResponse } from "@/shared/interfaces/apiResponses/getAllEmployeeLeavesPaginated";
import { getAllEmployeeLeavesPaginatedApi } from "../api/employeeLeavesApi";

export const EmployeeLeavesList = () => {
  const navigate = useNavigate();
  const columns: ColumnDef<EmployeeLeavesListSchema>[] = [
    {
      accessorKey: "psychologistName",
      header: "Psicólogo",
      cell: ({ row }) => <div>{row.original.psychologistName}</div>,
    },
    {
      accessorKey: "startDate",
      header: "Desde",
      cell: ({ row }) => {
        const startDate = new Date(row.original.startDate);
        return (
          <div>
            <Badge variant="outline" className="px-3 mr-1">
              {startDate.toLocaleDateString("es-ES")}
            </Badge>
          </div>
        );
      },
    },
    {
      accessorKey: "endDate",
      header: "Hasta",
      cell: ({ row }) => {
        const endDate = new Date(row.original.endDate);
        return (
          <div>
            <Badge variant="outline" className="px-3 mr-1">
              {endDate.toLocaleDateString("es-ES")}
            </Badge>
          </div>
        );
      },
    },

    {
      accessorKey: "status",
      header: "Estado",
      cell: ({ row }) => (
        <Badge
          variant="default"
          className={clsx(`flex gap-1 px-1.5 text-white [&_svg]:size-3`, {
            "bg-senses-success": row.original.isActive,
            "bg-senses-danger": !row.original.isActive,
          })}
        >
          {row.original.isActive ? "Activo" : "Cancelado"}
        </Badge>
      ),
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
              navigate(`/employee-leave/${row.original.id}`);
            }}
          >
            {row.original.adminButton}
          </Button>
        </div>
      ),
    },
  ];

  const fetchData = async ({ pageIndex = 0, pageSize = 10 }) => {
    const page = pageIndex + 1;
    const take = pageSize;

    const dataResponse =
      await queryClient.fetchQuery<EmployeeLeavesPaginatedResponse>({
        queryKey: ["employee-leaves", { page, take }],
        queryFn: () => getAllEmployeeLeavesPaginatedApi({ page, take }),
      });

    const data = dataResponse.employeeLeaves.map((employeeLeave) => ({
      ...employeeLeave,
      adminButton: "Administrar",
    }));
    console.log(data);
    return {
      data,
      pageCount: dataResponse.totalPages,
    };
  };

  return (
    <>
      <SiteHeader title="Permisos" />
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            <DataTable
              fetchData={fetchData}
              addItem={{
                addItemLabel: "Generar nuevo permiso",
                onClickAddItem: () => {
                  navigate("/create-employee-leave");
                },
              }}
              columns={columns}
            />
          </div>
        </div>
      </div>
      <Outlet />
    </>
  );
};
