import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/shared/components/SiteHeader";
import { DataTable } from "@/shared/components/DataTable";
import { useNavigate } from "react-router";
import { getAllOfficesPaginatedApi } from "../api/officesApi";
import type { OfficesListSchema } from "@/shared/interfaces/tables/OfficesListSchema";
import type { OfficesPaginatedResponse } from "@/shared/interfaces/apiResponses/getAllOfficesPaginatedResponse";
import { queryClient } from "@/lib/queryClient";
import { useEffect, useState } from "react";
import { getAllLocationsPaginatedApi } from "@/features/locations/api/locationsApi";
import type { Location } from "@/shared/interfaces/models";

export const OfficesList = () => {
  const navigate = useNavigate();
  const [locationOptions, setLocationOptions] = useState<string[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const locations = await getAllLocationsPaginatedApi({ page: 1, take: 100 });
        setLocationOptions(locations.locations.map((loc: Partial<Location>) => loc.name));
      } catch (err) {
        console.error("No se pudo cargar sedes:", err);
        setLocationOptions([]);
      }
    })();
  }, []);

  const columns: ColumnDef<OfficesListSchema>[] = [
    {
      accessorKey: "name",
      header: "Consultorio",
      cell: ({ row }) => <div className="">{row.original.name}</div>,
    },
    {
      accessorKey: "location",
      header: "Sede",
      cell: ({ row }) => <div className="">{row.original.location}</div>,
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
              navigate(`/offices/${row.original.id}`);
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
      await queryClient.fetchQuery<OfficesPaginatedResponse>({
        queryKey: ["offices", page, take],
        queryFn: () => getAllOfficesPaginatedApi({ page, take }),
      });

    const data = dataResponse.offices.map((office) => ({
      id: office.id,
      name: office.name,
      location: office.location.name,
      isActive: office.isActive,
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
      <SiteHeader title="Consultorios" />
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            <DataTable
              fetchData={fetchData}
              addItem={{
                addItemLabel: "Agregar nuevo consultorio",
                onClickAddItem: () => {
                  navigate("/offices/create");
                  console.log("se va agregar un nuevo consultorio");
                },
              }}
              filter={{
                filterLabel: "Filtrar por sede",
                filterLabelMobile: "Sede",
                filterOptions: Object.values(locationOptions),
                filterColumn: "location",
              }}
              columns={columns}
            />
          </div>
        </div>
      </div>
    </>
  );
};