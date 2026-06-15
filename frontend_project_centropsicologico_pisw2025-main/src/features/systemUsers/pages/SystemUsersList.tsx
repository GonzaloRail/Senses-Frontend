import { SiteHeader } from "@/shared/components/SiteHeader";
import { DataTable } from "@/shared/components/DataTable";
import type { SystemUsersListSchema } from "@/shared/interfaces/tables/SystemUsersListSchema";
import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Outlet, useNavigate } from "react-router";
import { queryClient } from "@/lib/queryClient";
import { getAllUsersPaginatedApi } from "../api/systemUsersApi";
import type { UsersPaginatedResponse } from "@/shared/interfaces/apiResponses/getAllUsersPaginatedResponse";

const rolesName = {
  ADMISSION: "Admisión",
  PSYCHOLOGIST: "Psicólogo",
  ADMIN: "Gerente",
  INTERNAL: "Interno",
};

export const SystemUsersList = () => {
  const navigate = useNavigate();
  const columns: ColumnDef<SystemUsersListSchema>[] = [
    {
      accessorKey: "name",
      header: "Nombre",
      cell: ({ row }) => <div>{row.original.name}</div>,
    },
    {
      accessorKey: "role",
      header: "Rol",
      filterFn: "arrIncludesAll",
      cell: ({ row }) => (
        <div>
          {row.original.role.map((role) => (
            <Badge key={role} variant="outline" className="px-5 mr-1">
              {role}
            </Badge>
          ))}
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: "Estado",
      cell: ({ row }) => (
        <Badge
          variant="default"
          className={`flex gap-1 px-1.5 text-white [&_svg]:size-3 ${
            row.original.status ? "bg-senses-success" : "bg-senses-danger"
          }`}
        >
          {row.original.status ? "Activo" : "Inactivo"}
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
              navigate(`/user-information/${row.original.id}`);
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

    const dataResponse = await queryClient.fetchQuery<UsersPaginatedResponse>({
      queryKey: ["users", page, take],
      queryFn: () => getAllUsersPaginatedApi({ page, take }),
    });

    const data = dataResponse.users.map((user) => ({
      id: user.id,
      name: `${user.firstName} ${user.lastName}`,
      role: user.roles.map((role) => rolesName[role.role.name]),
      status: user.isActive,
      adminButton: "Administrar",
    }));

    return {
      data: data,
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

    const dataResponse = await queryClient.fetchQuery<UsersPaginatedResponse>({
      queryKey: ["users", page, take],
      queryFn: () => getAllUsersPaginatedApi({ page, take, search }),
    });

    const data = dataResponse.users.map((user) => ({
      id: user.id,
      name: `${user.firstName} ${user.lastName}`,
      role: user.roles.map((role) => rolesName[role.role.name]),
      status: user.isActive,
      adminButton: "Administrar",
    }));

    return {
      data: data,
      pageCount: dataResponse.totalPages,
    };
  };

  return (
    <>
      <SiteHeader title="Usuarios del sistema" />
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            <DataTable
              fetchData={fetchData}
              searchItem={{
                searchLabel: "Buscar por DNI",
                fetchDataSearch: fetchDataSearch,
              }}
              addItem={{
                addItemLabel: "Agregar nuevo usuario",
                onClickAddItem: () => {
                  navigate("/create-user");
                },
              }}
              filter={{
                filterLabel: "Filtrar por rol",
                filterLabelMobile: "Rol",
                filterOptions: Object.values(rolesName),
                filterColumn: "role",
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
