import type { LocationsListSchema } from "@/shared/interfaces/tables/LocationsListSchema";
import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/shared/components/SiteHeader";
import { DataTable } from "@/shared/components/DataTable";
import { getAllLocationsPaginatedApi } from "../api/locationsApi";
import { useNavigate } from "react-router";
import { queryClient } from "@/lib/queryClient";
import type { LocationsPaginatedResponse } from "@/shared/interfaces/apiResponses/getAllLocationsPaginatedResponse";

export const LocationsList = () => {
  const navigate = useNavigate();

  const columns: ColumnDef<LocationsListSchema>[] = [
    {
      accessorKey: "name",
      header: "Nombre",
      cell: ({ row }) => <div className="">{row.original.name}</div>,
    },
    {
      accessorKey: "isActive",
      header: "Estado",
      cell: ({ row }) => (
        <div>
          <Badge
            variant="default"
            className={`flex gap-1 px-1.5 text-white [&_svg]:size-3 ${row.original.isActive ? "bg-senses-success" : "bg-senses-danger"
              }`}
          >
            {row.original.isActive ? "Activo" : "Inactivo"}
          </Badge>
        </div>
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
              navigate(`/location/${row.original.id}`);
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
    // const data = await getAllLocationsPaginatedApi();
    const dataResponse =
      await queryClient.fetchQuery<LocationsPaginatedResponse>({
        queryKey: ["locations", page, take],
        queryFn: () => getAllLocationsPaginatedApi({ page, take }),
      });

    const data = dataResponse.locations.map((location) => ({
      ...location,
      adminButton: "Administrar",
    }));
    console.log(dataResponse);
    return {
      data,
      pageCount: dataResponse.totalPages,
    };
  };

  return (
    <>
      <SiteHeader title="Sedes" />
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            <DataTable
              fetchData={fetchData}
              addItem={{
                addItemLabel: "Agregar nueva sede",
                onClickAddItem: () => {
                  navigate("/locations/create");
                  console.log("se va agregar una nueva sede");
                },
              }}
              columns={columns}
            />
          </div>
        </div>
      </div>
    </>
  );
};
